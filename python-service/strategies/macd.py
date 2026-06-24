"""MACD strategy: buy when MACD line crosses above signal line, sell on cross below."""
import pandas as pd


def macd_strategy(df: pd.DataFrame, params: dict | None = None) -> pd.DataFrame:
    params = params or {}
    fast = int(params.get("fast", 12))
    slow = int(params.get("slow", 26))
    signal_span = int(params.get("signal", 9))

    df = df.copy()
    ema_fast = df["Close"].ewm(span=fast, adjust=False).mean()
    ema_slow = df["Close"].ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal_span, adjust=False).mean()

    df["macd"] = macd_line
    df["macd_signal"] = signal_line

    cross_up = (macd_line > signal_line) & (
        macd_line.shift(1) <= signal_line.shift(1)
    )
    cross_down = (macd_line < signal_line) & (
        macd_line.shift(1) >= signal_line.shift(1)
    )

    df["signal"] = 0
    df.loc[cross_up, "signal"] = 1
    df.loc[cross_down, "signal"] = -1
    return df
