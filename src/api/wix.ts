// src/api/wix.ts
import { createClient, ApiKeyStrategy, media } from "@wix/sdk";
import { wixEventsV2 } from "@wix/events";
import { items } from "@wix/data";
import { posts, categories, tags } from "@wix/blog";
import slugify from "slugify";

const apiKey = import.meta.env.WIX_API_KEY;
const siteId = import.meta.env.WIX_SITE_ID;

if (!apiKey || !siteId) {
  console.error("Missing Wix credentials:", {
    hasApiKey: !!apiKey,
    hasSiteId: !!siteId,
  });
  throw new Error("WIX_API_KEY and WIX_SITE_ID must be set");
}
const wix = createClient({
  auth: ApiKeyStrategy({
    apiKey: import.meta.env.WIX_API_KEY,
    siteId: import.meta.env.WIX_SITE_ID,
  }),
  modules: { wixEventsV2, items, posts, categories, tags },
});

// ============================================
// Data Collections
// ============================================

export async function getItems(collection: string) {
  const collectionQuery = await wix.items.query(collection).find();
  let hasNext = collectionQuery.hasNext();
  let items = collectionQuery.items;

  while (hasNext) {
    const nextQuery = await collectionQuery.next();
    items = [...items, ...nextQuery.items];
    hasNext = nextQuery.hasNext();
  }

  return items;
}

// ============================================
// Events
// ============================================

export async function getEvents() {
  const allEvents: any[] = [];
  const limit = 100;
  let cursor: string | null = null;
  let hasMore = true;

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  while (hasMore) {
    const response: any = await wix.wixEventsV2.queryEvents({
      filter: {
        status: { $in: ["UPCOMING"] },
        "dateAndTimeSettings.startDate": {
          $gte: oneYearAgo,
        },
      },
      sort: [{ fieldName: "dateAndTimeSettings.startDate", order: "ASC" }],
      paging: {
        limit,
        ...(cursor ? { cursor } : {}),
      },
    });

    allEvents.push(...response.events);

    if (response.pagingMetadata?.cursors?.next) {
      cursor = response.pagingMetadata.cursors.next;
    } else {
      hasMore = false;
    }
  }

  return allEvents;
}

export async function getEventsPage(limit: number = 12, cursor?: string) {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const response: any = await wix.wixEventsV2.queryEvents({
    filter: {
      status: { $in: ["UPCOMING"] },
      "dateAndTimeSettings.startDate": {
        $gte: oneYearAgo,
      },
    },
    sort: [{ fieldName: "dateAndTimeSettings.startDate", order: "ASC" }],
    paging: {
      limit,
      ...(cursor ? { cursor } : {}),
    },
  });

  return {
    events: response.events,
    nextCursor: response.pagingMetadata?.cursors?.next ?? null,
    hasMore: !!response.pagingMetadata?.cursors?.next,
  };
}

// ============================================
// Blog Functions
// ============================================

/**
 * Fetch all blog posts with pagination.
 *
 * `filter` is a standard Wix query filter, e.g.
 * `{ categoryIds: { $hasSome: [id] } }`. It defaults to `{}` so existing
 * no-argument callers keep working.
 *
 * NOTE: the explicit sort overrides Wix's default ordering, which pins
 * pinned posts first. Newest-first is what the archive wants; drop the
 * `sort` line if editorial pinning should win on listing pages.
 */
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

    // The SDK query builder returns `items`; the REST shape returns `posts`.
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

// Get a paginated page of blog posts
export async function getBlogPostsPage(limit: number = 12, offset: number = 0) {
  const response: any = await wix.posts.queryPosts({
    paging: {
      limit,
      offset,
    },
  });

  const batch: any[] = response.posts ?? response.items ?? [];

  return {
    posts: batch,
    nextOffset: batch.length === limit ? offset + limit : null,
    hasMore: batch.length === limit,
  };
}

// Query blog posts with filters
export async function queryBlogPosts(options: {
  categoryIds?: string[];
  tagIds?: string[];
  hashtags?: string[];
  featured?: boolean;
  pinned?: boolean;
  sort?: { fieldName: string; order: "ASC" | "DESC" }[];
  limit?: number;
  offset?: number;
}) {
  const filter: any = {};

  if (options.categoryIds && options.categoryIds.length > 0) {
    filter.categoryIds = { $hasSome: options.categoryIds };
  }

  if (options.tagIds && options.tagIds.length > 0) {
    filter.tagIds = { $hasSome: options.tagIds };
  }

  if (options.hashtags && options.hashtags.length > 0) {
    filter.hashtags = { $hasSome: options.hashtags };
  }

  if (options.featured !== undefined) {
    filter.featured = { $eq: options.featured };
  }

  if (options.pinned !== undefined) {
    filter.pinned = { $eq: options.pinned };
  }

  const response: any = await wix.posts.queryPosts({
    filter,
    sort: options.sort,
    paging: {
      limit: options.limit || 50,
      offset: options.offset || 0,
    },
  });

  return response.posts ?? response.items ?? [];
}

// Get posts by category
export async function getPostsByCategory(
  categoryId: string,
  limit: number = 50,
) {
  return queryBlogPosts({
    categoryIds: [categoryId],
    limit,
  });
}

// Get posts by tag
export async function getPostsByTag(tagId: string, limit: number = 50) {
  return queryBlogPosts({
    tagIds: [tagId],
    limit,
  });
}

// Get posts by hashtag
export async function getPostsByHashtag(hashtag: string, limit: number = 50) {
  return queryBlogPosts({
    hashtags: [hashtag],
    limit,
  });
}

// Get featured posts
export async function getFeaturedPosts(limit: number = 10) {
  return queryBlogPosts({
    featured: true,
    limit,
  });
}

// Get pinned posts
export async function getPinnedPosts(limit: number = 10) {
  return queryBlogPosts({
    pinned: true,
    limit,
  });
}

// Get most viewed posts
export async function getMostViewedPosts(limit: number = 10) {
  return queryBlogPosts({
    sort: [{ fieldName: "metrics.views", order: "DESC" }],
    limit,
  });
}

// Get recent posts
export async function getRecentPosts(limit: number = 10) {
  return queryBlogPosts({
    sort: [{ fieldName: "firstPublishedDate", order: "DESC" }],
    limit,
  });
}

// Get posts within a date range
export async function getPostsByDateRange(
  startDate: Date,
  endDate: Date,
  limit: number = 50,
) {
  return queryBlogPosts({
    sort: [{ fieldName: "firstPublishedDate", order: "DESC" }],
    limit,
  }).then((posts) =>
    posts.filter((post: any) => {
      const publishedDate = new Date(post.firstPublishedDate);
      return publishedDate >= startDate && publishedDate <= endDate;
    }),
  );
}

// ============================================
// Blog Categories
// ============================================

/** Wix caps a category query at 100 records per request. */
const CATEGORY_PAGE_SIZE = 100;

export interface BlogCategorySummary {
  id: string;
  /** Name shown in the Wix category menu. */
  label: string;
  /** URL segment; falls back to a slugified label when Wix has none. */
  slug: string;
  description: string;
  /** Position in the category menu — lower comes first. */
  displayPosition: number;
  /** Number of published posts. Zero means the category is empty. */
  postCount: number;
  language: string;
  coverImage: { src: string; alt: string } | null;
  updatedDate: string | null;
  /** Link to the category listing page. */
  href: string;
}

export interface GetBlogCategoriesOptions {
  /** Include categories with no published posts. Default: true. */
  includeEmpty?: boolean;
  /** Restrict to one language, e.g. "en". Default: every language. */
  language?: string;
  /**
   * Menu order. Default "ASC", which matches how the Wix dashboard
   * displays the category menu. Wix's own default is "DESC", so this is
   * deliberately explicit.
   */
  sortOrder?: "ASC" | "DESC";
}

/**
 * Every blog category on the site, normalised.
 *
 * Wix caps one request at 100 categories and paginates by offset, so this
 * walks the whole set — new categories added in the dashboard show up with
 * no code change.
 *
 * The normalised shape still carries `id`, `label`, `slug` and
 * `description`, so callers written against the old raw-object version keep
 * working.
 */
export async function getBlogCategories(
  options: GetBlogCategoriesOptions = {},
): Promise<BlogCategorySummary[]> {
  const { includeEmpty = true, language, sortOrder = "ASC" } = options;

  const filter: any = {};

  if (!includeEmpty) {
    filter.postCount = { $gt: 0 };
  }

  if (language) {
    filter.language = { $eq: language };
  }

  const raw: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    // Cast the options object: the generated SDK types don't expose the
    // full filter/sort surface the endpoint supports.
    const response: any = await (wix.categories.queryCategories as any)({
      filter,
      sort: [{ fieldName: "displayPosition", order: sortOrder }],
      paging: { limit: CATEGORY_PAGE_SIZE, offset },
    });

    // The SDK returns `items`; the REST shape returns `categories`.
    const batch: any[] = response.categories ?? response.items ?? [];
    raw.push(...batch);

    if (batch.length === CATEGORY_PAGE_SIZE) {
      offset += CATEGORY_PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return raw.map(toBlogCategorySummary);
}

/** Reduce a raw Wix category to the shape the site renders. */
export function toBlogCategorySummary(category: any): BlogCategorySummary {
  const label = category?.label ?? category?.title ?? "";
  const slug = category?.slug || toSlug(label);

  return {
    id: category?.id ?? category?._id ?? slug,
    label,
    slug,
    description: (category?.description ?? "").trim(),
    displayPosition: category?.displayPosition ?? 0,
    postCount: category?.postCount ?? 0,
    language: category?.language ?? "",
    coverImage: resolveCategoryCover(category),
    updatedDate: category?._updatedDate ?? null,
    href: "/learn/" + slug,
  };
}

/**
 * Category covers come back the same way post covers do: as a Wix Media
 * identifier that has to be resolved through the SDK, or occasionally as a
 * ready URL. Hand-building a static.wixstatic.com path returns 403 for some
 * media, so everything goes through `media.getImageUrl`.
 */
function resolveCategoryCover(
  category: any,
): { src: string; alt: string } | null {
  const ref: string | undefined =
    category?.coverImage?.image ?? category?.coverImage?.url ?? undefined;

  return resolveImageRef(ref, category?.label ?? category?.title ?? "");
}

/**
 * Just the navigable categories, in menu order — the shape a navbar or a
 * "browse by topic" list wants.
 *
 * Display position is authoritative; label is a stable tiebreaker so the
 * order never shifts between requests.
 */
export async function getBlogCategoryMenu(
  options: GetBlogCategoriesOptions = {},
): Promise<BlogCategorySummary[]> {
  const categories = await getBlogCategories(options);

  return [...categories].sort(
    (a, b) =>
      a.displayPosition - b.displayPosition || a.label.localeCompare(b.label),
  );
}

/**
 * Print every category as a table and return it.
 *
 * The quickest way to answer "what is the dashboard actually publishing, and
 * what slug will each page get?" Run it from a scratch route or a tsx script.
 */
export async function printBlogCategories(
  options: GetBlogCategoriesOptions = {},
): Promise<BlogCategorySummary[]> {
  const categories = await getBlogCategories(options);

  console.table(
    categories.map(
      ({ label, slug, postCount, displayPosition, language, id }) => ({
        label,
        slug,
        postCount,
        displayPosition,
        language,
        id,
      }),
    ),
  );

  const empty = categories.filter((category) => category.postCount === 0);

  console.log(
    categories.length +
      " categories; " +
      empty.length +
      " empty" +
      (empty.length ? ": " + empty.map((c) => c.label).join(", ") : ""),
  );

  return categories;
}

// Categorize posts by their categories
export async function categorizePostsByCategory(posts: any[]) {
  const allCategories = await getBlogCategories();
  const categorizedPosts = new Map<string, any[]>();

  // Initialize map with all categories
  allCategories.forEach((category) => {
    categorizedPosts.set(category.id, []);
  });

  // Group posts by category
  posts.forEach((post) => {
    post.categoryIds?.forEach((categoryId: string) => {
      const categoryPosts = categorizedPosts.get(categoryId);
      if (categoryPosts) {
        categoryPosts.push(post);
      }
    });
  });

  return categorizedPosts;
}

// ============================================
// Blog Tags
// ============================================

// Fetch all tags
export async function getBlogTags() {
  const allTags: any[] = [];
  const limit = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response: any = await wix.tags.queryTags({
      paging: {
        limit,
        offset,
      },
    });

    const batch: any[] = response.tags ?? response.items ?? [];
    allTags.push(...batch);

    if (batch.length === limit) {
      offset += limit;
    } else {
      hasMore = false;
    }
  }

  return allTags;
}

// ============================================
// Blog Presentation Helpers
// ============================================

/**
 * Location used for links to individual posts.
 *
 * Every post link is built here, so this is the only line to change if the
 * post route ever moves.
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
 * Resolve an arbitrary Wix Media reference to an absolute URL.
 *
 * Media arrives as a `wix:image://` identifier rather than a ready URL, so it
 * has to go through the SDK. Hand-building a static.wixstatic.com URL only
 * works for some media and returns 403 for the rest. Some responses inline a
 * full URL instead, so that case passes straight through.
 */
function resolveImageRef(
  ref: string | undefined | null,
  alt: string,
): { src: string; alt: string } | null {
  if (!ref) return null;

  if (ref.startsWith("http://") || ref.startsWith("https://")) {
    return { src: ref, alt };
  }

  try {
    const { url } = media.getImageUrl(ref);
    return url ? { src: url, alt } : null;
  } catch (error) {
    console.error("Could not resolve image:", ref, error);
    return null;
  }
}

/** A post's cover image, wherever the payload happens to keep it. */
function resolveCoverImage(post: any): { src: string; alt: string } | null {
  const ref: string | undefined =
    post?.media?.wixMedia?.image ??
    post?.coverImage?.url ??
    post?.heroImage?.url;

  return resolveImageRef(ref, post?.title ?? "");
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
  slug: string;
  href: string;
  date: string | Date | null;
  image: { src: string; alt: string } | null;
  tags: BlogTagLink[];
}

// ---- Text --------------------------------------------------

/** Collapse whitespace and drop markup that survived the excerpt field. */
function toPlainText(value: string | undefined): string {
  if (!value) return "";

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, length: number): string {
  if (value.length <= length) return value;

  return value.slice(0, length).trimEnd() + "…";
}

// ---- Post normalising --------------------------------------

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
  const slug = post.slug ?? post.id ?? "";

  return {
    id: post.id,
    title: post.title ?? "Untitled",
    excerpt: truncate(toPlainText(post.excerpt || post.contentText), 220),
    slug,
    href: BLOG_POST_URL_PREFIX + slug,
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
    add({ label: tag.label, slug: getTagSlug(tag), tagId: tag.id ?? tag._id });
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

// ---- Archive page loaders ----------------------------------

/** Everything needed to render /learn/[blog-post-category]. */
export async function getBlogPostsByCategorySlug(slug: string) {
  const allCategories = await getBlogCategories();
  const category = allCategories.find(
    (candidate) => getCategorySlug(candidate) === slug,
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

// ============================================
// Single Blog Post
// ============================================

export interface BlogPostAuthor {
  name: string;
  image: { src: string; alt: string } | null;
}

export interface BlogPostDetail {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  href: string;
  date: string | Date | null;
  updatedDate: string | Date | null;
  image: { src: string; alt: string } | null;
  tags: BlogTagLink[];
  categories: BlogTagLink[];
  author: BlogPostAuthor | null;
  readingTimeMinutes: number;
  /** Body split into paragraphs, ready to render. */
  paragraphs: string[];
  /**
   * The Ricos document, present because the fetch requests the
   * RICH_CONTENT fieldset. Unused by the current page.
   */
  richContent: unknown | null;
}

/**
 * One post, by slug.
 *
 * `fieldsets: ["RICH_CONTENT"]` is what makes `post.richContent` exist at
 * all; without it the field is undefined and any rich-content renderer fails
 * silently. The slug filter is used rather than getPostBySlug() so this goes
 * through the same queryPosts call as every other function here.
 *
 * See Wix: https://dev.wix.com/docs/sdk/backend-modules/blog/posts/get-post-by-slug
 * A queryPosts fieldset is how the Ricos document is requested:
 * https://dev.wix.com/docs/sdk/backend-modules/blog/introduction
 */
export async function getBlogPostBySlug(slug: string): Promise<any | null> {
  const response: any = await wix.posts.queryPosts({
    filter: { slug: { $eq: slug } },
    fieldsets: ["RICH_CONTENT"],
    paging: { limit: 1 },
  });

  const batch: any[] = response.posts ?? response.items ?? [];
  return batch[0] ?? null;
}

// ---- Normalising -------------------------------------------

/** Split plain-text body into paragraphs without splitting sentences. */
function toParagraphs(value: string | undefined): string[] {
  const text = (value ?? "").trim();
  if (!text) return [];

  // Wix separates paragraphs with a blank line; fall back to single
  // newlines if the whole body arrived as one block.
  const blocks = text.split(/\n{2,}/);
  const parts = blocks.length > 1 ? blocks : text.split(/\n+/);

  return parts.map((part) => part.trim()).filter(Boolean);
}

function estimateReadingTime(value: string | undefined): number {
  const words = (value ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Authors arrive as a member object, an id, or nothing at all. */
function resolveAuthor(post: any): BlogPostAuthor | null {
  const author = post?.author ?? post?.memberAuthor ?? null;

  if (!author || typeof author === "string") return null;

  const name =
    author.nickname ?? author.name ?? author.displayName ?? author.title ?? "";

  if (!name) return null;

  const photo = author.profilePhoto ?? author.image ?? author.avatar ?? null;
  const ref =
    typeof photo === "string" ? photo : (photo?.url ?? photo?.image ?? null);

  return { name, image: resolveImageRef(ref, name) };
}

/** A post's categories, resolved against the category list. */
function resolvePostCategories(
  post: any,
  categoriesById: Map<string, any>,
): BlogTagLink[] {
  const links = new Map<string, BlogTagLink>();

  for (const categoryId of post?.categoryIds ?? []) {
    const category = categoriesById.get(categoryId);
    if (!category) continue;

    const slug = getCategorySlug(category);
    if (!slug || links.has(slug)) continue;

    links.set(slug, {
      label: category.label ?? "",
      slug,
      href: "/learn/" + slug,
    });
  }

  return [...links.values()];
}

/** Reduce a raw Wix post to everything a post page renders. */
export function toBlogPostDetail(
  post: any,
  options: {
    tagsById?: Map<string, any>;
    categoriesById?: Map<string, any>;
  } = {},
): BlogPostDetail {
  const { tagsById = new Map(), categoriesById = new Map() } = options;

  const body = post?.contentText ?? post?.excerpt ?? "";
  const slug = post?.slug ?? post?.id ?? "";

  return {
    id: post?.id,
    slug,
    title: post?.title ?? "Untitled",
    excerpt: toPlainText(post?.excerpt),
    href: BLOG_POST_URL_PREFIX + slug,
    date: post?.firstPublishedDate ?? post?.publishingDate ?? null,
    updatedDate: post?.lastPublishedDate ?? post?.updatedDate ?? null,
    image: resolveCoverImage(post),
    tags: resolvePostTags(post, tagsById),
    categories: resolvePostCategories(post, categoriesById),
    author: resolveAuthor(post),
    readingTimeMinutes: estimateReadingTime(body),
    paragraphs: toParagraphs(body),
    richContent: post?.richContent ?? null,
  };
}

// ---- Related posts -----------------------------------------

/**
 * Posts on the same topic, most relevant first:
 *
 *   1. same category
 *   2. same tag
 *   3. whatever was published most recently
 *
 * The current post is filtered out by id, and every stage is skipped once
 * `limit` is reached, so a post with no category or tags still fills its
 * sidebar from the recent-posts fallback.
 */
export async function getRelatedBlogPosts(
  post: any,
  limit: number = 6,
): Promise<BlogPostSummary[]> {
  if (!post?.id) return [];

  const rawTags = await getBlogTags();
  const tagsById = new Map<string, any>(
    rawTags.map((tag: any) => [tag.id, tag]),
  );

  const collected: any[] = [];
  const seen = new Set<string>([post.id]);

  const add = (batch: any[]) => {
    for (const candidate of batch) {
      if (collected.length >= limit) return;
      if (!candidate?.id || seen.has(candidate.id)) continue;

      seen.add(candidate.id);
      collected.push(candidate);
    }
  };

  const categoryIds = post.categoryIds ?? [];
  if (categoryIds.length > 0) {
    add(await getBlogPosts({ categoryIds: { $hasSome: categoryIds } }));
  }

  const tagIds = post.tagIds ?? [];
  if (tagIds.length > 0) {
    add(await getBlogPosts({ tagIds: { $hasSome: tagIds } }));
  }

  if (collected.length < limit) {
    // getBlogPosts() already sorts newest-first.
    add(await getBlogPosts());
  }

  return collected
    .slice(0, limit)
    .map((candidate) => toBlogPostSummary(candidate, tagsById));
}

/** Everything the post route needs, in one call. */
export async function getBlogPostDetail(slug: string, relatedLimit = 6) {
  const post = await getBlogPostBySlug(slug);

  if (!post) return null;

  const [rawTags, rawCategories, related] = await Promise.all([
    getBlogTags(),
    getBlogCategories(),
    getRelatedBlogPosts(post, relatedLimit),
  ]);

  const detail = toBlogPostDetail(post, {
    tagsById: new Map(rawTags.map((tag: any) => [tag.id, tag])),
    categoriesById: new Map(rawCategories.map((c: any) => [c.id, c])),
  });

  return { post: detail, related };
}
