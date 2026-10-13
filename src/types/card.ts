/**
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
