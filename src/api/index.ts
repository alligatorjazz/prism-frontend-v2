import type { Route, SiteMetadata } from "../types";
import * as API from "../inbox/payload-types";
import urlJoin from "url-join";
import { strictSlug } from "../lib";

type Collection = keyof API.Config["collections"];
type PluralAPIResponse<DocumentType extends Collection> = {
  docs: API.Config["collections"][DocumentType][];
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
  nextPage: string | null;
  page: number;
  pagingCounter: number;
  prevPage: null;
  totalDocs: number;
  totalPages: number;
};

export const backendUrl =
  import.meta.env.PUBLIC_PROD_OVERRIDE === "true" || import.meta.env.PROD
    ? "https://admin.prismfl.org/"
    : "http://localhost:3000/";

const apiUrl = urlJoin(backendUrl, "/api");

const api = {
  find: async <T extends Collection>(
    slug: T,
    params?: Record<string, string | number>,
  ): Promise<PluralAPIResponse<T> | null> => {
    try {
      const url = new URL(urlJoin(apiUrl, slug));
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, String(value));
        });
      }
      const response = await fetch(url.toString());
      return await response.json();
    } catch (err) {
      console.log(err);
      return null;
    }
  },
  findById: async <T extends Collection>(
    slug: T,
    id: string,
  ): Promise<API.Config["collections"][T] | null> => {
    try {
      const response = await fetch(urlJoin(apiUrl, slug, id));
      return await response.json();
    } catch (err) {
      console.log(err);
      return null;
    }
  },

  // Find By ID GET     /api/{collection-slug}/{id}
  // Count      GET     /api/{collection-slug}/count
  // Create     POST    /api/{collection-slug}
  // Update     PATCH   /api/{collection-slug}
  // Update By ID       PATCH   /api/{collection-slug}/{id}
  // Delete     DELETE  /api/{collection-slug}
  // Delete by ID       DELETE  /api/{collection-slug}/{id}
};

// Types for the all-events endpoint
type EventSource = "neon" | "volunteer" | "cms";

export type UnifiedEvent = {
  id: string | number;
  title?: string;
  name?: string;
  startDate?: string;
  date?: string;
  endDate?: string;
  location?: string;
  description?: string;
  registrationUrl?: string;
  link?: string;
  onlineEvent?: boolean;
  eventUrl?: string;
  capacity?: number;
  registeredCount?: number;
  eventStatus?: string;
  eventType?: string;
  isFeatured?: boolean;
  allowWaitlist?: boolean;
  registrationDeadline?: string;
  source: EventSource;
};

type AllEventsResponse = {
  docs: UnifiedEvent[];
  totalDocs: number;
  limit: number;
  offset: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  page: number;
  totalPages: number;
  pagingCounter: number;
};

type AllEventsQueryParams = {
  includeNeon?: boolean;
  includeVolunteer?: boolean;
  search?: string;
  source?: EventSource[];
  startDate?: string;
  endDate?: string;
  sortBy?: "date" | "title" | "location";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
  where?: string;
  sort?: string;
  depth?: number;
};

export async function getAllEvents(
  params?: AllEventsQueryParams,
): Promise<AllEventsResponse | null> {
  try {
    const queryParams: Record<string, string | number> = {};

    if (params?.includeNeon !== undefined) {
      queryParams.includeNeon = params.includeNeon?.toString();
    }
    if (params?.includeVolunteer !== undefined) {
      queryParams.includeVolunteer = params.includeVolunteer.toString();
    }
    if (params?.search) {
      queryParams.search = params.search;
    }
    if (params?.source && params.source.length > 0) {
      queryParams.source = params.source.join(",");
    }
    if (params?.startDate) {
      queryParams.startDate = params.startDate;
    }
    if (params?.endDate) {
      queryParams.endDate = params.endDate;
    }
    if (params?.sortBy) {
      queryParams.sortBy = params.sortBy;
    }
    if (params?.sortOrder) {
      queryParams.sortOrder = params.sortOrder;
    }
    if (params?.limit) {
      queryParams.limit = params.limit;
    }
    if (params?.offset) {
      queryParams.offset = params.offset;
    }
    if (params?.where) {
      queryParams.where = params.where;
    }
    if (params?.sort) {
      queryParams.sort = params.sort;
    }
    if (params?.depth !== undefined) {
      queryParams.depth = params.depth;
    }

    const response = await api.find("event/all", queryParams);

    return response as AllEventsResponse | null;
  } catch (err) {
    console.error("Error fetching all events:", err);
    return null;
  }
}

// TODO: implement site route fetching
export async function getSiteRoutes(): Promise<Route[]> {
  return [];
  // const sitePages = await api.find("pages");
  // return (sitePages?.docs ?? []).map((page) => {
  //   return {
  //     type: "internal",
  //     // TODO: implement slug / title separation
  //     path: "/" + strictSlug(page.title),
  //     displayName: page.title,
  //     id: page.id,
  //   };
  // });
}

export async function getPage(id: string): Promise<API.Page | null> {
  return await api.findById("pages", id);
}

// TODO: implement real metadata fetching
export async function getSiteMetadata(): Promise<SiteMetadata> {
  const dummy: SiteMetadata = {
    title: "PRISM",
    fullTitle: "PRISM FL Inc.",
    description:
      "PRISM works to expand access to LGBTQ-inclusive education and sexual health resources for youth in South Florida. It's our goal to make sure everyone feels included in their community, regardless of race, ethnicity, religion, sexual orientation, gender identity, or gender expression.",
    logo: "/img/prism-logo-primary.png",
  };
  return new Promise((resolve) =>
    setTimeout(() => resolve(dummy), Math.random() * 500),
  );
}
