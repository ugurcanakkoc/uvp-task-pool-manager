'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TaskPool } from '@/components/tasks/task-pool'
import { CreateTaskForm } from '@/components/tasks/create-task-form'
import { useI18nStore } from '@/stores/i18n-store'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { Briefcase, BarChart3, FolderKanban } from 'lucide-react'

export default function OwnerPage() {
    const { t } = useI18nStore()
    const { user } = useAuthStore()
    const [stats, setStats] = useState({
        activeProjects: 0,
        completionRate: 0
    })
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return

            try {
                // 1. Toplam Görevler (Owner'ın oluşturduğu)
                const { count: totalTasks, data: allTasks } = await supabase
                    .from('tasks')
                    .select('status', { count: 'exact' })
                    .eq('owner_id', user.id)

                // 2. Aktif Projeler (Tamamlanmamış görevler)
                const activeCount = allTasks?.filter((task: any) => task.status !== 'completed' && task.status !== 'cancelled').length || 0

                // 3. Tamamlanan Görevler
                const completedCount = allTasks?.filter((task: any) => task.status === 'completed').length || 0

                // 4. Tamamlanma Oranı
                const rate = totalTasks ? Math.round((completedCount / totalTasks) * 100) : 0

                setStats({
                    activeProjects: activeCount,
                    completionRate: rate
                })
            } catch (error) {
                console.error('Error fetching owner stats:', error)
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
                    Owner (Proje Sahibi) için özel mavi/indigo gradient arka plan.
                */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 md:p-10 text-white shadow-2xl shadow-blue-900/20">
                    {/* 
                        DECORATIVE ELEMENTS
                        Arka plandaki modern ve dinamik şekiller.
                        Sayfaya derinlik katmak için kullanılır.
                    */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-20 w-48 h-48 bg-gradient-to-tr from-indigo-400/20 to-transparent rounded-full blur-3xl" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            {/* ROLE BADGE: Owner rolünü gösteren etiket */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 shadow-inner">
                                    <Briefcase className="h-3.5 w-3.5 text-blue-200" /> {/* Ikon: Çanta (Briefcase) - İş yönetimini temsil eder */}
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-blue-100">
                                        {t('owner.badge')}
                                    </span>
                                </div>
                            </div>
                            {/* PAGE TITLE */}
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 bg-gradient-to-r from-white via-blue-100 to-indigo-100 bg-clip-text text-transparent">
                                {t('owner.title')}
                            </h1>
                            {/* DESCRIPTION */}
                            <p className="text-blue-100/80 max-w-xl text-sm md:text-base leading-relaxed font-medium">
                                {t('owner.description')}
                            </p>
                        </div>
                        {/* CREATE TASK BUTTON: Yeni görev oluşturma modalını açar */}
                        <div className="flex-shrink-0">
                            <CreateTaskForm />
                        </div>
                    </div>
                </div>

                {/* 
                    QUICK STATS
                    Proje sahibinin projelerinin durumunu gösteren özet kartlar.
                */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ACTIVE PROJECTS CARD */}
                    <div className="flex items-center gap-4 p-6 rounded-2xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-none transition-all duration-300 hover:-translate-y-1 group">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                            <FolderKanban className="w-7 h-7 text-white" /> {/* Ikon: Klasör/Kanban - Projeleri temsil eder */}
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Aktif Projeler</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white">
                                {isLoading ? <span className="animate-pulse opacity-50">...</span> : stats.activeProjects}
                            </p>
                        </div>
                    </div>
                    {/* COMPLETION RATE CARD */}
                    <div className="flex items-center gap-4 p-6 rounded-2xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl hover:shadow-xl hover:shadow-emerald-500/10 dark:hover:shadow-none transition-all duration-300 hover:-translate-y-1 group">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                            <BarChart3 className="w-7 h-7 text-white" /> {/* Ikon: Grafik - İlerlemeyi temsil eder */}
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Tamamlanma Oranı</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white">
                                {isLoading ? <span className="animate-pulse opacity-50">...</span> : `%${stats.completionRate}`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 
                    TASK POOL
                    Proje sahibinin oluşturduğu tüm görevleri listeler.
                */}
                <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-[32px] border border-slate-100 dark:border-slate-800 p-1">
                    <TaskPool />
                </div>
            </div>
        </DashboardLayout>
    )
}
