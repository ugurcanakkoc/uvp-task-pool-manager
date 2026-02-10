'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Locale } from '@/lib/i18n'
import { getTranslations } from '@/lib/i18n'

interface I18nState {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: (key: string) => string
}

export const useI18nStore = create<I18nState>()(
    persist(
        (set, get) => ({
            locale: 'tr',
            setLocale: (locale: Locale) => {
                const { t } = getTranslations(locale)
                set({ locale, t })
            },
            t: getTranslations('tr').t,
        }),
        {
            name: 'uvw-locale',
            partialize: (state) => ({ locale: state.locale }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    const { t } = getTranslations(state.locale)
                    state.t = t
                }
            },
        }
    )
)
