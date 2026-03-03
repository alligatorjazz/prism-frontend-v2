import "./EventList.scss";
import dayjs from "dayjs";
import { hash } from "../lib";
import type { SiteEvent } from "../types/payload";
import { processMedia } from "../lib/payload";
import { useCallback, useMemo, useState } from "react";

interface Props {
  events: SiteEvent[];
  eventsPerPage?: number;
}

export function EventList({ events, eventsPerPage = 3, ...props }: Props) {
  const uid = useMemo(() => hash(events), [events]);
  const numberOfPages = Math.ceil(events.length / eventsPerPage);
  const [currentPage, setCurrentPage] = useState(0);
  const nextPage = useCallback(
    () =>
      setCurrentPage((prev) => {
        if (prev < numberOfPages - 1) {
          return prev + 1;
        }
        return 0;
      }),
    [],
  );
  const previousPage = useCallback(
    () =>
      setCurrentPage((prev) => {
        if (prev > 0) {
          return prev - 1;
        }
        return numberOfPages - 1;
      }),
    [],
  );

  const pageEvents = useMemo(
    () =>
      events.slice(
        eventsPerPage * currentPage,
        eventsPerPage * currentPage + eventsPerPage,
      ),
    [currentPage, events, eventsPerPage],
  );

  return (
    <div data-uid={uid} className="event-list" data-page="1">
      <ul>
        {pageEvents.map(
          ({ title, date, location, image: { square, rectangular } }) => {
            const squareImage = processMedia(square);
            return (
              <li className="rounded" key={`${title}-${date}`}>
                <div className="image">
                  <img
                    {...squareImage}
                    alt={squareImage.alt ?? `The event poster for ${title}.`}
                  />
                </div>
                <div className="info">
                  <h1>{title}</h1>
                  <h2>{dayjs(date).format("DD/MM/YYYY hh:mm a")}</h2>
                  <h3>{location}</h3>
                </div>
                <div className="learn-more">
                  <a className="rounded" href="/">
                    Learn More
                  </a>
                </div>
              </li>
            );
          },
        )}
      </ul>
      <div>
        <button onClick={() => previousPage()}>prev</button>
        <button onClick={() => nextPage()}>next</button>
        <div>{currentPage}</div>
        <div>{JSON.stringify(pageEvents)}</div>
      </div>
    </div>
  );
}
