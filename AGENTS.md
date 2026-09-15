# PRISM South Florida — Wix Blog Archive Implementation: Thread Summary & Continuation Guide

## 1. What the work was

Implement a **dynamic, paginated blog archive** for the PRISM South Florida Astro frontend, driven entirely by the Wix Blog API, producing two new route types:

- `/learn/[blog-post-category]` — one page per Wix blog category
- `/learn/tag/[tag-name]` — one page per Wix blog tag (registered *or* freeform hashtag)

The requirement was **dynamic routing**: a category or tag created in the Wix dashboard must appear on the site without a code change or manual rebuild. That constraint drove almost every subsequent design decision.

The thread then added a **self-applying Node script** (`apply-blog-pages.mjs`) so the files could be dropped into the project in one command, and finally an `-f` flag to force rewrites.

## 2. Deliverables — inventory

| Artifact | Role | Status |
|---|---|---|
| `apply-blog-pages.mjs` | Root-level installer. Patches `wix.ts`, writes 4 new files, backs up, formats. Flags: `-f` / `-n` / `-h` (long forms accepted) | Final version delivered |
| `src/api/wix.ts` | Patched in place — not replaced | Patch spec delivered |
| `src/components/BlogPostList.astro` | New. Reusable, responsive, paginated post list | Payload in script |
| `src/sections/BlogArchive.astro` | New. `PageIntro` → `SectionBorder` → ruled-paper section → list | Payload in script |
| `src/pages/learn/[blog-post-category].astro` | New. Category listing route | Payload in script |
| `src/pages/learn/tag/[tag-name].astro` | New. Tag listing route | Payload in script |

### The patch to `src/api/wix.ts` — four edits, computed in memory before any write

1. **Import `media`** — `createClient, ApiKeyStrategy` → `createClient, ApiKeyStrategy, media` from `@wix/sdk`.
2. **Import `slugify`** — added after the `@wix/blog` import.
3. **`getBlogPosts(filter = {})`** — gained a filter parameter and `sort: [{ fieldName: "firstPublishedDate", order: "DESC" }]`, plus a tolerant response read: `response.posts ?? response.items ?? []`.
4. **Appended the "Blog Presentation Helpers" block** — a normalisation layer.

### What the normalisation layer does

Raw Wix payloads vary by SDK call style, so `wix.ts` reduces them to a stable `BlogPostSummary` shape before any Astro component touches them:

- `toSlug` / `getCategorySlug` / `getTagSlug` — URL-safe slugs, falling back to the label when Wix supplies no slug.
- `resolveCoverImage` — resolves `post.media.wixMedia.image` (a `wix:image://` identifier, not a URL) through `media.getImageUrl`, with a pass-through for values that are already absolute URLs and a `try/catch` that logs and returns `null`.
- `toPlainText` + `truncate` — strips markup and collapses whitespace in excerpts, then truncates at 220 chars on a word-safe boundary.
- `resolvePostTags` — merges `tagIds` (resolved against a `Map` of registered tags), inline `tags`, and freeform `hashtags`, de-duplicating by slug.
- `buildBlogTagIndex(rawTags, rawPosts)` — the tag universe, merging registered tags with hashtags seen on posts, sorted by label.
- `getBlogPostsByCategorySlug` / `getBlogPostsByTagSlug` — page loaders returning `{ category, posts }` or `{ tag, posts }`, or `null` (which the routes turn into a 404).
- `BLOG_POST_URL_PREFIX = "/learn/posts/"` — a single constant controlling every post link, since post detail pages don't exist yet.

### The routes

Both routes follow the same shape: read `Astro.params`, call the loader, `return new Response("...", { status: 404 })` on `null`, then render `BlogArchive` inside `Base` with `class={"page-content"}`. Category pages highlight `--rainbow-orange` (matching the existing `/learn` page); tag pages use `--rainbow-blue`.

## 3. Project context learned

This is the part a future model most needs, because much of it is not obvious from the code alone.

**Stack.** Astro **6.4.8** with `@astrojs/node` and `"start": "node ./dist/server/entry.mjs"` — i.e. **SSR/on-demand rendering**, which is precisely why the dynamic routes need no `getStaticPaths()`. React 19 via `@astrojs/react` (used for `EventList.tsx`, `EventPage.tsx`, `NewsletterForm.tsx`). SCSS via `sass`.

**Two content backends coexist.** Wix (`@wix/data`, `@wix/events`, and now `@wix/blog`) *and* Payload CMS (`@payloadcms/richtext-lexical`, `src/lib/payload.ts`, `src/types/payload.ts`, `src/inbox/payload-types.ts`, plus a `fetch-inbox` script). The blog work is firmly on the Wix side.

**There is already an `AGENTS.md` at the repo root.** I never saw its contents — it wasn't uploaded. Any future model must read it before writing code.

**There is already a root-level `apply-changes.mjs` and a `scripts/create-pages.js`.** So codegen/installer scripts are an established pattern in this repo — but it also means my script may duplicate or conflict with existing tooling that should be checked first.

**`src/lib` already exports a `strictSlug` helper**, used by `PageIntro` to derive section ids: `ConstrainedSection id={strictSlug(title)}`. My helper block added its own `toSlug` using the `slugify` package instead. **This is a convention deviation worth reconciling** — see §6.

**There is a competing image-resolution approach in the codebase.** `our-partners.astro` defines a local `wixImageUrl()` that regex-parses `wix:image://v1/<id>/...` into `https://static.wixstatic.com/media/<id>` by hand. That is exactly the hand-built-URL technique that causes 403s for some media, and why the blog code uses `media.getImageUrl` instead. The two now coexist and should probably be consolidated.

**Directory semantics are strict.** `src/sections/` holds full-width page bands and `PageIntro.astro` lives **there**, not in `src/components/`. `src/components/` holds leaf UI (`SectionBorder`, `TornPaperBox`, `Polaroid`, `Bookshelf`, …). `src/templates/Base.astro` is the page shell.

**`Base.astro` spreads `...props` onto a plain `<div>` around the slot** — which is why `class={"page-content"}` works as a styling hook. It also owns the site's nav route tree (Learn sits under Resources) and renders `Navbar`, `NewsletterSignup`, `Footer` around every page.

**`PageIntro` accepts `image` typed as `HTMLAttributes<"img">` and spreads it onto an `<img>`; its `description` prop is split on `"\n"` into multiple `<p>` elements.** `pointBackTo` renders a literal `< Return to {label}` link.

**Design tokens live in `public/styles/theme.css`**, plus `src/styles/global.scss` and `src/styles/utils.scss` (the latter two were **not** uploaded). Confirmed tokens: `--activist-aqua`, `--youth-yellow-1/2/3`, `--bold-black`, `--witty-white`, `--rainbow-red/orange/yellow/green/blue/purple`, `--text-color`, `--bg-color`, `--fg-color`, `--accent-color`, `--text-font` (Zilla Slab), `--header-font` (Poppins), `--handwriting` (Crudex), `--round-edge: 10px`, `--shadow`.

**`var(--xl)` is used by `our-partners.astro` for `max-width` but is not defined in `theme.css`** — it must come from `global.scss` or `utils.scss`, which I could not inspect. My `BlogArchive` reuses `var(--xl)` to match; if it's undefined anywhere, the container silently loses its max-width.

**The README is a design-polish backlog, not a technical spec.** Relevant entries: *"make pagination arrows into reusable component"* (open — my `BlogPostList` effectively does this), *"Add 'Learn'"* (open), and several paper/notebook-texture refinements. **The blog work is not mentioned in the README at all.**

**`@wix/blog` is absent from `package.json`.** The shared `package.json` lists `@wix/data`, `@wix/events` and `@wix/sdk` but not `@wix/blog`, while the newer `wix.ts` imports `posts, categories, tags` from `@wix/blog`. The script preflights and warns about this. It must be resolved for a clean `npm ci`.

**On the border assets:** the earlier warning I raised turned out to be unnecessary. `src/assets/img/borders/` contains **both** `marker-rainbow-orange.png` and `marker-rainbow-blue.png`, alongside the full `marker-*` and `spray-paint-*` families for every theme colour. `SectionBorder`'s `import.meta.glob` will find them, so the preflight check passes silently. The `throw` on a missing asset is real, but it will not fire here.

## 4. Conventions I followed

**Structural / visual**
- Every page wraps in `Base` with `class={"page-content"}` and sets a page background colour on `.page-content` in a local `<style>` block.
- Every page opens with `PageIntro`, carrying `title`, `description`, a sticker `image`, and a `pointBackTo` breadcrumb (`{ href: "/learn", label: "Learn" }`).
- Sections are separated by `<SectionBorder type="marker" backgroundColor="..." />`.
- Ruled-paper backgrounds are applied as an inline `background-image: url(${ruledBg.src})` with `background-size: 2000px; repeat-y; top center` — copied verbatim from the `#organizations` / `#donors` sections.
- Content containers use `max-width: var(--xl); margin: auto; padding: 4rem 1rem`.

**Pagination — deliberately copied from `our-partners.astro`**
- Identical `.slider` → `.track` → `.page` markup.
- Identical transform: `translateX(calc((var(--current-page, 1) - 1) * -100%))`, with the page number pushed in via `track.style.setProperty("--current-page", ...)`.
- Identical `pagination-arrow.png` through Astro's `Image`, with a `.flip` class rotating the next arrow 180°.
- Identical `Page X of Y` status markup and identical `:disabled` styling (opacity 0.5, no pointer events).

The one deliberate divergence: `our-partners.astro` initialises each slider by string id (`initSlider("organizations")`), whereas `BlogPostList` self-initialises by scanning `document.querySelectorAll(".blog-list")`, so multiple instances coexist without registration.

**Code style**
- Named exports in `src/api/wix.ts`; new functionality integrated into the existing file rather than a new module.
- `@wix/sdk` patterns preserved — `import.meta.env.WIX_API_KEY` / `WIX_SITE_ID`, `createClient` + `ApiKeyStrategy`.
- Functional style: no classes, no `this`, small pure helpers, `Map`-based de-duplication.
- Path aliases `@api`, `@assets`, `@components`, `@sections`, `@templates`.
- TypeScript interfaces for every normalised shape, with `any` confined to the raw-Wix boundary.
- `slugify` (already a dependency) rather than a hand-rolled slug function.

**Safety conventions in the installer**
- Dry-run mode; timestamped backups to `.backup/<timestamp>/` before any overwrite.
- Anchor-based, idempotent edits that check for their own result first.
- **Atomic failure**: all four `wix.ts` edits are computed in memory; if any anchor is missing, nothing is written and the script names the failing step.
- Refuses to run on a CRLF copy of `wix.ts`.
- Preflight checks for `package.json`, `wix.ts`, `learn.astro`, the border assets, and missing Wix dependencies.

## 5. Process — how the script reached its final form

1. **Read the codebase first.** I read the full `wix.ts`, both `learn.astro` variants, `Base`, `PageIntro`, `SectionBorder`, `TornPaperBox`, `Polaroid`, `Navbar`, `our-partners.astro` (both variants), `theme.css`, `package.json`, the README, and `file-tree.txt`. Crucially, `our-partners.astro` supplied the pagination pattern and `learn.astro` supplied the page-shell pattern.
2. **Identified the two `wix.ts` versions.** `e2f8adb18905-wix.ts` predates blog support entirely; `f297a57f110f-wix (1).ts` has the blog query functions but **no** `media` import, **no** filter parameter, and none of the presentation helpers. The installer therefore *patches*, never overwrites — overwriting would have destroyed the user's existing `getEvents`, `getItems`, `getBlogPostsPage`, `queryBlogPosts`, `categorizePostsByCategory` and friends.
3. **Built the normalisation layer** because raw Wix post shapes are inconsistent across SDK call styles and because tag pages must work for both registered tags and freeform hashtags.
4. **Wrote the four file payloads as strings inside the script**, letting both routes share one `BlogArchive` section so identical markup exists once.
5. **Added the installer mechanics** — anchor replacement, block replacement, self-checking idempotency, backups, prettier, preflight.
6. **Then added `-f`.** This required a real design distinction: imports are **one-way substitutions** (once `media` is imported the original anchor is gone, so `-f` cannot re-apply them and reports `already applied`), whereas `getBlogPosts` is **anchor-based** and can be re-spliced, and the helper block is **strippable to EOF** and re-appended. Hence `-f` rewrites files, re-splices `getBlogPosts`, and replaces the helper block wholesale — never stacking duplicates.
7. **Verified the Wix API surface** (see §7).

## 6. Verification status

**Confirmed by documentation:**

| Claim | Source |
|---|---|
| `posts`, `categories`, `tags` are exported from `@wix/blog` | [Query Posts (Velo)](https://dev.wix.com/docs/velo/apis/wix-blog-backend/posts/query-posts) [^1], [blog application recipe](https://dev.wix.com/digor/api/get-article-content?articleUrl=https%3A%2F%2Fdev.wix.com%2Fdocs%2Fkb-only%2FMCP_REST_RECIPES_KB_ID%2FTRAIN_how-to-code-a-blog-application&format=html) [^2] |
| `queryPosts()` exists and returns a builder | [Query Posts (Velo)](https://dev.wix.com/docs/velo/apis/wix-blog-backend/posts/query-posts) [^1], [Query Posts (API ref)](https://dev.wix.com/docs/api-reference/business-solutions/blog/posts-stats/query-posts) [^3] |
| `queryPosts` paginates at max 100; **default `limit` is 50, offset 0**; default sort is `firstPublishedDate` DESC with **pinned posts first** | [Query Posts (API ref)](https://dev.wix.com/docs/api-reference/business-solutions/blog/posts-stats/query-posts) [^3] |
| `queryCategories()` exists, max 100, defaults `limit` 50 | [Query Categories](https://dev.wix.com/docs/api-reference/business-solutions/blog/category/query-categories) [^4] |
| Tags are a subset of categories used to filter posts | [Tags introduction (Velo)](https://dev.wix.com/docs/velo/apis/wix-tags-v1/introduction) [^5], [Blog Categories (SDK)](https://dev.wix.com/docs/sdk/backend-modules/blog/categories/introduction) [^6] |
| `media.getImageUrl()` resolves Wix Media identifiers to absolute URLs | [SDK Media](https://dev.wix.com/docs/sdk/core-modules/sdk/media) [^7], [Work with Wix Media](https://dev.wix.com/docs/api-reference/articles/sdk-setup-and-usage/work-with-wix-media) [^8] |

**The important consequence:** the default sort is `firstPublishedDate` DESC *with pinned posts first* [^3]. My explicit `sort` override pins nothing, so **it will silently disable Wix's pinned-post ordering on listing pages**. If pinning matters editorially, drop the sort override or re-add pinned-first ordering deliberately.

*Caveat per your multi-source preference: the pinned-posts default is documented in a single source ([^3]); the other queryPosts sources state paging limits but not the pinned default.*

**Still unverified:** the exact raw field names on a post object (`media.wixMedia.image`, `tagIds`, `hashtags`, `firstPublishedDate`, `contentText`). These come from the codebase's own existing `queryBlogPosts` implementation (which used `categoryIds`, `tagIds`, `hashtags`, `featured`, `pinned`, `firstPublishedDate`) plus the Velo-era field vocabulary. **No documentation source was found confirming the exact cover-image field path**, so `resolveCoverImage`'s fallback chain (`media.wixMedia.image` → `coverImage.url` → `heroImage.url`) is defensive by design.

**Corrections to earlier statements in this thread:**
- I warned that the marker borders might not exist. They do — `marker-rainbow-orange.png` and `marker-rainbow-blue.png` are both present in `src/assets/img/borders/`.
- I flagged `posts.queryPosts` / `categories.queryCategories` / `tags.queryTags` as unverified from memory. Now confirmed, along with `media.getImageUrl()`.

## 7. Known open issues

1. **`@wix/blog` is missing from `package.json`** — needs `npm install @wix/blog`.
2. **Duplicate slug helpers** — `src/lib`'s `strictSlug` vs. the new `toSlug`/`slugify` in `wix.ts`. Pick one.
3. **Duplicate image resolution** — `our-partners.astro`'s regex `wixImageUrl()` vs. `media.getImageUrl` in `wix.ts`.
4. **Post links are placeholders** — all point at `/learn/posts/<slug>`, which does not exist. Controlled by `BLOG_POST_URL_PREFIX`. Set it to `"#"` to avoid 404s in the meantime.
5. **`Bookshelf.astro` was never provided**, so the `/learn` page's book links still point at placeholder URLs and were not updated to `/learn/<category-slug>`.
6. **`var(--xl)` provenance unconfirmed** — defined in `global.scss` or `utils.scss`, neither of which I saw.
7. **Pinned-post ordering** — see §6.
8. **Prettier + Astro** — `prettier-plugin-astro` is a dependency, but Prettier 3 requires plugins to be declared in config; if they aren't, `npx prettier --write *.astro` will fail and the script reports "Skipped prettier".
9. **`AGENTS.md` unread** — may contain rules that override everything above.

---

# 8. Instructions for a future AI model

### Read these first, in this order

1. **`AGENTS.md`** at the repo root. It exists in the file tree and I never read it. It may contain binding conventions that supersede this document.
2. **`apply-changes.mjs`** (repo root) and **`scripts/create-pages.js`** — existing installer tooling. Decide whether `apply-blog-pages.mjs` should remain standalone or be folded in. Do not create a third competing script without asking.
3. `src/api/wix.ts` — confirm the helper block landed and that `BLOG_POST_URL_PREFIX` is where you think it is.
4. `src/styles/global.scss` and `src/styles/utils.scss` — resolve the `--xl` question and check for existing utility mixins.
5. `src/lib/index.ts` — confirm `strictSlug`'s signature before reconciling it with `toSlug`.

### Guardrails

- **Do not rewrite `src/api/wix.ts` wholesale.** It contains working `getItems`, `getEvents`, `getEventsPage`, `getBlogPostsPage`, `queryBlogPosts`, `getPostsByCategory`, `getPostsByTag`, `getPostsByHashtag`, `getFeaturedPosts`, `getPinnedPosts`, `getMostViewedPosts`, `getRecentPosts`, `getBlogCategories`, `getBlogTags`, `categorizePostsByCategory`, and `getPostsByDateRange`. Patch, don't replace.
- **Resolve Wix images with `media.getImageUrl`** [^7] [^8], never by hand-building a `static.wixstatic.com` URL — except where you are deliberately refactoring `our-partners.astro`'s existing regex helper to match.
- **Keep the dynamic-routing contract.** The pages must not gain `getStaticPaths()` unless the project moves to `output: "static"`. Adding it would silently freeze the category/tag set at build time and break the core requirement.
- **Never write credentials into source.** Use `import.meta.env.WIX_API_KEY` / `WIX_SITE_ID`, matching the existing pattern.
- Match the existing functional style: no classes, named exports, small pure helpers.
- Any new page: `Base` + `class={"page-content"}` + a `.page-content` background colour + `PageIntro` first + `SectionBorder` between sections.

### Highest-value next tasks

| # | Task | Notes |
|---|---|---|
| 1 | Add `@wix/blog` to `package.json` | Blocking for clean installs |
| 2 | Build the post detail route `/learn/posts/[slug]` | Then set `BLOG_POST_URL_PREFIX` to the real path; it's a single constant by design |
| 3 | Point `Bookshelf.astro` at `getCategorySlug(category)` | Reads as `/learn/${getCategorySlug(c)}` |
| 4 | Reconcile `strictSlug` vs `toSlug` | Prefer the existing `src/lib` helper if it produces equivalent output |
| 5 | Reconcile `wixImageUrl` (our-partners) with `media.getImageUrl` | Removes a latent 403 source |
| 6 | Decide on pinned-post ordering | See §6 — the sort override currently suppresses it |
| 7 | Add `/learn` index links to categories and tags | `getBlogTagIndex()` already returns everything needed for a tag cloud |

### Debugging playbook

- **Category or tag page returns 404** → the loader returned `null`. Log `getBlogCategories()` / `getBlogTagIndex()` and compare slugs against the incoming `Astro.params` value.
- **Page renders but is empty** → the Wix filter matched nothing. Log the raw post once and diff its actual field names against what `resolvePostTags`, `resolveCoverImage` and `getCategorySlug` expect. This is the most likely failure point, since the raw field names are the one thing I could not verify from documentation.
- **Images 403** → a cover image value is already an absolute URL that my pass-through accepted, or `media` wasn't imported correctly.
- **Pagination controls missing** → `totalPages > 1` was false; the component intentionally renders no nav for a single page.
- **Pagination looks broken** → check `.blog-list[data-total-pages]` is present; the script reads the total from that attribute.

### How to run and verify

```bash
cd path/to/frontend
node apply-blog-pages.mjs --dry-run     # report only
node apply-blog-pages.mjs               # apply
node apply-blog-pages.mjs -f            # force: rewrite files, re-splice, replace helpers
npm run dev
# open /learn/<category-slug> and /learn/tag/<tag-slug>
```

After applying, confirm: the four new files exist; `wix.ts` has `media` and `slugify` imported; `BLOG_POST_URL_PREFIX` is present exactly once; no duplicate "Blog Presentation Helpers" blocks exist (the failure mode `-f` was written to prevent).

### If you regenerate the script

Preserve the four safety properties, because they are what make it safe to re-run against a live repo: **dry-run**, **timestamped backups**, **atomic failure** (compute everything before writing anything), and **self-checking idempotency** (every edit tests for its own result first). Keep the import edits reported as `already applied` under `-f` — they are genuinely irreversible and there is nothing user-authored inside them.

**References**

[^1]: [Query Posts | Velo](https://dev.wix.com/docs/velo/apis/wix-blog-backend/posts/query-posts) (9%)
[^2]: [dev.wix.com/digor/api/get-article-content?articleUrl=https://dev.wix....](https://dev.wix.com/digor/api/get-article-content?articleUrl=https%3A%2F%2Fdev.wix.com%2Fdocs%2Fkb-only%2FMCP_REST_RECIPES_KB_ID%2FTRAIN_how-to-code-a-blog-application&format=html) (17%)
[^3]: [Query Posts | API Reference - Wix.com](https://dev.wix.com/docs/api-reference/business-solutions/blog/posts-stats/query-posts) (12%)
[^4]: [Query Categories | API Reference - dev.wix.com](https://dev.wix.com/docs/api-reference/business-solutions/blog/category/query-categories) (10%)
[^5]: [Introduction](https://dev.wix.com/docs/velo/apis/wix-tags-v1/introduction) (4%)
[^6]: [Blog Categories Introduction | SDK](https://dev.wix.com/docs/sdk/backend-modules/blog/categories/introduction) (10%)
[^7]: [Media](https://dev.wix.com/docs/sdk/core-modules/sdk/media) (18%)
[^8]: [Work with Wix Media](https://dev.wix.com/docs/api-reference/articles/sdk-setup-and-usage/work-with-wix-media) (19%)
