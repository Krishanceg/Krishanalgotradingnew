import { useEffect, useState } from "react";
import BacktestForm from "./components/BacktestForm";
import MetricsPanel from "./components/MetricsPanel";
import PriceChart from "./components/PriceChart";
import EquityChart from "./components/EquityChart";
import Portfolio from "./components/Portfolio";
import Markets from "./components/Markets";
import OptionsLab from "./components/OptionsLab";
import Login from "./components/Login";
import { useAuth } from "./context/AuthContext";
import { TrendingUp, LogOutIcon, ChartIcon, TrophyIcon } from "./components/icons";
import {
  runBacktest,
  getHistory,
  getBacktest,
  deleteBacktest,
} from "./api/client";

const TABS = [
  { key: "backtester", label: "Backtester" },
  { key: "portfolio", label: "Portfolio" },
  { key: "fno", label: "F&O Lab" },
  { key: "markets", label: "Markets" },
];

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();

  const [tab, setTab] = useState("backtester");
  const [preset, setPreset] = useState(null);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    try {
      setHistory(await getHistory());
    } catch {
      /* ignore — likely just logged out */
    }
  };

  useEffect(() => {
    if (user) loadHistory();
    else {
      setHistory([]);
      setResult(null);
      setSelected(null);
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  if (!user) return <Login />;

  const handleSubmit = async (form) => {
    setLoading(true);
    setError("");
    try {
      const data = await runBacktest(form);
      setResult(data);
      await loadHistory();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Something went wrong running the backtest."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (id) => {
    setError("");
    try {
      setSelected(await getBacktest(id));
    } catch (err) {
      setError(err.response?.data?.error || "Could not load that backtest.");
    }
  };

  const handleBacktestSymbol = (symbol) => {
    setPreset({ symbol, nonce: Date.now() });
    setResult(null);
    setError("");
    setTab("backtester");
  };

  const handleDelete = async (id) => {
    try {
      await deleteBacktest(id);
      if (result?._id === id) setResult(null);
      if (selected?._id === id) setSelected(null);
      await loadHistory();
    } catch (err) {
      setError(err.response?.data?.error || "Could not delete that backtest.");
    }
  };

  const initials = (user.name || user.email || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 shadow-sm shadow-indigo-600/30">
              <TrendingUp width={19} height={19} className="text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-bold tracking-tight">Backtestr</div>
              <div className="text-[11px] text-slate-400">
                Strategy backtesting
              </div>
            </div>
          </div>

          <nav className="hidden sm:flex bg-slate-100 rounded-xl p-1">
            {TABS.map((t) => (
              <TabButton
                key={t.key}
                active={tab === t.key}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </TabButton>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-600">
                {initials}
              </div>
              <span className="text-sm text-slate-600 max-w-[160px] truncate">
                {user.name || user.email}
              </span>
            </div>
            <button onClick={logout} className="btn-ghost px-3 py-2" title="Log out">
              <LogOutIcon width={16} height={16} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>

        <nav className="sm:hidden flex gap-1 px-5 pb-3 overflow-x-auto">
          {TABS.map((t) => (
            <TabButton
              key={t.key}
              active={tab === t.key}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </TabButton>
          ))}
        </nav>
      </header>

      {/* ---- Backtester ---- */}
      {tab === "backtester" && (
        <main className="max-w-7xl mx-auto p-5 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
          <div>
            <BacktestForm
              onSubmit={handleSubmit}
              loading={loading}
              preset={preset}
            />
          </div>

          <div className="space-y-5">
            {error && <ErrorBox>{error}</ErrorBox>}
            {loading && <ResultSkeleton />}
            {!result && !error && !loading && (
              <EmptyState
                icon={ChartIcon}
                title="Ready to backtest"
                text="Pick a symbol, date range, capital and strategy on the left, then run a backtest to see performance metrics and charts here."
              />
            )}
            {result && !loading && <ResultView run={result} />}
          </div>
        </main>
      )}

      {/* ---- Portfolio ---- */}
      {tab === "portfolio" && (
        <main className="max-w-7xl mx-auto p-5 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
          <div>
            <Portfolio
              items={history}
              onSelect={handleSelect}
              onDelete={handleDelete}
              activeId={selected?._id}
            />
          </div>

          <div className="space-y-5">
            {error && <ErrorBox>{error}</ErrorBox>}
            {selected ? (
              <ResultView run={selected} />
            ) : (
              <EmptyState
                icon={TrophyIcon}
                title={
                  history.length
                    ? "Select a run to view details"
                    : "Your portfolio is empty"
                }
                text={
                  history.length
                    ? "Click any saved backtest on the left to see its metrics, signals and equity curve."
                    : "Head to the Backtester tab and run your first strategy — it will be saved here automatically."
                }
              />
            )}
          </div>
        </main>
      )}

      {/* ---- F&O Lab ---- */}
      {tab === "fno" && (
        <main className="max-w-7xl mx-auto p-5">
          <OptionsLab />
        </main>
      )}

      {/* ---- Markets ---- */}
      {tab === "markets" && (
        <main className="max-w-7xl mx-auto p-5">
          <Markets onBacktest={handleBacktestSymbol} />
        </main>
      )}
    </div>
  );
}

/* ---------- shared bits ---------- */

function ResultView({ run }) {
  const pnl = run.finalValue - run.initialCapital;
  const up = pnl >= 0;
  const fmtINR = (n) =>
    n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  return (
    <>
      <div className="card px-5 py-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-lg font-bold">{run.symbol}</div>
          <div className="text-xs text-slate-500">
            {run.strategy} · {run.startDate} → {run.endDate}
            {run.persisted === false && (
              <span className="ml-2 chip bg-amber-50 text-amber-700 border border-amber-200">
                not saved (DB offline)
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-extrabold tnum ${up ? "pos" : "neg"}`}>
            {up ? "+" : "−"}₹{fmtINR(Math.abs(pnl))}
          </div>
          <div className={`text-xs font-semibold tnum ${up ? "pos" : "neg"}`}>
            {up ? "Profit" : "Loss"} · {run.totalReturn > 0 ? "+" : ""}
            {run.totalReturn?.toFixed(2)}%
          </div>
        </div>
      </div>
      <MetricsPanel result={run} />
      <PriceChart equityCurve={run.equityCurve} trades={run.trades} />
      <EquityChart equityCurve={run.equityCurve} />
    </>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
        active
          ? "bg-white text-indigo-600 shadow-sm"
          : "text-slate-500 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function ErrorBox({ children }) {
  return (
    <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3 text-sm">
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="card p-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
        <Icon width={28} height={28} />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{text}</p>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="card h-20" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card h-24" />
        ))}
      </div>
      <div className="card h-80" />
    </div>
  );
}
