'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, UserRole } from '@/types'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  setUser: (user: User, token: string) => void
  updateUser: (partial: Partial<User>) => void
  logout: () => void
  setLoading: (v: boolean) => void

  // Helpers
  hasRole: (role: UserRole | UserRole[]) => boolean
  isAdmin: () => boolean
  isCandidate: () => boolean
  isPartyAdmin: () => boolean
  isVoter: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user, token) =>
        set({ user, token, isAuthenticated: true, isLoading: false }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      logout: () =>
        set({ user: null, token: null, isAuthenticated: false }),

      setLoading: (v) => set({ isLoading: v }),

      hasRole: (role) => {
        const { user } = get()
        if (!user) return false
        if (Array.isArray(role)) return role.includes(user.role)
        return user.role === role
      },
      isAdmin: () => get().user?.role === 'admin',
      isCandidate: () => get().user?.role === 'candidate',
      isPartyAdmin: () => get().user?.role === 'party_admin',
      isVoter: () => get().user?.role === 'voter',
    }),
    {
      name: 'votex-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)