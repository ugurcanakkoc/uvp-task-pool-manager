'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TaskPool } from '@/components/tasks/task-pool'
import { useI18nStore } from '@/stores/i18n-store'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { Zap, Trophy, Target } from 'lucide-react'

export default function WorkerPage() {
    const { t } = useI18nStore()
    const { user } = useAuthStore()
    const [stats, setStats] = useState({
        points: 0,
        completedTasks: 0
    })
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return

            try {
                // 1. Tamamlanan Görevler
                const { count: completedCount } = await supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .eq('assigned_worker_id', user.id)
                    .eq('status', 'completed')

                // 2. Puanlar (Henüz puan tablosu aktif değil, geçici olarak 0 veya mock)
                // İleride: select sum(points) from points_log where user_id = user.id

                setStats({
                    points: 0, // Step 10'da eklenecek
                    completedTasks: completedCount || 0
                })
            } catch (error) {
                console.error('Error fetching worker stats:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchStats()
    }, [user])

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* 
                    HERO SECTION
                    Sayfanın üst kısmındaki büyük banner alanı.
                    Worker (Çalışan) için özel yeşil/turkuaz gradient arka plan.
                */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 p-8 md:p-10 text-white shadow-2xl shadow-emerald-900/20">
                    {/* 
                        DECORATIVE ELEMENTS
                        Arka plandaki modern ve dinamik şekiller.
                        Sayfaya derinlik katmak için kullanılır.
                    */}
                    <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-10 w-40 h-40 bg-gradient-to-tr from-emerald-400/20 to-transparent rounded-full blur-3xl" />

                    <div className="relative z-10">
                        {/* ROLE BADGE: Worker rolünü gösteren etiket */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 shadow-inner">
                                <Zap className="h-3.5 w-3.5 text-emerald-200" /> {/* Ikon: Yıldırım (Zap) - Hızı ve enerjiyi temsil eder */}
                                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-100">
                                    {t('worker.badge')}
                                </span>
                            </div>
                        </div>
                        {/* PAGE TITLE */}
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 bg-gradient-to-r from-white via-emerald-100 to-cyan-100 bg-clip-text text-transparent">
                            {t('worker.title')}
                        </h1>
                        {/* DESCRIPTION */}
                        <p className="text-emerald-100/80 max-w-2xl text-sm md:text-base leading-relaxed font-medium">
                            {t('worker.description')}
                        </p>
                    </div>
                </div>

                {/* 
                    QUICK STATS
                    Çalışanın performansını gösteren özet kartlar.
                */}
                <div className="grid grid-cols-2 gap-4">
                    {/* TOTAL POINTS CARD */}
                    <div className="flex items-center gap-4 p-6 rounded-2xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl hover:shadow-xl hover:shadow-amber-500/10 dark:hover:shadow-none transition-all duration-300 hover:-translate-y-1 group">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                            <Trophy className="w-7 h-7 text-white" /> {/* Ikon: Kupa (Trophy) - Başarıyı temsil eder */}
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Toplam Puanım</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white">
                                {isLoading ? <span className="animate-pulse opacity-50">...</span> : stats.points}
                            </p>
                        </div>
                    </div>
                    {/* COMPLETED TASKS CARD */}
                    <div className="flex items-center gap-4 p-6 rounded-2xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl hover:shadow-xl hover:shadow-violet-500/10 dark:hover:shadow-none transition-all duration-300 hover:-translate-y-1 group">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform duration-500">
                            <Target className="w-7 h-7 text-white" /> {/* Ikon: Hedef (Target) - Tamamlanan işleri temsil eder */}
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Tamamlanan Görev</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white">
                                {isLoading ? <span className="animate-pulse opacity-50">...</span> : stats.completedTasks}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 
                    TASK POOL
                    Çalışanın kendisine atanan veya havuzdaki görevleri gördüğü alan.
                */}
                <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-[32px] border border-slate-100 dark:border-slate-800 p-1">
                    <TaskPool />
                </div>
            </div>
        </DashboardLayout>
    )
}
