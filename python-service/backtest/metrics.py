"""Performance metric calculations for a backtest equity curve."""
import numpy as np
import pandas as pd

TRADING_DAYS = 252


def max_drawdown(equity: pd.Series) -> float:
    """Maximum peak-to-trough decline of the equity curve, as a percentage."""
    if equity.empty:
        return 0.0
    running_max = equity.cummax()
    drawdown = (equity - running_max) / running_max
    return float(drawdown.min() * 100)


def sharpe_ratio(equity: pd.Series, risk_free_rate: float = 0.0) -> float:
    """Annualized Sharpe ratio from the equity curve's daily returns."""
    if len(equity) < 2:
        return 0.0
    daily_returns = equity.pct_change().dropna()
    if daily_returns.empty or daily_returns.std() == 0:
        return 0.0
    daily_rf = risk_free_rate / TRADING_DAYS
    excess = daily_returns - daily_rf
    return float((excess.mean() / excess.std()) * np.sqrt(TRADING_DAYS))


def win_rate(round_trip_pnls: list[float]) -> float:
    """Percentage of closed round-trip trades that were profitable."""
    if not round_trip_pnls:
        return 0.0
    wins = sum(1 for p in round_trip_pnls if p > 0)
    return float(wins / len(round_trip_pnls) * 100)
