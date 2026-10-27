// Public entry point for event data. The UI imports from here and never sees a
// provider-specific field.
import { getEvents } from "@api/wix";
import { normalizeEvents } from "./wix";
import { sortEventsByDate, type NormalizedEvent } from "./model";

export * from "./model";

/**
 * Upcoming events in ascending date order.
 *
 * The provider call already filters to upcoming, sorts by start date and walks
 * its cursor, so this only normalizes and re-sorts defensively.
 */
export async function getAllEvents(): Promise<NormalizedEvent[]> {
  const raw = (await getEvents()) as unknown as unknown[];
  const events = sortEventsByDate(normalizeEvents(raw ?? []));

  if (events.length > 0) {
    const external = events.filter((e) => e.registration.isExternal).length;
    const builtIn = events.filter((e) => !e.registration.isExternal && e.registration.url).length;
    const none = events.filter((e) => !e.registration.url).length;
    console.log(
      `[events] ${events.length} upcoming: ${external} external RSVP, ` +
        `${builtIn} built-in RSVP, ${none} details-only`,
    );

    if (!events[0].registration.url && !events[0].detailUrl) {
      console.warn(
        `[events] "${events[0].title}" has no URL at all; the URLS field is likely missing`,
      );
    }
  }

  return events;
}
