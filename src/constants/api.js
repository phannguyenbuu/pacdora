const rawBase = import.meta.env.VITE_API_BASE || "https://n-lux.com/pac-api";
export const API_BASE = rawBase.replace(/\/+$/, "");

export const apiUrl = (path = "") => {
  const cleanPath = String(path).replace(/^\/+/, "");
  if (!cleanPath) return API_BASE;
  return `${API_BASE}/${cleanPath}`;
};
