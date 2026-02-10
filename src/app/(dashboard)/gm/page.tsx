'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TaskPool } from '@/components/tasks/task-pool'
import { useI18nStore } from '@/stores/i18n-store'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, TrendingUp, Users, Layers, AlertTriangle } from 'lucide-react'

export default function GMPage() {
    const { t } = useI18nStore()
    const [stats, setStats] = useState([
        { label: 'Açık Görev', value: 0, icon: Layers, color: 'from-blue-500 to-indigo-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Aktif Çalışan', value: 0, icon: Users, color: 'from-emerald-500 to-teal-500', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: 'Doluluk Oranı', value: '%0', icon: TrendingUp, color: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
        { label: 'Eskalasyon', value: 0, icon: AlertTriangle, color: 'from-rose-500 to-red-500', bgColor: 'bg-rose-50 dark:bg-rose-900/20' },
    ])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 1. Açık Görevler (Open + In Progress)
                const { count: openTasksCount } = await supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .in('status', ['open', 'in_progress'])

                // 2. Aktif Çalışanlar
                const { count: workersCount } = await supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'worker')

                // 3. Eskalasyonlar (Öncelik 1 olan ve tamamlanmamış görevler)
                const { count: escalationsCount } = await supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .eq('priority', 1)
                    .neq('status', 'completed')

                // 4. Doluluk Oranı (Basit hesap: Aktif Görev / Toplam İşçi)
                // Daha karmaşık mantık ileride eklenebilir
                const occupancy = workersCount ? Math.min(100, Math.round(((openTasksCount || 0) / workersCount) * 100)) : 0

                setStats([
                    { label: 'Açık Görev', value: openTasksCount || 0, icon: Layers, color: 'from-blue-500 to-indigo-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Aktif Çalışan', value: workersCount || 0, icon: Users, color: 'from-emerald-500 to-teal-500', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Doluluk Oranı', value: `%${occupancy}`, icon: TrendingUp, color: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
                    { label: 'Eskalasyon', value: escalationsCount || 0, icon: AlertTriangle, color: 'from-rose-500 to-red-500', bgColor: 'bg-rose-50 dark:bg-rose-900/20' },
                ])
            } catch (error) {
                console.error('Error fetching stats:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchStats()
    }, [])

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* 
                    HERO SECTION
                    Sayfanın üst kısmındaki büyük banner alanı.
                    Gradient arka plan, hoş geldiniz mesajı ve rol rozetini içerir.
                */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-8 md:p-10 text-white shadow-2xl shadow-blue-900/20">
                    {/* 
                        DECORATIVE ELEMENTS
                        Arka plandaki bulanık daireler ve animasyonlu noktalar.
                        Sadece görsel amaçlıdır, tıklanamaz.
                    */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-500/20 to-transparent rounded-full blur-3xl" />
                    <div className="absolute top-10 right-20 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <div className="absolute top-20 right-40 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse delay-700" />
                    <div className="absolute bottom-10 left-40 w-1 h-1 bg-blue-300 rounded-full animate-pulse delay-1000" />

                    <div className="relative z-10">
                        {/* ROLE BADGE: Kullanıcının rolünü (GM) gösteren küçük etiket */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 shadow-inner">
                                <ShieldCheck className="h-3.5 w-3.5 text-blue-300" /> {/* Ikon: Kalkan (ShieldCheck) */}
                                <span className="text-[11px] font-bold uppercase tracking-widest text-blue-100">
                                    {t('gm.badge')}
                                </span>
                            </div>
                        </div>
                        {/* PAGE TITLE: Ana başlık */}
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                            {t('gm.title')}
                        </h1>
                        {/* DESCRIPTION: Alt açıklama metni */}
                        <p className="text-blue-200/80 max-w-2xl text-sm md:text-base leading-relaxed font-medium">
                            {t('gm.description')}
                        </p>
                    </div>
                </div>

                {/* 
                    STATS GRID
                    4 sütunlu istatistik kartları alanı.
                    Açık Görev, Aktif Çalışan, Doluluk Oranı ve Eskalasyon verilerini gösterir.
                */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="group relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl p-6 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-none transition-all duration-500 hover:-translate-y-1">
                            <div className="flex items-center justify-between mb-4">
                                {/* STAT ICON: İlgili istatistiğin ikonu (kare içinde) */}
                                <div className={`w-12 h-12 rounded-2xl ${stat.bgColor} flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
                                    <stat.icon className={`w-6 h-6 bg-gradient-to-r ${stat.color} bg-clip-text`} style={{ color: 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text' } as React.CSSProperties} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                {/* STAT VALUE: Sayısal değer */}
                                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {isLoading ? <span className="animate-pulse opacity-50">...</span> : stat.value}
                                </p>
                                {/* STAT LABEL: İstatistik adı */}
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{stat.label}</p>
                            </div>
                            {/* Hover glow effect background */}
                            <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
                        </div>
                    ))}
                </div>

                {/* 
                    TASK POOL SECTION
                    Tüm görevlerin listelendiği ana tablo bileşeni.
                    TaskPool bileşeni içinde filtreleme, sıralama ve sayfalama mantığı bulunur.
                */}
                <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-[32px] border border-slate-100 dark:border-slate-800 p-1">
                    <TaskPool />
                </div>
            </div>
        </DashboardLayout>
    )
}
