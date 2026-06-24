"""Trading strategy registry.

Every strategy is a function that takes an OHLCV DataFrame (and optional
params) and returns the same DataFrame with an integer ``signal`` column:
    1  -> buy signal
   -1  -> sell signal
    0  -> hold / no action

The backtest engine is responsible for position management, so a strategy may
emit a signal on every qualifying bar; the engine only acts on it when the
current position allows.
"""
from .rsi import rsi_strategy
from .macd import macd_strategy
from .bollinger import bollinger_strategy
from .momentum import momentum_strategy
from .moving_average import moving_average_crossover_strategy

# Maps the strategy key sent by the client to its implementation.
STRATEGIES = {
    "RSI": rsi_strategy,
    "MACD": macd_strategy,
    "BOLLINGER": bollinger_strategy,
    "MOMENTUM": momentum_strategy,
    "MA_CROSSOVER": moving_average_crossover_strategy,
}


def get_strategy(name: str):
    key = (name or "").strip().upper()
    if key not in STRATEGIES:
        raise ValueError(
            f"Unknown strategy '{name}'. "
            f"Available: {', '.join(STRATEGIES.keys())}"
        )
    return STRATEGIES[key]
