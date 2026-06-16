import dayjs from "dayjs";
import "./EventPage.scss";
import { useState, useEffect, useCallback, useRef } from "react";

interface NormalizedEvent {
  title: string;
  date: string;
  location: string;
  image: { url: string; width: number; height: number } | null;
  link: string;
  source: string;
}

interface EventsPage {
  events: NormalizedEvent[];
  nextCursor: string | null;
  hasMore: boolean;
}
export function wixImageToUrl(wixImageUri: string): string {
  const match = wixImageUri.replace(`wix:image://v1/`, "");
  return `https://static.wixstatic.com/media/${match}`;
}

function normalizeEvent(event: any): NormalizedEvent {
  const location =
    event.location?.type === "VENUE"
      ? event.location.venue?.name ||
        event.location.venue?.address?.formatted ||
        "Location TBD"
      : event.location?.type === "ONLINE"
        ? "Online Event"
        : "Location TBD";

  let image: NormalizedEvent["image"] = null;
  if (event.mainImage) {
    image = {
      url: `${wixImageToUrl(event.mainImage)}`,
      width: 0,
      height: 0,
    };
  }

  return {
    title: event.title || "Untitled Event",
    date: event.dateAndTimeSettings?.startDate || new Date().toISOString(),
    location,
    image,
    link: event.eventPageUrl?.url || "#",
    source: "wix",
  };
}

const EVENTS_PER_PAGE = 12;

export function EventPage() {
  const [pages, setPages] = useState<EventsPage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingPage, setLoadingPage] = useState<number | null>(0);
  const [error, setError] = useState<string | null>(null);
  const [totalLoaded, setTotalLoaded] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (pageIndex: number, cursor?: string) => {
    try {
      setLoadingPage(pageIndex);
      setError(null);

      const params = new URLSearchParams({
        limit: EVENTS_PER_PAGE.toString(),
      });
      if (cursor) params.set("cursor", cursor);

      const response = await fetch(`/api/events?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch events (status ${response.status})`);
      }

      const data = await response.json();
      const normalized = data.events.map(normalizeEvent);

      setPages((prev) => {
        const updated = [...prev];
        updated[pageIndex] = {
          events: normalized,
          nextCursor: data.nextCursor,
          hasMore: data.hasMore,
        };
        return updated;
      });

      setTotalLoaded((prev) => prev + normalized.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoadingPage(null);
    }
  }, []);

  // Fetch the first page on mount
  useEffect(() => {
    if (pages.length === 0) {
      fetchPage(0);
    }
  }, [fetchPage, pages.length]);

  // Prefetch adjacent pages when the current page changes
  useEffect(() => {
    const current = pages[currentPage];
    if (!current) return;

    // Prefetch next page if it hasn't been fetched yet
    if (current.hasMore && !pages[currentPage + 1]) {
      fetchPage(currentPage + 1, current.nextCursor ?? undefined);
    }

    // The previous page should always be available, but guard just in case
    if (currentPage > 0 && !pages[currentPage - 1]) {
      // We'd need the cursor for the previous page, which we don't store.
      // Since pages are fetched sequentially, this shouldn't happen.
    }
  }, [currentPage, pages, fetchPage]);

  const goToPage = (pageIndex: number) => {
    if (pageIndex < 0 || (pages.length > 0 && pageIndex >= pages.length))
      return;
    setCurrentPage(pageIndex);
  };

  const nextPage = () => {
    const current = pages[currentPage];
    if (!current) return;
    if (current.hasMore) {
      setCurrentPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const allEvents = pages.flatMap((p) => p?.events ?? []);
  const totalPages = pages.length;
  const currentPageData = pages[currentPage];
  const isLastPage = currentPageData ? !currentPageData.hasMore : false;
  const isFirstPage = currentPage === 0;

  // Paginate the page numbers for display (same logic as EventList)
  function paginate(current: number, total: number): (number | "...")[] {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i);
    }

    const slots = new Set<number>();
    slots.add(0);
    slots.add(1);
    slots.add(total - 2);
    slots.add(total - 1);
    slots.add(current);
    if (current > 0) slots.add(current - 1);
    if (current < total - 1) slots.add(current + 1);

    const sorted = Array.from(slots).sort((a, b) => a - b);
    const result: (number | "...")[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
        result.push("...");
      }
      result.push(sorted[i]);
    }
    return result;
  }

  const pageSlots = paginate(currentPage, totalPages);

  // Scroll to top of container when changing pages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentPage]);

  if (error) {
    return (
      <div className="event-page">
        <div className="event-page-header">
          <h1>Events</h1>
        </div>
        <div className="event-page-content">
          <p className="error">Error loading events: {error}</p>
          <button
            className="retry-button rounded"
            onClick={() =>
              fetchPage(
                currentPage,
                pages[currentPage - 1]?.nextCursor ?? undefined,
              )
            }
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-page" ref={containerRef}>
      <div className="event-page-header">
        <h1>Events</h1>
        <p className="subtitle">
          {totalLoaded > 0
            ? `${totalLoaded} upcoming event${totalLoaded !== 1 ? "s" : ""}`
            : "Loading events..."}
        </p>
      </div>

      <div className="event-page-content">
        {!currentPageData && loadingPage === 0 ? (
          <div className="loading-spinner">
            <div className="spinner" />
            <p>Loading events...</p>
          </div>
        ) : (
          <>
            <ul className="event-grid">
              {currentPageData?.events.map((event) => (
                <li
                  className="event-card rounded"
                  key={`${event.title}-${event.date}`}
                >
                  {event.image && (
                    <div className="event-card-image">
                      <img
                        src={event.image.url}
                        width={event.image.width || undefined}
                        height={event.image.height || undefined}
                        alt={`The event poster for ${event.title}.`}
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="event-card-body">
                    <div className="event-source-badge">{event.source}</div>
                    <h2>{event.title}</h2>
                    <h3>{dayjs(event.date).format("MMM DD, YYYY")}</h3>
                    <h4>{event.location}</h4>
                  </div>
                  <div className="event-card-action">
                    <a
                      className="rounded"
                      href={event.link}
                      target={event.link !== "#" ? "_blank" : undefined}
                      rel={
                        event.link !== "#" ? "noopener noreferrer" : undefined
                      }
                    >
                      Learn More
                    </a>
                  </div>
                </li>
              ))}
            </ul>

            {loadingPage !== null && loadingPage !== currentPage && (
              <div className="loading-spinner small">
                <div className="spinner" />
              </div>
            )}

            {currentPageData && currentPageData.events.length === 0 && (
              <p className="no-events">No upcoming events found.</p>
            )}

            {totalPages > 0 && (
              <div className="controls rounded">
                <button disabled={isFirstPage} onClick={() => previousPage()}>
                  {"<"}
                </button>
                {pageSlots.map((slot, index) =>
                  slot === "..." ? (
                    <span key={`ellipsis-${index}`} className="ellipsis">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-button-${slot}`}
                      className={slot === currentPage ? "current-page" : ""}
                      onClick={() => goToPage(slot)}
                      disabled={slot >= totalPages && !pages[slot]?.hasMore}
                    >
                      {slot + 1}
                    </button>
                  ),
                )}
                <button disabled={isLastPage} onClick={() => nextPage()}>
                  {">"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
