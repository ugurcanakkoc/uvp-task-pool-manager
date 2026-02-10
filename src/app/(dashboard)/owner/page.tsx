'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TaskPool } from '@/components/tasks/task-pool'
import { CreateTaskForm } from '@/components/tasks/create-task-form'
import { useI18nStore } from '@/stores/i18n-store'
import { Briefcase, BarChart3, FolderKanban } from 'lucide-react'

export default function OwnerPage() {
    const { t } = useI18nStore()

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 md:p-10 text-white">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-20 w-48 h-48 bg-gradient-to-tr from-indigo-400/20 to-transparent rounded-full blur-3xl" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
                                    <Briefcase className="h-3.5 w-3.5 text-blue-200" />
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-100">
                                        {t('owner.badge')}
                                    </span>
                                </div>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
                                {t('owner.title')}
                            </h1>
                            <p className="text-blue-100/80 max-w-xl text-sm md:text-base leading-relaxed">
                                {t('owner.description')}
                            </p>
                        </div>
                        <CreateTaskForm />
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-5 rounded-xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <FolderKanban className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Aktif Projeler</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">—</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-5 rounded-xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Tamamlanma Oranı</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">—</p>
                        </div>
                    </div>
                </div>

                <TaskPool />
            </div>
        </DashboardLayout>
    )
}
