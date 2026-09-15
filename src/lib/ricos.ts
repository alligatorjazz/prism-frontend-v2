// src/lib/ricos.ts
//
// Minimal server-side Ricos → HTML renderer.
//
// Wix Blog stores post bodies as Ricos documents, a JSON AST. Wix's own
// answer is the React `RicosViewer` from @wix/ricos, but in Astro that mounts
// client-side and leaves the article body out of the initial HTML — bad for
// the one page that exists to be indexed. This renders the common block and
// inline node types to an HTML string at request time instead.
//
// Everything the editor can insert is covered by the types below. Anything
// unrecognised is recursed into rather than dropped, so a new plugin degrades
// to plain paragraphs instead of eating the post.

export interface RicosRenderOptions {
  /**
   * Turns a Wix Media reference (`wix:image://...`) into a usable URL.
   * Passed in from the API layer so image handling stays in one place.
   */
  resolveImage?: (ref: string) => string | null;
  /** Applied to every <img> the renderer emits. */
  imageClass?: string;
}

// ---- Escape -------------------------------------------------

/**
 * Text nodes are escaped here and tags are built by hand below, which is what
 * makes it safe to hand the finished string to `set:html`.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only accept values that cannot break out of a style declaration. */
function safeColor(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const color = value.trim();

  if (/^#[0-9a-f]{3,8}$/i.test(color)) return color;
  if (/^rgba?\([\d\s.,%]+\)$/i.test(color)) return color;
  if (/^[a-z]{3,20}$/i.test(color)) return color;

  return null;
}

// ---- Document access ---------------------------------------

/**
 * A Ricos document reaches us in one of several wrappers depending on the
 * endpoint — bare, under `richContent`, or under `document`. Some payloads
 * even serialise it as a JSON string. Normalise all of that to a node array.
 */
export function normalizeRicosDocument(value: unknown): any | null {
  if (!value) return null;

  let doc: any = value;

  if (typeof doc === "string") {
    try {
      doc = JSON.parse(doc);
    } catch {
      return null;
    }
  }

  if (Array.isArray(doc?.nodes)) return doc;
  if (Array.isArray(doc?.richContent?.nodes)) return doc.richContent;
  if (Array.isArray(doc?.document?.nodes)) return doc.document;

  return null;
}

export function hasRicosContent(value: unknown): boolean {
  const doc = normalizeRicosDocument(value);
  return (doc?.nodes ?? []).length > 0;
}

function childNodes(node: any): any[] {
  return Array.isArray(node?.nodes) ? node.nodes : [];
}

function nodeText(node: any): string {
  return node?.textData?.text ?? "";
}

/** Find the first URL-ish value on a Ricos image payload. */
function imageRef(data: any): string | null {
  const image = data?.image ?? data?.src ?? null;

  return (
    image?.src?.url ??
    image?.src?.id ??
    image?.url ??
    image?.id ??
    data?.src?.url ??
    data?.src?.id ??
    null
  );
}

// ---- Inline ------------------------------------------------

/**
 * Apply text decorations. Decorations nest in array order, and CSS-neutral
 * ones (font size, colour) become a span rather than a tag.
 */
function applyDecorations(html: string, decorations: any[]): string {
  let result = html;

  for (const decoration of decorations ?? []) {
    switch (decoration?.type) {
      case "BOLD":
        result = "<strong>" + result + "</strong>";
        break;

      case "ITALIC":
        result = "<em>" + result + "</em>";
        break;

      case "UNDERLINE":
        result = "<u>" + result + "</u>";
        break;

      case "STRIKETHROUGH":
        result = "<s>" + result + "</s>";
        break;

      case "SUPERSCRIPT":
        result = "<sup>" + result + "</sup>";
        break;

      case "SUBSCRIPT":
        result = "<sub>" + result + "</sub>";
        break;

      case "LINK": {
        const link = decoration?.linkData?.link ?? decoration?.linkData ?? {};
        const url = link?.url ?? decoration?.linkData?.url;

        if (!url) break;

        const target = link?.target ?? "_blank";
        const rel = target === "_blank" ? ' rel="noopener noreferrer"' : "";

        result =
          '<a href="' +
          escapeHtml(url) +
          '" target="' +
          escapeHtml(target) +
          '"' +
          rel +
          ">" +
          result +
          "</a>";
        break;
      }

      case "COLOR": {
        const color =
          safeColor(decoration?.colorData?.foreground) ??
          safeColor(decoration?.colorData?.color);

        if (color) {
          result = '<span style="color:' + color + '">' + result + "</span>";
        }
        break;
      }

      case "FONT_SIZE": {
        const size = decoration?.fontSizeData?.size;
        if (size) {
          result =
            '<span style="font-size:' +
            escapeHtml(String(size)) +
            'px">' +
            result +
            "</span>";
        }
        break;
      }

      default:
        // Unknown decoration: keep the text rather than the styling.
        break;
    }
  }

  return result;
}

function renderInline(node: any, ctx: RicosRenderOptions): string {
  switch (node?.type) {
    case "TEXT":
      return applyDecorations(
        escapeHtml(nodeText(node)),
        node?.textData?.decorations ?? [],
      );

    case "LINE_BREAK":
      return "<br />";

    case "EMOJI":
      return escapeHtml(node?.emojiData?.emoji ?? "");

    case "MENTION":
      return escapeHtml(node?.mentionData?.name ?? nodeText(node) ?? "");

    case "IMAGE":
      // Inline images use the same payload as block images.
      return renderImage(node, ctx);

    default:
      // Unknown inline node: recurse, or fall back to its text.
      if (childNodes(node).length > 0) {
        return childNodes(node)
          .map((child) => renderInline(child, ctx))
          .join("");
      }

      return escapeHtml(nodeText(node));
  }
}

function renderInlineChildren(node: any, ctx: RicosRenderOptions): string {
  return childNodes(node)
    .map((child) => renderInline(child, ctx))
    .join("");
}

// ---- Media -------------------------------------------------

function renderImage(node: any, ctx: RicosRenderOptions): string {
  const data = node?.imageData ?? {};
  const ref = imageRef(data);

  if (!ref) return "";

  const src = ctx.resolveImage ? ctx.resolveImage(ref) : ref;
  if (!src) return "";

  const alt = data?.image?.alt ?? data?.alt ?? "";
  const classAttr = ctx.imageClass
    ? ' class="' + escapeHtml(ctx.imageClass) + '"'
    : "";

  return (
    '<img src="' +
    escapeHtml(src) +
    '" alt="' +
    escapeHtml(alt) +
    '"' +
    classAttr +
    ' loading="lazy" decoding="async" />'
  );
}

function renderGallery(node: any, ctx: RicosRenderOptions): string {
  const items: any[] = node?.galleryData?.items ?? [];

  const images = items
    .map((item) => renderImage({ type: "IMAGE", imageData: item }, ctx))
    .filter(Boolean)
    .join("");

  return images ? '<div class="gallery">' + images + "</div>" : "";
}

// ---- Blocks ------------------------------------------------

function renderParagraph(node: any, ctx: RicosRenderOptions): string {
  const inner = renderInlineChildren(node, ctx);

  // Wix uses empty paragraphs as spacers; drop them so posts don't grow
  // long empty gaps, but keep any that actually contain media.
  if (!inner.replace(/<[^>]*>/g, "").trim() && !inner.includes("<img")) {
    return "";
  }

  return "<p>" + inner + "</p>";
}

function renderHeading(node: any, ctx: RicosRenderOptions): string {
  // Clamped to 2–6: the page's <h1> is the post title in PageIntro, so a
  // heading inside the body must never be an h1.
  const raw = Number(node?.headingData?.level ?? 2);
  const level = Math.min(6, Math.max(2, Number.isFinite(raw) ? raw : 2));

  return (
    "<h" + level + ">" + renderInlineChildren(node, ctx) + "</h" + level + ">"
  );
}

function renderList(node: any, ctx: RicosRenderOptions): string {
  const tag = node?.type === "ORDERED_LIST" ? "ol" : "ul";

  const items = childNodes(node)
    .map((item) => {
      const inner = childNodes(item)
        .map((child) => renderBlock(child, ctx))
        .join("");

      return "<li>" + inner + "</li>";
    })
    .join("");

  return "<" + tag + ">" + items + "</" + tag + ">";
}

function renderBlockquote(node: any, ctx: RicosRenderOptions): string {
  const inner = childNodes(node)
    .map((child) => renderBlock(child, ctx))
    .join("");

  return "<blockquote>" + inner + "</blockquote>";
}

function renderCodeBlock(node: any, ctx: RicosRenderOptions): string {
  const code =
    node?.textData?.text ??
    childNodes(node)
      .map((child) => nodeText(child))
      .join("");

  if (!code.trim()) return "";

  return "<pre><code>" + escapeHtml(code) + "</code></pre>";
}

function renderVideo(node: any, ctx: RicosRenderOptions): string {
  const url =
    node?.videoData?.video?.src?.url ?? node?.videoData?.src?.url ?? null;

  // Only emit a player when there is a directly playable URL. Wix-hosted
  // videos come back as an id with no source URL, and guessing one produces
  // a broken element.
  if (!url) return "";

  return (
    '<figure><video controls preload="metadata" src="' +
    escapeHtml(url) +
    '"></video></figure>'
  );
}

function renderFile(node: any): string {
  const file = node?.fileData?.file ?? {};
  const url = file?.url ?? null;

  if (!url) return "";

  return (
    '<p><a href="' +
    escapeHtml(url) +
    '" target="_blank" rel="noopener noreferrer">' +
    escapeHtml(file?.name ?? "Download attachment") +
    "</a></p>"
  );
}

function renderBlock(node: any, ctx: RicosRenderOptions): string {
  switch (node?.type) {
    case "PARAGRAPH":
      return renderParagraph(node, ctx);

    case "HEADING":
      return renderHeading(node, ctx);

    case "BULLETED_LIST":
    case "ORDERED_LIST":
      return renderList(node, ctx);

    case "LIST_ITEM":
      return renderInlineChildren(node, ctx);

    case "BLOCKQUOTE":
      return renderBlockquote(node, ctx);

    case "CODE_BLOCK":
      return renderCodeBlock(node, ctx);

    case "DIVIDER":
      return "<hr />";

    case "IMAGE":
      return renderImage(node, ctx);

    case "GALLERY":
      return renderGallery(node, ctx);

    case "VIDEO":
      return renderVideo(node, ctx);

    case "FILE":
      return renderFile(node);

    case "TEXT":
      // A bare text node where a block was expected.
      return renderParagraph({ type: "PARAGRAPH", nodes: [node] }, ctx);

    default: {
      // Unknown block type: render whatever it contains rather than losing
      // the content. Apps, embeds and unsupported plugins land here.
      const children = childNodes(node);

      if (children.length === 0) {
        const text = nodeText(node);
        return text.trim() ? "<p>" + escapeHtml(text) + "</p>" : "";
      }

      return children.map((child) => renderBlock(child, ctx)).join("");
    }
  }
}

// ---- Public API --------------------------------------------

/** Render a Ricos document to an HTML string. Returns "" if there's nothing. */
export function ricosToHtml(
  value: unknown,
  options: RicosRenderOptions = {},
): string {
  const doc = normalizeRicosDocument(value);
  if (!doc) return "";

  return (doc.nodes as any[])
    .map((node) => renderBlock(node, options))
    .join("");
}

/**
 * Flatten a Ricos document to plain text.
 *
 * Used for reading time and as a fallback when nothing else in the payload
 * carries the body text. Blank lines separate blocks so downstream
 * paragraph splitting still works.
 */
export function ricosToPlainText(value: unknown): string {
  const doc = normalizeRicosDocument(value);
  if (!doc) return "";

  const walk = (node: any): string => {
    const children = childNodes(node);

    if (node?.type === "TEXT") return nodeText(node);

    const inner = children.map(walk).filter(Boolean);

    // Block-level nodes become their own paragraph; inline ones join up.
    switch (node?.type) {
      case "PARAGRAPH":
      case "HEADING":
      case "BLOCKQUOTE":
      case "CODE_BLOCK":
      case "LIST_ITEM":
        return inner.join("");
      case "BULLETED_LIST":
      case "ORDERED_LIST":
        return inner.join("\n");
      default:
        return inner.join("");
    }
  };

  return (doc.nodes as any[])
    .map(walk)
    .filter((part) => part.trim())
    .join("\n\n")
    .trim();
}
