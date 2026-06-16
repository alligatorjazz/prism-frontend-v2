import "./EventList.scss";
import dayjs from "dayjs";
import { hash } from "../lib";
import { useMemo, useState } from "react";

export interface NormalizedEvent {
  title: string;
  date: string;
  location: string;
  image: { url: string; width: number; height: number } | null;
  link: string;
  source: string;
}

interface Props {
  events: NormalizedEvent[];
  error?: string | null;
  eventsPerPage?: number;
}

/**
 * Returns an array representing the visible page slots.
 * Each slot is either a number (page index) or "...".
 *
 * Rules (0-indexed pages):
 *  - If totalPages ≤ 7: show all pages, no ellipses.
 *  - Otherwise, show at most 7 numeric slots comprising:
 *      • The first two pages (0, 1)
 *      • The last two pages (totalPages - 2, totalPages - 1)
 *      • The current page
 *      • The pages immediately previous and next to the current page
 *    Duplicate slots are collapsed, and "..." fills any gaps.
 */
function paginate(currentPage: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const slots = new Set<number>();

  // First two pages
  slots.add(0);
  slots.add(1);

  // Last two pages
  slots.add(totalPages - 2);
  slots.add(totalPages - 1);

  // Current page and its immediate neighbors
  slots.add(currentPage);
  if (currentPage > 0) slots.add(currentPage - 1);
  if (currentPage < totalPages - 1) slots.add(currentPage + 1);

  const sorted = Array.from(slots).sort((a, b) => a - b);

  // Insert "..." between non-consecutive page numbers
  const result: (number | "...")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push("...");
    }
    result.push(sorted[i]);
  }

  return result;
}

export function EventList({ events, error, eventsPerPage = 3 }: Props) {
  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) =>
        dayjs(a.date).isAfter(dayjs(b.date)) ? 1 : -1,
      ),
    [events],
  );

  const uid = useMemo(() => hash(sortedEvents), [sortedEvents]);
  const numberOfPages = Math.ceil(sortedEvents.length / eventsPerPage);
  const [currentPage, setCurrentPage] = useState(0);

  const pageSlots = useMemo(
    () => paginate(currentPage, numberOfPages),
    [currentPage, numberOfPages],
  );

  if (error) {
    return (
      <div className="event-list">
        <p className="error">Error loading events: {error}</p>
      </div>
    );
  }

  if (sortedEvents.length === 0) {
    return (
      <div className="event-list">
        <p>No upcoming events found.</p>
      </div>
    );
  }

  const nextPage = () =>
    setCurrentPage((prev) => (prev < numberOfPages - 1 ? prev + 1 : 0));

  const previousPage = () =>
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : numberOfPages - 1));

  const pageEvents = sortedEvents.slice(
    eventsPerPage * currentPage,
    eventsPerPage * currentPage + eventsPerPage,
  );

  console.log(events);

  return (
    <div data-uid={uid} className="event-list" data-page="1">
      <ul>
        {pageEvents.map(({ title, date, location, image, link, source }) => (
          <li className="rounded" key={`${title}-${date}-${source}`}>
            {image && (
              <div className="image">
                <img
                  src={image.url}
                  width={image.width}
                  height={image.height}
                  alt={`The event poster for ${title}.`}
                />
              </div>
            )}
            <div className="info">
              <h1>{title}</h1>
              <h2>{dayjs(date).format("MMM DD, YYYY")}</h2>
              <h3>{location}</h3>
            </div>
            <div className="learn-more">
              <a
                className="rounded"
                href={link || "#"}
                target={link ? "_blank" : undefined}
                rel={link ? "noopener noreferrer" : undefined}
              >
                Learn More
              </a>
            </div>
          </li>
        ))}
      </ul>
      <div className="controls rounded">
        <button onClick={() => previousPage()}>{"<"}</button>
        {pageSlots.map((slot, index) =>
          slot === "..." ? (
            <span key={`ellipsis-${index}`} className="ellipsis">
              ...
            </span>
          ) : (
            <button
              key={`event-list-${uid}-page-button-${slot}`}
              className={slot === currentPage ? "current-page" : ""}
              onClick={() => setCurrentPage(slot)}
            >
              {slot + 1}
            </button>
          ),
        )}
        <button onClick={() => nextPage()}>{">"}</button>
      </div>
    </div>
  );
}
