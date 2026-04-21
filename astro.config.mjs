// @ts-check
import { defineConfig } from "astro/config";

// TODO: add include() list for icons to avoid bundle bloat
import icon from "astro-icon";

import node from "@astrojs/node";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://staging.prismfl.org",
  server: {
    port: 4321,
  },
  integrations: [icon(), react()],
  output: "server",
  image: {
    remotePatterns: [{ protocol: "https" }],
  },
  adapter: node({
    mode: "standalone",
  }),
});
