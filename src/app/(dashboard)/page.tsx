'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
    const { user, isLoading } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/login')
            } else {
                const role = user.role
                if (role === 'gm') router.push('/gm')
                else if (role === 'owner') router.push('/owner')
                else router.push('/worker')
            }
        }
    }, [user, isLoading, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-slate-950">
            <div className="flex flex-col items-center gap-4 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-sm font-medium text-slate-500">Yönlendiriliyorsunuz...</p>
            </div>
        </div>
    )
}
