import { restaurants } from "./data/restaurants.js";
import { rankRestaurants } from "./search/rankRestaurants.js";

export function createApp() {
  return function requestListener(req, res) {
    const url = new URL(req.url, "http://localhost");

    if (req.method === "GET" && url.pathname === "/api/restaurants/search") {
      const query = url.searchParams.get("q") || "";
      const results = rankRestaurants(restaurants, query);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ results }));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  };
}
