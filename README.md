# 📈 MERN Algo Trading Backtester

A full-stack **MERN + Python** application for backtesting stock trading
strategies on historical market data. Select a symbol, date range, capital, and
strategy — the system fetches OHLCV data with `yfinance`, runs the backtest in
Python, stores the result in MongoDB, and visualizes everything in a React
dashboard.

> ⚠️ **This is a backtesting and learning project only. It does not connect to a
> broker and never executes real trades.**

---

## Architecture

```
┌──────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│  React (5173)│ ───► │ Node/Express(5000)│ ───►│ Python FastAPI(8000)│
│  dashboard   │ ◄─── │  REST API + Mongo │ ◄── │ yfinance + backtest │
└──────────────┘      └────────┬─────────┘      └─────────────────────┘
                               │
                          ┌────▼─────┐
                          │ MongoDB  │
                          └──────────┘
```

| Layer          | Tech                                   | Port |
| -------------- | -------------------------------------- | ---- |
| Frontend       | React (Vite), Axios, Tailwind, Recharts| 5173 |
| Backend        | Node.js, Express, Mongoose             | 5000 |
| Python service | FastAPI, yfinance, pandas, numpy       | 8000 |
| Database       | MongoDB                                | 27017|

---

## Project Structure

```
MERN Algo Trading Backtester/
├── python-service/          # FastAPI backtesting engine
│   ├── main.py              # POST /run-backtest
│   ├── models.py            # Pydantic request/response models
│   ├── data/fetcher.py      # yfinance OHLCV download
│   ├── strategies/          # RSI, MACD, Bollinger, Momentum, MA crossover
│   └── backtest/            # engine.py (simulation) + metrics.py
├── backend/                 # Node.js Express API
│   ├── server.js
│   └── src/
│       ├── app.js
│       ├── config/db.js
│       ├── models/BacktestResult.js
│       ├── routes/backtest.routes.js
│       └── controllers/backtest.controller.js
└── frontend/                # React + Vite dashboard
    └── src/
        ├── App.jsx
        ├── api/client.js
        ├── constants.js
        └── components/       # Form, MetricsPanel, PriceChart, EquityChart, HistoryList
```

---

## Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **MongoDB** running locally (or a connection string to Atlas)

---

## Setup & Run

Start each service in its **own terminal**. Recommended order:
MongoDB → Python service → Node backend → React frontend.

### 1. MongoDB

Make sure MongoDB is running locally on `mongodb://127.0.0.1:27017`
(or set `MONGO_URI` in `backend/.env`).

### 2. Python service (port 8000)

```bash
cd python-service
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Node backend (port 5000)

```bash
cd backend
cp .env.example .env      # Windows: copy .env.example .env
npm install
npm run dev               # or: npm start
```

### 4. React frontend (port 5173)

```bash
cd frontend
cp .env.example .env      # Windows: copy .env.example .env
npm install
npm run dev
```

Open **http://localhost:5173**.

---

## API Reference

### Node.js Express (`/api`)

| Method | Endpoint              | Description                                  |
| ------ | --------------------- | -------------------------------------------- |
| POST   | `/api/backtest`       | Run a backtest and persist the result        |
| GET    | `/api/backtests`      | List backtest history (summary fields)       |
| GET    | `/api/backtests/:id`  | Full result incl. trades + equity curve      |
| DELETE | `/api/backtests/:id`  | Delete a stored backtest                     |

**POST /api/backtest** body:

```json
{
  "symbol": "AAPL",
  "startDate": "2022-01-01",
  "endDate": "2023-01-01",
  "initialCapital": 10000,
  "strategy": "RSI"
}
```

### Python FastAPI

| Method | Endpoint        | Description                              |
| ------ | --------------- | ---------------------------------------- |
| POST   | `/run-backtest` | Fetch data, apply strategy, run backtest |
| GET    | `/strategies`   | List available strategy keys             |

---

## Strategies

| Key            | Strategy                  | Rules                                                       |
| -------------- | ------------------------- | ---------------------------------------------------------- |
| `RSI`          | RSI                       | Buy when RSI < 30, sell when RSI > 70                       |
| `MACD`         | MACD                      | Buy when MACD crosses above signal, sell on cross below    |
| `BOLLINGER`    | Bollinger Bands           | Buy when close < lower band, sell when close > upper band  |
| `MOMENTUM`     | Momentum                  | Buy when close > close N days ago, sell when below         |
| `MA_CROSSOVER` | Moving Average Crossover  | Buy when short SMA crosses above long SMA, sell on cross   |

Each strategy accepts optional `params` (e.g. RSI `period`/`lower`/`upper`,
MA `short_window`/`long_window`) — sensible defaults are applied otherwise.

---

## Backtest Model

The engine is **long-only and all-in**: on a buy signal (while flat) it invests
all cash; on a sell signal (while holding) it liquidates fully. Returned metrics:

- `totalReturn` (%), `finalValue`, `initialCapital`
- `numberOfTrades`, `winRate` (% of profitable round-trips)
- `maxDrawdown` (%), `sharpeRatio` (annualized)
- `trades` (BUY/SELL signals with price, shares, realized P&L)
- `equityCurve` (per-day equity + price)

---

## Notes & Disclaimer

- Past performance does not indicate future results.
- The all-in model ignores slippage, commissions, and taxes.
- For educational use only — **not financial advice**, and **no real trading**.
