import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,       // 1 min
      gcTime: 5 * 60 * 1000,      // 5 min
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const queryKeys = {
  // Auth
  me: ['me'] as const,

  // Elections
  elections: (params?: Record<string, unknown>) =>
    params ? ['elections', params] : ['elections'],
  election: (id: string) => ['election', id] as const,
  electionResults: (id: string) => ['election', id, 'results'] as const,
  electionLiveResults: (id: string) => ['election', id, 'results', 'live'] as const,

  // Candidates
  candidates: (electionId: string) => ['candidates', electionId] as const,
  candidate: (id: string) => ['candidate', id] as const,

  // Voters
  voters: (electionId: string, params?: Record<string, string>) =>
    params ? ['voters', electionId, params] : ['voters', electionId],
  myVoteStatus: (electionId: string) => ['vote-status', electionId] as const,

  // Parties
  parties: ['parties'] as const,
  party: (id: string) => ['party', id] as const,

  // Analytics
  adminAnalytics: ['analytics', 'admin'] as const,
  electionAnalytics: (id: string) => ['analytics', 'election', id] as const,
}