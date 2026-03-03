// @ts-check
import { defineConfig } from "astro/config";

// TODO: add include() list for icons to avoid bundle bloat
import icon from "astro-icon";

import node from "@astrojs/node";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: import.meta.env.NODE_ENV
    ? "http://localhost:3009"
    : // TODO: change to prismfl.org on launch
      "https://staging.prismfl.org",
  server: {
    port: import.meta.env.FRONTEND_LOCAL_PORT ?? 4321,
  },
  integrations: [icon(), react()],
  output: "server",

  adapter: node({
    mode: "standalone",
  }),
});