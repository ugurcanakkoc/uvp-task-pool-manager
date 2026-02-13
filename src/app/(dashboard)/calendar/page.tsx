'use client'

import { useState } from 'react'
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { GanttChart } from "@/components/calendar/gantt-chart"
import { useI18nStore } from "@/stores/i18n-store"
import { ResourceRequestModal } from "@/components/calendar/resource-request-modal"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PersonalTaskDialog } from "@/components/availability/personal-task-dialog"

export default function CalendarPage() {
    const { t } = useI18nStore()
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const handleRefresh = () => setRefreshTrigger(prev => prev + 1)

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                            {t('nav.calendar')}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Projelerin zaman çizelgesi ve görev dağılımı.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <PersonalTaskDialog onSuccess={handleRefresh} />
                        <ResourceRequestModal
                            onSuccess={handleRefresh}
                            trigger={
                                <Button className="gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none h-11 font-bold">
                                    <Users className="w-4 h-4" />
                                    Havuzdan Kaynak Talebi
                                </Button>
                            }
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[32px] p-2 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 min-h-[600px] overflow-hidden">
                    <GanttChart refreshTrigger={refreshTrigger} />
                </div>
            </div>
        </DashboardLayout>
    )
}
