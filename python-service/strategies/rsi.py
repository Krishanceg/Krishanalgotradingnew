"""RSI strategy: buy when RSI < lower, sell when RSI > upper."""
import pandas as pd


def compute_rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    # Wilder's smoothing via exponential moving average.
    avg_gain = gain.ewm(alpha=1 / period, min_periods=period).mean()
    avg_loss = loss.ewm(alpha=1 / period, min_periods=period).mean()
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi


def rsi_strategy(df: pd.DataFrame, params: dict | None = None) -> pd.DataFrame:
    params = params or {}
    period = int(params.get("period", 14))
    lower = float(params.get("lower", 30))
    upper = float(params.get("upper", 70))

    df = df.copy()
    df["rsi"] = compute_rsi(df["Close"], period)

    df["signal"] = 0
    df.loc[df["rsi"] < lower, "signal"] = 1
    df.loc[df["rsi"] > upper, "signal"] = -1
    return df
