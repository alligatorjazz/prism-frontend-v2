import { createClient, ApiKeyStrategy } from "@wix/sdk";
import { wixEventsV2 } from "@wix/events";
import { items } from "@wix/data";
import { posts, categories, tags } from "@wix/blog";
import { writeFileSync } from "node:fs";
import { getImageUrl } from "@wix/sdk/media";

const apiKey = process.env.WIX_API_KEY;
const siteId = process.env.WIX_SITE_ID;

if (!apiKey || !siteId) {
  console.error("Missing Wix credentials:", {
    hasApiKey: !!apiKey,
    hasSiteId: !!siteId,
  });
  throw new Error("WIX_API_KEY and WIX_SITE_ID must be set");
}
const wix = createClient({
  auth: ApiKeyStrategy({
    apiKey,
    siteId,
  }),
  modules: { wixEventsV2, items, posts, categories, tags },
});

const collection = "Blog/Posts";

console.log(await wix.items.get(collection, ""));
