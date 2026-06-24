import { WebSocketServer } from "ws";
import axios from "axios";
import jwt from "jsonwebtoken";

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const PUSH_INTERVAL_MS = 5000; // how often each client gets fresh quotes

/**
 * Attach a WebSocket server to the existing HTTP server.
 *
 * Protocol (JSON messages):
 *   client -> server: { type: "subscribe", symbols: ["^NSEI", "TCS.NS", ...] }
 *   server -> client: { type: "connected" }
 *                     { type: "quotes", quotes: [...], ts }
 *                     { type: "error", error }
 *
 * Auth: clients connect to ws://host/ws?token=<JWT>.
 */
export function attachWebSocket(server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    // --- authenticate via token query param ---
    try {
      const url = new URL(req.url, "http://localhost");
      jwt.verify(url.searchParams.get("token") || "", JWT_SECRET);
    } catch {
      ws.close(4001, "Unauthorized");
      return;
    }

    let symbols = [];
    let timer = null;

    const pushQuotes = async () => {
      if (!symbols.length || ws.readyState !== ws.OPEN) return;
      try {
        const { data } = await axios.get(`${PYTHON_SERVICE_URL}/quotes`, {
          params: { symbols: symbols.join(",") },
          timeout: 15000,
        });
        if (ws.readyState === ws.OPEN) {
          ws.send(
            JSON.stringify({ type: "quotes", quotes: data.quotes, ts: Date.now() })
          );
        }
      } catch {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: "error", error: "Quote fetch failed." }));
        }
      }
    };

    ws.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (msg.type === "subscribe" && Array.isArray(msg.symbols)) {
        symbols = msg.symbols.filter((s) => typeof s === "string").slice(0, 30);
        pushQuotes(); // send an immediate snapshot
        if (timer) clearInterval(timer);
        timer = setInterval(pushQuotes, PUSH_INTERVAL_MS);
      }
    });

    ws.on("close", () => {
      if (timer) clearInterval(timer);
    });

    ws.send(JSON.stringify({ type: "connected" }));
  });

  console.log("[ws] WebSocket server attached at /ws");
  return wss;
}
