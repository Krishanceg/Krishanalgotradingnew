import {
  TrendingUp,
  WalletIcon,
  ActivityIcon,
  TargetIcon,
  ShieldIcon,
  PercentIcon,
} from "./icons";

const fmtCurrency = (n) =>
  n?.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

const fmtPct = (n) => `${n > 0 ? "+" : ""}${n?.toFixed(2)}%`;

export default function MetricsPanel({ result }) {
  if (!result) return null;

  const cards = [
    {
      label: "Total return",
      value: fmtPct(result.totalReturn),
      tone: result.totalReturn >= 0 ? "pos" : "neg",
      icon: TrendingUp,
    },
    { label: "Final value", value: fmtCurrency(result.finalValue), icon: WalletIcon },
    {
      label: "Initial capital",
      value: fmtCurrency(result.initialCapital),
      icon: WalletIcon,
    },
    { label: "Trades", value: result.numberOfTrades, icon: ActivityIcon },
    { label: "Win rate", value: `${result.winRate?.toFixed(1)}%`, icon: TargetIcon },
    {
      label: "Max drawdown",
      value: fmtPct(result.maxDrawdown),
      tone: "neg",
      icon: ShieldIcon,
    },
    {
      label: "Sharpe ratio",
      value: result.sharpeRatio?.toFixed(2),
      tone: result.sharpeRatio >= 1 ? "pos" : undefined,
      icon: PercentIcon,
    },
    { label: "Strategy", value: result.strategy, icon: ActivityIcon },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="card card-hover p-4">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Icon width={14} height={14} />
              <span className="text-[11px] uppercase tracking-wide font-medium">
                {c.label}
              </span>
            </div>
            <div
              className={`text-lg font-bold mt-2 truncate tnum ${
                c.tone === "pos" ? "pos" : c.tone === "neg" ? "neg" : ""
              }`}
              title={String(c.value)}
            >
              {c.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
