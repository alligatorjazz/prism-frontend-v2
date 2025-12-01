import type { Route, SiteMetadata } from "../types";

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

export async function getSiteRoutes(): Promise<Route[]> {
  const dummy: Route[] = [
    { type: "internal", path: "/about", displayName: "About" },
    { type: "internal", path: "/get-involved", displayName: "Get Involved" },
    { type: "internal", path: "/resources", displayName: "Resources" },
    { type: "internal", path: "/events", displayName: "Events" },
    { type: "internal", path: "/more", displayName: "More" },
    {
      type: "internal",
      path: "/events",
      displayName: "Donate",
      highlight: true,
    },
  ];

  return new Promise((resolve) =>
    setTimeout(() => resolve(dummy), Math.random() * 500),
  );
}
