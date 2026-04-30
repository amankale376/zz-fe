const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export type ApiError = { error: string };

function getToken() {
  return localStorage.getItem("zz_token");
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  const token = getToken();
  if (token) headers.set("authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const err = (data ?? { error: `http_${res.status}` }) as ApiError;
    throw new Error(err.error || `http_${res.status}`);
  }
  return data as T;
}

export function setAuthToken(token: string | null) {
  if (!token) localStorage.removeItem("zz_token");
  else localStorage.setItem("zz_token", token);
}

export function getAuthToken() {
  return getToken();
}

