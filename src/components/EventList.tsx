import "./EventList.scss";
import dayjs from "dayjs";
import { hash } from "../lib";
import { processMedia } from "../lib/payload";
import { useCallback, useMemo, useState, useEffect } from "react";
import { getAllEvents, type UnifiedEvent } from "../api";

interface Props {
  eventsPerPage?: number;
  source?: ("neon" | "volunteer" | "cms")[];
  includeNeon?: boolean;
  includeVolunteer?: boolean;
}

type NormalizedEvent = {
  title: string;
  date: string;
  location: string;
  image: { square: any; rectangular: any };
  link?: string;
  source: string;
};

function normalizeEvent(event: UnifiedEvent): NormalizedEvent {
  return {
    title: event.title || event.name || "Untitled Event",
    date: event.startDate || event.date || new Date().toISOString(),
    location: event.location || "Location TBD",
    image: {
      square: null,
      rectangular: null,
    },
    link: event.registrationUrl || event.link,
    source: event.source,
  };
}

export function EventList({
  eventsPerPage = 3,
  source,
  includeNeon = true,
  includeVolunteer = true,
  ...props
}: Props) {
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getAllEvents({
          includeNeon,
          includeVolunteer,
          source,
          sortBy: "date",
          sortOrder: "asc",
          limit: 50,
        });

        if (response?.docs) {
          const normalized = response.docs.map(normalizeEvent);
          setEvents(normalized);
        } else {
          setEvents([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load events");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [source, includeNeon, includeVolunteer]);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => (dayjs(a.date).isAfter(b.date) ? 1 : -1)),
    [events],
  );

  const uid = useMemo(() => hash(sortedEvents), [sortedEvents]);
  const numberOfPages = Math.ceil(sortedEvents.length / eventsPerPage);
  const [currentPage, setCurrentPage] = useState(0);

  const nextPage = useCallback(
    () =>
      setCurrentPage((prev) => {
        if (prev < numberOfPages - 1) {
          return prev + 1;
        }
        return 0;
      }),
    [numberOfPages],
  );

  const previousPage = useCallback(
    () =>
      setCurrentPage((prev) => {
        if (prev > 0) {
          return prev - 1;
        }
        return numberOfPages - 1;
      }),
    [numberOfPages],
  );

  const pageEvents = useMemo(
    () =>
      sortedEvents.slice(
        eventsPerPage * currentPage,
        eventsPerPage * currentPage + eventsPerPage,
      ),
    [currentPage, sortedEvents, eventsPerPage],
  );

  if (loading) {
    return (
      <div className="event-list">
        <p>Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-list">
        <p>Error loading events: {error}</p>
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

  return (
    <div data-uid={uid} className="event-list" data-page="1">
      <ul>
        {pageEvents.map(({ title, date, location, image, link, source }) => {
          const hasImage = image.square !== null;
          return (
            <li className="rounded" key={`${title}-${date}-${source}`}>
              {hasImage && (
                <div className="image">
                  <img
                    {...processMedia(image.square)}
                    alt={`The event poster for ${title}.`}
                  />
                </div>
              )}
              <div className="info">
                <div className="event-source-badge">{source}</div>
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
          );
        })}
      </ul>
      <div className="controls rounded">
        <button onClick={() => previousPage()}>{"<"}</button>
        {new Array(numberOfPages).fill(null).map((_, index) => (
          <button
            key={`event-list-${uid}-page-button-${index}`}
            className={index === currentPage ? "current-page" : ""}
            onClick={() => setCurrentPage(index)}
          >
            {index + 1}
          </button>
        ))}
        <button onClick={() => nextPage()}>{">"}</button>
      </div>
    </div>
  );
}
