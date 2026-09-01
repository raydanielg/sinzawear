export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://atlas-devon-cardiac-convicted.trycloudflare.com/api/v1"

export function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export function getUser() {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem("user")
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function clearAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers as Record<string, string>,
    },
  })

  const data = await res.json().catch(() => ({}))

  if (res.status === 401) {
    clearAuth()
    if (typeof window !== "undefined") {
      window.location.href = "/auth"
    }
    throw new Error("Session expired")
  }

  return data
}

export const api = {
  get: (path: string) => apiFetch(path),
  post: (path: string, body?: unknown) => apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path: string, body?: unknown) => apiFetch(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch(path, { method: "DELETE" }),
}

export function formatTZS(amount: number) {
  if (!amount && amount !== 0) return "TZS 0"
  return `TZS ${Number(amount).toLocaleString("en-US")}`
}

export function formatDate(date: string | Date) {
  if (!date) return ""
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatDateTime(date: string | Date) {
  if (!date) return ""
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
