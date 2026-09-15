#!/usr/bin/env node
/**
 * apply-blog-pages.mjs
 *
 * Adds the paginated, Wix-backed blog archive to the PRISM frontend.
 *
 *   1. Patches src/api/wix.ts
 *        - imports `media` from @wix/sdk and `slugify`
 *        - lets getBlogPosts() take a Wix filter and sort newest-first
 *        - appends the normalisation helpers the pages consume
 *   2. Creates src/components/BlogPostList.astro        (paginated, responsive list)
 *   3. Creates src/sections/BlogArchive.astro           (PageIntro + border + list)
 *   4. Creates src/pages/learn/[blog-post-category].astro
 *   5. Creates src/pages/learn/tag/[tag-name].astro
 *
 * Usage:
 *   node apply-blog-pages.mjs             apply, skipping anything already present
 *   node apply-blog-pages.mjs -f          force: rewrite every file and re-apply
 *                                         every patch, even where already present
 *   node apply-blog-pages.mjs -n          dry run: report only, write nothing
 *   node apply-blog-pages.mjs -h          show usage
 *
 * Safe to re-run. Anything overwritten is copied into .backup/<timestamp>/.
 *
 * Replaces the long options --force / --dry-run / --help, which are still
 * accepted so existing habits keep working.
 */

import { execFile } from "node:child_process";
import {
  access,
  copyFile,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_ROOT = path.join(ROOT, ".backup");
const STAMP = new Date().toISOString().replace(/[:.]/g, "-");

const WIX_PATH = "src/api/wix.ts";
const BORDERS_DIR = "src/assets/img/borders";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

function parseOptions(argv) {
  const options = { force: false, dryRun: false, help: false, unknown: [] };

  for (const arg of argv) {
    switch (arg) {
      case "-f":
      case "--force":
        options.force = true;
        break;
      case "-n":
      case "--dry-run":
        options.dryRun = true;
        break;
      case "-h":
      case "--help":
        options.help = true;
        break;
      default:
        options.unknown.push(arg);
        break;
    }
  }

  return options;
}

// ---------------------------------------------------------------------------
// Payloads
// ---------------------------------------------------------------------------

const BLOG_POST_LIST = `---
import { Image } from "astro:assets";
import dayjs from "dayjs";
import arrow from "@assets/img/pagination-arrow.png";
import type { BlogPostSummary } from "@api/wix";

interface Props {
  posts: BlogPostSummary[];
  title?: string;
  itemsPerPage?: number;
  emptyMessage?: string;
  ariaLabel?: string;
}

const {
  posts,
  title,
  itemsPerPage = 6,
  emptyMessage = "No posts to display yet. Check back soon!",
  ariaLabel = "Blog posts pagination",
} = Astro.props;

function chunkItems<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks.length ? chunks : [[]];
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "";

  const date = dayjs(value);
  return date.isValid() ? date.format("MMMM D, YYYY") : "";
}

function toIsoDate(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;

  const date = dayjs(value);
  return date.isValid() ? date.toISOString() : undefined;
}

const pages = chunkItems(posts, itemsPerPage);
const totalPages = pages.length;
---

<div class="blog-list" data-total-pages={totalPages}>
  {title && <h2>{title}</h2>}

  <div class="slider">
    <div class="track">
      {
        pages.map((pagePosts, pageIndex) => (
          <div class="page" data-page={pageIndex + 1}>
            {pagePosts.length > 0 ? (
              <ul class="grid">
                {pagePosts.map((post) => (
                  <li>
                    <article>
                      <a
                        class="cover"
                        href={post.href}
                        tabindex="-1"
                        aria-hidden="true"
                      >
                        {post.image ? (
                          <img
                            src={post.image.src}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span class="cover-placeholder" />
                        )}
                      </a>

                      <div class="body">
                        {formatDate(post.date) && (
                          <time class="date" datetime={toIsoDate(post.date)}>
                            {formatDate(post.date)}
                          </time>
                        )}

                        <h3>
                          <a href={post.href}>{post.title}</a>
                        </h3>

                        {post.excerpt && <p class="excerpt">{post.excerpt}</p>}

                        {post.tags.length > 0 && (
                          <ul class="tags">
                            {post.tags.map((tag) => (
                              <li>
                                <a href={tag.href}>{tag.label}</a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            ) : (
              <p class="empty">{emptyMessage}</p>
            )}
          </div>
        ))
      }
    </div>
  </div>

  {
    totalPages > 1 && (
      <nav class="pagination" aria-label={ariaLabel}>
        <button class="prev" type="button" disabled>
          <Image src={arrow} alt="Previous Page" />
        </button>
        <span class="status">
          Page <span class="current">1</span> of {totalPages}
        </span>
        <button class="next" type="button">
          <Image src={arrow} class="flip" alt="Next Page" />
        </button>
      </nav>
    )
  }
</div>

<script>
  function initBlogList(list: HTMLElement) {
    const track = list.querySelector(".track") as HTMLElement | null;
    const pagination = list.querySelector(".pagination") as HTMLElement | null;

    // A list with a single page renders no pagination controls at all.
    if (!track || !pagination) return;

    const totalPages = parseInt(list.dataset.totalPages || "1", 10);
    let currentPage = 1;

    const prevButton = pagination.querySelector(".prev") as HTMLButtonElement;
    const nextButton = pagination.querySelector(".next") as HTMLButtonElement;
    const currentLabel = pagination.querySelector(".current") as HTMLElement;

    function updateButtons() {
      prevButton.disabled = currentPage <= 1;
      nextButton.disabled = currentPage >= totalPages;
      currentLabel.textContent = currentPage.toString();
    }

    function goToPage(newPage: number) {
      if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;

      track.style.setProperty("--current-page", newPage.toString());

      currentPage = newPage;
      updateButtons();
    }

    prevButton.addEventListener("click", () => goToPage(currentPage - 1));
    nextButton.addEventListener("click", () => goToPage(currentPage + 1));

    updateButtons();
  }

  document.querySelectorAll<HTMLElement>(".blog-list").forEach(initBlogList);
</script>

<style lang="scss">
  .blog-list {
    width: 100%;
  }

  h2 {
    font-size: 2rem;
    text-align: center;
    margin: 0 0 2rem;
  }

  .slider {
    overflow: hidden;
    width: 100%;
  }

  .track {
    display: flex;
    width: 100%;
    transition: transform 0.4s ease-in-out;
    transform: translateX(calc((var(--current-page, 1) - 1) * -100%));
  }

  .page {
    flex: 0 0 100%;
    width: 100%;
  }

  .grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    /* Collapses to one column on narrow screens, no media query needed. */
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
    gap: 1.5rem;
  }

  article {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1rem;
    background-color: var(--witty-white);
    filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.35));
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-4px);
    }
  }

  .cover {
    display: block;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background-color: var(--youth-yellow-1);

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cover-placeholder {
      display: block;
      width: 100%;
      height: 100%;
      background: linear-gradient(var(--youth-yellow-2), var(--rainbow-orange));
    }
  }

  .body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 1rem;
  }

  .date {
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--youth-yellow-3);
  }

  h3 {
    margin: 0;
    font-size: 1.4rem;
    line-height: 1.25;

    a {
      color: var(--text-color);
    }
  }

  .excerpt {
    margin: 0;
    font-size: 1rem;
    line-height: 1.5;
  }

  .tags {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: auto 0 0;
    padding: 1rem 0 0;

    a {
      display: inline-block;
      padding: 0.15rem 0.65rem;
      font-size: 0.85rem;
      color: var(--witty-white);
      background-color: var(--activist-aqua);
      border-radius: var(--round-edge);

      &:hover {
        background-color: var(--rainbow-purple);
      }
    }
  }

  .empty {
    margin: 0;
    text-align: center;
    font-size: 1.25rem;
  }

  .pagination {
    margin: 2rem auto 0;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    font-size: 1.25rem;

    button {
      background: transparent;
      border: none;
      color: var(--text-color);
      text-decoration: underline;
      font-size: inherit;
      cursor: pointer;

      &:disabled {
        pointer-events: none;
        opacity: 0.5;
        text-decoration: none;
        cursor: default;
      }
    }
  }

  img.flip {
    transform: rotate(180deg);
  }
</style>
`;

const BLOG_ARCHIVE = `---
import type { ComponentProps } from "astro/types";
import PageIntro from "@sections/PageIntro.astro";
import SectionBorder from "@components/SectionBorder.astro";
import BlogPostList from "@components/BlogPostList.astro";
import book from "@assets/img/stickers/book-sticker.png";
import ruledBg from "@assets/img/ruled-bg.png";
import type { BlogPostSummary } from "@api/wix";

type BorderColor = ComponentProps<typeof SectionBorder>["backgroundColor"];

interface Props {
  title: string;
  description: string;
  breadcrumb: { href: string; label: string };
  posts: BlogPostSummary[];
  borderColor: BorderColor;
}

const { title, description, breadcrumb, posts, borderColor } = Astro.props;

const ariaLabel = title + " pagination";
const emptyMessage = title + " has no posts yet. Check back soon!";
const sectionStyle = "background-image: url(" + ruledBg.src + ");";
---

<PageIntro
  title={title}
  description={description}
  image={book}
  pointBackTo={breadcrumb}
/>

<SectionBorder type="marker" backgroundColor={borderColor} />

<main>
  <section class="archive" aria-label={ariaLabel} style={sectionStyle}>
    <div class="container">
      <BlogPostList
        posts={posts}
        ariaLabel={ariaLabel}
        emptyMessage={emptyMessage}
      />
    </div>
  </section>
</main>

<style lang="scss">
  main {
    margin: auto;
    font-size: 1.25rem;
  }

  .archive {
    background-size: 2000px;
    background-repeat: repeat-y;
    background-position: top center;
  }

  .container {
    max-width: var(--xl);
    margin: auto;
    padding: 4rem 1rem;
  }
</style>
`;

const CATEGORY_PAGE = `---
import { faker } from "@faker-js/faker";
import Base from "@templates/Base.astro";
import BlogArchive from "@sections/BlogArchive.astro";
import { getBlogPostsByCategorySlug } from "@api/wix";

const slug = Astro.params["blog-post-category"] ?? "";

const result = await getBlogPostsByCategorySlug(slug);

if (!result) {
  return new Response("Category not found", { status: 404 });
}

const { category, posts } = result;

const description =
  category.description ||
  "Every " + category.label + " article in the PRISM Learn library.";

const intro = description + " Browse the full collection below.";

const heroImage = faker.image.urlPicsumPhotos({ width: 1200, height: 600 });
---

<Base
  pageMetadata={{
    title: category.label + " | Learn",
    description,
    type: "website",
    image: heroImage,
    "image:alt": category.label + " articles on PRISM Learn",
  }}
  class={"page-content"}
>
  <BlogArchive
    title={category.label}
    description={intro}
    breadcrumb={{ href: "/learn", label: "Learn" }}
    posts={posts}
    borderColor="rainbow-orange"
  />
</Base>

<style lang="scss">
  .page-content {
    background-color: var(--rainbow-orange);
  }
</style>
`;

const TAG_PAGE = `---
import { faker } from "@faker-js/faker";
import Base from "@templates/Base.astro";
import BlogArchive from "@sections/BlogArchive.astro";
import { getBlogPostsByTagSlug } from "@api/wix";

const slug = Astro.params["tag-name"] ?? "";

const result = await getBlogPostsByTagSlug(slug);

if (!result) {
  return new Response("Tag not found", { status: 404 });
}

const { tag, posts } = result;

const title = "#" + tag.label;

const description = 'Every PRISM Learn article tagged "' + tag.label + '".';

const intro = description + " Browse the full collection below.";

const heroImage = faker.image.urlPicsumPhotos({ width: 1200, height: 600 });
---

<Base
  pageMetadata={{
    title: title + " | Learn",
    description,
    type: "website",
    image: heroImage,
    "image:alt": title + " posts on PRISM Learn",
  }}
  class={"page-content"}
>
  <BlogArchive
    title={title}
    description={intro}
    breadcrumb={{ href: "/learn", label: "Learn" }}
    posts={posts}
    borderColor="rainbow-blue"
  />
</Base>

<style lang="scss">
  .page-content {
    background-color: var(--rainbow-blue);
  }
</style>
`;

const GET_BLOG_POSTS_REPLACEMENT = `// Fetch all blog posts with pagination
export async function getBlogPosts(filter: any = {}) {
  const allPosts: any[] = [];
  const limit = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response: any = await wix.posts.queryPosts({
      filter,
      sort: [{ fieldName: "firstPublishedDate", order: "DESC" }],
      paging: {
        limit,
        offset,
      },
    });

    // The SDK query builder returns \`items\`; the REST shape returns \`posts\`.
    const batch: any[] = response.posts ?? response.items ?? [];
    allPosts.push(...batch);

    if (batch.length === limit) {
      offset += limit;
    } else {
      hasMore = false;
    }
  }

  return allPosts;
}
`;

const BLOG_HELPERS = `// ============================================
// Blog Presentation Helpers
// ============================================

/**
 * Location used for links to individual posts.
 *
 * TODO: point this at the real post route once the post pages exist.
 * Every post link is built here, so this is the only line to change.
 */
export const BLOG_POST_URL_PREFIX = "/learn/posts/";

// ---- Slugs -------------------------------------------------

/** Lowercase, hyphenated, URL-safe. Uses the slugify dependency. */
function toSlug(value: string): string {
  return slugify(value ?? "", { lower: true, strict: true });
}

/** Categories carry a slug, but fall back to the label so nothing breaks. */
export function getCategorySlug(category: any): string {
  return category?.slug || toSlug(category?.label ?? "");
}

export function getTagSlug(tag: any): string {
  return tag?.slug || toSlug(tag?.label ?? "");
}

// ---- Images ------------------------------------------------

/**
 * A post cover is a wix:image identifier at post.media.wixMedia.image rather
 * than a ready URL, so it has to be resolved through the SDK. Building a
 * static.wixstatic.com URL by hand only works for some media and returns 403
 * for the rest.
 */
function resolveCoverImage(post: any): { src: string; alt: string } | null {
  const ref: string | undefined =
    post?.media?.wixMedia?.image ??
    post?.coverImage?.url ??
    post?.heroImage?.url;

  if (!ref) return null;

  const alt = post?.title ?? "";

  // Some responses inline a full URL instead of a media identifier.
  if (ref.startsWith("http://") || ref.startsWith("https://")) {
    return { src: ref, alt };
  }

  try {
    const { url } = media.getImageUrl(ref);
    return url ? { src: url, alt } : null;
  } catch (error) {
    console.error("Could not resolve blog cover image:", ref, error);
    return null;
  }
}

// ---- Normalised shapes -------------------------------------

export interface BlogTag {
  label: string;
  slug: string;
  /** Present when the tag is registered in the Wix dashboard. */
  tagId?: string;
  /** Present when the tag originated as a freeform hashtag on a post. */
  hashtag?: string;
}

export interface BlogTagLink {
  label: string;
  slug: string;
  href: string;
}

export interface BlogPostSummary {
  id: string;
  title: string;
  excerpt: string;
  /** Placeholder location of the post until the post pages exist. */
  href: string;
  date: string | Date | null;
  image: { src: string; alt: string } | null;
  tags: BlogTagLink[];
}

/** Collapse whitespace and drop markup that survived the excerpt field. */
function toPlainText(value: string | undefined): string {
  if (!value) return "";

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\\s+/g, " ")
    .trim();
}

function truncate(value: string, length: number): string {
  if (value.length <= length) return value;

  return value.slice(0, length).trimEnd() + "…";
}

/**
 * Collect the tags a post belongs to.
 *
 * A post can reference tags as ids (registered tags) or as freeform hashtags,
 * so both are read and de-duplicated by slug.
 */
export function resolvePostTags(
  post: any,
  tagsById: Map<string, any> = new Map(),
): BlogTagLink[] {
  const links = new Map<string, BlogTagLink>();

  const add = (label: string | undefined, slug: string) => {
    if (!label || !slug || links.has(slug)) return;

    links.set(slug, { label, slug, href: "/learn/tag/" + slug });
  };

  for (const tagId of post.tagIds ?? []) {
    const tag = tagsById.get(tagId);
    if (tag) add(tag.label, getTagSlug(tag));
  }

  for (const tag of post.tags ?? []) {
    if (typeof tag === "string") add(tag, toSlug(tag));
    else if (tag?.label) add(tag.label, getTagSlug(tag));
  }

  for (const hashtag of post.hashtags ?? []) {
    add(hashtag, toSlug(hashtag));
  }

  return [...links.values()];
}

/** Reduce a raw Wix post to just what a list card needs. */
export function toBlogPostSummary(
  post: any,
  tagsById: Map<string, any> = new Map(),
): BlogPostSummary {
  return {
    id: post.id,
    title: post.title ?? "Untitled",
    excerpt: truncate(toPlainText(post.excerpt || post.contentText), 220),
    href: BLOG_POST_URL_PREFIX + (post.slug ?? post.id),
    date: post.firstPublishedDate ?? post.publishingDate ?? null,
    image: resolveCoverImage(post),
    tags: resolvePostTags(post, tagsById),
  };
}

// ---- Tag index ---------------------------------------------

/**
 * Every tag that can have a page.
 *
 * Registered tags are the source of truth, but posts often carry hashtags
 * that were never registered, so those are merged in and ordered by label.
 */
export function buildBlogTagIndex(rawTags: any[], rawPosts: any[]): BlogTag[] {
  const index = new Map<string, BlogTag>();

  const add = (tag: BlogTag) => {
    if (!tag.label || !tag.slug || index.has(tag.slug)) return;

    index.set(tag.slug, tag);
  };

  for (const tag of rawTags) {
    add({ label: tag.label, slug: getTagSlug(tag), tagId: tag.id });
  }

  for (const post of rawPosts) {
    for (const hashtag of post.hashtags ?? []) {
      add({ label: hashtag, slug: toSlug(hashtag), hashtag });
    }
  }

  return [...index.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export async function getBlogTagIndex(): Promise<BlogTag[]> {
  const [rawTags, rawPosts] = await Promise.all([
    getBlogTags(),
    getBlogPosts(),
  ]);

  return buildBlogTagIndex(rawTags, rawPosts);
}

// ---- Page loaders ------------------------------------------

/** Everything needed to render /learn/[blog-post-category]. */
export async function getBlogPostsByCategorySlug(slug: string) {
  const allCategories = await getBlogCategories();
  const category = allCategories.find(
    (candidate: any) => getCategorySlug(candidate) === slug,
  );

  if (!category) return null;

  const [rawPosts, rawTags] = await Promise.all([
    getBlogPosts({ categoryIds: { $hasSome: [category.id] } }),
    getBlogTags(),
  ]);

  const tagsById = new Map<string, any>(
    rawTags.map((tag: any) => [tag.id, tag]),
  );

  return {
    category,
    posts: rawPosts.map((post: any) => toBlogPostSummary(post, tagsById)),
  };
}

/** Everything needed to render /learn/tag/[tag-name]. */
export async function getBlogPostsByTagSlug(slug: string) {
  const [rawTags, rawPosts] = await Promise.all([
    getBlogTags(),
    getBlogPosts(),
  ]);

  const tag = buildBlogTagIndex(rawTags, rawPosts).find(
    (candidate) => candidate.slug === slug,
  );

  if (!tag) return null;

  const tagsById = new Map<string, any>(
    rawTags.map((tag: any) => [tag.id, tag]),
  );

  // Registered tags filter on their id; freeform hashtags filter on text.
  const filter = tag.tagId
    ? { tagIds: { $hasSome: [tag.tagId] } }
    : { hashtags: { $hasSome: [tag.hashtag ?? tag.label] } };

  const matchingPosts = await getBlogPosts(filter);

  return {
    tag,
    posts: matchingPosts.map((post: any) => toBlogPostSummary(post, tagsById)),
  };
}
`;

const NEW_FILES = [
  { path: "src/components/BlogPostList.astro", contents: BLOG_POST_LIST },
  { path: "src/sections/BlogArchive.astro", contents: BLOG_ARCHIVE },
  {
    path: "src/pages/learn/[blog-post-category].astro",
    contents: CATEGORY_PAGE,
  },
  { path: "src/pages/learn/tag/[tag-name].astro", contents: TAG_PAGE },
];

const HELPERS_MARKER =
  "// ============================================\n// Blog Presentation Helpers";

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

async function pathExists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function backup(relativePath) {
  const destination = path.join(BACKUP_ROOT, STAMP, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(path.join(ROOT, relativePath), destination);
}

async function formatWithPrettier(relativePaths) {
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";

  try {
    await run(npx, ["prettier", "--write", ...relativePaths], { cwd: ROOT });
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Text surgery
// ---------------------------------------------------------------------------

/** Replace the first occurrence of needle, or return null if it is absent. */
function replaceOnce(source, needle, replacement) {
  const index = source.indexOf(needle);

  if (index === -1) return null;

  return (
    source.slice(0, index) + replacement + source.slice(index + needle.length)
  );
}

/** Replace from a start marker through the end of that top-level block. */
function replaceBlock(source, startMarker, replacement) {
  const start = source.indexOf(startMarker);
  if (start === -1) return null;

  const end = source.indexOf("\n}\n", start);
  if (end === -1) return null;

  // Keep the blank line that follows the closing brace.
  return source.slice(0, start) + replacement + source.slice(end + 3);
}

/** Remove a previously appended helper block, if one is present. */
function stripHelpers(source) {
  const index = source.indexOf(HELPERS_MARKER);
  if (index === -1) return null;

  return source.slice(0, index).trimEnd() + "\n";
}

// ---------------------------------------------------------------------------
// src/api/wix.ts
// ---------------------------------------------------------------------------

const IMPORT_EDITS = [
  {
    name: "import media from @wix/sdk",
    done: (source) => source.includes("ApiKeyStrategy, media }"),
    apply: (source) =>
      replaceOnce(
        source,
        'import { createClient, ApiKeyStrategy } from "@wix/sdk";',
        'import { createClient, ApiKeyStrategy, media } from "@wix/sdk";',
      ),
  },
  {
    name: "import slugify",
    done: (source) => source.includes('import slugify from "slugify";'),
    apply: (source) =>
      replaceOnce(
        source,
        'import { posts, categories, tags } from "@wix/blog";',
        'import { posts, categories, tags } from "@wix/blog";\nimport slugify from "slugify";',
      ),
  },
];

async function patchWixFile(options) {
  const absolute = path.join(ROOT, WIX_PATH);

  if (!(await pathExists(absolute))) {
    return {
      ok: false,
      steps: [],
      message: WIX_PATH + " not found in " + ROOT,
    };
  }

  const source = await readFile(absolute, "utf8");

  if (source.includes("\r\n")) {
    return {
      ok: false,
      steps: [],
      message:
        WIX_PATH +
        " uses CRLF line endings; this script expects LF. Run prettier first.",
    };
  }

  let next = source;
  const steps = [];

  // Imports are one-way substitutions: once applied, the original anchor is
  // gone, so there is nothing left to rewrite. They are skipped in both modes.
  for (const edit of IMPORT_EDITS) {
    if (edit.done(next)) {
      steps.push({ name: edit.name, status: "already applied" });
      continue;
    }

    const patched = edit.apply(next);

    if (patched === null) {
      return {
        ok: false,
        steps,
        message:
          'Could not find the anchor for "' +
          edit.name +
          '" in ' +
          WIX_PATH +
          ". No changes were written.",
      };
    }

    next = patched;
    steps.push({ name: edit.name, status: "applied" });
  }

  // getBlogPosts: anchor-based, so it can be re-applied verbatim in force mode.
  const hasFilterParam = next.includes(
    "export async function getBlogPosts(filter",
  );

  if (hasFilterParam && !options.force) {
    steps.push({ name: "getBlogPosts(filter)", status: "already applied" });
  } else {
    const patched = replaceBlock(
      next,
      "// Fetch all blog posts with pagination",
      GET_BLOG_POSTS_REPLACEMENT,
    );

    if (patched === null) {
      return {
        ok: false,
        steps,
        message:
          'Could not find the anchor for "getBlogPosts(filter)" in ' +
          WIX_PATH +
          ". No changes were written.",
      };
    }

    next = patched;
    steps.push({
      name: "getBlogPosts(filter)",
      status: hasFilterParam ? "rewritten" : "applied",
    });
  }

  // Helpers: appended once, or replaced wholesale when forced.
  const hasHelpers = next.includes(HELPERS_MARKER);

  if (hasHelpers && !options.force) {
    steps.push({
      name: "blog presentation helpers",
      status: "already applied",
    });
  } else if (hasHelpers) {
    const stripped = stripHelpers(next);

    if (stripped === null) {
      return {
        ok: false,
        steps,
        message:
          "Could not locate the existing helper block. No changes written.",
      };
    }

    next = stripped + "\n" + BLOG_HELPERS;
    steps.push({ name: "blog presentation helpers", status: "rewritten" });
  } else {
    next = next + "\n" + BLOG_HELPERS;
    steps.push({ name: "blog presentation helpers", status: "applied" });
  }

  if (next === source) return { ok: true, steps, written: false };

  if (options.dryRun) return { ok: true, steps, written: false };

  await backup(WIX_PATH);
  await writeFile(absolute, next, "utf8");

  return { ok: true, steps, written: true };
}

// ---------------------------------------------------------------------------
// Preflight
// ---------------------------------------------------------------------------

/**
 * SectionBorder throws at build time when no asset matches
 * `<type>-<backgroundColor>`, so confirm the marker borders exist up front.
 */
async function checkBorderAssets(colors) {
  const warnings = [];
  const directory = path.join(ROOT, BORDERS_DIR);

  let entries;

  try {
    entries = await readdir(directory);
  } catch {
    warnings.push(BORDERS_DIR + " not found — could not verify border assets.");
    return warnings;
  }

  for (const color of colors) {
    const stem = "marker-" + color;

    if (!entries.some((entry) => entry.startsWith(stem + "."))) {
      warnings.push(
        "No " +
          stem +
          " asset in " +
          BORDERS_DIR +
          " — SectionBorder will throw on the page that uses it. " +
          "Add the asset or pass a different borderColor.",
      );
    }
  }

  return warnings;
}

async function preflight() {
  const packagePath = path.join(ROOT, "package.json");

  if (!(await pathExists(packagePath))) {
    return {
      fatal:
        "No package.json in " +
        ROOT +
        ". Put this script at the project root and run it from there.",
      warnings: [],
    };
  }

  const warnings = [];

  try {
    const pkg = JSON.parse(await readFile(packagePath, "utf8"));
    const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };

    if (!dependencies["@wix/blog"]) {
      warnings.push(
        "@wix/blog is not listed in package.json — run `npm install @wix/blog`.",
      );
    }
    if (!dependencies["slugify"]) {
      warnings.push(
        "slugify is not listed in package.json — the new helpers import it.",
      );
    }
  } catch {
    warnings.push("Could not parse package.json.");
  }

  if (!(await pathExists(path.join(ROOT, WIX_PATH)))) {
    return { fatal: WIX_PATH + " not found.", warnings };
  }

  if (!(await pathExists(path.join(ROOT, "src/pages/learn.astro")))) {
    warnings.push(
      "src/pages/learn.astro not found — the new routes live under src/pages/learn/.",
    );
  }

  warnings.push(
    ...(await checkBorderAssets(["rainbow-orange", "rainbow-blue"])),
  );

  return { fatal: null, warnings };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function printHelp() {
  console.log(
    [
      "apply-blog-pages.mjs — add the Wix-backed blog archive",
      "",
      "  node apply-blog-pages.mjs         apply, skipping anything already present",
      "  node apply-blog-pages.mjs -f      force: rewrite every file and re-apply",
      "                                    every patch, even where already present",
      "  node apply-blog-pages.mjs -n      dry run: report only, write nothing",
      "  node apply-blog-pages.mjs -h      show this message",
      "",
      "Long forms --force, --dry-run and --help are also accepted.",
      "Files overwritten are backed up to .backup/<timestamp>/ first.",
    ].join("\n"),
  );
}

async function main() {
  const options = parseOptions(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  if (options.unknown.length > 0) {
    console.log(
      "Ignoring unrecognised option(s): " + options.unknown.join(", "),
    );
  }

  console.log("PRISM frontend — applying the Wix blog pages");

  if (options.force) {
    console.log("Force mode: existing files and patches will be rewritten.");
  }
  if (options.dryRun) {
    console.log("Dry run: nothing will be written.");
  }

  const { fatal, warnings } = await preflight();

  for (const warning of warnings) console.log("  ! " + warning);

  if (fatal) {
    console.error("\nAborted: " + fatal);
    process.exitCode = 1;
    return;
  }

  console.log("\n1. Patching " + WIX_PATH);
  const patch = await patchWixFile(options);

  if (!patch.ok) {
    for (const step of patch.steps) {
      console.log("  · " + step.name + ": " + step.status);
    }
    console.error("\nAborted: " + patch.message);
    process.exitCode = 1;
    return;
  }

  for (const step of patch.steps) {
    console.log("  · " + step.name + ": " + step.status);
  }

  console.log("\n2. Copying new files");
  const written = [];

  for (const file of NEW_FILES) {
    const absolute = path.join(ROOT, file.path);
    const alreadyThere = await pathExists(absolute);

    if (alreadyThere && !options.force) {
      console.log("  · " + file.path + ": exists, skipped (use -f to rewrite)");
      continue;
    }

    if (options.dryRun) {
      console.log(
        "  · " +
          file.path +
          ": would be " +
          (alreadyThere ? "rewritten" : "created"),
      );
      continue;
    }

    await mkdir(path.dirname(absolute), { recursive: true });

    if (alreadyThere) await backup(file.path);

    await writeFile(absolute, file.contents, "utf8");
    written.push(file.path);

    console.log(
      "  · " + file.path + ": " + (alreadyThere ? "rewritten" : "created"),
    );
  }

  if (written.length > 0) {
    const formatted = await formatWithPrettier(written);

    if (formatted) console.log("\n3. Formatted the new files with prettier");
    else console.log("\n3. Skipped prettier (not installed, or it errored)");
  }

  console.log("\nDone.");
  console.log(
    [
      "",
      "Next:",
      "  npm run dev",
      "  open /learn/<category-slug> and /learn/tag/<tag-slug>",
      "",
      "Still to do by hand:",
      "  · Bookshelf.astro on /learn still links to placeholder URLs — point them at",
      "    /learn/<category-slug> using getCategorySlug() from @api/wix.",
      "  · Post links point at /learn/posts/<slug> until the post pages exist.",
      "    Change BLOG_POST_URL_PREFIX in src/api/wix.ts when they do.",
      '  · If you ever switch to output: "static", add getStaticPaths() to both routes.',
    ].join("\n"),
  );
}

await main();
