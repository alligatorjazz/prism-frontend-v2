// src/api/wix.ts
import { createClient, ApiKeyStrategy } from "@wix/sdk";
import { wixEventsV2 } from "@wix/events";
import { items } from "@wix/data";
import { posts, categories, tags } from "@wix/blog";

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

// Existing functions...
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

// Fetch all blog posts with pagination
export async function getBlogPosts() {
  const allPosts: any[] = [];
  const limit = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response: any = await wix.posts.queryPosts({
      paging: {
        limit,
        offset,
      },
    });

    allPosts.push(...response.posts);

    if (response.posts.length === limit) {
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

  return {
    posts: response.posts,
    nextOffset: response.posts.length === limit ? offset + limit : null,
    hasMore: response.posts.length === limit,
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

  return response.posts;
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

// Fetch all categories
export async function getBlogCategories() {
  const allCategories: any[] = [];
  const limit = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response: any = await wix.categories.queryCategories({
      paging: {
        limit,
        offset,
      },
    });

    allCategories.push(...response.categories);

    if (response.categories.length === limit) {
      offset += limit;
    } else {
      hasMore = false;
    }
  }

  return allCategories;
}

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

    allTags.push(...response.tags);

    if (response.tags.length === limit) {
      offset += limit;
    } else {
      hasMore = false;
    }
  }

  return allTags;
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
