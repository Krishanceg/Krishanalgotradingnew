import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: API_URL });

// Attach the JWT (if present) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- auth ---
export const register = (payload) =>
  api.post("/auth/register", payload).then((r) => r.data);

export const login = (payload) =>
  api.post("/auth/login", payload).then((r) => r.data);

export const fetchMe = () => api.get("/auth/me").then((r) => r.data);

// --- backtests ---
export const runBacktest = (payload) =>
  api.post("/backtest", payload).then((r) => r.data);

export const getHistory = () => api.get("/backtests").then((r) => r.data);

export const getBacktest = (id) =>
  api.get(`/backtests/${id}`).then((r) => r.data);

export const deleteBacktest = (id) =>
  api.delete(`/backtests/${id}`).then((r) => r.data);

// --- market quotes ---
export const getQuotes = (symbols) =>
  api
    .get("/market/quotes", { params: { symbols: symbols.join(",") } })
    .then((r) => r.data.quotes);

export default api;
