import { createClient, ApiKeyStrategy } from "@wix/sdk";
import { items } from "@wix/data";
import { wixEventsV2 } from "@wix/events";

const wix = createClient({
  auth: ApiKeyStrategy({
    apiKey: import.meta.env.WIX_API_KEY,
    siteId: import.meta.env.WIX_SITE_ID,
  }),
  modules: { items, wixEventsV2 },
});

export async function getItems(collection: string) {
  const collectionQuery = await wix.items.query(collection).find();
  let hasNext = collectionQuery.hasNext();
  let items = collectionQuery.items;

  while (hasNext) {
    const nextQuery = await collectionQuery.next();
    items = [...items, ...nextQuery.items];
    hasNext = nextQuery.hasNext();
  }

  return items;
}

export async function getEvents() {
  const allEvents: any[] = [];
  const limit = 100;
  let cursor: string | null = null;
  let hasMore = true;

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  while (hasMore) {
    const response: any = await wix.wixEventsV2.queryEvents({
      filter: {
        status: { $in: ["UPCOMING"] },
        "dateAndTimeSettings.startDate": {
          $gte: oneYearAgo,
        },
      },
      sort: [{ fieldName: "dateAndTimeSettings.startDate", order: "ASC" }],
      paging: {
        limit,
        ...(cursor ? { cursor } : {}),
      },
    });

    allEvents.push(...response.events);

    if (response.pagingMetadata?.cursors?.next) {
      cursor = response.pagingMetadata.cursors.next;
    } else {
      hasMore = false;
    }
  }

  console.log(allEvents);

  return allEvents;
}
