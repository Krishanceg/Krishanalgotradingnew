import { useMemo } from "react";
import { TrophyIcon, TrashIcon } from "./icons";

export default function Portfolio({ items = [], onSelect, onDelete, activeId }) {
  const stats = useMemo(() => {
    if (!items.length) return null;
    const returns = items.map((i) => i.totalReturn ?? 0);
    const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
    const best = items.reduce((a, b) =>
      (b.totalReturn ?? -Infinity) > (a.totalReturn ?? -Infinity) ? b : a
    );
    const wins = returns.filter((r) => r > 0).length;
    return {
      count: items.length,
      avg,
      best,
      profitableShare: (wins / items.length) * 100,
    };
  }, [items]);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrophyIcon width={18} height={18} className="text-indigo-600" />
        <h2 className="text-base font-bold">My portfolio</h2>
        {stats && (
          <span className="ml-auto chip bg-slate-100 text-slate-600">
            {stats.count} runs
          </span>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Stat
            label="Avg return"
            value={`${stats.avg > 0 ? "+" : ""}${stats.avg.toFixed(1)}%`}
            tone={stats.avg >= 0 ? "pos" : "neg"}
          />
          <Stat label="Profitable" value={`${stats.profitableShare.toFixed(0)}%`} />
          <Stat
            label="Best"
            value={`${stats.best.totalReturn > 0 ? "+" : ""}${stats.best.totalReturn?.toFixed(0)}%`}
            tone="pos"
            sub={stats.best.symbol}
          />
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">No test runs yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Run your first backtest to build your portfolio.
          </p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-[380px] overflow-auto pr-1 -mr-1">
          {items.map((it) => {
            const up = it.totalReturn >= 0;
            const active = activeId === it._id;
            return (
              <li
                key={it._id}
                onClick={() => onSelect(it._id)}
                className={`group rounded-xl border p-3 cursor-pointer transition ${
                  active
                    ? "border-indigo-400 bg-indigo-50/60"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {it.symbol}
                      <span className="text-slate-400 text-xs font-normal">
                        {" "}
                        · {it.strategy}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 tnum">
                      {it.startDate} → {it.endDate}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm font-bold tnum ${up ? "pos" : "neg"}`}>
                      {up ? "+" : ""}
                      {it.totalReturn?.toFixed(1)}%
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(it._id);
                      }}
                      className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                      title="Delete"
                    >
                      <TrashIcon width={15} height={15} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, tone, sub }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div
        className={`text-sm font-bold tnum ${
          tone === "pos" ? "pos" : tone === "neg" ? "neg" : ""
        }`}
      >
        {value}
      </div>
      {sub && <div className="text-[10px] text-slate-400 truncate">{sub}</div>}
    </div>
  );
}
