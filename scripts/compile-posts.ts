// compile-posts.ts
//
// Reads result.json (produced by pull-posts.ts, where `content` is already a
// markdown string) and compiles each post into its own .mdx file:
//
//   ---
//   title: ...
//   publishDate: ...
//   author: ...
//   excerpt: ...
//   tags: [...]
//   coverImage: {...}
//   ---
//
//   <markdown content>
//
// File names come from slugify in strict mode: <slug>.mdx.
// Output is written to src/content/posts (created if it does not exist).
//
// Usage:  npx tsx compile-posts.ts [path/to/result.json]
// Deps:   npm i slugify yaml

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import slugify from "slugify";
import YAML from "yaml";

// ---------------------------------------------------------------------------
// Types (the shape pull-posts.ts writes to result.json)
// ---------------------------------------------------------------------------

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
    | null
    | undefined;
  author: string;
  excerpt: string;
  tags: string[];
  content: unknown; // expected to be a markdown string
};

type CoverImage = {
  url: string;
  id?: string;
  height?: number;
  width?: number;
  alt?: string;
  filename?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert the positional coverImage tuple written by pull-posts.ts into a
 *  named object for the frontmatter. Returns null when there is no image. */
const coverImageToFrontmatter = (
  cover: Post["coverImage"],
): CoverImage | null => {
  if (!Array.isArray(cover) || typeof cover[0] !== "string") return null;

  const [url, id, height, width, altText, filename] = cover;
  const result: CoverImage = { url };
  if (typeof id === "string" && id !== "") result.id = id;
  if (typeof height === "number") result.height = height;
  if (typeof width === "number") result.width = width;
  if (typeof altText === "string" && altText !== "") result.alt = altText;
  if (typeof filename === "string" && filename !== "")
    result.filename = filename;
  return result;
};

/** Assert that a post's content is a markdown string and return it.
 *  Fails loudly (instead of writing a broken .mdx) if result.json still
 *  holds raw Ricos objects. */
const requireMarkdownContent = (post: Post): string => {
  if (typeof post.content !== "string") {
    throw new Error(
      `Post "${post.title}": content is not a markdown string ` +
        `(got ${post.content === null ? "null" : typeof post.content}). ` +
        "That means this result.json does not contain converted content - " +
        "re-run pull-posts.ts with the Ricos -> Markdown conversion applied.",
    );
  }
  if (post.content.trim() === "") {
    throw new Error(`Post "${post.title}": content is empty.`);
  }
  return post.content.trim();
};

/** Build the frontmatter object: every post property except `content`
 *  (which becomes the file body). */
const buildFrontmatter = (post: Post): Record<string, unknown> => {
  const frontmatter: Record<string, unknown> = {
    title: post.title,
    publishDate: post.publishDate,
    author: post.author,
    excerpt: post.excerpt,
    tags: (post.tags ?? []).filter(
      (tag): tag is string => typeof tag === "string" && tag !== "",
    ),
  };
  const cover = coverImageToFrontmatter(post.coverImage);
  if (cover) frontmatter.coverImage = cover;
  return frontmatter;
};

/** Slugify in strict mode. `lower`/`trim` are passed explicitly because
 *  slugify's `lower` defaults to false. Duplicate titles get -2, -3, ... */
const makeSlug = (title: string, used: Set<string>): string => {
  const base =
    slugify(title, {
      strict: true,
      lower: true,
      trim: true,
      locale: "en",
    }) || "untitled";

  let slug = base;
  for (let n = 2; used.has(slug); n += 1) slug = `${base}-${n}`;
  used.add(slug);
  return slug;
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const INPUT_FILE = process.argv[2] ?? "result.json";
const OUTPUT_DIR = "src/content/posts";

let raw: string;
try {
  raw = readFileSync(INPUT_FILE, "utf8");
} catch {
  throw new Error(
    `Could not read "${INPUT_FILE}". Run pull-posts.ts first (or pass a ` +
      "different path as the first CLI argument).",
  );
}

const posts: Post[] = JSON.parse(raw);
if (!Array.isArray(posts) || posts.length === 0) {
  throw new Error(`"${INPUT_FILE}" must contain a non-empty array of posts.`);
}

mkdirSync(OUTPUT_DIR, { recursive: true });

const usedSlugs = new Set<string>();

for (const post of posts) {
  const markdown = requireMarkdownContent(post);

  // YAML.stringify output always ends with a trailing newline, so the
  // closing --- lands on its own line.
  const frontmatter = YAML.stringify(buildFrontmatter(post), {
    lineWidth: 0, // don't wrap long strings (URLs, excerpts) mid-line
  });

  const fileName = `${makeSlug(post.title, usedSlugs)}.mdx`;
  const file = `---\n${frontmatter}---\n\n${markdown}\n`;

  writeFileSync(join(OUTPUT_DIR, fileName), file, "utf8");
  console.log(`wrote ${join(OUTPUT_DIR, fileName)}`);
}

console.log(`\nCompiled ${posts.length} post(s) into ${OUTPUT_DIR}/`);
