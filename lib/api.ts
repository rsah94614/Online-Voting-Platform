import type {
  ElectionConfig,
  CandidateProfile,
  Party,
  ElectionResult,
  AdminAnalytics,
  PaginatedResponse,
  ApiResponse,
  User,
} from '@/types'

const BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('votex-auth') || '{}')?.state?.token
    : null

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(err.message || 'Request failed')
  }

  return res.json()
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: Record<string, unknown>) =>
    request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: () => request<User>('/auth/me'),

  verifyOtp: (email: string, otp: string) =>
    request<{ verified: boolean }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),
}

// ─── Elections ────────────────────────────────────────────────────────────────

export const electionApi = {
  list: (params: Record<string, string | number>) => {
    const q = new URLSearchParams(params as Record<string, string>).toString()
    return request<PaginatedResponse<ElectionConfig>>(`/elections?${q}`)
  },

  get: (id: string) =>
    request<ElectionConfig>(`/elections/${id}`),

  create: (data: Partial<ElectionConfig>) =>
    request<ElectionConfig>('/elections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<ElectionConfig>) =>
    request<ElectionConfig>(`/elections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/elections/${id}`, { method: 'DELETE' }),

  launch: (id: string) =>
    request<ElectionConfig>(`/elections/${id}/launch`, { method: 'POST' }),

  pause: (id: string) =>
    request<ElectionConfig>(`/elections/${id}/pause`, { method: 'POST' }),

  close: (id: string) =>
    request<ElectionConfig>(`/elections/${id}/close`, { method: 'POST' }),

  results: (id: string) =>
    request<ElectionResult>(`/elections/${id}/results`),

  liveResults: (id: string) =>
    request<ElectionResult>(`/elections/${id}/results/live`),
}

// ─── Candidates ───────────────────────────────────────────────────────────────

export const candidateApi = {
  list: (electionId: string) =>
    request<CandidateProfile[]>(`/elections/${electionId}/candidates`),

  get: (candidateId: string) =>
    request<CandidateProfile>(`/candidates/${candidateId}`),

  register: (data: Partial<CandidateProfile>) =>
    request<CandidateProfile>('/candidates/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CandidateProfile>) =>
    request<CandidateProfile>(`/candidates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  approve: (id: string) =>
    request<CandidateProfile>(`/candidates/${id}/approve`, { method: 'POST' }),

  reject: (id: string, reason: string) =>
    request<CandidateProfile>(`/candidates/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
}

// ─── Voters ───────────────────────────────────────────────────────────────────

export const voterApi = {
  list: (electionId: string, params?: Record<string, string>) => {
    const q = new URLSearchParams(params).toString()
    return request<PaginatedResponse<User>>(`/elections/${electionId}/voters?${q}`)
  },

  castVote: (electionId: string, candidateId: string) =>
    request<{ receipt: string }>('/votes/cast', {
      method: 'POST',
      body: JSON.stringify({ electionId, candidateId }),
    }),

  verifyVote: (receipt: string) =>
    request<{ valid: boolean; timestamp: string }>(`/votes/verify/${receipt}`),

  myVoteStatus: (electionId: string) =>
    request<{ hasVoted: boolean; timestamp?: string }>(`/votes/status/${electionId}`),
}

// ─── Parties ──────────────────────────────────────────────────────────────────

export const partyApi = {
  list: () => request<Party[]>('/parties'),

  get: (id: string) => request<Party>(`/parties/${id}`),

  update: (id: string, data: Partial<Party>) =>
    request<Party>(`/parties/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export const analyticsApi = {
  admin: () => request<AdminAnalytics>('/analytics/admin'),
  election: (id: string) => request<Record<string, unknown>>(`/analytics/elections/${id}`),
}