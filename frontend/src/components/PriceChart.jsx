import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/**
 * Price line with BUY/SELL markers overlaid via Scatter series.
 * `equityCurve` carries the per-day price; `trades` carries the signals.
 */
export default function PriceChart({ equityCurve = [], trades = [] }) {
  if (!equityCurve.length) return null;

  const priceByDate = Object.fromEntries(
    equityCurve.map((p) => [p.date, p.price])
  );

  const buys = trades
    .filter((t) => t.type === "BUY")
    .map((t) => ({ date: t.date, price: priceByDate[t.date] ?? t.price }));
  const sells = trades
    .filter((t) => t.type === "SELL")
    .map((t) => ({ date: t.date, price: priceByDate[t.date] ?? t.price }));

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">Price &amp; Signals</h3>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="text-emerald-500">▲</span> Buy
          </span>
          <span className="flex items-center gap-1">
            <span className="text-rose-500">▼</span> Sell
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={equityCurve}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} minTickGap={40} />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 11, fill: "#64748b" }}
            width={60}
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              boxShadow: "0 6px 16px rgba(16,24,40,.08)",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="price"
            name="Price"
            stroke="#4f46e5"
            dot={false}
            strokeWidth={1.8}
          />
          <Scatter
            data={buys}
            dataKey="price"
            name="Buy"
            fill="#10b981"
            shape="triangle"
          />
          <Scatter
            data={sells}
            dataKey="price"
            name="Sell"
            fill="#f43f5e"
            shape="triangle"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
