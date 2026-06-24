import "dotenv/config";
import http from "http";
import { createApp } from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { attachWebSocket } from "./src/ws.js";

const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/algo_backtester";

async function start() {
  await connectDB(MONGO_URI);

  const app = createApp();
  const server = http.createServer(app);
  attachWebSocket(server); // live quote streaming over WebSocket

  server.listen(PORT, () => {
    console.log(`[server] Express API listening on http://localhost:${PORT}`);
  });
}

start();
