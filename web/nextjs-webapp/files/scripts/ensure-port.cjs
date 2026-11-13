const net = require("net");

const port = Number(process.argv[2]);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("Usage: node scripts/ensure-port.cjs <port>");
  process.exit(1);
}

const server = net.createServer();
server.once("error", () => {
  console.error(`Port ${port} is already in use.`);
  process.exit(1);
});
server.listen(port, "127.0.0.1", () => {
  server.close(() => process.exit(0));
});
