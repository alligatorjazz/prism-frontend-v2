import { createClient, ApiKeyStrategy } from "@wix/sdk";
import { items } from "@wix/data";
import { writeFileSync } from "node:fs";

const wix = createClient({
  auth: ApiKeyStrategy({
    apiKey: import.meta.env.WIX_API_KEY,
    siteId: import.meta.env.WIX_SITE_ID,
  }),
  modules: { items },
});

export async function getItems(collection: string) {
  console.debug("getting items...");
  const collectionQuery = await wix.items.query(collection).find();
  let hasNext = collectionQuery.hasNext();
  let items = collectionQuery.items;

  console.debug("items : ", items);
  while (hasNext) {
    console.debug("fetching next page...");
    const nextQuery = await collectionQuery.next();
    items = [...items, ...nextQuery.items];
    console.debug("items : ", items);

    hasNext = nextQuery.hasNext();
  }

  console.debug(collection);
  return items;
}

writeFileSync(
  "partners.json",
  JSON.stringify(await getItems("Partners"), null, 4),
);
