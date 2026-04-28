import { createClient } from "@/lib/supabase/client";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token: string | null = null;
  if (typeof window !== "undefined") {
    const supabase = createClient();
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token ?? null;
    }
  }

  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    // Prefer the human-readable message; fall back to the code, then status.
    // Suffix with HTTP status so the toast shows e.g. "All models failed... (HTTP 502)".
    const detail = err.message || err.error || "Request failed";
    throw new Error(`${detail} (HTTP ${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get:    <T>(path: string)                         => request<T>(path),
  post:   <T>(path: string, body: unknown)          => request<T>(path, { method: "POST",   body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)          => request<T>(path, { method: "PATCH",  body: JSON.stringify(body) }),
  delete: <T>(path: string)                         => request<T>(path, { method: "DELETE" }),

  events: {
    list:      (params?: Record<string, string>)    => api.get(`/events${params ? "?" + new URLSearchParams(params) : ""}`),
    get:       (id: string)                         => api.get(`/events/${id}`),
    create:    (body: unknown)                      => api.post("/events", body),
    update:    (id: string, body: unknown)          => api.patch(`/events/${id}`, body),
    delete:    (id: string)                         => api.delete(`/events/${id}`),
    addVendor: (id: string, body: unknown)          => api.post(`/events/${id}/vendors`, body),
  },

  vendors: {
    list:   (params?: Record<string, string>)       => api.get(`/vendors${params ? "?" + new URLSearchParams(params) : ""}`),
    get:    (id: string)                            => api.get(`/vendors/${id}`),
    create: (body: unknown)                         => api.post("/vendors", body),
    update: (id: string, body: unknown)             => api.patch(`/vendors/${id}`, body),
    delete: (id: string)                            => api.delete(`/vendors/${id}`),
  },

  compliance: {
    list:   ()                                      => api.get("/compliance"),
    create: (body: unknown)                         => api.post("/compliance", body),
    update: (id: string, body: unknown)             => api.patch(`/compliance/${id}`, body),
    audit:  ()                                      => api.get("/compliance/audit-trail"),
  },

  ai: {
    eventPlan:         (body: unknown)              => api.post("/ai/event-plan", body),
    vendorSuggestions: (body: unknown)              => api.post("/ai/vendor-suggestions", body),
    complianceRisk:    (body: unknown)              => api.post("/ai/compliance-risk", body),
  },

  proposals: {
    list:              ()                           => api.get("/proposals"),
    get:               (id: string)                 => api.get(`/proposals/${id}`),
    getBatch:          (batchId: string)            => api.get(`/proposals/batch/${batchId}`),
    generateIdeas:     (body: unknown)              => api.post("/proposals/generate-ideas", body),
    generateExperience:(body: unknown)              => api.post("/proposals/generate-experience", body),
    generate:          (body: unknown)              => api.post("/proposals/generate", body),
    generateImage:     (body: unknown)              => api.post("/proposals/generate-image", body),
    regenerate:        (id: string, body: unknown)  => api.post(`/proposals/${id}/regenerate`, body),
    switchVersion:     (id: string, body: unknown)  => api.post(`/proposals/${id}/switch-version`, body),
    update:            (id: string, b: unknown)     => api.patch(`/proposals/${id}`, b),
    saveTemplate:      (id: string, name: string)   => api.post(`/proposals/${id}/save-template`, { name }),
    duplicate:         (id: string)                 => api.post(`/proposals/${id}/duplicate`, {}),
    delete:            (id: string)                 => api.delete(`/proposals/${id}`),
    pitchDeck: {
      get:      (id: string)                        => api.get(`/proposals/${id}/pitch-deck`),
      generate: (id: string, body: unknown)         => api.post(`/proposals/${id}/pitch-deck`, body),
      save:     (id: string, body: unknown)         => api.post(`/proposals/${id}/pitch-deck`, body),
    },
  },

  billing: {
    status:    ()                                   => api.get("/billing/status"),
    subscribe: (plan: "PRO" | "ENTERPRISE")         => api.post("/billing/subscribe", { plan }),
    cancel:    ()                                   => api.post("/billing/cancel", {}),
  },
};
