import type { APIRoute } from "astro";
import { getEventsPage } from "../../api/wix";
import { faker } from "@faker-js/faker";

export const GET: APIRoute = async ({ url }) => {
  const limit = parseInt(url.searchParams.get("limit") ?? "12");
  const cursor = url.searchParams.get("cursor") ?? undefined;

  try {
    const result = await getEventsPage(limit, cursor);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Failed to fetch events",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

const tags = ["Volunteer", "P-SAP", "Creative Fellowship", "Policy"];

function generateEvents(count: number) {
  const events = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const date = faker.date.soon({ days: 90, refDate: today });
    const tag = faker.helpers.arrayElement(tags);

    events.push({
      title: faker.company.catchPhrase(),
      date: date.toISOString(),
      location: faker.location.city(),
      image: null,
      link: faker.internet.url(),
      source: "faker",
      tags: [
        tag,
        faker.helpers.arrayElement(["All Members", "Track Leaders", "Public"]),
      ],
    });
  }

  return events.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

export const dummyEvents = generateEvents(120);
