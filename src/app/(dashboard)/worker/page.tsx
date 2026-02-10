'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TaskPool } from '@/components/tasks/task-pool'
import { useI18nStore } from '@/stores/i18n-store'
import { Zap, Trophy, Target } from 'lucide-react'

export default function WorkerPage() {
    const { t } = useI18nStore()

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 p-8 md:p-10 text-white">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-10 w-40 h-40 bg-gradient-to-tr from-emerald-400/20 to-transparent rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
                                <Zap className="h-3.5 w-3.5 text-emerald-200" />
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-100">
                                    {t('worker.badge')}
                                </span>
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
                            {t('worker.title')}
                        </h1>
                        <p className="text-emerald-100/80 max-w-2xl text-sm md:text-base leading-relaxed">
                            {t('worker.description')}
                        </p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-5 rounded-xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Toplam Puanım</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">—</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-5 rounded-xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Tamamlanan Görev</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">—</p>
                        </div>
                    </div>
                </div>

                <TaskPool />
            </div>
        </DashboardLayout>
    )
}
