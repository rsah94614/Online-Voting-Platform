'use client'

import { create } from 'zustand'
import type { ElectionConfig, ElectionStatus } from '@/types'

interface ElectionFilters {
  status: ElectionStatus | 'all'
  type: string
  search: string
  page: number
  pageSize: number
}

interface ElectionCreationDraft {
  step: number
  data: Partial<ElectionConfig>
}

interface ElectionStore {
  // List state
  filters: ElectionFilters
  selectedElectionId: string | null

  // Creation draft (persisted locally)
  draft: ElectionCreationDraft

  // Live polling state
  liveElectionId: string | null
  isPollingActive: boolean
  pollInterval: number // ms

  // Actions
  setFilters: (partial: Partial<ElectionFilters>) => void
  resetFilters: () => void
  selectElection: (id: string | null) => void

  // Draft actions
  setDraftStep: (step: number) => void
  updateDraft: (partial: Partial<ElectionConfig>) => void
  resetDraft: () => void

  // Polling
  startPolling: (electionId: string) => void
  stopPolling: () => void
  setPollInterval: (ms: number) => void
}

const defaultFilters: ElectionFilters = {
  status: 'all',
  type: 'all',
  search: '',
  page: 1,
  pageSize: 10,
}

const defaultDraft: ElectionCreationDraft = {
  step: 0,
  data: {},
}

export const useElectionStore = create<ElectionStore>((set, get) => ({
  filters: defaultFilters,
  selectedElectionId: null,
  draft: defaultDraft,
  liveElectionId: null,
  isPollingActive: false,
  pollInterval: 5000,

  setFilters: (partial) =>
    set((state) => ({ filters: { ...state.filters, ...partial, page: 1 } })),

  resetFilters: () => set({ filters: defaultFilters }),

  selectElection: (id) => set({ selectedElectionId: id }),

  setDraftStep: (step) =>
    set((state) => ({ draft: { ...state.draft, step } })),

  updateDraft: (partial) =>
    set((state) => ({
      draft: { ...state.draft, data: { ...state.draft.data, ...partial } },
    })),

  resetDraft: () => set({ draft: defaultDraft }),

  startPolling: (electionId) =>
    set({ liveElectionId: electionId, isPollingActive: true }),

  stopPolling: () =>
    set({ liveElectionId: null, isPollingActive: false }),

  setPollInterval: (ms) => set({ pollInterval: ms }),
}))