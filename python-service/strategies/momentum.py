"""Momentum strategy: buy when close > close N days ago, sell when close < close N days ago."""
import pandas as pd


def momentum_strategy(df: pd.DataFrame, params: dict | None = None) -> pd.DataFrame:
    params = params or {}
    lookback = int(params.get("lookback", 10))

    df = df.copy()
    past_close = df["Close"].shift(lookback)
    df["momentum"] = df["Close"] - past_close

    df["signal"] = 0
    df.loc[df["Close"] > past_close, "signal"] = 1
    df.loc[df["Close"] < past_close, "signal"] = -1
    return df
