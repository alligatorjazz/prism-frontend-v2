// src/content.config.ts
//
// "blog" content collection: the PRISM Learn posts that
// scripts/compile-posts.ts compiled from Wix into .mdx files under
// src/content/posts/.
//
// Each file's frontmatter becomes `entry.data`, its raw markdown becomes
// `entry.body`, and `render(entry)` produces the HTML.
//
// Docs: https://docs.astro.build/en/guides/content-collections/

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  // Entry `id` is the filename without extension (e.g. "dental-dams"),
  // which doubles as the URL slug for /learn/posts/[slug].
  loader: glob({
    pattern: "**/*.mdx",
    base: "./src/content/posts",
  }),
  schema: z
    .object({
      // Post title; also used for the page <title> and OG tags.
      title: z.string(),
      // ISO 8601 published timestamp Wix reported. Plain in YAML, so it
      // may arrive as a Date or a string — coerce normalizes both.
      publishDate: z.coerce.date(),
      // Author display name (e.g. "Maxx Fenning").
      author: z.string().default(""),
      // Short blurb, rendered in the PageIntro and meta description.
      excerpt: z.string().default(""),
      // Wix categories and tags were merged into a single flat list when
      // pulled, so this is all the taxonomy the frontmatter carries.
      tags: z.array(z.string()).default([]),
      // Cover image, converted from the Wix Media object.
      coverImage: z
        .object({
          url: z.string(),
          id: z.string().optional(),
          height: z.number().optional(),
          width: z.number().optional(),
          alt: z.string().optional(),
          filename: z.string().optional(),
        })
        .optional(),
    })
    // Keep (and ignore) any extra front-matter keys so later tweaks to
    // compile-posts.ts don't break the build.
    .passthrough(),
});

export const collections = { blog };
