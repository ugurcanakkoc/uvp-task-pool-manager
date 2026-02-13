'use client'

import { useAuthStore } from '@/stores/auth-store'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { WelcomeBanner } from '@/components/dashboard/welcome-banner'
import { DashboardSection } from '@/components/dashboard/dashboard-section'
import { StaffStatusList } from '@/components/dashboard/staff-status-list'
import { TaskPool } from '@/components/tasks/task-pool'
import { SideTaskList } from '@/components/tasks/side-task-list'
import { KPIStats } from '@/components/dashboard/kpi-stats'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import {
    BadgeCheck,
    Users,
    CheckCircle2,
    Calendar
} from 'lucide-react'

export default function DashboardPage() {
    const { user } = useAuthStore()
    const { isLoading, staffData, counts } = useDashboardData(user as any)

    if (!user) return null

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-10">
                <WelcomeBanner />

                {(user.role === 'gm' || user.role === 'owner') && (
                    <KPIStats
                        availableStaffCount={staffData.available.length}
                        totalActiveTasks={counts.activeTasks}
                        pendingApprovals={counts.pendingApprovals}
                    />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* 1. Approvals Section (GM & Owner only) */}
                        {(user.role === 'gm' || user.role === 'owner') && (
                            <DashboardSection
                                title="Onay Bekleyenler"
                                subtitle="Yönetici onayı veya aday bekleyen işler"
                                icon={BadgeCheck}
                                iconClassName="bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"
                            >
                                <div className="p-2">
                                    <TaskPool mode="pending_approval" />
                                </div>
                            </DashboardSection>
                        )}

                        {/* 2. Today's My Tasks (For Everyone) */}
                        <DashboardSection
                            title="Bugün Yapacaklarım"
                            subtitle="Üzerime atanan aktif destek talepleri"
                            icon={CheckCircle2}
                            iconClassName="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                        >
                            <div className="p-4">
                                <TaskPool mode="worker" />
                            </div>
                        </DashboardSection>
                    </div>

                    {/* Sidebar / Stats Area (GM & Owner see Staff Status) */}
                    <div className="lg:col-span-4 space-y-8">
                        {(user.role === 'gm' || user.role === 'owner') && (
                            <div className="space-y-8">
                                <DashboardSection
                                    title="Saha Durumu"
                                    subtitle="Aktif çalışan personel"
                                    icon={Users}
                                >
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        <StaffStatusList
                                            title="İşi Olanlar"
                                            staff={staffData.working}
                                            type="working"
                                            emptyText="Şu an aktif destek talebinde kimse yok."
                                        />
                                        <StaffStatusList
                                            title="İşi Olmayanlar"
                                            staff={staffData.available}
                                            type="available"
                                            emptyText="Boşta personel bulunmuyor."
                                        />
                                    </div>
                                </DashboardSection>
                            </div>
                        )}

                        {user.role === 'worker' && (
                            <div className="space-y-8">
                                <DashboardSection
                                    title="Kişisel Ajanda"
                                    subtitle="Bugünkü meşguliyetlerin"
                                    icon={Calendar}
                                >
                                    <div className="p-4">
                                        <p className="text-sm text-slate-500 italic text-center py-10">
                                            Bugün için eklenmiş bir meşguliyetiniz bulunmuyor.
                                        </p>
                                    </div>
                                </DashboardSection>

                                <DashboardSection
                                    title="Ara İşlerim"
                                    subtitle="Delegasyon dışı destek talepleri"
                                >
                                    <SideTaskList />
                                </DashboardSection>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
