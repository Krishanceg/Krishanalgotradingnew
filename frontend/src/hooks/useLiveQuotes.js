import { useCallback, useEffect, useRef, useState } from "react";
import { getQuotes } from "../api/client";

// Derive ws://host/ws from the configured REST base URL.
const WS_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api")
  .replace(/^http/, "ws")
  .replace(/\/api\/?$/, "/ws");

const POLL_MS = 20000;

/**
 * Live market quotes over a WebSocket, with automatic fallback to HTTP polling
 * if the socket can't connect. Returns a symbol -> quote map plus status.
 *
 * status: "connecting" | "live" (WebSocket) | "polling" | "error"
 */
export function useLiveQuotes(symbols) {
  const [quotes, setQuotes] = useState({});
  const [updatedAt, setUpdatedAt] = useState(null);
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");

  const wsRef = useRef(null);
  const pollRef = useRef(null);
  const symbolsRef = useRef(symbols);
  symbolsRef.current = symbols;

  const applyQuotes = useCallback((list) => {
    if (!Array.isArray(list)) return;
    setQuotes((prev) => {
      const next = { ...prev };
      list.forEach((q) => q?.symbol && (next[q.symbol] = q));
      return next;
    });
    setUpdatedAt(new Date());
  }, []);

  const poll = useCallback(async () => {
    try {
      applyQuotes(await getQuotes(symbolsRef.current));
      setError("");
    } catch (e) {
      setError(e.response?.data?.error || "Could not load quotes.");
    }
  }, [applyQuotes]);

  const startPolling = useCallback(() => {
    setStatus("polling");
    if (pollRef.current) clearInterval(pollRef.current);
    poll();
    pollRef.current = setInterval(poll, POLL_MS);
  }, [poll]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Connection lifecycle (mount once).
  useEffect(() => {
    const token = localStorage.getItem("token");
    let closedByUs = false;
    let reconnectTimer = null;

    const connect = () => {
      let ws;
      try {
        ws = new WebSocket(`${WS_URL}?token=${token}`);
      } catch {
        startPolling();
        return;
      }
      wsRef.current = ws;
      setStatus("connecting");

      ws.onopen = () => {
        setStatus("live");
        stopPolling();
        ws.send(
          JSON.stringify({ type: "subscribe", symbols: symbolsRef.current })
        );
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "quotes") {
            applyQuotes(msg.quotes);
            setError("");
          } else if (msg.type === "error") {
            setError(msg.error);
          }
        } catch {
          /* ignore malformed frame */
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (closedByUs) return;
        // Fall back to polling and retry the socket later.
        startPolling();
        reconnectTimer = setTimeout(connect, 15000);
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      closedByUs = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      stopPolling();
      if (wsRef.current) wsRef.current.close();
    };
  }, [applyQuotes, startPolling, stopPolling]);

  // Re-subscribe whenever the symbol set changes.
  const symbolKey = symbols.join(",");
  useEffect(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "subscribe", symbols }));
    } else if (pollRef.current) {
      poll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolKey]);

  const refresh = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "subscribe", symbols: symbolsRef.current }));
    } else {
      poll();
    }
  }, [poll]);

  return { quotes, updatedAt, status, error, refresh };
}
