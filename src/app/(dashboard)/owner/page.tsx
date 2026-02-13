'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function OwnerPage() {
    const router = useRouter()

    useEffect(() => {
        router.push('/dashboard')
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
    )
}
