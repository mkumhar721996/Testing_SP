import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.loadEnvFile(path.join(__dirname, "..", "..", ".env"));

const port = Number(process.env.ARC_DEV_PORT ?? 8001);
const webPort = process.env.ARC_WEB_PORT ?? 3001;
const devWebOrigin = `http://localhost:${webPort}`;

const server = createServer(createApp(devWebOrigin));

server.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
