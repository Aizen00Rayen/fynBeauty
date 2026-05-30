import axios from "axios";

// Empty / unset means "same origin" — used when the Node server also serves
// the built frontend (single-app deployment on Hostinger).
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fyn_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

export function mediaUrl(path) {
  if (!path) return PLACEHOLDER_IMG;
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}${path}`;
}

export function apiError(detail) {
  if (detail == null) return "Une erreur est survenue. Réessayez.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}
