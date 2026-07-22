import { createClient } from "@/app/utils/supabase/client";

const _raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = _raw.replace(/^http:\/\//, "https://");

let _onError = null;

export function setGlobalErrorHandler(fn) {
  _onError = fn;
}

export async function getToken() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

async function apiFetch(path, options = {}) {
  const token = await getToken();
  const url = `${API_BASE}${path}`;

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    const supabase = createClient();
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      window.location.href = "/login?expired=1";
    }
    throw new Error("Session expirée");
  }

  if (!res.ok && _onError) {
    const text = await res.text().catch(() => "");
    let detail;
    try {
      detail = JSON.parse(text).detail;
    } catch {
      detail = text || `Erreur ${res.status}`;
    }
    _onError(detail, "error");
  }

  return res;
}

export async function apiGet(path) {
  const res = await apiFetch(path);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await apiFetch(path, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiDelete(path) {
  const res = await apiFetch(path, { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
  return res.json();
}
