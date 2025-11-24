import type { Route, SiteMetadata } from "../types";

// TODO: implement real metadata fetching
export async function getSiteMetadata(): Promise<SiteMetadata> {
  const dummy: SiteMetadata = {
    title: "Webbedsite",
    fullTitle: "The Webbed Site Company",
    description:
      "A company whose sole purpose is to make a webbed site for you, your friends, and everyone else.",
  };
  return new Promise((resolve) =>
    setTimeout(() => resolve(dummy), Math.random() * 500),
  );
}

export async function getSiteRoutes(): Promise<Route[]> {
  const dummy: Route[] = [
    { type: "internal", path: "/about", displayName: "About" },
    { type: "internal", path: "/links", displayName: "Quick Links" },
    { type: "internal", path: "/blog", displayName: "Blog" },
    { type: "external", url: "/github", displayName: "Github" },
  ];

  return new Promise((resolve) =>
    setTimeout(() => resolve(dummy), Math.random() * 500),
  );
}
