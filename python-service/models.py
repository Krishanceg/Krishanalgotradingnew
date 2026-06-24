"""Pydantic request/response models for the backtesting service."""
from typing import List, Optional
from pydantic import BaseModel, Field


class BacktestRequest(BaseModel):
    symbol: str = Field(..., examples=["AAPL"])
    startDate: str = Field(..., examples=["2022-01-01"])
    endDate: str = Field(..., examples=["2023-01-01"])
    initialCapital: float = Field(..., gt=0, examples=[10000])
    strategy: str = Field(..., examples=["RSI"])
    # Optional strategy parameters (sensible defaults applied per-strategy)
    params: Optional[dict] = None


class Trade(BaseModel):
    type: str          # "BUY" or "SELL"
    date: str
    price: float
    shares: float
    value: float
    pnl: Optional[float] = None      # realized P&L on SELL


class EquityPoint(BaseModel):
    date: str
    equity: float
    price: float


class BacktestResponse(BaseModel):
    symbol: str
    strategy: str
    startDate: str
    endDate: str
    initialCapital: float
    finalValue: float
    totalReturn: float          # percentage
    numberOfTrades: int
    winRate: float              # percentage
    maxDrawdown: float          # percentage (negative)
    sharpeRatio: float
    trades: List[Trade]
    equityCurve: List[EquityPoint]
