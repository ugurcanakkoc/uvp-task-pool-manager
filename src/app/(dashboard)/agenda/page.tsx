'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useI18nStore } from '@/stores/i18n-store'
import { createClient } from '@/lib/supabase/client'
import { PersonalTaskDialog } from '@/components/availability/personal-task-dialog'
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Users,
    Trash2,
    CheckCircle2,
    AlertCircle,
    UserCircle2
} from 'lucide-react'
import { AgendaTimeline } from '@/components/availability/agenda-timeline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format, addDays, subDays } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export default function AgendaPage() {
    const { user } = useAuthStore()
    const { t, locale } = useI18nStore()
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [tasks, setTasks] = useState<any[]>([])
    const [staff, setStaff] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<any>(null)
    const supabase = createClient()

    const isManager = user?.role === 'gm' || user?.role === 'owner'
    const dateLocale = locale === 'tr' ? tr : enUS

    const filteredStaff = staff.filter(s => {
        const query = searchQuery.toLowerCase()
        return (
            s.full_name?.toLowerCase().includes(query) ||
            s.department?.toLowerCase().includes(query) ||
            s.role?.toLowerCase().includes(query)
        )
    })

    useEffect(() => {
        if (!user) return

        if (isManager) {
            fetchStaff()
        } else {
            setSelectedStaffId(user.id)
        }
    }, [user])

    useEffect(() => {
        if (selectedStaffId) {
            fetchAgenda(selectedStaffId, selectedDate)
        }
    }, [selectedStaffId, selectedDate])

    async function fetchStaff() {
        try {
            let query = supabase.from('users').select('id, full_name, role, department')

            if (user?.role === 'owner') {
                query = query.eq('department', user.department)
            }

            const { data, error } = await query.order('full_name')
            if (error) throw error
            setStaff(data || [])
            if (data?.length > 0 && !selectedStaffId) {
                // If I am looking at someone else, but by default looking at myself if I'm on the list
                const me = data.find((s: any) => s.id === user?.id)
                setSelectedStaffId(me?.id || data[0].id)
            }
        } catch (error) {
            console.error('Staff fetch error:', error)
        }
    }

    async function fetchAgenda(staffId: string, startDate: Date) {
        setIsLoading(true)
        try {
            // Fetch for a 14-day window
            const endDate = addDays(startDate, 14)
            endDate.setHours(23, 59, 59, 999)

            const startStr = startDate.toISOString()
            const endStr = endDate.toISOString()

            // 1. Fetch personal tasks (including recurring check within the date range)
            const { data: personalTasks, error: personalError } = await supabase
                .from('personal_tasks')
                .select('*')
                .eq('user_id', staffId)
                .or(`and(start_date.lte.${endStr},end_date.gte.${startStr}),is_recurring.eq.true`)

            if (personalError) throw personalError

            // 2. Fetch bookings for this user in range
            const { data: bookings, error: bookingError } = await supabase
                .from('bookings')
                .select(`
                    id,
                    task_id,
                    start_date,
                    end_date,
                    tasks!inner (
                        title,
                        description,
                        department,
                        priority
                    )
                `)
                .eq('worker_id', staffId)
                .lte('start_date', endStr)
                .gte('end_date', startStr)

            if (bookingError) throw bookingError

            // Normalize
            const normalizedPersonal = (personalTasks || []).map((t: any) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                start_date: t.start_date,
                end_date: t.end_date,
                is_recurring: t.is_recurring,
                recurring_days: t.recurring_days,
                can_support: t.can_support,
                user_id: t.user_id, // Important for management
                type: 'personal',
                is_full_day: t.is_full_day,
                status: 'active'
            }))

            const normalizedBookings = (bookings || []).map((b: any) => ({
                id: b.id,
                title: b.tasks.title,
                description: b.tasks.description,
                start_date: b.start_date,
                end_date: b.end_date,
                is_recurring: false,
                can_support: false,
                type: 'project_task',
                is_full_day: true,
                priority: b.tasks.priority,
                department: b.tasks.department,
                status: 'booked'
            }))

            setTasks([...normalizedPersonal, ...normalizedBookings])
        } catch (error) {
            console.error('Agenda fetch error:', error)
            toast.error(t('common.error'))
        } finally {
            setIsLoading(false)
        }
    }

    async function cancelTask(taskId: string) {
        if (!isManager) return

        try {
            const { error } = await supabase.from('personal_tasks').delete().eq('id', taskId)
            if (error) throw error
            toast.success(t('common.success'))
            fetchAgenda(selectedStaffId!, selectedDate)
        } catch (error) {
            toast.error(t('common.error'))
        }
    }

    async function updateTaskDates(taskId: string, start: Date, end: Date) {
        try {
            const { error } = await supabase
                .from('personal_tasks')
                .update({
                    start_date: start.toISOString(),
                    end_date: end.toISOString()
                })
                .eq('id', taskId)

            if (error) throw error

            // Refresh agenda
            if (selectedStaffId) {
                fetchAgenda(selectedStaffId, selectedDate)
            }
            toast.success(t('common.success'))
        } catch (error) {
            console.error('Update task dates error:', error)
            toast.error(t('common.error'))
        }
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 w-full px-4 lg:px-8">
                {/* Header section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-10 rounded-[48px] border border-white/20 dark:border-slate-800/50 shadow-2xl shadow-indigo-500/5">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 -rotate-3 hover:rotate-0 transition-all duration-500">
                            <CalendarIcon className="w-10 h-10" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-1">
                                {t('agenda.title')}
                            </h1>
                            <div className="flex items-center gap-3">
                                <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest text-[10px] px-3 py-1 rounded-full">
                                    {format(selectedDate, 'MMM yyyy', { locale: dateLocale })}
                                </Badge>
                                <span className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                                    {format(selectedDate, 'd MMMM', { locale: dateLocale })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center bg-white dark:bg-slate-800 p-2 rounded-[28px] border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 h-12 w-12 text-slate-600 dark:text-slate-400 transition-all active:scale-90"
                                onClick={() => setSelectedDate(subDays(selectedDate, 7))}
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                            <Button
                                variant="ghost"
                                className="px-8 h-12 font-black uppercase tracking-[0.2em] text-[11px] text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all"
                                onClick={() => setSelectedDate(new Date())}
                            >
                                {t('common.today')}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 h-12 w-12 text-slate-600 dark:text-slate-400 transition-all active:scale-90"
                                onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                            >
                                <ChevronRight className="w-6 h-6" />
                            </Button>
                        </div>

                        <PersonalTaskDialog
                            targetUserId={selectedStaffId || user?.id}
                            onSuccess={() => {
                                if (selectedStaffId) fetchAgenda(selectedStaffId, selectedDate)
                            }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left side: Staff Selection (for managers) */}
                    {isManager && (
                        <div className="lg:col-span-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[40px] border border-white/20 dark:border-slate-800/50 p-6 shadow-xl space-y-4">
                            <div className="flex items-center justify-between px-2 mb-2">
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    <h2 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">
                                        {t('agenda.userSelection')}
                                    </h2>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                    {filteredStaff.length}
                                </span>
                            </div>

                            {/* Flexible Search for Staff */}
                            <div className="relative group px-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <Input
                                    placeholder="İsim, departman veya rol..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 rounded-2xl bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div className="flex flex-col gap-2 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar pt-2">
                                {filteredStaff.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedStaffId(p.id)}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 text-left group",
                                            selectedStaffId === p.id
                                                ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]"
                                                : "hover:bg-white dark:hover:bg-slate-800 bg-white/30 dark:bg-slate-800/20 text-slate-600 dark:text-slate-400 border border-slate-100/50 dark:border-slate-700/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-inner transition-colors",
                                            selectedStaffId === p.id ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                                        )}>
                                            {p.full_name?.charAt(0)}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold truncate">{p.full_name}</span>
                                            <span className={cn(
                                                "text-[10px] font-medium uppercase tracking-widest opacity-70 truncate",
                                                selectedStaffId === p.id ? "text-indigo-100" : "text-slate-400"
                                            )}>
                                                {p.role} • {p.department}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                                {filteredStaff.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 text-sm italic">
                                        Sonuç bulunamadı.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Right side: Timeline */}
                    <div className={cn(
                        "bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[40px] border border-white/20 dark:border-slate-800/50 p-8 shadow-xl shadow-indigo-500/5 min-h-[600px]",
                        isManager ? "lg:col-span-9" : "lg:col-span-12"
                    )}>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-[500px] gap-8">
                                <div className="relative">
                                    <div className="w-20 h-20 border-8 border-slate-100 dark:border-slate-800 rounded-[32px] animate-pulse" />
                                    <div className="absolute inset-0 w-20 h-20 border-t-8 border-indigo-600 rounded-[32px] animate-spin" />
                                </div>
                                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs animate-pulse">
                                    {t('common.loading')}
                                </p>
                            </div>
                        ) : (
                            <div className="w-full">
                                <AgendaTimeline
                                    tasks={tasks}
                                    startDate={selectedDate}
                                    isManager={isManager}
                                    onCancelTask={cancelTask}
                                    onUpdateTaskDates={updateTaskDates} // Connect drag/resize
                                    onEditTask={(task) => {
                                        setEditingTask(task)
                                        setIsDialogOpen(true)
                                    }}
                                />
                            </div>
                        )}

                        {/* Controlled Edit Dialog */}
                        <PersonalTaskDialog
                            task={editingTask}
                            targetUserId={selectedStaffId || undefined}
                            openOverride={isDialogOpen}
                            onOpenChangeOverride={(open) => {
                                setIsDialogOpen(open)
                                if (!open) setEditingTask(null)
                            }}
                            onSuccess={() => {
                                if (selectedStaffId) fetchAgenda(selectedStaffId, selectedDate)
                                setEditingTask(null)
                                setIsDialogOpen(false)
                            }}
                        />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
