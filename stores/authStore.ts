// stores/authStore.ts  ←  Replace existing version
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi, AuthUser } from "@/lib/api";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
  }) => Promise<{ requiresApproval: boolean }>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearError: () => void;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user } = await authApi.login(email, password);
          set({ user, isLoading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "Login failed",
            isLoading: false,
          });
          throw err;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authApi.register(data);
          set({ user: result.user, isLoading: false });
          return { requiresApproval: result.requiresApproval };
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "Registration failed",
            isLoading: false,
          });
          throw err;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch {}
        set({ user: null, isLoading: false, error: null });
        // Clear persisted state
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      },

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const { user } = await authApi.me();
          set({ user: user as AuthUser, isLoading: false });
        } catch {
          set({ user: null, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user) => set({ user }),
    }),
    {
      name: "votex-auth",
      // Only persist user — don't persist loading/error states
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// Convenience selectors
export const selectUser = (s: AuthState) => s.user;
export const selectIsAdmin = (s: AuthState) => s.user?.role === "ADMIN";
export const selectIsVoter = (s: AuthState) => s.user?.role === "VOTER";
export const selectIsCandidate = (s: AuthState) => s.user?.role === "CANDIDATE";
export const selectIsPartyAdmin = (s: AuthState) => s.user?.role === "PARTY_ADMIN";