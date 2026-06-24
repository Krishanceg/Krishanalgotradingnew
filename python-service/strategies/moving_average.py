"""Moving Average Crossover: buy when short SMA crosses above long SMA, sell on cross below."""
import pandas as pd


def moving_average_crossover_strategy(
    df: pd.DataFrame, params: dict | None = None
) -> pd.DataFrame:
    params = params or {}
    short_window = int(params.get("short_window", 20))
    long_window = int(params.get("long_window", 50))

    df = df.copy()
    short_sma = df["Close"].rolling(short_window).mean()
    long_sma = df["Close"].rolling(long_window).mean()
    df["sma_short"] = short_sma
    df["sma_long"] = long_sma

    cross_up = (short_sma > long_sma) & (short_sma.shift(1) <= long_sma.shift(1))
    cross_down = (short_sma < long_sma) & (short_sma.shift(1) >= long_sma.shift(1))

    df["signal"] = 0
    df.loc[cross_up, "signal"] = 1
    df.loc[cross_down, "signal"] = -1
    return df
