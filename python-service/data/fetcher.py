"""Historical OHLCV data fetching via Yahoo Finance (yfinance)."""
import pandas as pd
import yfinance as yf


def fetch_ohlcv(symbol: str, start: str, end: str) -> pd.DataFrame:
    """Download historical OHLCV data for a symbol.

    Returns a DataFrame indexed by date with columns:
    Open, High, Low, Close, Volume.
    Raises ValueError when no data is available.
    """
    df = yf.download(
        symbol,
        start=start,
        end=end,
        progress=False,
        auto_adjust=True,
    )

    if df is None or df.empty:
        raise ValueError(
            f"No market data found for '{symbol}' between {start} and {end}."
        )

    # yfinance may return a MultiIndex (when several tickers are requested);
    # flatten it so we always work with simple column names.
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    expected = ["Open", "High", "Low", "Close", "Volume"]
    missing = [c for c in expected if c not in df.columns]
    if missing:
        raise ValueError(f"Data for '{symbol}' missing columns: {missing}")

    df = df[expected].dropna()
    if df.empty:
        raise ValueError(f"Data for '{symbol}' is empty after cleaning.")

    return df
