"""Simple long-only, all-in backtest engine.

The engine walks the price series day by day. On a buy signal (and only when
flat) it invests all available cash; on a sell signal (and only when holding)
it liquidates the entire position. This keeps the model easy to reason about
for a learning project.
"""
import pandas as pd

from . import metrics


def run_backtest(df: pd.DataFrame, initial_capital: float) -> dict:
    """Execute the backtest over a DataFrame that has 'Close' and 'signal'.

    Returns a dict matching the BacktestResponse shape (minus request echo).
    """
    cash = float(initial_capital)
    shares = 0.0
    in_position = False
    entry_price = 0.0

    trades = []
    equity_records = []
    round_trip_pnls = []

    for date, row in df.iterrows():
        price = float(row["Close"])
        signal = int(row["signal"]) if not pd.isna(row["signal"]) else 0
        date_str = pd.Timestamp(date).strftime("%Y-%m-%d")

        if signal == 1 and not in_position:
            shares = cash / price
            trade_value = cash
            cash = 0.0
            in_position = True
            entry_price = price
            trades.append({
                "type": "BUY",
                "date": date_str,
                "price": round(price, 4),
                "shares": round(shares, 6),
                "value": round(trade_value, 2),
                "pnl": None,
            })

        elif signal == -1 and in_position:
            proceeds = shares * price
            pnl = (price - entry_price) * shares
            round_trip_pnls.append(pnl)
            cash = proceeds
            trades.append({
                "type": "SELL",
                "date": date_str,
                "price": round(price, 4),
                "shares": round(shares, 6),
                "value": round(proceeds, 2),
                "pnl": round(pnl, 2),
            })
            shares = 0.0
            in_position = False
            entry_price = 0.0

        equity = cash + shares * price
        equity_records.append({
            "date": date_str,
            "equity": round(equity, 2),
            "price": round(price, 4),
        })

    final_value = equity_records[-1]["equity"] if equity_records else initial_capital
    total_return = (final_value - initial_capital) / initial_capital * 100

    equity_series = pd.Series([r["equity"] for r in equity_records])

    return {
        "finalValue": round(final_value, 2),
        "totalReturn": round(total_return, 2),
        "numberOfTrades": len(trades),
        "winRate": round(metrics.win_rate(round_trip_pnls), 2),
        "maxDrawdown": round(metrics.max_drawdown(equity_series), 2),
        "sharpeRatio": round(metrics.sharpe_ratio(equity_series), 2),
        "trades": trades,
        "equityCurve": equity_records,
    }
