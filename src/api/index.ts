import type { Route, SiteMetadata } from "../types";
import * as API from "../inbox/payload-types";
import urlJoin from "url-join";
import { strictSlug } from "../lib";

type Collection = keyof API.Config["collections"];
type APIResponse<DocumentType extends Collection> = {
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

const apiUrl =
  import.meta.env.PUBLIC_PROD_OVERRIDE === "true" || import.meta.env.PROD
    ? "https://admin.prismfl.org/api"
    : "https://localhost:3009/api";

const api = {
  find: async <T extends Collection>(
    slug: T,
  ): Promise<APIResponse<T> | null> => {
    try {
      const response = await fetch(urlJoin(apiUrl, slug));
      return await response.json();
    } catch (err) {
      console.log(err);
      return null;
    }
  },
  // Find By ID	GET	/api/{collection-slug}/{id}
  // Count	GET	/api/{collection-slug}/count
  // Create	POST	/api/{collection-slug}
  // Update	PATCH	/api/{collection-slug}
  // Update By ID	PATCH	/api/{collection-slug}/{id}
  // Delete	DELETE	/api/{collection-slug}
  // Delete by ID	DELETE	/api/{collection-slug}/{id}
};

// TODO: implement site route fetching
export async function getSiteRoutes(): Promise<Route[]> {
  const sitePages = await api.find("pages");
  return (sitePages?.docs ?? []).map((page) => {
    return {
      type: "internal",
      // TODO: implement slug / title separation
      path: strictSlug(page.title),
      displayName: page.title,
    };
  });
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
