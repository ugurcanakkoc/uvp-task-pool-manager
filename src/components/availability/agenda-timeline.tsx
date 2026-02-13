'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
    format,
    differenceInDays,
    startOfDay,
    addDays,
    isWithinInterval,
    eachDayOfInterval,
    isSameDay,
    parseISO,
    isWeekend
} from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { useI18nStore } from '@/stores/i18n-store'
import { cn } from '@/lib/utils'
import { AlertCircle, Briefcase, CheckCircle2, Info, Trash2, Calendar as CalendarIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AgendaItem {
    id: string
    title: string
    description?: string
    start_date: string
    end_date: string
    is_recurring: boolean
    recurring_days?: number[]
    can_support: boolean
    type: 'personal' | 'project_task'
    is_full_day: boolean
    status?: string
    priority?: number
    department?: string
}

interface AgendaTimelineProps {
    tasks: AgendaItem[]
    startDate: Date
    onCancelTask?: (id: string) => void
    onEditTask?: (task: AgendaItem) => void
    onUpdateTaskDates?: (id: string, start: Date, end: Date) => Promise<void>
    isManager?: boolean
}

export function AgendaTimeline({ tasks, startDate, onCancelTask, onEditTask, onUpdateTaskDates, isManager }: AgendaTimelineProps) {
    const { locale, t } = useI18nStore()
    const dateLocale = locale === 'tr' ? tr : enUS
    const daysToShow = 14
    const endDate = addDays(startDate, daysToShow - 1)

    const days = useMemo(() => {
        return eachDayOfInterval({ start: startDate, end: endDate })
    }, [startDate])

    // Pre-process tasks to expand recurring items and handle multi-day spanning
    const processedData = useMemo(() => {
        const items: any[] = []

        tasks.forEach(task => {
            const taskStart = parseISO(task.start_date)
            const taskEnd = parseISO(task.end_date)

            if (task.is_recurring && task.recurring_days) {
                // Expand recurring tasks into individual day items for display
                days.forEach(day => {
                    const dayNum = day.getDay() === 0 ? 7 : day.getDay()
                    if (task.recurring_days?.includes(dayNum)) {
                        items.push({
                            ...task,
                            id: `${task.id}-${day.toISOString()}`,
                            originalId: task.id,
                            displayStart: day,
                            displayEnd: day,
                            actualStart: taskStart,
                            actualEnd: taskEnd
                        })
                    }
                })
            } else {
                // Check if task falls within our visible range
                const visibleStart = startDate
                const visibleEnd = endDate

                const isVisible = (
                    isWithinInterval(taskStart, { start: visibleStart, end: visibleEnd }) ||
                    isWithinInterval(taskEnd, { start: visibleStart, end: visibleEnd }) ||
                    (isBefore(taskStart, visibleStart) && isAfter(taskEnd, visibleEnd))
                )

                if (isVisible) {
                    items.push({
                        ...task,
                        originalId: task.id,
                        displayStart: isBefore(taskStart, visibleStart) ? visibleStart : taskStart,
                        displayEnd: isAfter(taskEnd, visibleEnd) ? visibleEnd : taskEnd,
                        actualStart: taskStart,
                        actualEnd: taskEnd
                    })
                }
            }
        })

        // Leveling/Stacking Logic
        const levels: any[][] = []
        const itemLayout = new Map<string, { level: number; hasOverlap: boolean; conflictingTitles: string[] }>()

        // Sort by start date then duration
        const sorted = items.sort((a, b) => {
            const diff = a.displayStart.getTime() - b.displayStart.getTime()
            if (diff !== 0) return diff
            return (b.displayEnd.getTime() - b.displayStart.getTime()) - (a.displayEnd.getTime() - a.displayStart.getTime())
        })

        sorted.forEach(item => {
            let level = 0
            while (true) {
                if (!levels[level]) levels[level] = []
                const collision = levels[level].some(other => {
                    return isBefore(item.displayStart, addDays(other.displayEnd, 1)) && isAfter(addDays(item.displayEnd, 1), other.displayStart)
                })
                if (!collision) {
                    levels[level].push(item)
                    break
                }
                level++
            }

            const conflicts = items.filter(other => {
                if (other.id === item.id) return false
                return isBefore(item.displayStart, addDays(other.displayEnd, 1)) && isAfter(addDays(item.displayEnd, 1), other.displayStart)
            })

            const hasOverlap = conflicts.length > 0
            const conflictingTitles = conflicts.map(c => c.title)

            itemLayout.set(item.id, { level, hasOverlap, conflictingTitles })
        })

        return { items: sorted, itemLayout, maxLevel: levels.length }
    }, [tasks, startDate])

    // Drag and Resize State
    const [dragState, setDragState] = useState<{
        type: 'move' | 'resize-start' | 'resize-end'
        itemId: string
        initialX: number
        initialStart: Date
        initialEnd: Date
        currentStart: Date
        currentEnd: Date
    } | null>(null)

    const timelineRef = useRef<HTMLDivElement>(null)

    const handleMouseDown = (e: React.MouseEvent, item: any, type: 'move' | 'resize-start' | 'resize-end') => {
        if (item.type !== 'personal') return // Read-only for project tasks
        e.preventDefault() // Prevent text selection
        e.stopPropagation()
        setDragState({
            type,
            itemId: item.originalId,
            initialX: e.clientX,
            initialStart: item.actualStart,
            initialEnd: item.actualEnd,
            currentStart: item.actualStart,
            currentEnd: item.actualEnd
        })
    }

    useEffect(() => {
        if (!dragState) return

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - dragState.initialX
            const columnWidthPx = timelineRef.current!.offsetWidth / daysToShow
            const daysOffset = Math.round(deltaX / columnWidthPx)

            if (dragState.type === 'move') {
                const newStart = addDays(dragState.initialStart, daysOffset)
                const newEnd = addDays(dragState.initialEnd, daysOffset)
                setDragState(prev => prev ? { ...prev, currentStart: newStart, currentEnd: newEnd } : null)
            } else if (dragState.type === 'resize-start') {
                const newStart = addDays(dragState.initialStart, daysOffset)
                // Prevent start from going after end
                if (isBefore(newStart, addDays(dragState.initialEnd, 1))) {
                    setDragState(prev => prev ? { ...prev, currentStart: newStart } : null)
                }
            } else if (dragState.type === 'resize-end') {
                const newEnd = addDays(dragState.initialEnd, daysOffset)
                // Prevent end from going before start
                if (isAfter(addDays(newEnd, 1), dragState.initialStart)) {
                    setDragState(prev => prev ? { ...prev, currentEnd: newEnd } : null)
                }
            }
        }

        const handleMouseUp = async () => {
            if (dragState && onUpdateTaskDates) {
                const finalStart = startOfDay(dragState.currentStart)
                const finalEnd = startOfDay(isBefore(dragState.currentEnd, dragState.currentStart) ? dragState.currentStart : dragState.currentEnd)

                if (finalStart.getTime() !== startOfDay(dragState.initialStart).getTime() ||
                    finalEnd.getTime() !== startOfDay(dragState.initialEnd).getTime()) {
                    await onUpdateTaskDates(dragState.itemId, finalStart, finalEnd)
                }
            }
            setDragState(null)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [dragState, onUpdateTaskDates, daysToShow])

    function isBefore(date1: Date, date2: Date) {
        return date1.getTime() < date2.getTime()
    }
    function isAfter(date1: Date, date2: Date) {
        return date1.getTime() > date2.getTime()
    }

    const columnWidth = 100 / daysToShow

    return (
        <div
            ref={timelineRef}
            className={cn(
                "w-full flex flex-col bg-white dark:bg-slate-900/50 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden",
                dragState && "select-none cursor-grabbing"
            )}
        >
            {/* Timeline Header (Days) */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                {days.map((day, idx) => (
                    <div
                        key={day.toISOString()}
                        style={{ width: `${columnWidth}%` }}
                        className={cn(
                            "h-20 flex flex-col items-center justify-center border-r border-slate-100 dark:border-slate-800 last:border-r-0",
                            isWeekend(day) && "bg-slate-100/30 dark:bg-slate-800/20",
                            isSameDay(day, new Date()) && "bg-indigo-50/50 dark:bg-indigo-900/20"
                        )}
                    >
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            {format(day, 'EEE', { locale: dateLocale })}
                        </span>
                        <span className={cn(
                            "text-lg font-black w-9 h-9 flex items-center justify-center rounded-xl",
                            isSameDay(day, new Date()) ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-slate-700 dark:text-slate-300"
                        )}>
                            {format(day, 'd')}
                        </span>
                        <span className="text-[9px] font-medium text-slate-400 mt-1 uppercase">
                            {format(day, 'MMM', { locale: dateLocale })}
                        </span>
                    </div>
                ))}
            </div>

            {/* Grid Area */}
            <div className="relative min-h-[500px] bg-white dark:bg-slate-950">
                {/* Vertical Lines */}
                <div className="absolute inset-0 flex pointer-events-none">
                    {days.map((day, idx) => (
                        <div
                            key={idx}
                            style={{ width: `${columnWidth}%` }}
                            className={cn(
                                "h-full border-r border-slate-50 dark:border-slate-900/50 last:border-r-0",
                                isWeekend(day) && "bg-slate-50/30 dark:bg-slate-900/10"
                            )}
                        />
                    ))}
                </div>

                {/* Items */}
                <div
                    className="relative p-6"
                    style={{ height: `${(processedData.maxLevel || 1) * 90 + 100}px` }}
                >
                    {processedData.items.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 dark:text-slate-800">
                            <CalendarIcon className="w-20 h-20 mb-4 opacity-20" />
                            <p className="font-black uppercase tracking-[0.2em] text-sm opacity-50">Planlı İş Bulunmuyor</p>
                        </div>
                    ) : (
                        processedData.items.map((item) => {
                            const isDragging = dragState?.itemId === item.originalId
                            const layout = processedData.itemLayout.get(item.id)

                            // Use live dates if dragging
                            const start = isDragging && dragState ? dragState.currentStart : item.displayStart
                            const end = isDragging && dragState ? dragState.currentEnd : item.displayEnd

                            const offset = differenceInDays(start, startDate)
                            const duration = differenceInDays(end, start) + 1

                            const left = offset * columnWidth
                            const width = duration * columnWidth

                            return (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "absolute h-20 rounded-3xl flex flex-col justify-center px-6 group border-2",
                                        !isDragging && "transition-all hover:scale-[1.01] hover:shadow-xl cursor-pointer",
                                        item.type === 'personal'
                                            ? "bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-300 shadow-indigo-500/5"
                                            : "bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-300 shadow-emerald-500/5",
                                        layout?.hasOverlap && "border-amber-200 dark:border-amber-900/50",
                                        isDragging && "z-50 opacity-80 border-indigo-500 shadow-2xl ring-4 ring-indigo-500/20 scale-100 cursor-grabbing"
                                    )}
                                    style={{
                                        left: `${left}%`,
                                        width: `${width}%`,
                                        top: `${(layout?.level || 0) * 95 + 24}px`,
                                        zIndex: dragState?.itemId === item.originalId ? 50 : 10,
                                        opacity: dragState?.itemId === item.originalId ? 0.6 : 1,
                                        transform: dragState?.itemId === item.originalId ? 'scale(1.02)' : 'none'
                                    }}
                                    onClick={() => !dragState && onEditTask?.(item)}
                                >
                                    {/* Drag Handles (Visible on hover or while dragging) */}
                                    {item.type === 'personal' && !dragState && (
                                        <>
                                            <div
                                                className="absolute left-0 top-0 bottom-0 w-8 cursor-ew-resize flex items-center justify-start -ml-2 z-20 group/handle"
                                                onMouseDown={(e) => handleMouseDown(e, item, 'resize-start')}
                                            >
                                                <div className="w-5 h-5 bg-white border-2 border-indigo-600 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" />
                                            </div>
                                            <div
                                                className="absolute right-0 top-0 bottom-0 w-8 cursor-ew-resize flex items-center justify-end -mr-2 z-20 group/handle"
                                                onMouseDown={(e) => handleMouseDown(e, item, 'resize-end')}
                                            >
                                                <div className="w-5 h-5 bg-white border-2 border-indigo-600 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" />
                                            </div>
                                            {/* Move Handle (Entire bar except edges) */}
                                            <div
                                                className="absolute inset-x-6 top-0 bottom-0 cursor-move"
                                                onMouseDown={(e) => handleMouseDown(e, item, 'move')}
                                            />
                                        </>
                                    )}

                                    <div className="flex items-center justify-between gap-3 overflow-hidden">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={cn(
                                                "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:rotate-6",
                                                item.type === 'personal' ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"
                                            )}>
                                                {item.type === 'project_task' ? <Briefcase className="w-5 h-5" /> : <CalendarIcon className="w-5 h-5" />}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-black text-sm uppercase tracking-tight truncate dark:text-white">
                                                    {item.title}
                                                </span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                        {format(start, 'd MMM')}
                                                        {differenceInDays(end, start) > 0 && ` - ${format(end, 'd MMM')}`}
                                                    </span>
                                                    {item.can_support && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {layout?.hasOverlap && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                                                                <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-amber-950 text-amber-200 border-none rounded-xl p-3 shadow-xl">
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center gap-2 text-amber-200">
                                                                    <AlertCircle className="w-4 h-4" />
                                                                    <p className="text-xs font-black uppercase tracking-wider">Çakışan Destek Talepleri</p>
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    {layout?.conflictingTitles?.map((title, i) => (
                                                                        <div key={i} className="flex items-center gap-2 bg-amber-900/40 p-1.5 rounded-lg border border-amber-800/50">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                                            <p className="text-[11px] font-bold text-amber-50">{title}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <p className="text-[10px] text-amber-400/80 italic mt-1 font-medium">Bu zaman diliminde {layout?.conflictingTitles?.length} destek talebi çakışıyor.</p>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}

                                            {isManager && item.type === 'personal' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 opacity-0 group-hover:opacity-100 transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onCancelTask?.(item.originalId)
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
