"""Bollinger Bands strategy: buy when close < lower band, sell when close > upper band."""
import pandas as pd


def bollinger_strategy(df: pd.DataFrame, params: dict | None = None) -> pd.DataFrame:
    params = params or {}
    window = int(params.get("window", 20))
    num_std = float(params.get("num_std", 2))

    df = df.copy()
    ma = df["Close"].rolling(window).mean()
    std = df["Close"].rolling(window).std()
    df["bb_mid"] = ma
    df["bb_upper"] = ma + num_std * std
    df["bb_lower"] = ma - num_std * std

    df["signal"] = 0
    df.loc[df["Close"] < df["bb_lower"], "signal"] = 1
    df.loc[df["Close"] > df["bb_upper"], "signal"] = -1
    return df
