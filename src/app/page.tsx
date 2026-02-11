
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()

  useEffect(() => {
    if (_hasHydrated) {
      if (user) {
        const role = user.role
        if (role === 'gm') router.replace('/gm')
        else if (role === 'owner') router.replace('/owner')
        else router.replace('/worker')
      } else {
        router.replace('/login')
      }
    }
  }, [user, _hasHydrated, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Yönlendiriliyorsunuz...</p>
      </div>
    </div>
  )
}
