"""Live(ish) quote lookups via Yahoo Finance.

Note: Yahoo data for Indian symbols (.NS / .BO) is typically delayed ~15 min;
this is fine for a learning dashboard but is NOT real-time market data.
"""
import yfinance as yf


def _safe_float(fast_info, *names):
    """Read the first available attribute from a yfinance FastInfo object."""
    for name in names:
        try:
            value = getattr(fast_info, name)
        except Exception:
            value = None
        if value is not None:
            try:
                return float(value)
            except (TypeError, ValueError):
                continue
    return None


def _round(value, ndigits=2):
    return round(value, ndigits) if value is not None else None


def get_quote(symbol: str) -> dict:
    """Return a normalized quote dict for a single symbol."""
    ticker = yf.Ticker(symbol)
    fi = ticker.fast_info

    last = _safe_float(fi, "last_price")
    prev = _safe_float(fi, "previous_close")

    # Fallback to recent daily history if fast_info is unavailable.
    if last is None or prev is None:
        hist = ticker.history(period="5d")
        if hist.empty:
            raise ValueError(f"No quote data for '{symbol}'.")
        last = float(hist["Close"].iloc[-1])
        prev = float(hist["Close"].iloc[-2]) if len(hist) > 1 else last

    change = last - prev
    pct = (change / prev * 100) if prev else 0.0

    currency = None
    try:
        currency = getattr(fi, "currency", None)
    except Exception:
        currency = None

    return {
        "symbol": symbol.upper(),
        "price": _round(last),
        "previousClose": _round(prev),
        "change": _round(change),
        "changePercent": _round(pct),
        "open": _round(_safe_float(fi, "open")),
        "dayHigh": _round(_safe_float(fi, "day_high")),
        "dayLow": _round(_safe_float(fi, "day_low")),
        "volume": _safe_float(fi, "last_volume"),
        "currency": currency,
    }


def get_quotes(symbols: list[str]) -> list[dict]:
    """Return quotes for many symbols; failures are reported per-symbol."""
    out = []
    for sym in symbols:
        sym = sym.strip()
        if not sym:
            continue
        try:
            out.append(get_quote(sym))
        except Exception as exc:  # noqa: BLE001 - report, don't fail the batch
            out.append({"symbol": sym.upper(), "error": str(exc)})
    return out
