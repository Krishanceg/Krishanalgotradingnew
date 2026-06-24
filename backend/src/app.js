import express from "express";
import cors from "cors";
import backtestRoutes from "./routes/backtest.routes.js";
import authRoutes from "./routes/auth.routes.js";
import marketRoutes from "./routes/market.routes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
    })
  );
  app.use(express.json({ limit: "5mb" }));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/market", marketRoutes);
  app.use("/api", backtestRoutes);

  // 404 fallback
  app.use((_req, res) => res.status(404).json({ error: "Not found." }));

  return app;
}
