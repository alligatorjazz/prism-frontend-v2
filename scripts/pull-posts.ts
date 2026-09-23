// src/api/wix.ts
import { createClient, ApiKeyStrategy } from "@wix/sdk";
import { wixEventsV2 } from "@wix/events";
import { items } from "@wix/data";
import { posts, categories, tags } from "@wix/blog";
import { writeFileSync } from "node:fs";
import { getImageUrl } from "@wix/sdk/media";

const apiKey = process.env.WIX_API_KEY;
const siteId = process.env.WIX_SITE_ID;

if (!apiKey || !siteId) {
  console.error("Missing Wix credentials:", {
    hasApiKey: !!apiKey,
    hasSiteId: !!siteId,
  });
  throw new Error("WIX_API_KEY and WIX_SITE_ID must be set");
}
const wix = createClient({
  auth: ApiKeyStrategy({
    apiKey,
    siteId,
  }),
  modules: { wixEventsV2, items, posts, categories, tags },
});

// ---------------------------------------------------------------------------
// Ricos -> Markdown
//
// Wix Blog stores post bodies as a Ricos document: a tree of typed nodes
// (see https://dev.wix.com/docs/ricos/api-reference/ricos-document). The
// official rich-content conversion endpoint is server-side only, so this
// script converts the raw `richContent` tree to markdown locally instead.
// ---------------------------------------------------------------------------

/** One node in a Ricos tree. Only the fields we actually need are typed;
 *  everything else (custom elements, Wix-specific extras) stays unknown. */
type RicosNode = {
  type: string;
  id?: string;
  nodes?: RicosNode[];
  textData?: { text?: string; decorations?: RicosDecoration[] };
  headingData?: { level?: number };
  orderedListData?: { start?: number };
  bulletedListData?: Record<string, unknown>;
  videoData?: { video?: { src?: { url?: string | null } } };
  mediaData?: {
    media?: { src?: { url?: string | null } };
    src?: { url?: string | null };
    altText?: string;
  };
  imageData?: {
    image?: { src?: { url?: string | null } };
    altText?: string;
  };
  gifData?: {
    original?: { src?: { url?: string | null } };
    downsized?: { src?: { url?: string | null } };
    altText?: string;
  };
  fileData?: { src?: { url?: string | null }; name?: string };
  codeBlockData?: Record<string, unknown>;
  htmlData?: { html?: string };
  embedData?: { html?: string; data?: { source?: string } };
  tableData?: Record<string, unknown>;
  tableCellData?: Record<string, unknown>;
  paragraphData?: Record<string, unknown>;
  [key: string]: unknown;
};

/** An inline text decoration. */
type RicosDecoration = {
  type: string;
  fontWeightValue?: number;
  linkData?: { link?: { url?: string | null; anchor?: string } };
  anchorData?: { anchor?: string };
  [key: string]: unknown;
};

type RicosDocument = { nodes?: RicosNode[]; [key: string]: unknown };

type RenderCtx = { slugs: Map<string, string> };

/** Wix pads text with zero-width characters; they must not leak into markdown. */
const INVISIBLE_CHARS = /[\u200b-\u200f\u202a-\u202e\u2060\ufeff]/g;
const stripInvisible = (text: string): string =>
  text.replace(INVISIBLE_CHARS, "");

/** GitHub-style slug for heading text: "STI vs. STD" -> "sti-vs-std". */
const slugify = (text: string): string =>
  stripInvisible(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

/** All visible text in a node's subtree. */
const subtreeText = (node: RicosNode): string =>
  node.type === "TEXT"
    ? stripInvisible(node.textData?.text ?? "")
    : (node.nodes ?? []).map(subtreeText).filter(Boolean).join(" ");

/** First pass: map each node id to the slug of the text it contains, so Wix
 *  table-of-contents bullets (TEXT runs with an ANCHOR decoration pointing at
 *  a section's node id) become working in-page links. Textless nodes (e.g. a
 *  video) fall back to their raw id. Duplicate slugs get -1, -2 suffixes. */
const collectAnchorSlugs = (
  nodes: RicosNode[],
  slugs: Map<string, string>,
): void => {
  const used = new Map<string, number>();
  const claim = (id: string, text: string): void => {
    const base = slugify(text) || id;
    const n = used.get(base) ?? 0;
    used.set(base, n + 1);
    slugs.set(id, n === 0 ? base : `${base}-${n}`);
  };
  const walk = (list: RicosNode[]): void => {
    for (const node of list) {
      if (node.id && !slugs.has(node.id)) claim(node.id, subtreeText(node));
      if (node.nodes) walk(node.nodes);
    }
  };
  walk(nodes);
};

/** Render one TEXT run, with its decorations, as inline markdown. */
const renderRun = (node: RicosNode, ctx: RenderCtx): string => {
  // Wix splits in-paragraph line breaks into their own "\n" runs; turn them
  // into markdown hard breaks.
  let text = stripInvisible(node.textData?.text ?? "").replace(/\n/g, "  \n");
  if (!text) return "";

  const decorations = node.textData?.decorations ?? [];
  const has = (type: string) => decorations.some((d) => d.type === type);

  // Wrap innermost -> outermost so combinations nest correctly.
  if (has("STRIKETHROUGH")) text = `~~${text}~~`;
  if (has("ITALIC")) text = `*${text}*`;
  if (has("BOLD")) text = `**${text}**`;

  const link = decorations.find((d) => d.type === "LINK")?.linkData?.link;
  const anchorId =
    decorations.find((d) => d.type === "ANCHOR")?.anchorData?.anchor ??
    link?.anchor;
  if (link?.url) {
    text = `[${text}](${link.url})`;
  } else if (anchorId) {
    text = `[${text}](#${ctx.slugs.get(anchorId) ?? anchorId})`;
  }
  // UNDERLINE, COLOR, FONT_SIZE, MENTION, SPOILER, sub/superscript have no
  // inline markdown equivalent; the visible text is kept, styling dropped.
  return text;
};

/** Concatenate the inline markdown of every TEXT run in `nodes`. */
const renderInline = (nodes: RicosNode[], ctx: RenderCtx): string =>
  nodes
    .map((node) =>
      node.type === "TEXT"
        ? renderRun(node, ctx)
        : node.nodes
          ? renderInline(node.nodes, ctx)
          : "",
    )
    .join("");

/** Render a (possibly nested) list node as GFM list lines. */
const renderList = (list: RicosNode, ctx: RenderCtx, depth: number): string => {
  const ordered = list.type === "ORDERED_LIST";
  let counter = ordered ? (list.orderedListData?.start ?? 1) - 1 : 0;
  const lines: string[] = [];

  for (const item of list.nodes ?? []) {
    if (item.type !== "LIST_ITEM") continue;
    counter += 1;

    const bullet = ordered ? `${counter}.` : "-";
    const prefix = " ".repeat(depth * 2) + bullet + " ";
    const continuation = " ".repeat(depth * 2 + bullet.length + 1);

    const blocks = (item.nodes ?? []).flatMap((child) => {
      if (child.type === "BULLETED_LIST" || child.type === "ORDERED_LIST") {
        return [{ text: renderList(child, ctx, depth + 1), inline: false }];
      }
      const inline = renderInline([child], ctx).trim();
      return inline ? [{ text: inline, inline: true }] : [];
    });
    if (blocks.length === 0) continue;

    const [head, ...rest] = blocks;
    lines.push(prefix + head.text);
    for (const block of rest) {
      const pad = block.inline ? continuation : "";
      lines.push(
        block.text
          .split("\n")
          .map((line) => pad + line)
          .join("\n"),
      );
    }
  }
  return lines.join("\n");
};

/** Render a TABLE node (rows -> cells -> inline text) as a GFM table. */
const renderTable = (node: RicosNode, ctx: RenderCtx): string | null => {
  const rows = (node.nodes ?? []).filter((n) => n.type === "TABLE_ROW");
  const cells = rows.map((row) =>
    (row.nodes ?? [])
      .filter((c) => c.type === "TABLE_CELL")
      .map((cell) =>
        renderInline(cell.nodes ?? [], ctx)
          .replace(/\|/g, "\\|")
          .replace(/\n+/g, " ")
          .trim(),
      ),
  );
  if (cells.length === 0 || cells.every((row) => row.every((cell) => !cell))) {
    return null;
  }

  const width = Math.max(...cells.map((row) => row.length));
  const padded = cells.map((row) => [
    ...row,
    ...Array.from({ length: width - row.length }, () => ""),
  ]);
  const line = (row: string[]) => `| ${row.join(" | ")} |`;
  const [head, ...body] = padded;
  return [
    line(head),
    `| ${head.map(() => "---").join(" | ")} |`,
    ...body.map(line),
  ].join("\n");
};

/** Render the top-level nodes of a document as markdown blocks. */
const renderBlocks = (nodes: RicosNode[], ctx: RenderCtx): string =>
  nodes
    .map((node): string | null => {
      switch (node.type) {
        case "HEADING": {
          const level = Math.min(Math.max(node.headingData?.level ?? 1, 1), 6);
          const text = renderInline(node.nodes ?? [], ctx).trim();
          return text ? `${"#".repeat(level)} ${text}` : null;
        }
        case "PARAGRAPH":
        case "TEXT_BLOCK": {
          const text = renderInline(node.nodes ?? [], ctx).trim();
          return text || null;
        }
        case "BULLETED_LIST":
        case "ORDERED_LIST":
          return renderList(node, ctx, 0);
        case "LIST_ITEM": {
          // A list item appearing outside of any list: render as a bullet.
          return renderList({ type: "BULLETED_LIST", nodes: [node] }, ctx, 0);
        }
        case "VIDEO": {
          const url = node.videoData?.video?.src?.url;
          return url ? `[video](${url})` : null;
        }
        case "MEDIA": {
          const url =
            node.mediaData?.media?.src?.url ?? node.mediaData?.src?.url;
          return url ? `![${node.mediaData?.altText ?? ""}](${url})` : null;
        }
        case "IMAGE": {
          const url = node.imageData?.image?.src?.url;
          return url ? `![${node.imageData?.altText ?? ""}](${url})` : null;
        }
        case "GIF": {
          const url =
            node.gifData?.original?.src?.url ??
            node.gifData?.downsized?.src?.url;
          return url ? `![${node.gifData?.altText ?? "gif"}](${url})` : null;
        }
        case "FILE": {
          const url = node.fileData?.src?.url;
          return url ? `[${node.fileData?.name ?? "file"}](${url})` : null;
        }
        case "DIVIDER":
          return "---";
        case "CODE_BLOCK":
        case "CODE": {
          // The spec keeps the code content in the node's own TEXT children.
          const code = (node.nodes ?? [])
            .filter((n) => n.type === "TEXT")
            .map((n) => stripInvisible(n.textData?.text ?? ""))
            .join("")
            .replace(/\s+$/, "");
          if (!code) return null;
          const language =
            typeof node.codeBlockData?.language === "string"
              ? node.codeBlockData.language
              : "";
          const FENCE = "```";
          return `${FENCE}${language}\n${code}\n${FENCE}`;
        }
        case "TABLE":
          return renderTable(node, ctx);
        case "HTML":
          return node.htmlData?.html || null;
        case "EMBED":
          return node.embedData?.html || node.embedData?.data?.source || null;
        default: {
          // Unknown or custom element: keep the visible text, drop the styling.
          const text = renderInline(node.nodes ?? [], ctx).trim();
          return text || null;
        }
      }
    })
    .filter((block): block is string => block !== null)
    .join("\n\n");

/** Convert a Ricos document (a Wix Blog post's `richContent` field) to markdown. */
const ricosToMarkdown = (ricos: RicosDocument): string => {
  const slugs = new Map<string, string>();
  collectAnchorSlugs(ricos.nodes ?? [], slugs);
  return renderBlocks(ricos.nodes ?? [], { slugs });
};

// ---------------------------------------------------------------------------
// Pull posts
// ---------------------------------------------------------------------------

const postCollection = "Blog/Posts";
const page1 = await wix.items
  .query(postCollection)
  .limit(100)
  .find({ returnTotalCount: true });

const page2 = await page1.next();

const allPostsData = [...page1.items, ...page2.items];

type Post = {
  title: string;
  publishDate: string;
  coverImage:
    | [
        url: string,
        id?: string,
        height?: number,
        width?: number,
        altText?: string,
        filename?: string,
      ]
    | null;
  author: string;
  excerpt: string;
  tags: string[];
  content: string;
};

const blogPosts: Post[] = [];

// Dev limit: only the first two posts. Drop the .slice(0, 2) to pull all.
for (const post of allPostsData) {
  console.log("starting post fetch for ", post.title);

  await new Promise((r) => setTimeout(r, 500));

  console.log(
    "fetching cover image for ",
    post.title,
    `(  ${post.coverImage} )`,
  );
  let coverImage: Post["coverImage"] | null = null;
  try {
    const { id, url, height, width, altText, filename } = getImageUrl(
      post.coverImage,
    );

    coverImage = [url, id, height, width, altText, filename];
  } catch (err) {
    console.warn("Cover image not found for ", post.title);
  }

  console.log("fetching author for ", post.title);
  let author: string;
  try {
    author = (
      (await wix.items.get(
        "Members/PublicData",
        "905fbba9-6e1c-479f-9103-5618e28bc1a1",
      )) ?? { nickname: "PRISM FL" }
    ).nickname;
  } catch (err) {
    console.warn("Could not fetch author for ", post.title, err);
    author = "PRISM FL";
  }
  let wixCategories: string[];

  try {
    wixCategories = (
      await Promise.all(
        post.categories.map(async (category: string) => {
          return (
            (await wix.items.get("Blog/Categories", category)) ?? {
              label: null,
            }
          ).label;
        }),
      )
    ).filter((category) => category);
  } catch (err) {
    console.warn("Could not fetch categories for ", post.title, err);
    wixCategories = [];
  }

  let wixTags: string[];
  try {
    wixTags = (
      await Promise.all(
        post.categories.map(async (tag: string) => {
          return (
            (await wix.items.get("Blog/Tags", tag)) ?? {
              label: null,
            }
          ).label;
        }),
      )
    ).filter((tag) => tag);
  } catch (err) {
    console.warn("Could not fetch tags for ", post.title, err);
    wixTags = [];
  }

  const tagsList = [...wixCategories, ...wixTags];
  const { richContent } = (await wix.items.get(postCollection, post._id)) ?? {
    richContent: { nodes: [] },
  };

  console.log("converting ", post.title, " content into markdown");
  const markdownContent = ricosToMarkdown(
    (richContent ?? { nodes: [] }) as RicosDocument,
  );

  console.log("finished fetch for ", post.title);
  blogPosts.push({
    title: post.title,
    publishDate: post.publishedDate,
    coverImage,
    author,
    excerpt: post.excerpt,
    tags: tagsList,
    content: markdownContent,
  });
}

writeFileSync("result.json", JSON.stringify(blogPosts));
