#!/usr/bin/env node
/**
 * apply-get-involved-redesign.mjs
 *
 * Applies the get-involved redesign to a PRISM frontend checkout:
 *
 *   1. create  src/types/card.ts                  shared card shape
 *   2. create  src/components/Card.astro          generalised from LeadershipProgramCard
 *   3. create  src/components/FlowArrow.astro     the self-reorienting connector
 *   4. create  src/sections/CardGrid.astro        generalised from LeadershipPrograms
 *   5. create  src/sections/FitComparison.astro   Volunteer vs Member + arrows
 *   6. rewrite src/sections/LeadershipPrograms.astro  thin wrapper over CardGrid
 *   7. patch   src/pages/get-involved.astro       binder -> CardGrid + FitComparison,
 *                                                 drop the #core-tracks SCSS,
 *                                                 drop the binder <script>
 *
 * Usage, from the project root:
 *
 *   node apply-get-involved-redesign.mjs [--dry-run] [--prune] [--fix-links] [--no-backup]
 *
 * Every edit is anchored on exact text and aborts the whole run if an anchor
 * is missing, so a partially-applied state is not possible. Touched files are
 * copied into .backup/redesign-<timestamp>/ first.
 *
 * No environment variables are read or written, so dotenv is not involved.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

/* ------------------------------------------------------------------ *
 * 0. CLI
 * ------------------------------------------------------------------ */

const argv = new Set(process.argv.slice(2));

if (argv.has("-h") || argv.has("--help")) {
  console.log(`
  apply-get-involved-redesign.mjs

  Rewrites the core-tracks and leadership-programs parts of
  src/pages/get-involved.astro and adds the generic components they need.

    node apply-get-involved-redesign.mjs [flags]

  Flags
    --dry-run     report what would change, write nothing
    --prune       delete LeadershipProgramCard.astro and LeadershipPrograms_1.astro
                  once nothing under src/ imports them any more
    --fix-links   also repair the get-started section: the duplicate class
                  attribute and the dead /volunteer-interest route
    --no-backup   do not copy touched files into .backup/
    -h, --help    this text
`);
  process.exit(0);
}

const DRY_RUN = argv.has("--dry-run");
const PRUNE = argv.has("--prune");
const FIX_LINKS = argv.has("--fix-links");
const NO_BACKUP = argv.has("--no-backup");

/* ------------------------------------------------------------------ *
 * 1. locate the project root, and the io helpers
 * ------------------------------------------------------------------ */

const looksLikeRoot = (dir) =>
  existsSync(join(dir, "package.json")) &&
  existsSync(join(dir, "src", "pages"));

const findRoot = (from) => {
  let dir = resolve(from);
  for (;;) {
    if (looksLikeRoot(dir)) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
};

const die = (message) => {
  console.error(`\n  x ${message}\n`);
  process.exit(1);
};

const ROOT = findRoot(process.cwd());
if (!ROOT) {
  die(
    `no Astro project root at or above ${process.cwd()} (looked for package.json + src/pages)`,
  );
}

const at = (...parts) => join(ROOT, ...parts);
const show = (abs) => relative(ROOT, abs).split("\\").join("/");

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const BACKUP_DIR = at(".backup", `redesign-${stamp}`);
let backups = 0;

const backUp = (abs) => {
  if (NO_BACKUP || DRY_RUN || !existsSync(abs)) return;
  const target = join(BACKUP_DIR, relative(ROOT, abs));
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, readFileSync(abs));
  backups += 1;
};

const emitFile = (abs, contents) => {
  const existed = existsSync(abs);
  if (existed) backUp(abs);
  mkdirSync(dirname(abs), { recursive: true });
  if (!DRY_RUN) writeFileSync(abs, contents);
  console.log(
    `  ${existed ? "rewrite" : "create "}  ${show(abs)}${DRY_RUN ? "   (dry run)" : ""}`,
  );
};

const step = (title) => console.log(`\n${title}`);

/* ------------------------------------------------------------------ *
 * 2. text surgery helpers
 * ------------------------------------------------------------------ */

/** Replace `find` everywhere, aborting the run if it is not present. */
const mustReplace = (text, find, replace, label) => {
  if (!text.includes(find)) {
    die(
      `anchor not found for ${label} - the file has moved on since this script was written`,
    );
  }
  return text.split(find).join(replace);
};

/** Replace the first occurrence, aborting if it is not present. */
const mustReplaceOnce = (text, find, replace, label) => {
  const index = text.indexOf(find);
  if (index === -1) {
    die(
      `anchor not found for ${label} - the file has moved on since this script was written`,
    );
  }
  return text.slice(0, index) + replace + text.slice(index + find.length);
};

/**
 * The [start, end) range of a top-level SCSS rule, found by brace matching.
 * `selector` is matched as a line-initial selector so it cannot pick up a
 * mention inside a comment.
 */
const cssRuleRange = (text, selector) => {
  const marker = `\n  ${selector} {`;
  const start = text.indexOf(marker);
  if (start === -1) return null;
  let depth = 0;
  for (let i = text.indexOf("{", start); i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    else if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) return { start, end: i + 1 };
    }
  }
  return null;
};

/**
 * The [start, end) range of the first element whose opening tag carries
 * `attribute`, found by counting open/close tags so nested siblings cannot
 * truncate the match.
 */
const elementRange = (text, tag, attribute) => {
  const open = new RegExp(`<${tag}\\b[^>]*\\b${attribute}[^>]*>`).exec(text);
  if (!open) return null;
  const start = open.index;
  const scanner = new RegExp(`<${tag}\\b|</${tag}>`, "g");
  scanner.lastIndex = start;
  let depth = 0;
  let token;
  while ((token = scanner.exec(text)) !== null) {
    if (token[0].startsWith("</")) {
      depth -= 1;
      if (depth === 0) return { start, end: token.index + token[0].length };
    } else {
      depth += 1;
    }
  }
  return null;
};

const splice = (text, range, replacement) =>
  text.slice(0, range.start) + replacement + text.slice(range.end);

/* ------------------------------------------------------------------ *
 * 3. the files this script writes
 * ------------------------------------------------------------------ */

const TYPES_CARD = `/**
 * One entry in a CardGrid.
 *
 * Lives here rather than being exported from an .astro file so both the
 * component and its callers can import the same shape. Reachable as
 * "@datatypes/card" via the tsconfig path alias.
 */
export type CardData = {
  /** Card heading. */
  title: string;
  /** Body copy. Omitted entirely when absent. */
  description?: string;
  /** Small kicker line above the description: a duration, a tier, a date. */
  meta?: string;
  /** Emoji or short glyph shown beside the title. */
  icon?: string;
  /** Any CSS colour. Drives the title, kicker, list headings and CTA. */
  color?: string;
  /** Image URL. Omit for a text-only card. */
  image?: string;
  /** Alt text for the image. Pass "" for a decorative image. */
  imageAlt?: string;
  /** When set, the whole card links here. */
  link?: string;
  /** Visible CTA text. Defaults to "Learn more". */
  linkLabel?: string;
  /** Optional bullet list. Omitted entirely when empty. */
  items?: string[];
  /** Heading for the bullet list. */
  itemsLabel?: string;
};
`;

const CARD_ASTRO = `---
// src/components/Card.astro
//
// One card for any list of things: core tracks, leadership programs,
// resources, events. Generalised from LeadershipProgramCard.
//
// Degrades cleanly:
//   no image  -> no media block
//   no items  -> no list block
//   no link   -> no link layer at all
//
// The whole card is clickable when a link is given. Instead of wrapping the
// card in an <a> - which needs a dynamic tag name, and Astro's scoped styles
// are not guaranteed to stamp data-astro-cid-* onto a dynamic tag - the
// anchor is stretched over the card with an absolutely positioned ::after.
// The root stays a plain <div>, so this component's styles always match it.

import type { CardData } from "@datatypes/card";

const {
  title,
  description,
  meta,
  icon,
  color = "var(--rainbow-purple)",
  image,
  imageAlt,
  link,
  linkLabel = "Learn more",
  items = [],
  itemsLabel,
} = Astro.props as CardData;

const hasItems = items.length > 0;
---

<div class="card" style={\`--card-color: \${color}\`}>
  {
    image && (
      <div class="card-media">
        <img
          src={image}
          alt={imageAlt ?? ""}
          width={400}
          height={250}
          loading="lazy"
        />
      </div>
    )
  }

  <div class="card-body">
    <header class="card-head">
      {icon && <span class="card-icon" aria-hidden="true">{icon}</span>}
      <h3 class="card-title">{title}</h3>
    </header>

    {meta && <p class="card-meta">{meta}</p>}
    {description && <p class="card-description">{description}</p>}

    {
      hasItems && (
        <div class="card-items">
          {itemsLabel && <h4>{itemsLabel}</h4>}
          <ul>
            {items.map((item) => (
              <li>{item}</li>
            ))}
          </ul>
        </div>
      )
    }

    {
      link && (
        <a class="card-link" href={link} aria-label={\`\${linkLabel}: \${title}\`}>
          <span class="card-cta">{linkLabel}</span>
        </a>
      )
    }
  </div>
</div>

<style lang="scss">
  .card {
    /* Token seam: the original card hard-coded var(--fg-color). Move the
       surface token here if it changes. */
    --card-surface: var(--fg-color);

    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--card-surface);
    color: var(--text-color);
    border-radius: var(--round-edge);
    box-shadow: var(--shadow-light);
    overflow: hidden;
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;

    /* The click target is the whole card, so the lift belongs on the card. */
    &:hover,
    &:focus-within {
      transform: translateY(-4px);
      box-shadow: var(--shadow);
    }

    .card-media {
      width: 100%;
      height: 180px;
      overflow: hidden;

      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1.5rem;
    }

    .card-head {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .card-icon {
        font-size: 2rem;
        line-height: 1;
      }

      .card-title {
        margin: 0;
        font-size: 1.5rem;
        color: var(--card-color);
      }
    }

    .card-meta {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--card-color);
    }

    .card-description {
      margin: 0;
      line-height: 1.6;
    }

    .card-items {
      h4 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
        color: var(--card-color);
      }

      ul {
        margin: 0;
        padding-left: 1.5rem;

        li {
          margin-bottom: 0.25rem;
          line-height: 1.5;
          font-size: 0.95rem;
        }
      }
    }

    /* The anchor paints nothing; its ::after covers the card so a click
       anywhere follows the link. */
    .card-link {
      margin-top: auto;
      color: inherit;
      text-decoration: none;

      &::after {
        content: "";
        position: absolute;
        inset: 0;
      }
    }

    .card-cta {
      font-weight: 600;
      color: var(--card-color);
      text-decoration: underline;
      text-underline-offset: 0.25em;
    }

    &:hover .card-cta {
      text-decoration-thickness: 2px;
    }
  }
</style>
`;

const FLOW_ARROW_ASTRO = `---
// src/components/FlowArrow.astro
//
// A CSS-only connector arrow. The glyph is drawn once, natively pointing
// right, and re-aimed with a single rotate value:
//
//   0deg = right    90deg = down    135deg = down-left
//
// The value flips inside a CONTAINER query, so the arrow reorients when the
// layout it lives in stacks, rather than when the viewport happens to cross
// a breakpoint. The classic failure that avoids: a component dropped into a
// narrow column while the viewport is still wide.
//
// PARENT REQUIREMENT: the arrow queries its nearest ancestor container, so
// that ancestor must declare container-type: inline-size. Without it the
// @container rule below can never match and the arrow silently stays at
// angleWide. FitComparison.astro sets it. If the arrow ever stops
// reorienting, look for a missing container first.
//
// To key off the viewport instead, replace the @container block with:
//   @media (max-width: 48rem) { .flow-arrow { --arrow-angle: var(--arrow-angle-stacked, 90deg); } }

type Props = {
  /** Rotation while the layout is side by side. 0deg points right. */
  angleWide?: string;
  /** Rotation once the container is narrower than the breakpoint. */
  angleStacked?: string;
  /** Optional caption under the arrow. */
  label?: string;
  /** Forwarded from the call site so callers can position the arrow. */
  class?: string;
};

const {
  angleWide = "0deg",
  angleStacked = "90deg",
  label,
  class: className,
} = Astro.props as Props;
---

<div
  class:list={["flow-arrow", className]}
  style={\`--arrow-angle-wide: \${angleWide}; --arrow-angle-stacked: \${angleStacked};\`}
>
  <svg
    class="flow-arrow-glyph"
    viewBox="0 0 64 32"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <!-- Shaft. The slight arc keeps the hand-drawn feel of the mockup. -->
    <path
      d="M5 18c14 4 28 4 43-2"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"></path>
    <!-- Head -->
    <path
      d="M38 5l13 10-13 9"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"></path>
  </svg>
  {label && <p class="flow-arrow-label">{label}</p>}
</div>

<style lang="scss">
  .flow-arrow {
    --arrow-angle: var(--arrow-angle-wide, 0deg);

    display: grid;
    justify-items: center;
    gap: 0.5rem;

    .flow-arrow-glyph {
      display: block;
      width: min(100%, 8rem);
      /* height:auto scales the glyph uniformly, so the stroke stays
         proportional. Only reach for vector-effect="non-scaling-stroke" if
         you switch to a stretched (preserveAspectRatio="none") layout. */
      height: auto;
      rotate: var(--arrow-angle);
      transition: rotate 300ms ease;
    }

    .flow-arrow-label {
      margin: 0;
      text-align: center;
      font-size: 1.1rem;
    }
  }

  /* The arrow's own container, not the viewport. */
  @container (width < 48rem) {
    .flow-arrow {
      --arrow-angle: var(--arrow-angle-stacked, 90deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .flow-arrow .flow-arrow-glyph {
      transition: none;
    }
  }
</style>
`;

const CARD_GRID_ASTRO = `---
// src/sections/CardGrid.astro
//
// Generalised from LeadershipPrograms.astro: a heading, an optional intro,
// and a responsive grid of Cards. Drives both rows on /get-involved.

import Card from "@components/Card.astro";
import type { CardData } from "@datatypes/card";

type Props = {
  /** Anchor id, e.g. "core-tracks". */
  id?: string;
  heading?: string;
  intro?: string;
  cards: CardData[];
  /** Minimum card width before the grid reflows to fewer columns. */
  minColumn?: string;
  /** Any CSS colour. Defaults to the page background. */
  background?: string;
};

const {
  id,
  heading,
  intro,
  cards,
  minColumn = "320px",
  background = "var(--bg-color)",
} = Astro.props as Props;
---

<section
  id={id}
  class="card-grid"
  style={\`--grid-bg: \${background}; --min-column: \${minColumn};\`}
>
  <div class="section-content">
    {heading && <h2>{heading}</h2>}
    {intro && <p class="intro">{intro}</p>}
    <div class="cards">
      {cards.map((card) => <Card {...card} />)}
    </div>
  </div>
</section>

<style lang="scss">
  .card-grid {
    padding: 4rem 2rem;
    background: var(--grid-bg);
    /* Text colour is inherited on purpose: the caller decides whether the
       band this sits on is light or dark. */

    .section-content {
      max-width: var(--xl);
      margin: 0 auto;
    }

    h2 {
      text-align: center;
      font-size: 2.5rem;
      margin: 0 0 1rem;
    }

    .intro {
      text-align: center;
      max-width: 800px;
      margin: 0 auto 3rem;
      font-size: 1.1rem;
      line-height: 1.6;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(var(--min-column), 1fr));
      gap: 2rem;
    }
  }
</style>
`;

const FIT_COMPARISON_ASTRO = `---
// src/sections/FitComparison.astro
//
// "What's the best fit for me?" - Volunteer vs Member, plus the connector
// that carries the eye from Member down into the leadership programs.
//
// This section is the containment context the FlowArrows query, which is why
// container-type: inline-size sits on the root. Removing it silently stops
// the arrows from reorienting.

import FlowArrow from "@components/FlowArrow.astro";

const tiers = [
  {
    key: "volunteer",
    heading: "Volunteer",
    lead: "For people who can't commit, or aren't sure yet.",
    body: "Volunteers participate in initiatives when they're available and don't make a specific commitment.",
    note: "Training opportunities for volunteers are limited.",
  },
  {
    key: "member",
    heading: "Member",
    lead: "For individuals that want to go deeper.",
    body: "Members agree to volunteer at least once each month with a particular track and attend monthly All-Member meetings.",
    note: "Members have access to more training and the opportunity to become track leaders, spearheading their own projects within PRISM.",
  },
];
---

<section class="fit-comparison">
  <h2>What's the Best Fit for Me?</h2>

  <div class="tiers">
    {
      tiers.map((tier, index) => (
        <>
          {index > 0 && (
            <FlowArrow class="tier-arrow" angleWide="0deg" angleStacked="90deg" />
          )}
          <article class:list={["tier", tier.key]}>
            <h3>{tier.heading}</h3>
            <p class="lead">{tier.lead}</p>
            <p>{tier.body}</p>
            <p class="note">{tier.note}</p>
          </article>
        </>
      ))
    }
  </div>

  <!-- Points down-left at the leadership-programs heading below. -->
  <div class="descent">
    <FlowArrow class="descent-arrow" angleWide="135deg" angleStacked="90deg" />
  </div>
</section>

<style lang="scss">
  .fit-comparison {
    /* The containment context the FlowArrows query. Do not remove. */
    container-type: inline-size;

    padding: 0 2rem 4rem;
    max-width: var(--xl);
    margin: 0 auto;

    h2 {
      text-align: center;
      font-size: 2rem;
      margin: 0 0 2.5rem;
    }

    .tiers {
      display: grid;
      /* volunteer | arrow | member */
      grid-template-columns: 1fr auto 1fr;
      align-items: start;
      gap: 1.5rem 2rem;

      .tier-arrow {
        align-self: center;
      }

      .tier {
        h3 {
          margin: 0 0 0.75rem;
          font-size: 1.5rem;
          font-family: var(--handwriting);
          text-align: center;
        }

        p {
          margin: 0 0 0.75rem;
          line-height: 1.6;
        }

        .lead {
          font-weight: 600;
        }

        .note {
          opacity: 0.8;
        }
      }
    }

    .descent {
      display: grid;
      grid-template-columns: 1fr 1fr;
      margin-top: 1rem;

      .descent-arrow {
        grid-column: 2;
        justify-self: start;
      }
    }

    /* Stacks: the tier arrow points down and the descent arrow straightens
       out. Both are driven by the FlowArrow's own container query. */
    @container (width < 48rem) {
      .tiers {
        grid-template-columns: 1fr;
      }

      .descent {
        grid-template-columns: 1fr;

        .descent-arrow {
          grid-column: 1;
          justify-self: center;
        }
      }
    }
  }
</style>
`;

const LEADERSHIP_PROGRAMS_ASTRO = `---
// src/sections/LeadershipPrograms.astro
// Based on: Membership Model - Section 4: Specialized Leadership Programs
//
// Thin wrapper over the generalised CardGrid. Kept as its own file so any
// existing importer keeps working; new pages can use CardGrid directly.

import CardGrid from "@sections/CardGrid.astro";
import type { CardData } from "@datatypes/card";
import { faker } from "@faker-js/faker";

// TODO: Replace with actual images from @assets/img/
const cards: CardData[] = [
  {
    title: "Creative Fellowship",
    icon: "\\u{1F7E2}",
    color: "var(--rainbow-green)",
    description:
      "6-month volunteer leadership cohort for LGBTQ+ and allied students under 24. Fellows produce content, develop professional skills, and showcase their work at a public event.",
    meta: "6-month program",
    image: faker.image.urlPicsumPhotos({ width: 400, height: 250 }),
    link: "/creative-fellowship",
  },
  {
    title: "Student Ambassador Program (P-SAP)",
    icon: "\\u{1F7E3}",
    color: "var(--rainbow-purple)",
    description:
      "GSA network empowerment program for high school and university LGBTQ+ organization leaders. Provides resources, training, and support for student activists.",
    meta: "Ongoing program",
    image: faker.image.urlPicsumPhotos({ width: 400, height: 250 }),
    link: "/psap",
  },
  {
    title: "Youth Advisory Committee (YAC)",
    icon: "\\u{1F7E1}",
    color: "var(--youth-yellow-2)",
    description:
      "9-month board governance program for strategy review and recommendations. Works directly with the Executive Director and YAC Chair.",
    meta: "9-month program",
    image: faker.image.urlPicsumPhotos({ width: 400, height: 250 }),
    link: "/yac",
  },
];
---

<CardGrid
  id="leadership-programs"
  heading="Specialized Leadership Programs"
  intro="In addition to serving as track leaders, members have the opportunity to move into one of our specialized leadership programs."
  cards={cards}
/>
`;

/* ------------------------------------------------------------------ *
 * 4. the get-involved.astro patch
 * ------------------------------------------------------------------ */

const PAGE_IMPORT_FIND = `import LeadershipPrograms from "@sections/LeadershipPrograms.astro";`;

const PAGE_IMPORT_REPLACE = `import CardGrid from "@sections/CardGrid.astro";
import FitComparison from "@sections/FitComparison.astro";
import LeadershipPrograms from "@sections/LeadershipPrograms.astro";
import type { CardData } from "@datatypes/card";`;

const PAGE_HERO_FIND = `const heroImage = faker.image.urlPicsumPhotos({ width: 1200, height: 600 });`;

const PAGE_CORE_TRACKS_DATA = `

// Core tracks. Order follows the mockup: Outreach, Policy, People's Operations.
// TODO: copy pending review against the Membership Plan (Updated August 2026).
const coreTracks: CardData[] = [
  {
    title: "Outreach",
    color: "var(--rainbow-orange)",
    description:
      "Mass outreach and harm reduction. Table at events, distribute resources, and hold the real conversations that connect people to PRISM.",
    link: "/outreach",
  },
  {
    title: "Policy",
    color: "var(--rainbow-red)",
    description:
      "Advocacy and legislation. Turn community power into pressure on school boards and lawmakers.",
    link: "/policy",
  },
  {
    title: "People's Operations",
    color: "var(--activist-aqua)",
    description:
      "Internal base-building. Steward our Discord, run phonebanks, do wellness checks, and recruit the next wave.",
    link: "/people-ops",
  },
];`;

const PAGE_CORE_TRACKS_MARKUP = `    <section class="core-tracks-band">
      <CardGrid
        id="core-tracks"
        heading="Ways to Plug In!"
        intro="PRISM membership is divided into different core tracks. Each track offers distinct activities, skills development, and leadership opportunities."
        cards={coreTracks}
        background="transparent"
      />

      <!-- Volunteer vs Member, and the arrow into the leadership programs -->
      <FitComparison />
    </section>`;

const PAGE_BAND_SCSS = `

  /* The band that both the track grid and the fit comparison sit on. */
  .core-tracks-band {
    background-color: var(--rainbow-purple);
    color: var(--witty-white);
  }`;

const NEON_FORM =
  "https://prismfl.app.neoncrm.com/forms/volunteer-interest-form";

/* ------------------------------------------------------------------ *
 * 5. run
 * ------------------------------------------------------------------ */

console.log(
  `\nPRISM get-involved redesign${DRY_RUN ? "  (dry run - nothing will be written)" : ""}`,
);
console.log(`  root  ${ROOT}`);

step("Components and sections");
emitFile(at("src", "types", "card.ts"), TYPES_CARD);
emitFile(at("src", "components", "Card.astro"), CARD_ASTRO);
emitFile(at("src", "components", "FlowArrow.astro"), FLOW_ARROW_ASTRO);
emitFile(at("src", "sections", "CardGrid.astro"), CARD_GRID_ASTRO);
emitFile(at("src", "sections", "FitComparison.astro"), FIT_COMPARISON_ASTRO);
emitFile(
  at("src", "sections", "LeadershipPrograms.astro"),
  LEADERSHIP_PROGRAMS_ASTRO,
);

step("src/pages/get-involved.astro");

const pagePath = at("src", "pages", "get-involved.astro");
if (!existsSync(pagePath)) die(`missing ${show(pagePath)}`);

let page = readFileSync(pagePath, "utf8");
const alreadyApplied =
  !page.includes('<section id="core-tracks">') &&
  page.includes("core-tracks-band");

if (alreadyApplied) {
  console.log("  already carries the redesign - page left alone");
} else {
  if (!page.includes('<section id="core-tracks">')) {
    die(
      "get-involved.astro has neither the binder nor the redesign - refusing to guess",
    );
  }

  // 1. imports
  page = mustReplaceOnce(
    page,
    PAGE_IMPORT_FIND,
    PAGE_IMPORT_REPLACE,
    "the LeadershipPrograms import",
  );

  // 2. the track data, parked next to the hero image
  page = mustReplaceOnce(
    page,
    PAGE_HERO_FIND,
    PAGE_HERO_FIND + PAGE_CORE_TRACKS_DATA,
    "the hero image const",
  );

  // 3. the binder element itself -> the card grid + fit comparison
  const binder = elementRange(page, "section", 'id="core-tracks"');
  if (!binder) die('could not bracket the <section id="core-tracks"> element');
  page = splice(page, binder, PAGE_CORE_TRACKS_MARKUP);

  // 4. the #core-tracks stylesheet block -> the band rule
  const scss = cssRuleRange(page, "#core-tracks");
  if (!scss) die("could not bracket the #core-tracks style block");
  page = splice(page, scss, PAGE_BAND_SCSS);

  // 5. the binder's tablist script. Nothing else uses it.
  const scriptStart = page.indexOf("\n<script>");
  if (scriptStart === -1) die("could not find the binder <script> block");
  const scriptEnd = page.indexOf("</script>", scriptStart);
  if (scriptEnd === -1) die("the binder <script> block is unterminated");
  page =
    page.slice(0, scriptStart) + page.slice(scriptEnd + "</script>".length);

  // 6. optional cleanups in the untouched get-started section
  if (FIX_LINKS) {
    page = mustReplaceOnce(
      page,
      '<section class="get-started-section" class="ruled-bg">',
      '<section class="get-started-section ruled-bg">',
      "the duplicate class attribute",
    );
    const formLinks = page.split('href="/volunteer-interest"').length - 1;
    page = mustReplace(
      page,
      'href="/volunteer-interest"',
      `href="${NEON_FORM}"`,
      "the dead volunteer-interest route",
    );
    console.log(
      `  fix-links  repointed ${formLinks} /volunteer-interest link(s) at the Neon form`,
    );
    console.log(
      "  fix-links  /orientation left alone - there is no live endpoint for it",
    );
  }

  page = page.replace(/\s+$/, "\n");
  backUp(pagePath);
  if (!DRY_RUN) writeFileSync(pagePath, page);
  console.log(`  rewrite  ${show(pagePath)}${DRY_RUN ? "   (dry run)" : ""}`);
}

/* ---- optional: prune the files the rewrite makes redundant ---------- */

if (PRUNE) {
  step("Prune");

  if (DRY_RUN) {
    console.log("  skipped - the importer scan would read the pre-change tree");
  } else {
    const SKIP_DIRS = new Set([
      "node_modules",
      ".git",
      "dist",
      ".astro",
      ".backup",
    ]);

    const walk = (dir) => {
      const found = [];
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (SKIP_DIRS.has(entry.name)) continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) found.push(...walk(full));
        else found.push(full);
      }
      return found;
    };

    const sources = existsSync(at("src")) ? walk(at("src")) : [];

    const stillImported = (absTarget) => {
      const base = show(absTarget).split("/").pop();
      return sources.filter(
        (file) =>
          file !== absTarget && readFileSync(file, "utf8").includes(base),
      );
    };

    for (const name of [
      "LeadershipProgramCard.astro",
      "LeadershipPrograms_1.astro",
    ]) {
      const target =
        name === "LeadershipProgramCard.astro"
          ? at("src", "components", name)
          : at("src", "sections", name);

      if (!existsSync(target)) {
        console.log(`  skip     ${show(target)} (not present)`);
        continue;
      }

      const importers = stillImported(target);
      if (importers.length) {
        console.log(
          `  keep     ${show(target)} - still referenced by ${importers.map(show).join(", ")}`,
        );
        continue;
      }

      backUp(target);
      rmSync(target);
      console.log(`  delete   ${show(target)}`);
    }
  }
}

/* ---- summary -------------------------------------------------------- */

step("Done");
console.log(
  `  ${backups} file(s) backed up${backups ? ` to ${show(BACKUP_DIR)}` : ""}`,
);
console.log(`
  Next:
    1. npx astro check
    2. npx astro build        # or: npm run build
    3. check the arrows in the browser: they should point right while the
       two tiers sit side by side, and swing to point down once the section
       itself gets narrower than 48rem - resize the window slowly.

  Revert with:  cp -R ${show(BACKUP_DIR)}/. .
`);
