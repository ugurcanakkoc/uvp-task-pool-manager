'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { Tables } from '@/types/supabase'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export function useAuth() {
    const { user, setUser, setLoading, logout } = useAuthStore()
    const supabase = createClient()
    const initialized = useRef(false)

    const fetchUserProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()

            if (!error && data) {
                console.log('User profile fetched successfully:', data.email)
                setUser(data as Tables<'users'>)
            } else {
                console.error('Error fetching user profile:', error)
                logout()
            }
        } catch (err) {
            console.error('Unexpected error in fetchUserProfile:', err)
            logout()
        }
    }, [supabase, setUser, logout])

    useEffect(() => {
        if (initialized.current) return
        initialized.current = true

        let subscription: { unsubscribe: () => void } | null = null

        const init = async () => {
            try {
                // Önce mevcut oturumu kontrol et
                const { data: { session } } = await supabase.auth.getSession()

                if (session?.user) {
                    await fetchUserProfile(session.user.id)
                } else {
                    logout()
                }
            } catch (err: any) {
                // AbortError'ları yok say — Supabase navigator.locks'tan geliyor
                if (err?.name !== 'AbortError') {
                    console.error('Auth init error:', err)
                }
                logout()
            }

            // Auth değişikliklerini dinle
            try {
                const { data } = supabase.auth.onAuthStateChange(
                    async (event: AuthChangeEvent, session: Session | null) => {
                        if (event === 'SIGNED_IN' && session?.user) {
                            await fetchUserProfile(session.user.id)
                        } else if (event === 'SIGNED_OUT') {
                            logout()
                        }
                    }
                )
                subscription = data.subscription
            } catch (err: any) {
                if (err?.name !== 'AbortError') {
                    console.error('Auth subscription error:', err)
                }
            }
        }

        init()

        return () => {
            initialized.current = false
            subscription?.unsubscribe()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return { user, supabase }
}
