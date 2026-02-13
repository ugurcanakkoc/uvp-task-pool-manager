'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { WelcomeBanner } from '@/components/dashboard/welcome-banner'
import { DashboardSection } from '@/components/dashboard/dashboard-section'
import { StaffStatusList } from '@/components/dashboard/staff-status-list'
import { TaskPool } from '@/components/tasks/task-pool'
import { SideTaskList } from '@/components/tasks/side-task-list'
import {
    BadgeCheck,
    Users,
    CheckCircle2,
    Calendar,
    Loader2
} from 'lucide-react'
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns'
import { getUserOccupancyForDate } from '@/lib/utils/agenda-utils'

interface WorkerUser {
    id: string;
    full_name: string;
    avatar_url: string;
    department: string;
    role: string;
    is_active: boolean;
}

interface ActiveTask {
    id: string;
    title: string;
    assigned_worker_id: string;
    status: string;
    start_date: string;
    end_date: string;
}

interface PersonalTask {
    id: string;
    user_id: string;
    title: string;
    start_date: string;
    end_date: string;
}

export default function DashboardPage() {
    const { user } = useAuthStore()
    const [isLoading, setIsLoading] = useState(true)
    const [staffData, setStaffData] = useState<{ working: any[], available: any[] }>({ working: [], available: [] })
    const supabase = createClient()

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return
            setIsLoading(true)
            try {
                const today = new Date()
                const todayStr = format(today, 'yyyy-MM-dd')

                // 1. Fetch Workers & Owners (All potential staff)
                const { data: staffMembers } = await supabase
                    .from('users')
                    .select('*')
                    .in('role', ['worker', 'owner'])
                    .eq('is_active', true)

                // 2. Fetch Bookings (Active assignments including tasks)
                const { data: bookings } = await supabase
                    .from('bookings')
                    .select(`
                        *,
                        tasks (
                            *,
                            bookings (
                                *,
                                worker:users!worker_id (
                                    full_name,
                                    avatar_url
                                )
                            )
                        )
                    `)
                    .eq('is_active', true)

                // 3. Fetch Personal Tasks (including recurring)
                const { data: personalTasks } = await supabase
                    .from('personal_tasks')
                    .select('*')

                // Process logic using unified utility
                const workingList: any[] = []
                const availableList: any[] = []

                staffMembers?.forEach((member: any) => {
                    // Map bookings to the format getUserOccupancyForDate expects
                    // Handle both direct object and array (due to plural naming 'tasks')
                    const workerTasks = bookings
                        ?.filter((b: any) => {
                            const t = Array.isArray(b.tasks) ? b.tasks[0] : b.tasks
                            const busyStatuses = ['active', 'in_progress', 'requested', 'review']
                            return b.worker_id === member.id && busyStatuses.includes(t?.status)
                        })
                        .map((b: any) => {
                            const t = Array.isArray(b.tasks) ? b.tasks[0] : b.tasks
                            return {
                                id: b.id,
                                title: t?.title || 'Destek Talebi',
                                status: t?.status,
                                start_date: b.start_date,
                                end_date: b.end_date
                            }
                        }) || []

                    const workerPersonal = personalTasks?.filter((p: any) => p.user_id === member.id) || []

                    const occupancy = getUserOccupancyForDate(today, workerTasks, workerPersonal)
                    const isBusy = occupancy.percentage > 0

                    const isSameDept = member.department === user.department

                    if (isBusy) {
                        // If it's Owner, filter "Working" by department
                        if (user.role === 'owner' && !isSameDept) return

                        // Find ALL matching tasks that make them busy today
                        const currentBookings = bookings?.filter((b: any) => {
                            const t = Array.isArray(b.tasks) ? b.tasks[0] : b.tasks
                            const busyStatuses = ['active', 'in_progress', 'requested', 'review']
                            if (!busyStatuses.includes(t?.status)) return false
                            const start = new Date(b.start_date)
                            const end = new Date(b.end_date)
                            return b.worker_id === member.id && start <= today && end >= today
                        }) || []

                        const currentTasks = currentBookings.map((cb: any) =>
                            Array.isArray(cb.tasks) ? cb.tasks[0] : cb.tasks
                        ).filter(Boolean)

                        workingList.push({
                            ...member,
                            current_task: currentTasks.length > 1
                                ? `${currentTasks.length} Farklı İş Var`
                                : (currentTasks[0]?.title || occupancy.reason || "Meşgul"),
                            task_objects: currentTasks,
                            occupancy_rate: occupancy.percentage
                        })
                    } else {
                        availableList.push(member)
                    }
                })

                setStaffData({ working: workingList, available: availableList })
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchDashboardData()
    }, [user])

    if (!user) return null

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-10">
                <WelcomeBanner />

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
