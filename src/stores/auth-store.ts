import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Tables } from '@/types/supabase'

type UserProfile = Tables<'users'>

interface AuthState {
    user: UserProfile | null
    isLoading: boolean
    _hasHydrated: boolean
    setUser: (user: UserProfile | null) => void
    setLoading: (isLoading: boolean) => void
    logout: () => void
    setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isLoading: true,
            _hasHydrated: false,
            setUser: (user) => set({ user, isLoading: false }),
            setLoading: (isLoading) => set({ isLoading }),
            logout: () => set({ user: null, isLoading: false }),
            setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),
        }),
        {
            name: 'uvw-auth-storage',
            partialize: (state) => ({ user: state.user }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true)
            },
        }
    )
)
