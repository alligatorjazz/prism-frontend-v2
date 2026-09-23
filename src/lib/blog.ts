// src/lib/blog.ts
//
// Helpers shared by the Learn pages that read the "blog" content
// collection (src/content.config.ts).

import slugify from "slugify";
import type { CollectionEntry } from "astro:content";
import type { PostSummary, TagLink } from "../types/blog";

/**
 * URL slug for a tag label: "Sexual Health" -> "sexual-health".
 * Tags are stored in frontmatter in their original case, so every link
 * generation (tag chips, post cards) and every lookup (the
 * /learn/tagged-with/[tag] page) must go through this one function.
 */
export const tagSlug = (label: string): string =>
  slugify(label, { lower: true, trim: true });

/** Frontmatter tag (plain string) -> linked tag. */
export const tagToLink = (tag: string): TagLink => ({
  label: tag,
  href: `/learn/tagged-with/${tagSlug(tag)}`,
});

/** Collection entry -> the summary shape the card/archive components expect. */
export const postToSummary = (entry: CollectionEntry<"blog">): PostSummary => {
  const { title, publishDate, excerpt, tags, coverImage } = entry.data;

  return {
    slug: entry.id,
    href: `/learn/posts/${entry.id}`,
    title,
    date: publishDate.toISOString(),
    ...(excerpt ? { excerpt } : {}),
    ...(coverImage
      ? { image: { src: coverImage.url, alt: coverImage.alt } }
      : {}),
    tags: tags.map(tagToLink),
  };
};
