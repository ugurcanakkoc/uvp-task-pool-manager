'use client'

import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function WelcomeBanner({ children }: { children?: React.ReactNode }) {
    const { user } = useAuthStore()

    if (!user) return null

    return (
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-8 text-white shadow-2xl shadow-blue-500/20 md:px-12 md:py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="relative z-10 flex flex-col items-start gap-4 max-w-2xl">
                <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                        Hoş geldin, {user.full_name?.split(' ')[0]}! 👋
                    </h2>
                    <p className="text-blue-100 font-medium text-lg max-w-lg leading-relaxed">
                        Havuz yönetim panelinde işler yolunda. Bugün bekleyen destek taleplerini ve yeni talepleri inceleyebilirsin.
                    </p>
                </div>
                {!children && (
                    <Button
                        className="bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-xl h-12 px-6 shadow-xl shadow-blue-900/10 transition-all hover:scale-105 active:scale-95"
                    >
                        Raporlara Git <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>

            {children && (
                <div className="relative z-10 flex-shrink-0">
                    {children}
                </div>
            )}

            {/* Decorative Circles */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-20 -mb-20 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl pointer-events-none" />

            {/* 3D Illustration Placeholder/Mockup */}
            <div className="absolute right-4 bottom-0 hidden lg:block pointer-events-none">
                {/* 
                    Using a text/emoji placeholder for now as per instructions to use generate_image if needed, 
                    but for a component code I should provide a structure or a public image if available. 
                    I'll use a CSS-only representation or just the layout.
                 */}
                <div className="relative w-64 h-56">
                    {/* Abstract shapes representing a 3D character */}
                </div>
            </div>
        </div>
    )
}
