// @ts-check
import { defineConfig } from "astro/config";

// TODO: add include() list for icons to avoid bundle bloat
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: import.meta.env.NODE_ENV
    ? "http://localhost:3009"
    : "https://prismfl.org",
  integrations: [icon()],
});
