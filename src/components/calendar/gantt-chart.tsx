'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    format,
    addDays,
    startOfDay,
    differenceInDays,
    eachDayOfInterval,
    isToday,
    isSameDay,
    startOfMonth,
    endOfMonth,
    isWeekend,
    getDay
} from 'date-fns'
import { tr, enUS, de } from 'date-fns/locale'
import { useI18nStore } from '@/stores/i18n-store'
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Layers, Search, Eraser, CheckCircle, Clock, User, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TaskDetailDialog } from './task-detail-dialog'

interface Task {
    id: string
    title: string
    description?: string
    start_date: string
    end_date: string
    status: string
    priority: number
    department: string
    is_strategic: boolean
    is_production: boolean
    assigned_worker_id?: string
    assigned_worker?: {
        full_name: string
        avatar_url?: string
    }
    owner_id: string
    owner?: {
        full_name: string
        avatar_url?: string
    }
    bookings?: {
        id: string
        worker_id: string
        worker: {
            full_name: string
            avatar_url?: string
        }
    }[]
}

interface GanttChartProps {
    refreshTrigger?: number
}

export function GanttChart({ refreshTrigger = 0 }: GanttChartProps) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const { t, locale } = useI18nStore()
    const supabase = createClient()
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState(0)

    // Timeline state
    const [viewDate, setViewDate] = useState(startOfDay(new Date()))
    const [daysToShow, setDaysToShow] = useState(60)
    const [sidebarWidth, setSidebarWidth] = useState(300)
    const [isResizing, setIsResizing] = useState(false)

    // Filters
    const [filterDept, setFilterDept] = useState<string>('all')
    const [filterAssignment, setFilterAssignment] = useState<string>('all')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const dateLocale = locale === 'tr' ? tr : locale === 'de' ? de : enUS

    useEffect(() => {
        if (!scrollContainerRef.current) return
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                setContainerWidth(entry.contentRect.width)
            }
        })
        observer.observe(scrollContainerRef.current)
        return () => observer.disconnect()
    }, [])

    const fetchTasks = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                assigned_worker:users!assigned_worker_id(full_name, avatar_url),
                owner:users!owner_id(full_name, avatar_url),
                bookings(
                    id,
                    worker_id,
                    worker:users!worker_id(full_name, avatar_url)
                )
            `)
            .order('start_date', { ascending: true })

        if (!error && data) {
            setTasks(data as any)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchTasks()
    }, [supabase, refreshTrigger])

    const filteredAndSortedTasks = useMemo(() => {
        let result = [...tasks]

        // 1. Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query)
            )
        }

        // 2. Department filter
        if (filterDept !== 'all') {
            result = result.filter(t => t.department === filterDept)
        }

        // 3. Assignment filter
        if (filterAssignment !== 'all') {
            if (filterAssignment === 'assigned') {
                result = result.filter(t => t.bookings && t.bookings.length > 0)
            } else {
                result = result.filter(t => !t.bookings || t.bookings.length === 0)
            }
        }

        // 4. Status filter
        if (filterStatus !== 'all') {
            result = result.filter(t => t.status === filterStatus)
        } else {
            // By default hide cancelled to keep it clean, unless specifically asked
            result = result.filter(t => t.status !== 'cancelled')
        }

        // 5. Sort by Priority (P1 first) and then Date
        return result.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority
            return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        })
    }, [tasks, searchQuery, filterDept, filterAssignment, filterStatus])

    const unassignedTasks = useMemo(() => {
        return tasks.filter(t => (!t.bookings || t.bookings.length === 0) && t.status !== 'cancelled' && t.status !== 'completed')
    }, [tasks])

    const departments = useMemo(() => {
        return Array.from(new Set(tasks.map(t => t.department))).filter(Boolean)
    }, [tasks])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return
            const newWidth = Math.max(200, Math.min(600, e.clientX))
            setSidebarWidth(newWidth)
        }
        const handleMouseUp = () => setIsResizing(false)

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isResizing])

    const timelineInterval = useMemo(() => {
        const start = viewDate
        const end = addDays(start, daysToShow)
        return { start, end }
    }, [viewDate, daysToShow])

    const days = useMemo(() => {
        return eachDayOfInterval(timelineInterval)
    }, [timelineInterval])

    const columnWidth = 140
    const timelineWidth = Math.max(containerWidth, sidebarWidth + (days.length * columnWidth))

    const getTaskStyles = (task: Task) => {
        const start = new Date(task.start_date)
        const end = new Date(task.end_date)
        const offset = differenceInDays(start, timelineInterval.start)
        const duration = differenceInDays(end, start) + 1

        return {
            left: `${offset * columnWidth}px`,
            width: `${duration * columnWidth - 8}px`,
        }
    }

    const getPriorityStyles = (p: number) => {
        switch (p) {
            case 1: return {
                bg: "bg-rose-500 shadow-rose-500/30",
                border: "border-rose-200 dark:border-rose-800",
                badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
            }
            case 2: return {
                bg: "bg-orange-500 shadow-orange-500/30",
                border: "border-orange-200 dark:border-orange-800",
                badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
            }
            case 3: return {
                bg: "bg-blue-600 shadow-blue-500/30",
                border: "border-blue-200 dark:border-blue-800",
                badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            }
            default: return {
                bg: "bg-slate-500 shadow-slate-500/30",
                border: "border-slate-200 dark:border-slate-800",
                badge: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300"
            }
        }
    }

    const getStatusColor = (task: Task) => {
        const isRequested = task.status === 'requested'
        const isCancelled = task.status === 'cancelled'
        const pStyle = getPriorityStyles(task.priority)

        if (isCancelled) {
            return "bg-slate-200 dark:bg-slate-800 shadow-none grayscale opacity-40"
        }

        if (isRequested) {
            return cn(pStyle.bg, "opacity-40 shadow-none grayscale-[0.5]")
        }

        return pStyle.bg
    }

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task)
        setIsDialogOpen(true)
    }

    if (isLoading) {
        return (
            <div className="h-[500px] flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg border-slate-200"
                        onClick={() => setViewDate(prev => addDays(prev, -1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase min-w-[160px] text-center tracking-tight">
                        {format(viewDate, 'd MMMM yyyy', { locale: dateLocale })}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg border-slate-200"
                        onClick={() => setViewDate(prev => addDays(prev, 1))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    {unassignedTasks.length > 0 && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-900/30 cursor-help animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="relative">
                                            <Clock className="w-4 h-4 animate-pulse" />
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-tight">
                                            {unassignedTasks.length} Atanmamış İş
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="p-4 w-72 bg-slate-900 text-white border-none rounded-2xl shadow-2xl" side="bottom" align="end">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2">Henüz Atama Yapılmamış Destek Talepleri</p>
                                        <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                                            {unassignedTasks.map(ut => (
                                                <div key={ut.id} className="group flex flex-col gap-1 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer" onClick={() => handleTaskClick(ut)}>
                                                    <span className="text-xs font-bold leading-snug group-hover:text-amber-400 transition-colors">{ut.title}</span>
                                                    <span className="text-[9px] font-black text-slate-500 uppercase">{ut.department}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-500 italic pt-1 border-t border-slate-800">Detay ve atama için işin üzerine tıklayın.</p>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>

            {/* Filter Area */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 flex flex-wrap gap-3 items-center">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Destek taleplerinde ara..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl h-10 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Select value={filterDept} onValueChange={setFilterDept}>
                    <SelectTrigger className="w-[160px] h-10 rounded-xl font-bold bg-white dark:bg-slate-900">
                        <SelectValue placeholder="Departman" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Departmanlar</SelectItem>
                        {departments.map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterAssignment} onValueChange={setFilterAssignment}>
                    <SelectTrigger className="w-[160px] h-10 rounded-xl font-bold bg-white dark:bg-slate-900">
                        <SelectValue placeholder="Atama Durumu" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Atamalar</SelectItem>
                        <SelectItem value="assigned">Atanmışlar</SelectItem>
                        <SelectItem value="unassigned">Atanmayanlar</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[160px] h-10 rounded-xl font-bold bg-white dark:bg-slate-900">
                        <SelectValue placeholder="İşlem Durumu" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Durumlar (Aktif)</SelectItem>
                        <SelectItem value="requested">Onay Bekleyenler</SelectItem>
                        <SelectItem value="active">Aktifler</SelectItem>
                        <SelectItem value="completed">Tamamlananlar</SelectItem>
                        <SelectItem value="cancelled">İptal Edilenler</SelectItem>
                    </SelectContent>
                </Select>

                {(filterDept !== 'all' || filterAssignment !== 'all' || filterStatus !== 'all' || searchQuery) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setFilterDept('all')
                            setFilterAssignment('all')
                            setFilterStatus('all')
                            setSearchQuery('')
                        }}
                        className="h-10 rounded-xl text-slate-400 hover:text-red-500"
                    >
                        <Eraser className="w-4 h-4 mr-2" /> Temizle
                    </Button>
                )}
            </div>

            {/* Gantt Container */}
            <div
                ref={scrollContainerRef}
                className="relative flex-1 min-w-0 max-w-full overflow-x-auto overflow-y-auto bg-white dark:bg-slate-950 scrollbar-hide select-none"
            >
                <div style={{ width: timelineWidth }}>
                    {/* Timeline Header */}
                    <div className="sticky top-0 z-20 flex bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
                        <div
                            className="sticky left-0 z-30 bg-white border-r border-slate-100 dark:bg-slate-950 dark:border-slate-800 p-4 font-bold text-xs uppercase text-slate-400 tracking-widest flex items-center justify-between"
                            style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}
                        >
                            {t('nav.taskPool')}
                            <div
                                className={cn(
                                    "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors z-40",
                                    isResizing && "bg-blue-500 w-1"
                                )}
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    setIsResizing(true)
                                }}
                            />
                        </div>
                        <div className="flex">
                            {days.map((day) => (
                                <div
                                    key={day.toISOString()}
                                    className={cn(
                                        "flex flex-col items-center justify-center border-r border-slate-50 dark:border-slate-900 transition-colors",
                                        isWeekend(day) ? "bg-slate-50/50 dark:bg-slate-900/30" : "",
                                        isToday(day) ? "bg-blue-50/30 dark:bg-blue-900/10" : ""
                                    )}
                                    style={{ width: `${columnWidth}px`, height: '80px' }}
                                >
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                        {format(day, 'EEE', { locale: dateLocale })}
                                    </span>
                                    <span className={cn(
                                        "text-sm font-black mt-0.5 w-7 h-7 flex items-center justify-center rounded-full relative z-10",
                                        isToday(day) ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-slate-600 dark:text-slate-400"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    {getDay(day) === 1 && (
                                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-red-500/40 z-20" />
                                    )}
                                    {getDay(day) === 0 && (
                                        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-red-500/40 z-20" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rows */}
                    <div className="relative min-w-max pb-10 min-h-[400px]">
                        <div className="absolute inset-0 flex pointer-events-none" style={{ paddingLeft: `${sidebarWidth}px` }}>
                            {days.map((day) => (
                                <div
                                    key={day.toISOString()}
                                    className={cn(
                                        "h-full border-r relative",
                                        isWeekend(day) ? "bg-slate-50/40 dark:bg-slate-900/40 border-slate-100/50 dark:border-slate-800/30" : "border-slate-50 dark:border-slate-900"
                                    )}
                                    style={{ width: `${columnWidth}px` }}
                                >
                                    {getDay(day) === 1 && (
                                        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-red-500/20" />
                                    )}
                                    {getDay(day) === 0 && (
                                        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-red-500/20" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {filteredAndSortedTasks.length === 0 ? (
                            <div className="p-20 text-center col-span-full">
                                <Layers className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                                <p className="text-slate-400 font-medium uppercase tracking-widest text-[10px]">Henüz destek talebi bulunmuyor.</p>
                            </div>
                        ) : (
                            filteredAndSortedTasks.map((task, index) => {
                                const pStyle = getPriorityStyles(task.priority)
                                return (
                                    <div
                                        key={task.id}
                                        className={cn(
                                            "group relative flex border-b transition-colors h-20",
                                            index % 2 === 0 ? "bg-transparent" : "bg-slate-50/20 dark:bg-slate-900/10",
                                            "hover:bg-blue-50/30 dark:hover:bg-blue-900/10 border-slate-50 dark:border-slate-800/50"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "sticky left-0 z-10 border-r border-slate-100 dark:border-slate-800 p-3 flex flex-col justify-center transition-colors overflow-hidden",
                                                index % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/80 dark:bg-slate-900/80",
                                                "group-hover:bg-blue-50/50 dark:group-hover:bg-blue-950/50",
                                                task.status === 'requested' && "border-l-4 border-l-amber-400",
                                                task.status === 'cancelled' && "opacity-50 grayscale"
                                            )}
                                            style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}
                                        >
                                            <h4 className={cn(
                                                "text-[13px] font-black uppercase leading-snug break-words",
                                                task.status === 'cancelled' ? "text-slate-400 line-through decoration-slate-500 decoration-2" : "text-slate-800 dark:text-slate-100"
                                            )}>
                                                {task.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="outline" className="text-[9px] h-4 font-black uppercase tracking-tighter bg-slate-50 dark:bg-slate-900 border-slate-200">
                                                    {task.department}
                                                </Badge>
                                                {task.status !== 'cancelled' && (
                                                    <Badge className={cn("text-[9px] h-4 font-black px-1.5 border-none", pStyle.badge)}>
                                                        P{task.priority}
                                                    </Badge>
                                                )}
                                                {task.status === 'cancelled' && (
                                                    <Badge variant="secondary" className="text-[9px] h-4 font-black px-1.5 bg-slate-200 text-slate-500">
                                                        İPTAL
                                                    </Badge>
                                                )}
                                                {task.bookings && task.bookings.length > 0 && task.status !== 'cancelled' && (
                                                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="relative flex-1">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className={cn(
                                                                "absolute top-3 bottom-3 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-95 flex items-center px-6 overflow-hidden shadow-lg border-2 border-transparent",
                                                                getStatusColor(task),
                                                                task.status === 'requested' && "border-dashed border-slate-300 dark:border-slate-700 shadow-none"
                                                            )}
                                                            style={getTaskStyles(task)}
                                                            onClick={() => handleTaskClick(task)}
                                                        >
                                                            <span className={cn(
                                                                "text-[11px] font-black uppercase truncate drop-shadow-sm",
                                                                task.status === 'requested' ? "text-slate-200" : "text-white"
                                                            )}>
                                                                {task.status === 'requested' && "🕒 "}
                                                                {task.title}
                                                            </span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="p-3 max-w-xs bg-slate-900 text-white border-none rounded-xl">
                                                        <div className="space-y-1">
                                                            <p className="font-black uppercase text-[10px] tracking-tight">{task.title}</p>
                                                            <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase">
                                                                <span>{format(new Date(task.start_date), 'd MMM')}</span>
                                                                <span>-</span>
                                                                <span>{format(new Date(task.end_date), 'd MMM')}</span>
                                                            </div>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            <TaskDetailDialog
                task={selectedTask}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={fetchTasks}
            />
        </div>
    )
}
