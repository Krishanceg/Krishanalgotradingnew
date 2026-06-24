import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["BUY", "SELL"], required: true },
    date: { type: String, required: true },
    price: { type: Number, required: true },
    shares: { type: Number, required: true },
    value: { type: Number, required: true },
    pnl: { type: Number, default: null },
  },
  { _id: false }
);

const equityPointSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    equity: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const backtestResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    strategy: { type: String, required: true, trim: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    initialCapital: { type: Number, required: true },
    finalValue: { type: Number, required: true },
    totalReturn: { type: Number, required: true },
    numberOfTrades: { type: Number, required: true },
    winRate: { type: Number, required: true },
    maxDrawdown: { type: Number, required: true },
    sharpeRatio: { type: Number, required: true },
    trades: { type: [tradeSchema], default: [] },
    equityCurve: { type: [equityPointSchema], default: [] },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export default mongoose.model("BacktestResult", backtestResultSchema);
