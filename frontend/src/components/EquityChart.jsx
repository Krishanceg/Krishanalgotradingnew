import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function EquityChart({ equityCurve = [] }) {
  if (!equityCurve.length) return null;

  return (
    <div className="card p-5">
      <h3 className="font-bold mb-3">Equity curve</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={equityCurve}>
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} minTickGap={40} />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 11, fill: "#64748b" }}
            width={70}
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              boxShadow: "0 6px 16px rgba(16,24,40,.08)",
            }}
            formatter={(v) => [
              `₹${Number(v).toLocaleString("en-IN")}`,
              "Equity",
            ]}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="#4f46e5"
            strokeWidth={2}
            fill="url(#equityFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
