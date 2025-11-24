import type { OpenGraphNode } from "./openGraph";

export type PageMetadata = {
  title: string;
  description: string;
  og: OpenGraphNode;
  author?: string;
  canonical: string;
};

export type SurfaceMetadata = Omit<OpenGraphNode, "url" | "description"> & {
  shortTitle?: string;
  description?: string;
  url?: string;
  author?: { name?: string; url?: string };
};

export type SiteMetadata = {
  title: string;
  fullTitle?: string;
  description?: string;
};

export type Route = (
  | {
      type: "internal";
      path: string;
    }
  | {
      type: "external";
      url: string;
    }
) & { displayName: string };
