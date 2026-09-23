// src/types/blog.ts
//
// Render-only post summary consumed by the BlogPostCard, BlogPostList,
// RelatedPosts, and BlogArchive components. Build instances with
// postToSummary() in src/lib/blog.ts.

/** A frontmatter tag with its /learn/tagged-with/[tag] link. */
export interface TagLink {
  /** Original-case label from frontmatter (e.g. "Sexual Health"). */
  label: string;
  href: string;
}

export interface PostSummary {
  /** Entry id: the .mdx filename without extension. */
  slug: string;
  /** Article URL. */
  href: string;
  title: string;
  /** ISO 8601 string; dayjs() accepts string or Date. */
  date: string;
  excerpt?: string;
  image?: { src: string; alt?: string } | null;
  /** Always present (possibly empty) — every frontmatter tag is linked. */
  tags: TagLink[];
}
