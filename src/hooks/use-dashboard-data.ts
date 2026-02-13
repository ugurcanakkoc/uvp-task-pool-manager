import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getActiveStaff, getOccupancyData } from '@/lib/supabase/queries'
import { format } from 'date-fns'
import { getUserOccupancyForDate } from '@/lib/utils/agenda-utils'
import { BaseUser } from '@/types'

/**
 * Custom hook to manage dashboard data fetching and processing.
 * Separates business logic from the Dashboard UI.
 * @param user The current authenticated user object.
 */
export function useDashboardData(user: BaseUser | null) {
    const [isLoading, setIsLoading] = useState(true)
    const [staffData, setStaffData] = useState<{ working: any[], available: any[] }>({ working: [], available: [] })
    const [counts, setCounts] = useState({ activeTasks: 0, pendingApprovals: 0 })
    const supabase = createClient()

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return
            setIsLoading(true)
            try {
                const today = new Date()

                // Fetch staff and occupancy data using shared queries
                const staffMembers = await getActiveStaff()
                const { bookings, personalTasks } = await getOccupancyData()

                const workingList: any[] = []
                const availableList: any[] = []

                staffMembers.forEach((member: any) => {
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

                    if (isBusy) {
                        if (user.role === 'owner' && member.department !== user.department) return

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

                // KPI Counts
                const { count: pendingCount } = await supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .in('status', ['requested', 'pending'])

                const { count: activeCount } = await supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'active')

                setStaffData({ working: workingList, available: availableList })
                setCounts({
                    activeTasks: activeCount || 0,
                    pendingApprovals: pendingCount || 0
                })
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchDashboardData()
    }, [user, supabase])

    return { isLoading, staffData, counts }
}
