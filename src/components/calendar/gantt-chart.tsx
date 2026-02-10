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
    isWeekend
} from 'date-fns'
import { tr, enUS, de } from 'date-fns/locale'
import { useI18nStore } from '@/stores/i18n-store'
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Task {
    id: string
    title: string
    start_date: string
    end_date: string
    status: string
    priority: number
    department: string
    is_strategic: boolean
    is_production: boolean
}

export function GanttChart() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { t, locale } = useI18nStore()
    const supabase = createClient()
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Timeline state
    const [viewDate, setViewDate] = useState(startOfDay(new Date()))
    const [daysToShow, setDaysToShow] = useState(30) // Initial view range

    const dateLocale = locale === 'tr' ? tr : locale === 'de' ? de : enUS

    useEffect(() => {
        const fetchTasks = async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .order('start_date', { ascending: true })

            if (!error && data) {
                setTasks(data)
            }
            setIsLoading(false)
        }

        fetchTasks()
    }, [supabase])

    const timelineInterval = useMemo(() => {
        const start = addDays(viewDate, -5) // 5 days padding before
        const end = addDays(start, daysToShow)
        return { start, end }
    }, [viewDate, daysToShow])

    const days = useMemo(() => {
        return eachDayOfInterval(timelineInterval)
    }, [timelineInterval])

    const columnWidth = 100 // px per day

    const getTaskStyles = (task: Task) => {
        const start = new Date(task.start_date)
        const end = new Date(task.end_date)

        // Calculate offset from timeline start
        const offset = differenceInDays(start, timelineInterval.start)
        const duration = differenceInDays(end, start) + 1

        return {
            left: `${offset * columnWidth}px`,
            width: `${duration * columnWidth - 8}px`, // 4px margin on each side
        }
    }

    const getStatusColor = (task: Task) => {
        if (task.is_strategic) return 'bg-indigo-500 shadow-indigo-500/30'
        if (task.is_production) return 'bg-amber-500 shadow-amber-500/30'
        return 'bg-blue-500 shadow-blue-500/30'
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
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => setViewDate(addDays(viewDate, -7))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-8 px-3 text-xs font-bold uppercase tracking-wider"
                            onClick={() => setViewDate(new Date())}
                        >
                            {t('common.today') || 'BUGÜN'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => setViewDate(addDays(viewDate, 7))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase">
                        {format(timelineInterval.start, 'MMMM yyyy', { locale: dateLocale })}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl h-9 gap-2">
                        <Filter className="w-4 h-4" /> {t('common.filter') || 'Filtrele'}
                    </Button>
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
                        <Button
                            variant={daysToShow === 15 ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7 text-xs rounded-lg px-3"
                            onClick={() => setDaysToShow(15)}
                        >
                            {t('common.week') || 'Hafta'}
                        </Button>
                        <Button
                            variant={daysToShow === 30 ? "secondary" : "ghost"}
                            size="sm"
                            className="h-7 text-xs rounded-lg px-3"
                            onClick={() => setDaysToShow(30)}
                        >
                            {t('common.month') || 'Ay'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Gantt Container */}
            <div className="relative flex-1 overflow-auto bg-white dark:bg-slate-950 scrollbar-hide" ref={scrollContainerRef}>
                {/* Timeline Header */}
                <div className="sticky top-0 z-20 flex bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
                    <div className="sticky left-0 z-30 w-64 min-w-[256px] bg-white border-r border-slate-100 dark:bg-slate-950 dark:border-slate-800 p-4 font-bold text-xs uppercase text-slate-400 tracking-widest">
                        {t('nav.taskPool')}
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
                                style={{ width: `${columnWidth}px`, height: '60px' }}
                            >
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                    {format(day, 'EEE', { locale: dateLocale })}
                                </span>
                                <span className={cn(
                                    "text-sm font-black mt-0.5 w-7 h-7 flex items-center justify-center rounded-full",
                                    isToday(day) ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-slate-600 dark:text-slate-400"
                                )}>
                                    {format(day, 'd')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rows */}
                <div className="relative min-w-max pb-10">
                    {/* Vertical Grid Lines */}
                    <div className="absolute inset-0 flex pointer-events-none" style={{ paddingLeft: '256px' }}>
                        {days.map((day) => (
                            <div
                                key={day.toISOString()}
                                className={cn(
                                    "h-full border-r",
                                    isWeekend(day) ? "bg-slate-50/30 dark:bg-slate-900/20 border-slate-100/50 dark:border-slate-800/30" : "border-slate-50 dark:border-slate-900"
                                )}
                                style={{ width: `${columnWidth}px` }}
                            />
                        ))}
                    </div>

                    {/* Task Rows */}
                    {tasks.length === 0 ? (
                        <div className="p-20 text-center col-span-full">
                            <Layers className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium">Görüntülenecek görev bulunmuyor.</p>
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <div key={task.id} className="relative flex border-b border-slate-50 dark:border-slate-900 group hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors">
                                {/* Task Info Label (Sticky) */}
                                <div className="sticky left-0 z-10 w-64 min-w-[256px] bg-white group-hover:bg-slate-50/50 dark:bg-slate-950 dark:group-hover:bg-slate-900/50 border-r border-slate-100 dark:border-slate-800 p-4 flex flex-col gap-1 transition-colors">
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                                        {task.title}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[9px] uppercase tracking-tighter h-4 px-1 rounded-sm border-slate-200 text-slate-500">
                                            {task.department}
                                        </Badge>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            P{task.priority}
                                        </span>
                                    </div>
                                </div>

                                {/* Task Bar Area */}
                                <div className="relative h-20 flex-1 py-6">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={cn(
                                                        "absolute h-8 rounded-lg flex items-center px-3 transition-all cursor-pointer group/bar hover:scale-[1.02] shadow-sm",
                                                        getStatusColor(task)
                                                    )}
                                                    style={getTaskStyles(task)}
                                                >
                                                    <span className="text-white text-[11px] font-black truncate drop-shadow-sm">
                                                        {task.title}
                                                    </span>

                                                    {/* Decorative handle-like lines */}
                                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-3 bg-white/20 rounded-full" />
                                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-3 bg-white/20 rounded-full" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="p-3 bg-white dark:bg-slate-900 border-none shadow-2xl rounded-xl z-[100]" side="top" align="center">
                                                <div className="space-y-1.5 min-w-[200px]">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <Badge className={cn("text-[10px] uppercase font-bold", getStatusColor(task))}>
                                                            {task.status}
                                                        </Badge>
                                                        <span className="text-[10px] font-bold text-slate-400">
                                                            P{task.priority}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                                                        {task.title}
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                                                        <div>
                                                            <p className="text-[9px] uppercase font-bold text-slate-400">Başlangıç</p>
                                                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                                {format(new Date(task.start_date), 'd MMM yyyy', { locale: dateLocale })}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] uppercase font-bold text-slate-400">Bitiş</p>
                                                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                                {format(new Date(task.end_date), 'd MMM yyyy', { locale: dateLocale })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
