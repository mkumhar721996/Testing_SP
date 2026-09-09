import http from "node:http";
import { createApp } from "./app.js";

const port = process.env.ARC_DEV_PORT || 8006;

http.createServer(createApp()).listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
