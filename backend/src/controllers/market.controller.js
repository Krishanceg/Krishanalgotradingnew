import axios from "axios";

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";

/**
 * GET /api/market/quotes?symbols=RELIANCE.NS,TCS.NS,^NSEI
 * Proxies to the Python service for live(ish) quote data.
 */
export async function getQuotes(req, res) {
  try {
    const symbols = req.query.symbols;
    if (!symbols) {
      return res.status(400).json({ error: "symbols query param is required." });
    }

    const { data } = await axios.get(`${PYTHON_SERVICE_URL}/quotes`, {
      params: { symbols },
      timeout: 30000,
    });
    return res.json(data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json({
        error: err.response.data?.detail || "Quote service error.",
      });
    }
    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: "Python service is unreachable. Is it running on port 8000?",
      });
    }
    console.error("[market] error:", err.message);
    return res.status(500).json({ error: "Internal server error." });
  }
}
