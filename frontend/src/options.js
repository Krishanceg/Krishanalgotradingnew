// Options & Futures payoff math (expiry payoff — no time value / Greeks).
// All amounts are per-unit; multiply by quantity = lots * lotSize.

export const roundTo = (x, step = 5) => Math.round(x / step) * step;
const round2 = (x) => Math.round(x * 100) / 100;

/** Payoff of a single leg (per unit) at underlying price S at expiry. */
export function legPayoff(leg, S) {
  const sign = leg.action === "BUY" ? 1 : -1;
  if (leg.type === "FUTURE") {
    // 'strike' field is used as the entry price; premium ignored.
    return sign * (S - leg.strike);
  }
  const intrinsic =
    leg.type === "CALL"
      ? Math.max(S - leg.strike, 0)
      : Math.max(leg.strike - S, 0);
  // BUY: intrinsic - premium ; SELL: premium - intrinsic
  return sign * (intrinsic - leg.premium);
}

const qtyOf = (leg, lotSize) =>
  (Number(leg.lots) || 1) * (Number(lotSize) || 1);

/** Total strategy payoff (incl. quantity) at price S. */
export function totalPayoff(legs, lotSize, S) {
  return legs.reduce(
    (sum, leg) => sum + legPayoff(leg, S) * qtyOf(leg, lotSize),
    0
  );
}

/** Net premium cashflow now: negative = net debit paid, positive = net credit. */
export function netPremium(legs, lotSize) {
  return legs.reduce((sum, leg) => {
    if (leg.type === "FUTURE") return sum;
    const sign = leg.action === "BUY" ? -1 : 1;
    return sum + sign * (Number(leg.premium) || 0) * qtyOf(leg, lotSize);
  }, 0);
}

/** Data points for the payoff diagram. */
export function payoffCurve(legs, lotSize, spot, points = 140) {
  const strikes = legs.map((l) => Number(l.strike)).filter((x) => x > 0);
  const center =
    spot ||
    (strikes.length ? strikes.reduce((a, b) => a + b, 0) / strikes.length : 100);

  let lo = Math.min(center, ...(strikes.length ? strikes : [center])) * 0.82;
  let hi = Math.max(center, ...(strikes.length ? strikes : [center])) * 1.18;
  if (!isFinite(lo) || lo <= 0) lo = center * 0.7;
  if (!isFinite(hi) || hi <= lo) hi = center * 1.3;

  const data = [];
  for (let i = 0; i <= points; i++) {
    const S = lo + ((hi - lo) * i) / points;
    data.push({ price: round2(S), payoff: round2(totalPayoff(legs, lotSize, S)) });
  }
  return data;
}

/** Max profit, max loss (with unbounded detection), and breakeven prices. */
export function analyze(legs, lotSize, spot) {
  if (!legs.length) {
    return { maxProfit: 0, maxLoss: 0, breakevens: [], netPremium: 0 };
  }
  const strikes = legs.map((l) => Number(l.strike)).filter((x) => x > 0);
  const center =
    spot ||
    (strikes.length ? strikes.reduce((a, b) => a + b, 0) / strikes.length : 100);

  // Slope of total payoff as S -> +infinity (only calls/futures contribute).
  const slopeHigh = legs.reduce((s, l) => {
    const dir = l.type === "PUT" ? 0 : 1; // CALL & FUTURE -> 1
    const sign = l.action === "BUY" ? 1 : -1;
    return s + sign * dir * qtyOf(l, lotSize);
  }, 0);

  // Piecewise-linear extremes occur at S=0 or at a strike.
  const candidates = [0, ...strikes].sort((a, b) => a - b);
  const vals = candidates.map((S) => totalPayoff(legs, lotSize, S));

  const maxProfit = slopeHigh > 1e-9 ? Infinity : Math.max(...vals);
  const maxLoss = slopeHigh < -1e-9 ? -Infinity : Math.min(...vals);

  // Breakevens: scan a wide range and interpolate zero crossings.
  const lo = 0;
  const hi = center * 3;
  const N = 1200;
  const bes = [];
  let prevS = lo;
  let prev = totalPayoff(legs, lotSize, lo);
  for (let i = 1; i <= N; i++) {
    const S = lo + ((hi - lo) * i) / N;
    const v = totalPayoff(legs, lotSize, S);
    if ((prev < 0 && v >= 0) || (prev > 0 && v <= 0)) {
      const t = prev / (prev - v);
      bes.push(round2(prevS + (S - prevS) * t));
    }
    prevS = S;
    prev = v;
  }

  return {
    maxProfit,
    maxLoss,
    breakevens: bes,
    netPremium: netPremium(legs, lotSize),
  };
}

let legId = 0;
const mkLeg = (type, action, strike, premium, lots = 1) => ({
  id: ++legId,
  type,
  action,
  strike: roundTo(strike),
  premium: Math.round(premium),
  lots,
});

export const STRATEGY_PRESETS = [
  "Long Call",
  "Long Put",
  "Bull Call Spread",
  "Bear Put Spread",
  "Long Straddle",
  "Long Strangle",
  "Iron Condor",
  "Covered Call",
];

/** Build template legs for a named strategy around a given spot price. */
export function presetLegs(name, spot) {
  const s = spot || 100;
  const atm = s;
  const otmCall = s * 1.05;
  const otmPut = s * 0.95;
  const farCall = s * 1.1;
  const farPut = s * 0.9;
  const pAtm = s * 0.03; // rough ATM premium estimate
  const pOtm = s * 0.015;
  const pFar = s * 0.008;

  switch (name) {
    case "Long Call":
      return [mkLeg("CALL", "BUY", atm, pAtm)];
    case "Long Put":
      return [mkLeg("PUT", "BUY", atm, pAtm)];
    case "Bull Call Spread":
      return [
        mkLeg("CALL", "BUY", atm, pAtm),
        mkLeg("CALL", "SELL", otmCall, pOtm),
      ];
    case "Bear Put Spread":
      return [
        mkLeg("PUT", "BUY", atm, pAtm),
        mkLeg("PUT", "SELL", otmPut, pOtm),
      ];
    case "Long Straddle":
      return [
        mkLeg("CALL", "BUY", atm, pAtm),
        mkLeg("PUT", "BUY", atm, pAtm),
      ];
    case "Long Strangle":
      return [
        mkLeg("CALL", "BUY", otmCall, pOtm),
        mkLeg("PUT", "BUY", otmPut, pOtm),
      ];
    case "Iron Condor":
      return [
        mkLeg("PUT", "BUY", farPut, pFar),
        mkLeg("PUT", "SELL", otmPut, pOtm),
        mkLeg("CALL", "SELL", otmCall, pOtm),
        mkLeg("CALL", "BUY", farCall, pFar),
      ];
    case "Covered Call":
      return [
        mkLeg("FUTURE", "BUY", atm, 0),
        mkLeg("CALL", "SELL", otmCall, pOtm),
      ];
    default:
      return [mkLeg("CALL", "BUY", atm, pAtm)];
  }
}

export const newLeg = (spot) => mkLeg("CALL", "BUY", spot || 100, (spot || 100) * 0.02);
