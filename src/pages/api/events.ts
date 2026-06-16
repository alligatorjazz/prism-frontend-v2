import type { APIRoute } from "astro";
import { getEventsPage } from "../../api/wix";

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
