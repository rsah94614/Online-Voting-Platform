// lib/api.ts  ←  Replace the existing mock version with this
// All functions now call real Next.js API routes.

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "VOTER" | "CANDIDATE" | "PARTY_ADMIN";
  isApproved: boolean;
  isVerified: boolean;
  avatarUrl: string | null;
  isPro?: boolean;
}

export interface Election {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: "DRAFT" | "UPCOMING" | "LIVE" | "ENDED" | "CANCELLED";
  startDate: string;
  endDate: string;
  totalVoters: number;
  candidates: ElectionCandidate[];
  _count: { votes: number };
}

export interface ElectionCandidate {
  id: string;
  candidateId: string;
  candidate: {
    user: { name: string; avatarUrl: string | null; email: string };
    party: { name: string; abbreviation: string; color: string } | null;
    bio: string | null;
  };
  _count: { votes: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
  return data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (body: { name: string; email: string; password: string; role?: string; phone?: string }) =>
    request<{ user: AuthUser; requiresApproval: boolean }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (email: string, password: string) =>
    request<{ user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

  me: () =>
    request<{ user: AuthUser & { candidate?: { id: string; isApproved: boolean; partyId: string | null } } }>("/api/auth/me"),
};

// ─── Elections ────────────────────────────────────────────────────────────────

export const electionApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return request<{ elections: Election[]; total: number; pages: number }>(`/api/elections${qs ? `?${qs}` : ''}`)
  },

  get: (id: string) =>
    request<{ election: Election }>(`/api/elections/${id}`),

  create: (body: {
    title: string;
    description?: string;
    type: string;
    startDate: string;
    endDate: string;
    candidateIds?: string[];
  }) =>
    request<{ election: Election }>("/api/elections", { method: "POST", body: JSON.stringify(body) }),

  update: (id: string, body: Partial<Election & { candidateIds?: string[] }>) =>
    request<{ election: Election }>(`/api/elections/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  delete: (id: string) =>
    request<{ ok: boolean }>(`/api/elections/${id}`, { method: "DELETE" }),

  results: (id: string) =>
    request<{
      election: Partial<Election>;
      results: { name: string; votes: number; percentage: number; party: object | null }[];
      totalVotes: number;
      turnout: number | null;
      winner: object | null;
    }>(`/api/elections/${id}/results`),
};

// ─── Votes ────────────────────────────────────────────────────────────────────

export const voteApi = {
  cast: (electionId: string, electionCandidateId: string) =>
    request<{ ok: boolean; receiptHash: string; message: string }>("/api/votes", {
      method: "POST",
      body: JSON.stringify({ electionId, electionCandidateId }),
    }),

  checkStatus: (electionId: string) =>
    request<{ voted: boolean; vote: { castAt: string; receiptHash: string } | null }>(
      `/api/votes?electionId=${electionId}`
    ),
};

// ─── Candidates ───────────────────────────────────────────────────────────────

export const candidateApi = {
  list: (params?: { approved?: boolean; page?: number }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params ?? {}).map(([k, v]) => [k, String(v)])
      )
    ).toString();
    return request<{ candidates: object[]; total: number }>(`/api/candidates${qs ? `?${qs}` : ""}`);
  },

  approve: (id: string, approved: boolean, reason?: string) =>
    request<{ candidate: object }>(`/api/candidates/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ approved, reason }),
    }),
};

// ─── Users (Admin) ────────────────────────────────────────────────────────────

export const userApi = {
  list: (params?: { role?: string; q?: string; page?: number }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
      )
    ).toString();
    return request<{ users: object[]; total: number; pages: number }>(`/api/users${qs ? `?${qs}` : ""}`);
  },

  update: (id: string, updates: { isApproved?: boolean; isSuspended?: boolean; isVerified?: boolean }) =>
    request<{ user: object }>("/api/users", { method: "PATCH", body: JSON.stringify({ id, ...updates }) }),
};

// ─── Audit ────────────────────────────────────────────────────────────────────

export const auditApi = {
  list: (params?: { action?: string; userId?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
      )
    ).toString();
    return request<{ logs: object[]; total: number; pages: number }>(`/api/audit${qs ? `?${qs}` : ""}`);
  },
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export const analyticsApi = {
  admin: () =>
    request<{
      data: {
        totalElections: number;
        liveElections: number;
        totalVoters: number;
        totalVotesCast: number;
        totalCandidates: number;
        pendingCandidates: number;
        averageTurnout: number;
        systemUptime: string;
        electionsByStatus: Record<string, number>;
        recentActivity: any[];
        electionsByMonth: any[];
      };
    }>("/api/analytics/admin"),
};