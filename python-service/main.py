"""FastAPI backtesting service.

Endpoint:
    POST /run-backtest  -> fetch data, apply strategy, run backtest, return metrics.

This service does NOT place real trades. It is for backtesting / learning only.
"""
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backtest.engine import run_backtest
from data.fetcher import fetch_ohlcv
from data.quotes import get_quotes
from models import BacktestRequest, BacktestResponse
from strategies import STRATEGIES, get_strategy

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backtester")

app = FastAPI(
    title="MERN Algo Trading Backtester - Python Service",
    description="Fetches market data, runs strategy backtests. Learning project only.",
    version="1.0.0",
)

# Allow the Node backend (and direct browser calls during dev) to reach us.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "service": "python-backtester"}


@app.get("/strategies")
def list_strategies():
    return {"strategies": list(STRATEGIES.keys())}


@app.get("/quotes")
def quotes(symbols: str):
    """Live(ish) quotes for a comma-separated list of symbols.

    Example: /quotes?symbols=RELIANCE.NS,TCS.NS,^NSEI
    """
    requested = [s for s in symbols.split(",") if s.strip()]
    if not requested:
        raise HTTPException(status_code=400, detail="No symbols provided.")
    if len(requested) > 30:
        raise HTTPException(status_code=400, detail="Too many symbols (max 30).")
    return {"quotes": get_quotes(requested)}


@app.post("/run-backtest", response_model=BacktestResponse)
def run_backtest_endpoint(req: BacktestRequest):
    try:
        strategy_fn = get_strategy(req.strategy)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    try:
        df = fetch_ohlcv(req.symbol, req.startDate, req.endDate)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:  # network / yfinance errors
        logger.exception("Data fetch failed")
        raise HTTPException(status_code=502, detail=f"Data fetch failed: {exc}")

    try:
        df = strategy_fn(df, req.params)
        result = run_backtest(df, req.initialCapital)
    except Exception as exc:
        logger.exception("Backtest failed")
        raise HTTPException(status_code=500, detail=f"Backtest failed: {exc}")

    return BacktestResponse(
        symbol=req.symbol.upper(),
        strategy=req.strategy.upper(),
        startDate=req.startDate,
        endDate=req.endDate,
        initialCapital=req.initialCapital,
        **result,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
