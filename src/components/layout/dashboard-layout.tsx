'use client'

import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { Toaster } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useAuthStore } from "@/stores/auth-store"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const { isLoading, _hasHydrated } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        if (_hasHydrated && !isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, _hasHydrated, router])

    if (!user || isLoading || !_hasHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    <p className="text-sm font-medium text-slate-500">Oturum doğrulanıyor...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-slate-200/60 bg-white/70 backdrop-blur-xl md:block dark:border-slate-800/60 dark:bg-slate-900/70">
                <Sidebar />
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col md:pl-72 min-w-0 w-full overflow-hidden">
                <Header />
                <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden min-w-0">
                    {children}
                </main>
            </div>

            <Toaster richColors position="top-right" />
        </div>
    )
}
