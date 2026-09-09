const http = require('http');
const { app } = require('./app');

const port = process.env.ARC_DEV_PORT || 3000;

const server = http.createServer(app);

if (require.main === module) {
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = server;
