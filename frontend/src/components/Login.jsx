import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { TrendingUp } from "./icons";

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
      } else {
        await register(form);
      }
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Authentication failed."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-indigo-600 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(30rem 30rem at 80% 10%, rgba(255,255,255,.5), transparent 60%)",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 backdrop-blur">
            <TrendingUp width={19} height={19} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Backtestr</span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Test your trading
            <br />
            strategies with
            <br />
            confidence.
          </h1>
          <p className="mt-4 text-indigo-100 max-w-sm">
            Run RSI, MACD, Bollinger, Momentum and Moving-Average strategies on
            real market history — with metrics, charts and a saved portfolio.
          </p>
        </div>

        <div className="relative flex gap-6 text-sm text-indigo-100">
          <Stat n="5" l="Strategies" />
          <Stat n="6+" l="Metrics" />
          <Stat n="Live" l="Market data" />
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600">
              <TrendingUp width={19} height={19} className="text-white" />
            </div>
            <span className="font-bold text-lg">Backtestr</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            {mode === "login"
              ? "Sign in to access your portfolio."
              : "Start backtesting in seconds — it's free."}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="label">Name</label>
                <input
                  className="input mt-1.5"
                  placeholder="Your name (optional)"
                  value={form.name}
                  onChange={update("name")}
                />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input
                className="input mt-1.5"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={update("email")}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input mt-1.5"
                type="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={update("password")}
                required
              />
            </div>

            {error && (
              <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy
                ? "Please wait…"
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          <p className="text-sm text-slate-500 mt-6 text-center">
            {mode === "login" ? "New to Backtestr?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              className="text-indigo-600 font-semibold hover:underline"
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>

          <p className="text-center text-xs text-slate-400 mt-8">
            Educational backtesting tool — no real trades are executed.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, l }) {
  return (
    <div>
      <div className="text-2xl font-extrabold text-white">{n}</div>
      <div className="text-xs">{l}</div>
    </div>
  );
}
