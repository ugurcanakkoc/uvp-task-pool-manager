'use client'

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { GanttChart } from "@/components/calendar/gantt-chart"
import { useI18nStore } from "@/stores/i18n-store"

export default function CalendarPage() {
    const { t } = useI18nStore()

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                        {t('nav.calendar')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Projelerin zaman çizelgesi ve görev dağılımı.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[32px] p-2 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 min-h-[600px] overflow-hidden">
                    <GanttChart />
                </div>
            </div>
        </DashboardLayout>
    )
}
