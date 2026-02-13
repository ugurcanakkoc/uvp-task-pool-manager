import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Tables } from '@/types/supabase'
import posthog from 'posthog-js'

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
            setUser: (user) => {
                set({ user, isLoading: false })
                if (user) {
                    posthog.identify(user.id, {
                        email: user.email,
                        full_name: user.full_name,
                        role: user.role
                    })
                }
            },
            setLoading: (isLoading) => set({ isLoading }),
            logout: () => {
                set({ user: null, isLoading: false })
                posthog.reset()
            },
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
