import { useEffect, useMemo, useState } from "react";
import { INDIAN_INDICES, DEFAULT_WATCHLIST } from "../constants";
import { RefreshIcon, SearchIcon, TrashIcon, PlayIcon } from "./icons";
import { useLiveQuotes } from "../hooks/useLiveQuotes";

const WATCHLIST_KEY = "watchlist";

const loadWatchlist = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(WATCHLIST_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {
    /* ignore */
  }
  return DEFAULT_WATCHLIST;
};

const fmt = (n) =>
  n == null ? "—" : n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function Markets({ onBacktest }) {
  const [watchlist, setWatchlist] = useState(loadWatchlist);
  const [newSymbol, setNewSymbol] = useState("");

  const allSymbols = useMemo(
    () => [
      ...INDIAN_INDICES.map((i) => i.symbol),
      ...watchlist.map((w) => w.symbol),
    ],
    [watchlist]
  );

  const { quotes, updatedAt, status, error, refresh } =
    useLiveQuotes(allSymbols);
  const loading = !updatedAt;

  useEffect(() => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const addSymbol = (e) => {
    e.preventDefault();
    let sym = newSymbol.trim().toUpperCase();
    if (!sym) return;
    if (!sym.includes(".") && !sym.startsWith("^")) sym = `${sym}.NS`;
    if (!watchlist.some((w) => w.symbol === sym)) {
      setWatchlist((w) => [...w, { symbol: sym, name: sym }]);
    }
    setNewSymbol("");
  };

  const removeSymbol = (symbol) =>
    setWatchlist((w) => w.filter((s) => s.symbol !== symbol));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Indian markets
            {status === "live" ? (
              <span className="chip bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live · WebSocket
              </span>
            ) : status === "polling" ? (
              <span className="chip bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Polling
              </span>
            ) : (
              <span className="chip bg-slate-100 text-slate-500">
                Connecting…
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Yahoo Finance (delayed ~15 min) ·{" "}
            {status === "live" ? "streaming every 5s" : "auto-refresh 20s"}
            {updatedAt && ` · updated ${updatedAt.toLocaleTimeString("en-IN")}`}
          </p>
        </div>
        <button onClick={refresh} className="btn-ghost px-3 py-2">
          <RefreshIcon
            width={16}
            height={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {INDIAN_INDICES.map((idx) => (
          <IndexCard
            key={idx.symbol}
            name={idx.name}
            symbol={idx.symbol}
            quote={quotes[idx.symbol]}
            loading={loading}
            onBacktest={onBacktest}
          />
        ))}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h3 className="font-bold">Watchlist</h3>
          <form onSubmit={addSymbol} className="flex gap-2">
            <div className="relative">
              <SearchIcon
                width={15}
                height={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="Add symbol e.g. ITC"
                className="input pl-9 py-2 w-48"
              />
            </div>
            <button className="btn-primary px-4 py-2">Add</button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-200">
                <th className="py-2.5 pr-3 font-medium">Symbol</th>
                <th className="py-2.5 px-3 font-medium text-right">Price</th>
                <th className="py-2.5 px-3 font-medium text-right">Change</th>
                <th className="py-2.5 px-3 font-medium text-right">% Chg</th>
                <th className="py-2.5 px-3 font-medium text-right hidden md:table-cell">
                  Day low / high
                </th>
                <th className="py-2.5 pl-3"></th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((w) => {
                const q = quotes[w.symbol];
                const up = q && q.change >= 0;
                return (
                  <tr
                    key={w.symbol}
                    className="border-b border-slate-100 hover:bg-slate-50 transition"
                  >
                    <td className="py-3 pr-3">
                      <div className="font-semibold">{w.symbol}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {w.name}
                      </div>
                    </td>
                    {q && !q.error ? (
                      <>
                        <td className="px-3 text-right font-semibold tnum">
                          ₹{fmt(q.price)}
                        </td>
                        <td className={`px-3 text-right tnum ${up ? "pos" : "neg"}`}>
                          {up ? "+" : ""}
                          {fmt(q.change)}
                        </td>
                        <td className="px-3 text-right">
                          <span
                            className={`chip tnum ${
                              up
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {up ? "▲" : "▼"} {Math.abs(q.changePercent)}%
                          </span>
                        </td>
                        <td className="px-3 text-right text-slate-400 text-xs tnum hidden md:table-cell">
                          {fmt(q.dayLow)} / {fmt(q.dayHigh)}
                        </td>
                      </>
                    ) : (
                      <td colSpan={4} className="px-3 text-right text-slate-400 text-xs">
                        {q?.error ? "No data" : loading ? "Loading…" : "—"}
                      </td>
                    )}
                    <td className="pl-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onBacktest?.(w.symbol)}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition"
                        title={`Backtest ${w.symbol}`}
                      >
                        <PlayIcon width={12} height={12} /> Test
                      </button>
                      <button
                        onClick={() => removeSymbol(w.symbol)}
                        className="text-slate-300 hover:text-rose-500 ml-2 align-middle transition"
                        title="Remove"
                      >
                        <TrashIcon width={15} height={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function IndexCard({ name, symbol, quote, loading, onBacktest }) {
  const up = quote && quote.change >= 0;
  return (
    <div className="card card-hover p-4 flex flex-col">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">
          {name}
        </span>
        {quote && !quote.error && (
          <span className={`text-xs font-semibold ${up ? "pos" : "neg"}`}>
            {up ? "▲" : "▼"}
          </span>
        )}
      </div>
      {quote && !quote.error ? (
        <>
          <div className="text-xl font-bold mt-1.5 tnum">{fmt(quote.price)}</div>
          <div className={`text-xs font-medium tnum ${up ? "pos" : "neg"}`}>
            {up ? "+" : ""}
            {fmt(quote.change)} ({up ? "+" : ""}
            {fmt(quote.changePercent)}%)
          </div>
        </>
      ) : (
        <div className="text-slate-400 mt-2 text-sm">
          {loading ? "Loading…" : "No data"}
        </div>
      )}
      <button
        onClick={() => onBacktest?.(symbol)}
        className="mt-3 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-500 font-medium self-start"
      >
        <PlayIcon width={12} height={12} /> Backtest
      </button>
    </div>
  );
}
