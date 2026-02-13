'use client'

import { useMemo } from 'react'
import {
    format,
    eachDayOfInterval,
    startOfMonth,
    endOfMonth,
    isSameDay,
    startOfWeek,
    endOfWeek,
    addMonths,
    subMonths,
    isWeekend
} from 'date-fns'
import { tr, enUS, de } from 'date-fns/locale'
import { useI18nStore } from '@/stores/i18n-store'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface AvailabilityHeatmapProps {
    tasks: any[]      // Proje destek talepleri
    personalTasks: any[] // Kişisel meşguliyetler
    currentDate: Date
    onDateChange: (date: Date) => void
}

export function AvailabilityHeatmap({ tasks, personalTasks, currentDate, onDateChange }: AvailabilityHeatmapProps) {
    const { t, locale } = useI18nStore()
    const dateLocale = locale === 'tr' ? tr : locale === 'de' ? de : enUS

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const days = useMemo(() => {
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    }, [calendarStart, calendarEnd])

    const getDayOccupancy = (day: Date) => {
        const dayOfWeek = day.getDay() === 0 ? 7 : day.getDay()

        // Bu gün için doluluk hesapla
        // 1. Proje Destek Talepleri
        const dayTasks = tasks.filter(task => {
            const start = new Date(task.start_date)
            const end = new Date(task.end_date)
            // Normalize dates to day only for comparison
            const checkDay = new Date(day.getFullYear(), day.getMonth(), day.getDate())
            const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
            const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
            return checkDay >= startDay && checkDay <= endDay
        })

        // 2. Kişisel Meşguliyetler & Ajanda Kayıtları (Statik + Tekrarlayan)
        const dayPersonal = personalTasks.filter(pt => {
            // Statik kontrol
            const start = new Date(pt.start_date)
            const end = new Date(pt.end_date)
            const checkDay = new Date(day.getFullYear(), day.getMonth(), day.getDate())
            const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
            const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())

            const isWithinStaticRange = checkDay >= startDay && checkDay <= endDay

            // Tekrarlayan kontrol
            const isRecurringToday = pt.is_recurring && pt.recurring_days?.includes(dayOfWeek)

            return isWithinStaticRange || isRecurringToday
        })

        // Basit bir puanlama: 
        // Her proje destek talebi: 25% (max 100%)
        // Her tam gün kişisel meşguliyet: 100%
        // Her meşguliyet (tam gün değilse) veya destek olabileceği durumlar (opsiyonel): 50%
        // Not: Eğer can_support ise ve işi yoksa 0% dır ama biz burada meşguliyeti (busy) hesaplıyoruz.

        let total = 0
        dayTasks.forEach(() => total += 25)
        dayPersonal.forEach(pt => {
            // Eğer can_support ise meşguliyet %0 dır (işe yarayabilir ama dolu değil)
            // Ancak meşguliyet tanımı "ne kadar doluyum" olduğu için can_support meşguliyet değildir.
            if (!pt.can_support) {
                total += pt.is_full_day ? 100 : 50
            }
        })

        return Math.min(100, total)
    }

    const getOccupancyColor = (percentage: number) => {
        if (percentage === 0) return 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'
        if (percentage < 30) return 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 text-blue-700'
        if (percentage < 60) return 'bg-blue-300 dark:bg-blue-700/50 border-blue-400 text-blue-800'
        if (percentage < 90) return 'bg-blue-500 dark:bg-blue-500 border-blue-600 text-white'
        return 'bg-blue-700 dark:bg-blue-400 border-blue-800 text-white'
    }

    const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white">
                        {t('availability.occupancy')}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-0.5">
                        {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
                    </p>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => onDateChange(subMonths(currentDate, 1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 rounded-lg font-bold text-[10px] uppercase"
                        onClick={() => onDateChange(new Date())}
                    >
                        {t('common.today')}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => onDateChange(addMonths(currentDate, 1))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
                {weekDays.map(day => (
                    <div key={day} className="text-[10px] font-black uppercase text-slate-400 text-center py-2">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                <TooltipProvider>
                    {days.map((day, i) => {
                        const occupancy = getDayOccupancy(day)
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                        const colorClass = getOccupancyColor(occupancy)
                        const isWeekendDay = isWeekend(day)

                        return (
                            <Tooltip key={i}>
                                <TooltipTrigger asChild>
                                    <div
                                        className={cn(
                                            "aspect-square rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95",
                                            colorClass,
                                            !isCurrentMonth && "opacity-20 grayscale cursor-default hover:scale-100",
                                            isSameDay(day, new Date()) && "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900"
                                        )}
                                    >
                                        <span className="text-[11px] font-black">{format(day, 'd')}</span>
                                        {occupancy > 0 && isCurrentMonth && (
                                            <span className="text-[8px] font-bold mt-0.5 opacity-80">% {occupancy}</span>
                                        )}
                                    </div>
                                </TooltipTrigger>
                                {isCurrentMonth && (
                                    <TooltipContent className="bg-slate-900 text-white border-none rounded-xl p-3 shadow-2xl">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-tight">
                                                {format(day, 'd MMMM EEEE', { locale: dateLocale })}
                                            </p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                {occupancy === 100 ? t('availability.full') : occupancy === 0 ? t('availability.available') : `% ${occupancy} ${t('availability.full')}`}
                                            </p>
                                        </div>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        )
                    })}
                </TooltipProvider>
            </div>

            <div className="mt-6 flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-tight">İpucu</span>
                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight">
                            Renkler gün içindeki toplam iş yoğunluğunu temsil eder.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
