// Universal event model. Knows nothing about any provider: swapping the data
// source means writing a new adapter that fills these types, and touching
// nothing here or in the UI.
import dayjs from "dayjs";

export type EventLocationKind = "in-person" | "online" | "tba";
export type RegistrationStatus = "open" | "waitlist" | "closed" | "unavailable";

export interface EventLocation {
  kind: EventLocationKind;
  name: string;
  address: string | null;
}

export interface EventImage {
  url: string;
  width: number;
  height: number;
  alt: string;
}

export interface EventRegistration {
  status: RegistrationStatus;
  /** Where to send someone to register. Null when there is nowhere to go. */
  url: string | null;
  /** True when registration is handled by a third-party system. */
  isExternal: boolean;
  /** "RSVP", "Get Tickets", "Join Waitlist" or "Learn More". */
  ctaLabel: string;
}

export interface NormalizedEvent {
  id: string;
  title: string;
  description: string | null;
  /** ISO 8601. */
  startDate: string;
  endDate: string | null;
  allDay: boolean;
  location: EventLocation;
  image: EventImage | null;
  registration: EventRegistration;
  /** Canonical page for this event. May be null. */
  detailUrl: string | null;
  tags: string[];
  /** Provenance only; never rendered. */
  provider: string;
}

export const FALLBACK_LOCATION: EventLocation = {
  kind: "tba",
  name: "Location TBD",
  address: null,
};

export const FALLBACK_REGISTRATION: EventRegistration = {
  status: "unavailable",
  url: null,
  isExternal: false,
  ctaLabel: "Learn More",
};

const REPORTED = new Set<string>();

function reportOnce(missing: string[], keys: string, title: string) {
  const signature = missing.join(",");
  if (REPORTED.has(signature)) return;
  REPORTED.add(signature);
  console.warn(
    [
      "",
      "[events] An event reached a component without the NormalizedEvent fields:",
      `         ${missing.join(", ")}`,
      `         title: ${title}`,
      `         keys received: ${keys || "(empty object)"}`,
      "         The caller is bypassing the adapter. Use getAllEvents() from",
      "         src/lib/events, which runs every event through normalizeEvent().",
      "",
    ].join("\n"),
  );
}

/**
 * Coerces whatever a component received into a complete NormalizedEvent.
 *
 * Safety net, not a substitute for the adapter: it renders something sensible
 * and names the problem in the build log. Fix the caller, not this function.
 */
export function ensureEvent(input: unknown): NormalizedEvent {
  const raw = (input ?? {}) as Record<string, any>;

  const title = typeof raw.title === "string" && raw.title ? raw.title : "Untitled Event";

  // Older shapes used `date`; accept both.
  const startDate =
    (typeof raw.startDate === "string" && raw.startDate) ||
    (typeof raw.date === "string" && raw.date) ||
    new Date().toISOString();

  const location: EventLocation =
    raw.location && typeof raw.location === "object" && raw.location.name
      ? {
          kind: raw.location.kind ?? "in-person",
          name: String(raw.location.name),
          address: raw.location.address ?? null,
        }
      : typeof raw.location === "string" && raw.location
        ? { kind: "in-person", name: raw.location, address: null }
        : FALLBACK_LOCATION;

  const legacyLink = typeof raw.link === "string" && raw.link !== "#" ? raw.link : null;

  const registration: EventRegistration =
    raw.registration && typeof raw.registration === "object"
      ? { ...FALLBACK_REGISTRATION, ...raw.registration }
      : legacyLink
        ? { ...FALLBACK_REGISTRATION, url: legacyLink }
        : FALLBACK_REGISTRATION;

  const missing = ["title", "startDate", "location", "registration"].filter(
    (field) => raw[field] == null,
  );
  if (missing.length > 0) reportOnce(missing, Object.keys(raw).join(", "), title);

  return {
    id: typeof raw.id === "string" ? raw.id : title,
    title,
    description: raw.description ?? null,
    startDate,
    endDate: raw.endDate ?? null,
    allDay: Boolean(raw.allDay),
    location,
    image: raw.image ?? null,
    registration,
    detailUrl: raw.detailUrl ?? null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    provider: typeof raw.provider === "string" ? raw.provider : "unknown",
  };
}

/** Best available destination for the card's call to action. */
export function eventCtaUrl(event: NormalizedEvent): string | null {
  return event.registration?.url ?? event.detailUrl ?? null;
}

export function formatEventDate(iso: string, format = "MMM DD, YYYY"): string {
  const parsed = dayjs(iso);
  return parsed.isValid() ? parsed.format(format) : "";
}

export function sortEventsByDate(events: NormalizedEvent[]): NormalizedEvent[] {
  return [...events].sort((a, b) => (dayjs(a.startDate).isAfter(dayjs(b.startDate)) ? 1 : -1));
}

export function chunkItems<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [[]];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}
