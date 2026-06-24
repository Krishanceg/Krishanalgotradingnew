import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { getQuotes } from "../api/client";
import {
  STRATEGY_PRESETS,
  presetLegs,
  newLeg,
  payoffCurve,
  analyze,
} from "../options";
import { TrashIcon, SearchIcon } from "./icons";

const fmtINR = (n) =>
  n == null ? "—" : n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const fmtMoney = (n) => {
  if (n === Infinity || n === -Infinity) return "Unlimited";
  const sign = n < 0 ? "-" : "";
  return `${sign}₹${fmtINR(Math.abs(n))}`;
};

export default function OptionsLab() {
  const [symbol, setSymbol] = useState("NIFTY");
  const [spot, setSpot] = useState(22000);
  const [lotSize, setLotSize] = useState(50);
  const [strategy, setStrategy] = useState("Bull Call Spread");
  const [legs, setLegs] = useState(() => presetLegs("Bull Call Spread", 22000));
  const [fetching, setFetching] = useState(false);
  const [note, setNote] = useState("");

  const applyPreset = (name) => {
    setStrategy(name);
    setLegs(presetLegs(name, Number(spot) || 100));
  };

  const fetchSpot = async () => {
    let sym = symbol.trim().toUpperCase();
    if (!sym) return;
    const map = { NIFTY: "^NSEI", BANKNIFTY: "^NSEBANK", SENSEX: "^BSESN" };
    const ySym =
      map[sym] || (sym.includes(".") || sym.startsWith("^") ? sym : `${sym}.NS`);
    setFetching(true);
    setNote("");
    try {
      const [q] = await getQuotes([ySym]);
      if (q && !q.error && q.price) {
        setSpot(Math.round(q.price));
        setNote(`Spot updated from ${ySym}: ₹${fmtINR(q.price)}`);
      } else {
        setNote(`No live price for ${ySym}.`);
      }
    } catch (e) {
      setNote(e.response?.data?.error || "Could not fetch spot price.");
    } finally {
      setFetching(false);
    }
  };

  const updateLeg = (id, key, value) =>
    setLegs((ls) =>
      ls.map((l) =>
        l.id === id
          ? {
              ...l,
              [key]: key === "type" || key === "action" ? value : Number(value),
            }
          : l
      )
    );

  const removeLeg = (id) => setLegs((ls) => ls.filter((l) => l.id !== id));
  const addLeg = () => setLegs((ls) => [...ls, newLeg(Number(spot) || 100)]);

  const curve = useMemo(
    () => payoffCurve(legs, Number(lotSize), Number(spot)),
    [legs, lotSize, spot]
  );
  const stats = useMemo(
    () => analyze(legs, Number(lotSize), Number(spot)),
    [legs, lotSize, spot]
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          F&amp;O Lab
          <span className="chip bg-indigo-50 text-indigo-700 border border-indigo-100">
            Options &amp; futures
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Build a multi-leg strategy and visualize its payoff at expiry. Premiums
          are your inputs · no time value / Greeks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
        {/* Builder */}
        <div className="space-y-5">
          <div className="card p-5 space-y-4">
            <div>
              <label className="label">Underlying & spot</label>
              <div className="flex gap-2 mt-1.5">
                <div className="relative flex-1">
                  <SearchIcon
                    width={15}
                    height={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    className="input pl-9"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="NIFTY / RELIANCE"
                  />
                </div>
                <button
                  onClick={fetchSpot}
                  disabled={fetching}
                  className="btn-ghost px-3 py-2 whitespace-nowrap"
                >
                  {fetching ? "…" : "Get spot"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Spot price (₹)</label>
                <input
                  type="number"
                  className="input mt-1.5 tnum"
                  value={spot}
                  onChange={(e) => setSpot(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Lot size</label>
                <input
                  type="number"
                  className="input mt-1.5 tnum"
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                />
              </div>
            </div>
            {note && <p className="text-[11px] text-emerald-600">{note}</p>}

            <div>
              <label className="label">Strategy presets</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {STRATEGY_PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => applyPreset(p)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                      strategy === p
                        ? "border-indigo-400 text-indigo-700 bg-indigo-50"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Legs</h3>
              <button onClick={addLeg} className="btn-ghost px-3 py-1.5 text-xs">
                + Add leg
              </button>
            </div>

            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-1.5 mb-1.5 px-1 text-[10px] uppercase text-slate-400">
              <span>Action</span>
              <span>Type</span>
              <span>Strike/Entry</span>
              <span>Premium</span>
              <span></span>
            </div>

            <div className="space-y-2">
              {legs.map((leg) => (
                <div
                  key={leg.id}
                  className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-1.5 items-center"
                >
                  <select
                    className="input px-2 py-1.5 text-xs"
                    value={leg.action}
                    onChange={(e) => updateLeg(leg.id, "action", e.target.value)}
                  >
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                  </select>
                  <select
                    className="input px-2 py-1.5 text-xs"
                    value={leg.type}
                    onChange={(e) => updateLeg(leg.id, "type", e.target.value)}
                  >
                    <option value="CALL">Call</option>
                    <option value="PUT">Put</option>
                    <option value="FUTURE">Future</option>
                  </select>
                  <input
                    type="number"
                    className="input px-2 py-1.5 text-xs tnum"
                    value={leg.strike}
                    title={leg.type === "FUTURE" ? "Entry price" : "Strike"}
                    onChange={(e) => updateLeg(leg.id, "strike", e.target.value)}
                  />
                  <input
                    type="number"
                    className="input px-2 py-1.5 text-xs tnum"
                    value={leg.premium}
                    disabled={leg.type === "FUTURE"}
                    title="Premium"
                    onChange={(e) => updateLeg(leg.id, "premium", e.target.value)}
                  />
                  <button
                    onClick={() => removeLeg(leg.id)}
                    className="text-slate-300 hover:text-rose-500 transition"
                    title="Remove leg"
                  >
                    <TrashIcon width={15} height={15} />
                  </button>
                </div>
              ))}
              {legs.length === 0 && (
                <p className="text-sm text-slate-400 py-2">
                  No legs — add one or pick a preset.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric
              label="Max profit"
              value={fmtMoney(stats.maxProfit)}
              tone={stats.maxProfit > 0 ? "pos" : undefined}
            />
            <Metric label="Max loss" value={fmtMoney(stats.maxLoss)} tone="neg" />
            <Metric
              label={stats.netPremium >= 0 ? "Net credit" : "Net debit"}
              value={fmtMoney(Math.abs(stats.netPremium))}
              tone={stats.netPremium >= 0 ? "pos" : "neg"}
            />
            <Metric
              label="Breakeven"
              value={
                stats.breakevens.length
                  ? stats.breakevens.map((b) => fmtINR(b)).join(", ")
                  : "—"
              }
            />
          </div>

          <div className="card p-5">
            <h3 className="font-bold mb-3">Payoff at expiry</h3>
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={curve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="price"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  minTickGap={40}
                  tickFormatter={(v) => fmtINR(v)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  width={70}
                  tickFormatter={(v) => fmtINR(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    boxShadow: "0 6px 16px rgba(16,24,40,.08)",
                  }}
                  formatter={(v) => [`₹${fmtINR(v)}`, "P/L"]}
                  labelFormatter={(v) => `Spot ₹${fmtINR(v)}`}
                />
                <ReferenceLine y={0} stroke="#cbd5e1" />
                {Number(spot) > 0 && (
                  <ReferenceLine
                    x={Number(spot)}
                    stroke="#6366f1"
                    strokeDasharray="4 4"
                    label={{ value: "Spot", fill: "#6366f1", fontSize: 11 }}
                  />
                )}
                {stats.breakevens.map((b, i) => (
                  <ReferenceLine
                    key={i}
                    x={b}
                    stroke="#f59e0b"
                    strokeDasharray="2 4"
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="payoff"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-2">
              <span><span className="text-indigo-500">┊</span> Spot</span>
              <span><span className="text-amber-500">┊</span> Breakeven</span>
              <span><span className="text-indigo-600">━</span> P/L curve</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            Educational tool. Shows theoretical profit/loss <b>at expiry</b> for
            the quantity entered (lots × lot size). It ignores brokerage, taxes,
            margin and time value. For a Future leg, the “Strike” column is the
            entry price and premium is ignored. Typical NSE lot sizes: NIFTY 50,
            BANKNIFTY 15 — adjust as needed.
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">
        {label}
      </div>
      <div
        className={`text-lg font-bold mt-1.5 truncate tnum ${
          tone === "pos" ? "pos" : tone === "neg" ? "neg" : ""
        }`}
        title={String(value)}
      >
        {value}
      </div>
    </div>
  );
}
