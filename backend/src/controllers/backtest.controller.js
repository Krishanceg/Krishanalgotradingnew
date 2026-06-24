import axios from "axios";
import BacktestResult from "../models/BacktestResult.js";

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";

const VALID_STRATEGIES = [
  "RSI",
  "MACD",
  "BOLLINGER",
  "MOMENTUM",
  "MA_CROSSOVER",
];

/**
 * POST /api/backtest
 * Validates input, delegates the computation to the Python service,
 * persists the result, and returns the saved document.
 */
export async function createBacktest(req, res) {
  try {
    const { symbol, startDate, endDate, initialCapital, strategy, params } =
      req.body;

    // --- validation ---
    if (!symbol || !startDate || !endDate || !initialCapital || !strategy) {
      return res.status(400).json({
        error:
          "symbol, startDate, endDate, initialCapital and strategy are required.",
      });
    }
    if (Number(initialCapital) <= 0) {
      return res
        .status(400)
        .json({ error: "initialCapital must be greater than 0." });
    }
    if (new Date(startDate) >= new Date(endDate)) {
      return res
        .status(400)
        .json({ error: "startDate must be before endDate." });
    }
    const normalizedStrategy = String(strategy).toUpperCase();
    if (!VALID_STRATEGIES.includes(normalizedStrategy)) {
      return res.status(400).json({
        error: `Invalid strategy. Choose one of: ${VALID_STRATEGIES.join(", ")}`,
      });
    }

    // --- delegate to Python backtesting service ---
    const { data } = await axios.post(
      `${PYTHON_SERVICE_URL}/run-backtest`,
      {
        symbol: String(symbol).toUpperCase(),
        startDate,
        endDate,
        initialCapital: Number(initialCapital),
        strategy: normalizedStrategy,
        params: params || null,
      },
      { timeout: 60000 }
    );

    // --- persist (scoped to the authenticated user) ---
    const saved = await BacktestResult.create({ ...data, user: req.userId });
    return res.status(201).json(saved);
  } catch (err) {
    // Surface the Python service's error message when available.
    if (err.response) {
      return res.status(err.response.status).json({
        error: err.response.data?.detail || "Backtest service error.",
      });
    }
    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({
        error:
          "Python backtesting service is unreachable. Is it running on port 8000?",
      });
    }
    console.error("[backtest] error:", err.message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

/** GET /api/backtests — list history, newest first (no heavy arrays). */
export async function listBacktests(req, res) {
  try {
    const items = await BacktestResult.find({ user: req.userId })
      .select("-trades -equityCurve")
      .sort({ createdAt: -1 })
      .lean();
    return res.json(items);
  } catch (err) {
    console.error("[backtest] list error:", err.message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

/** GET /api/backtests/:id — full result including trades + equity curve. */
export async function getBacktest(req, res) {
  try {
    const item = await BacktestResult.findOne({
      _id: req.params.id,
      user: req.userId,
    }).lean();
    if (!item) return res.status(404).json({ error: "Backtest not found." });
    return res.json(item);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid backtest id." });
    }
    console.error("[backtest] get error:", err.message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

/** DELETE /api/backtests/:id */
export async function deleteBacktest(req, res) {
  try {
    const deleted = await BacktestResult.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });
    if (!deleted) return res.status(404).json({ error: "Backtest not found." });
    return res.json({ message: "Deleted", id: req.params.id });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid backtest id." });
    }
    console.error("[backtest] delete error:", err.message);
    return res.status(500).json({ error: "Internal server error." });
  }
}
