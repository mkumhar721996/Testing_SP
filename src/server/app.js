import { restaurants } from "./data/restaurants.js";
import { rankRestaurants } from "./search/rankRestaurants.js";
import { isAuthenticated } from "./auth/session.js";

export function createApp() {
  return function requestListener(req, res) {
    const url = new URL(req.url, "http://localhost");

    if (req.method === "GET" && url.pathname === "/api/restaurants/search") {
      const query = url.searchParams.get("q") || "";

      if (!isAuthenticated(req)) {
        console.error(
          JSON.stringify({ level: "error", event: "search_unauthenticated", query }),
        );
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }

      const startedAt = Date.now();
      console.log(JSON.stringify({ level: "info", event: "search_request", query }));

      try {
        const results = rankRestaurants(restaurants, query);
        console.log(
          JSON.stringify({
            level: "info",
            event: "search_response",
            query,
            resultCount: results.length,
            durationMs: Date.now() - startedAt,
          }),
        );
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ results }));
      } catch (error) {
        console.error(
          JSON.stringify({
            level: "error",
            event: "search_error",
            query,
            message: error.message,
            stack: error.stack,
            durationMs: Date.now() - startedAt,
          }),
        );
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  };
}
