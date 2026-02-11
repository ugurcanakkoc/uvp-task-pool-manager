'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TaskPool } from '@/components/tasks/task-pool'
import { useI18nStore } from '@/stores/i18n-store'
import { BadgeCheck, Shield } from 'lucide-react'

export default function ApprovalsPage() {
    const { t } = useI18nStore()

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* HERO SECTION */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-900 via-indigo-950 to-slate-950 p-8 md:p-10 text-white shadow-2xl shadow-violet-900/20">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-500/20 to-transparent rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 shadow-inner">
                                <Shield className="h-3.5 w-3.5 text-violet-300" />
                                <span className="text-[11px] font-bold uppercase tracking-widest text-violet-100">
                                    Yönetici Paneli
                                </span>
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 bg-gradient-to-r from-white via-violet-100 to-indigo-200 bg-clip-text text-transparent">
                            Onay Bekleyenler
                        </h1>
                        <p className="text-violet-200/80 max-w-2xl text-sm md:text-base leading-relaxed font-medium">
                            Proje sahipleri tarafından oluşturulan görev isteklerini ve çalışan başvurularını buradan yönetebilirsiniz.
                        </p>
                    </div>
                </div>

                {/* TASK POOL - PENDING APPROVAL MODE */}
                <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-[32px] border border-slate-100 dark:border-slate-800 p-1">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                <BadgeCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">İncelenmesi Gereken Görevler</h2>
                                <p className="text-sm text-slate-500">Onay bekleyen görev istekleri ve çalışan başvuruları listeleniyor.</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-2">
                        <TaskPool mode="pending_approval" />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
