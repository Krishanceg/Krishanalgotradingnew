// Indian market indices (Yahoo Finance symbols).
export const INDIAN_INDICES = [
  { symbol: "^NSEI", name: "NIFTY 50" },
  { symbol: "^BSESN", name: "SENSEX" },
  { symbol: "^NSEBANK", name: "NIFTY BANK" },
  { symbol: "^CNXIT", name: "NIFTY IT" },
];

// Default NSE watchlist (.NS suffix = National Stock Exchange of India).
export const DEFAULT_WATCHLIST = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank" },
  { symbol: "INFY.NS", name: "Infosys" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank" },
  { symbol: "SBIN.NS", name: "State Bank of India" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors" },
  { symbol: "WIPRO.NS", name: "Wipro" },
];

export const STRATEGIES = [
  { value: "RSI", label: "RSI Strategy", hint: "Buy RSI < 30, sell RSI > 70" },
  {
    value: "MACD",
    label: "MACD Strategy",
    hint: "Buy/sell on MACD–signal line crossovers",
  },
  {
    value: "BOLLINGER",
    label: "Bollinger Bands",
    hint: "Buy below lower band, sell above upper band",
  },
  {
    value: "MOMENTUM",
    label: "Momentum Strategy",
    hint: "Buy if close > close N days ago, else sell",
  },
  {
    value: "MA_CROSSOVER",
    label: "Moving Average Crossover",
    hint: "Buy/sell on short vs long SMA crossover",
  },
];
