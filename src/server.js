'use strict';

const http = require('node:http');
const { createApp } = require('./app');
const { createDefectsStore } = require('./db/defectsStore');
const { createSessionStore } = require('./auth/session');
const { buildSeedDefects } = require('./db/seedDefects');

const port = process.env.ARC_DEV_PORT || process.env.PORT || 3000;

const store = createDefectsStore(buildSeedDefects(new Date()));
const sessions = createSessionStore();
const server = http.createServer(createApp({ store, sessions }));

server.listen(port, () => {
  console.log(`Defect Dashboard server listening on port ${port}`);
});
