// @ts-check
// TODO: add include() list for icons to avoid bundle bloat
import { defineConfig, fontProviders } from "astro/config";
import icon from "astro-icon";
import node from "@astrojs/node";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://staging.prismfl.org",
  server: {
    port: 3000,
		host: "0.0.0.0"
  },
  integrations: [icon(), react()],
  output: "server",
  image: {
    remotePatterns: [{ protocol: "https" }],
    domains: ["static.wixstatic.com"],
  },
  adapter: node({
    mode: "standalone",
  }),
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Crudex",
      cssVariable: "--crudex",
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/Crudex.ttf"],
            weight: "normal",
            style: "normal",
          },
        ],
      },
    },
  ],
});
