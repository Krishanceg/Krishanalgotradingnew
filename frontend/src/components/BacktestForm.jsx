import { useEffect, useState } from "react";
import { STRATEGIES } from "../constants";
import { PlayIcon } from "./icons";

const today = new Date().toISOString().slice(0, 10);

const isoDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const RANGES = [
  { label: "6M", days: 182 },
  { label: "1Y", days: 365 },
  { label: "2Y", days: 730 },
  { label: "5Y", days: 1825 },
];

export default function BacktestForm({ onSubmit, loading, preset }) {
  const [form, setForm] = useState({
    symbol: "AAPL",
    startDate: "2022-01-01",
    endDate: "2023-01-01",
    initialCapital: 100000,
    strategy: "RSI",
  });

  useEffect(() => {
    if (preset?.symbol) setForm((f) => ({ ...f, symbol: preset.symbol }));
  }, [preset]);

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const setRange = (days) =>
    setForm((f) => ({ ...f, startDate: isoDaysAgo(days), endDate: today }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      symbol: form.symbol.trim().toUpperCase(),
      initialCapital: Number(form.initialCapital),
    });
  };

  const selected = STRATEGIES.find((s) => s.value === form.strategy);

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-5">
      <div>
        <h2 className="text-base font-bold">New backtest</h2>
        <p className="text-xs text-slate-500">Configure and run a strategy.</p>
      </div>

      <div>
        <label className="label">Stock symbol</label>
        <input
          className="input mt-1.5 font-semibold tracking-wide"
          value={form.symbol}
          onChange={update("symbol")}
          placeholder="e.g. AAPL or RELIANCE.NS"
          required
        />
        <p className="text-[11px] text-slate-400 mt-1">
          Use <span className="text-slate-600 font-medium">.NS</span> for NSE
          India (e.g. INFY.NS)
        </p>
      </div>

      <div>
        <label className="label">Initial capital (₹)</label>
        <input
          type="number"
          min="1"
          className="input mt-1.5 tnum"
          value={form.initialCapital}
          onChange={update("initialCapital")}
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="label">Date range</label>
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => setRange(r.days)}
                className="text-[11px] px-2 py-0.5 rounded-md border border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-1.5">
          <input
            type="date"
            max={today}
            className="input"
            value={form.startDate}
            onChange={update("startDate")}
            required
          />
          <input
            type="date"
            max={today}
            className="input"
            value={form.endDate}
            onChange={update("endDate")}
            required
          />
        </div>
      </div>

      <div>
        <label className="label">Strategy</label>
        <select
          className="input mt-1.5 cursor-pointer"
          value={form.strategy}
          onChange={update("strategy")}
        >
          {STRATEGIES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {selected && (
          <div className="mt-2 text-xs text-slate-600 bg-indigo-50/60 border border-indigo-100 rounded-lg px-3 py-2">
            {selected.hint}
          </div>
        )}
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? (
          "Running backtest…"
        ) : (
          <>
            <PlayIcon width={16} height={16} /> Run backtest
          </>
        )}
      </button>
    </form>
  );
}
