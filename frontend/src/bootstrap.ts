const apiBaseMeta = document.querySelector('meta[name="api-base"]');
window.__API_BASE__ = apiBaseMeta?.getAttribute("content") ?? "";

import("./app.ts");
