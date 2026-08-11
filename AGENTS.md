---
agent: coding
scope: repo-root
---

# Frontend Project — Agent Instructions

## Overview
This is a new revision of the PRISM FL website: https://www.prismfl.org/.

PRISM FL, Inc. is a 501(c)(3) nonprofit based in South Florida (EIN: 85-0891778). Its mission is to expand access to LGBTQ-inclusive education and sexual health resources for youth in South Florida and beyond, with a focus on making sure everyone feels included regardless of race, ethnicity, religion, sexual orientation, gender identity, or gender expression. The site serves students, parents, educators, allies, volunteers, donors, and community partners.

This Astro frontend renders public-facing content, program pages, events, resources, blog/podcast content, job postings, task forces, and an STI clinic search.

## Tech Stack
- Framework: Astro `^5.15.9`
- Renderer: `@astrojs/react` with React `^19.2.4` + TypeScript `^5.9.3`
- Adapter: `@astrojs/node` for SSR
- Styling: Sass `^1.94.2` with `@sassi/breakpoints`
- CMS / Data: Wix SDK (`@wix/data`, `@wix/events`), PayloadCMS rich text (`@payloadcms/richtext-lexical`)
- Icons: `astro-icon` with `@iconify-json/ri`
- Utilities: `dayjs`, `slugify`, `color`, `css-filter-converter`, `murmurhash`, `url-join`
- Tooling: ESLint `^9.39.3`, Prettier `^3.8.3`, `prettier-plugin-astro`

## Commands
- Dev server: `npm run dev` (or `astro dev`)
- Production build: `npm run build`
- Preview build: `npm run preview`
- Production start: `npm run start` (runs `node ./dist/server/entry.mjs`)
- Update inbox data: `npm run fetch-inbox` (runs `git checkout main && git pull` inside `src/inbox`)
- Format: `npx prettier --write .`
- Lint: `npx eslint .`

## Project Structure
- `src/pages/` — Astro file-based routes
- `src/layouts/` — page shell layouts
- `src/components/` — Astro and React components
- `src/inbox/` — external data source (git-managed content; do not edit manually)
- `src/styles/` — global Sass, variables, mixins
- `public/` — static assets
- `dist/` — build output (do not edit)

## Astro Conventions
- Prefer `.astro` components for static markup and layout.
- Use React components only for interactive islands.
- Add explicit client directives (`client:load`, `client:visible`, `client:idle`, `client:media`) to interactive React components.
- Keep React islands small and data-bound; pass data via props from `.astro` pages.
- Use `Astro.props` for typed component props.
- Prefer `getStaticPaths` for static route generation where data is available at build time.
- Use Astro's `server` output with the Node adapter for SSR pages that need runtime data.

## React Conventions
- Write React components as functions, not classes.
- Use hooks; avoid class components.
- Keep components in `src/components/` with `.tsx` extension.
- Do not add React state where Astro props and server data suffice.
- Follow `eslint-plugin-react-hooks` rules for hook dependencies.

## Styling
- Use Sass (`*.scss`) for component and global styles.
- Use CSS custom properties for theme colors and fonts.
- Use `@sassi/breakpoints` for responsive breakpoints.
- Avoid inline styles; prefer utility classes or component-scoped Sass modules.

## Data & Content
- Fetch Wix data via `@wix/sdk` in Astro pages or API routes.
- Treat `src/inbox/` as read-only content; use `npm run fetch-inbox` to refresh it.
- Render PayloadCMS Lexical rich text with `@payloadcms/richtext-lexical` serializers.
- Use `slugify` for URL-safe slugs and `dayjs` for date formatting.

## Assets & Images
- Store static assets in `public/`.
- Generate or place bespoke card backgrounds in `public/` or an `src/assets/` directory.
- Provide an `/image-not-found` fallback route.

## Domain Context
PRISM FL's programs and content areas include:
- **STI Clinic Search** — directory of free and low-cost STI testing centers in South Florida, with clinic details, hours, tests offered, pricing, and accessibility info.
- **STI Clinic Vetting Program** — volunteer-driven process for verifying clinics and building the Certified Partner Program.
- **PRISM Student Ambassador Program (P-SAP)** — network and resources for high school and college LGBTQ+ student organization leaders.
- **School Policy Hub** — guide to LGBTQ+ rights and policies in Florida schools, focused on Miami-Dade, Broward, and Palm Beach counties.
- **Email Your Teachers** — advocacy tool for contacting educators.
- **Resources / Learn** — educational content, guides, and support materials.
- **Events** — upcoming community events, volunteer orientations, and school board meetings.
- **News / Blog / Podcast** — press, articles, and media content.
- **About / Our Team / Board of Directors** — organizational and leadership info.
- **Donate / Get Involved / Volunteer / Shop** — participation and fundraising.

## Pages & Features
Implement and maintain:
- Home, About, Quick Links, Task Forces, Job Postings, Blog & Podcast, SPH, Events, STI Clinic Search
- Privacy Policy / "Do Not Use My Personal Information"
- Section backgrounds, section borders, configurable theme colors/fonts
- Banner alerts, search bar, OpenGraph props per page, newsletter signup, auto-carousel
- Linode backups awareness

## SEO / Meta
- Add OpenGraph and Twitter card meta tags per page.
- Use Astro's `<head>` slot or `Astro.props` for page-specific metadata.
- Keep tone inclusive, youth-centered, and accessible.

## Accessibility & Tone
- Maintain an inclusive, welcoming tone appropriate for LGBTQ+ youth and allies.
- Ensure color contrast and readability meet WCAG 2.1 AA.
- Support keyboard navigation and screen readers for interactive components.
- Avoid assumptions about gender, sexuality, or family structure in copy.

## Boundaries
- ✅ Always: run `npm run build` after non-trivial changes.
- ✅ Always: format with Prettier before finishing.
- ⚠️ Ask first: before adding new dependencies or changing `astro.config.*`.
- ⚠️ Ask first: before modifying `src/inbox/` contents directly.
- ❌ Never: commit `.env` files or Wix API keys.
- ❌ Never: manually edit `package-lock.json` or `dist/`.

