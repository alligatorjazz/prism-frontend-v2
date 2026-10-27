// The ONLY module that knows the provider's event shape. Everything leaving
// here is a NormalizedEvent. Swapping providers means deleting this file and
// writing a replacement exporting normalizeEvents().
//
// Provider field notes:
//   registration      requires the REGISTRATION field
//   eventPageUrl      requires the URLS field; shape { base, path }
//   mainImage         requires the DETAILS field
import type {
  EventImage,
  EventLocation,
  EventRegistration,
  NormalizedEvent,
  RegistrationStatus,
} from "./model";

/**
 * The built-in RSVP page IS the event page: eventPageUrl.path is
 * "/event-details-registration/{slug}". There is no separate registration URL
 * field -- registration.rsvp carries only responseType / limit /
 * waitlistEnabled / startDate / endDate. If a distinct registration path ever
 * appears, this is the single place to add it.
 */
const REGISTRATION_PATH_SUFFIX = "";

const EXTERNAL_URL_FIELDS = ["url", "link", "registrationUrl", "href", "absoluteUrl"];
const PAGE_URL_FIELDS = ["url", "full", "absoluteUrl"];
const IMAGE_URL_FIELDS = ["url", "src", "link"];

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function pickFrom(container: unknown, fields: string[]): string | null {
  if (!container || typeof container !== "object") return null;
  const record = container as Record<string, unknown>;
  for (const field of fields) {
    const candidate = record[field];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return null;
}

/** "wix:image://v1/<id>/...", an absolute URL, or an { url, id } object. */
function toImageUrl(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    if (/^https?:\/\//.test(raw)) return raw;
    const urn = raw.match(/wix:image:\/\/v1\/([^/]+)/);
    return urn ? `https://static.wixstatic.com/media/${urn[1]}` : null;
  }
  if (typeof raw !== "object") return null;

  const direct = pickFrom(raw, IMAGE_URL_FIELDS);
  if (direct) return /^https?:\/\//.test(direct) ? direct : toImageUrl(direct);

  const id = (raw as Record<string, unknown>).id;
  return typeof id === "string" && id.trim()
    ? `https://static.wixstatic.com/media/${id.trim()}`
    : null;
}

/** eventPageUrl is { base, path }, but accept a plain string too. */
function toPageUrl(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "string") return raw.trim() || null;
  if (typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  const direct = pickFrom(record, PAGE_URL_FIELDS);
  if (direct) return direct;

  const base = firstString(record.base);
  const path = firstString(record.path);
  if (base && path) return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  return base ?? path;
}

function toImage(raw: any, title: string): EventImage | null {
  const source = raw?.mainImage ?? raw?.coverImage;
  const url = toImageUrl(source);
  if (!url) return null;

  const dims = typeof source === "object" && source !== null ? source : {};
  return {
    url,
    width: Number(dims.width) || 0,
    height: Number(dims.height) || 0,
    alt: `The event poster for ${title}.`,
  };
}

function toLocation(raw: any): EventLocation {
  const location = raw?.location;

  if (location?.type === "ONLINE") {
    return { kind: "online", name: "Online Event", address: null };
  }

  const name = firstString(
    location?.venue?.name,
    location?.name,
    typeof location === "string" ? location : null,
    raw?.venue?.name,
  );
  const address = firstString(
    location?.venue?.address?.formatted,
    location?.address?.formatted,
    location?.address?.addressLine,
  );

  if (name || address) {
    return { kind: "in-person", name: name ?? address ?? "Location TBD", address };
  }
  return { kind: "tba", name: "Location TBD", address: null };
}

function toStatus(raw: any, externalUrl: string | null): RegistrationStatus {
  const registration = raw?.registration;
  if (!registration || registration.registrationDisabled) return "unavailable";

  const status = firstString(registration.status);
  const paused =
    Boolean(registration.registrationPaused) || status === "CLOSED" || status === "CLOSED_AUTOMATICALLY";

  if (paused) {
    return externalUrl || registration.rsvp?.waitlistEnabled ? "waitlist" : "closed";
  }
  if (registration.tickets?.soldOut) {
    return registration.rsvp?.waitlistEnabled ? "waitlist" : "closed";
  }
  return "open";
}

/**
 * RSVP destination, in the requested order:
 *   1. an external registration URL, used directly
 *   2. the built-in RSVP page (the event page hosting the form)
 *   3. nothing -- the card falls back to the event page, labelled "Learn More"
 */
function toRegistration(raw: any, detailUrl: string | null): EventRegistration {
  const registration = raw?.registration;

  const externalUrl = firstString(
    pickFrom(registration?.external, EXTERNAL_URL_FIELDS),
    typeof registration?.external === "string" ? registration.external : null,
    pickFrom(raw?.registrationUrl, EXTERNAL_URL_FIELDS),
    typeof raw?.registrationUrl === "string" ? raw.registrationUrl : null,
  );

  const status = toStatus(raw, externalUrl);
  const ticketed = firstString(registration?.type, registration?.initialType) === "TICKETING";
  const label = ticketed ? "Get Tickets" : "RSVP";

  if (externalUrl) {
    return {
      status: status === "unavailable" ? "closed" : status,
      url: externalUrl,
      isExternal: true,
      ctaLabel: label,
    };
  }

  if (status === "open" || status === "waitlist") {
    return {
      status,
      url: detailUrl ? `${detailUrl}${REGISTRATION_PATH_SUFFIX}` : null,
      isExternal: false,
      ctaLabel: status === "waitlist" ? "Join Waitlist" : label,
    };
  }

  return { status, url: null, isExternal: false, ctaLabel: "Learn More" };
}

function toTags(raw: any): string[] {
  const categories = raw?.categories;
  if (!Array.isArray(categories)) return [];

  const names: string[] = [];
  for (const entry of categories) {
    const label = firstString(
      typeof entry === "string" ? entry : entry?.name ?? entry?.title ?? entry?.label,
    );
    if (label) names.push(label);
  }
  return names;
}

export function normalizeEvent(raw: any): NormalizedEvent {
  const title = firstString(raw?.title) ?? "Untitled Event";
  const detailUrl = toPageUrl(raw?.eventPageUrl);

  return {
    id: firstString(raw?.id, raw?.slug) ?? title,
    title,
    description: firstString(raw?.shortDescription) ?? null,
    startDate:
      firstString(raw?.dateAndTimeSettings?.startDate, raw?.startDate, raw?.date) ??
      new Date().toISOString(),
    endDate: firstString(raw?.dateAndTimeSettings?.endDate, raw?.endDate) ?? null,
    allDay: Boolean(raw?.dateAndTimeSettings?.allDay),
    location: toLocation(raw),
    image: toImage(raw, title),
    registration: toRegistration(raw, detailUrl),
    detailUrl,
    tags: toTags(raw),
    provider: "wix",
  };
}

export function normalizeEvents(raw: unknown[]): NormalizedEvent[] {
  return raw.filter(Boolean).map((entry) => normalizeEvent(entry));
}
