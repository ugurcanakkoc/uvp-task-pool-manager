import { startOfDay } from 'date-fns'

export interface RecurringSlot {
    is_recurring: boolean
    recurring_days: number[] | null
    start_date: string
    end_date: string
}

/**
 * Checks if a specific date matches a recurring slot's criteria.
 */
export function isDateInSlot(date: Date, slot: RecurringSlot): boolean {
    const checkDate = startOfDay(date)
    const dayOfWeek = checkDate.getDay() === 0 ? 7 : checkDate.getDay() // 1=Mon, 7=Sun

    // 1. Static check (non-recurring)
    if (!slot.is_recurring) {
        const start = startOfDay(new Date(slot.start_date))
        const end = startOfDay(new Date(slot.end_date))
        return checkDate >= start && checkDate <= end
    }

    // 2. Recurring check
    if (slot.is_recurring && slot.recurring_days) {
        // If it's recurring, we check if the day of week matches
        return slot.recurring_days.includes(dayOfWeek)
    }

    return false
}

/**
 * Calculates total occupancy for a user on a specific date.
 */
export function getUserOccupancyForDate(
    date: Date,
    tasks: any[],
    personalTasks: any[]
): { percentage: number, reason: string | null } {
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay()

    // 1. Project Tasks (active/in_progress/requested/review)
    const activeTasks = tasks.filter(t => {
        const busyStatuses = ['active', 'in_progress', 'requested', 'review']
        if (!busyStatuses.includes(t.status)) return false

        // Use UTC-safe parsing for date strings from DB
        const start = startOfDay(new Date(t.start_date))
        const end = startOfDay(new Date(t.end_date))
        const check = startOfDay(date)
        return check >= start && check <= end
    })

    // 2. Personal Tasks (busy)
    const busyPersonal = personalTasks.filter(pt => {
        if (pt.can_support) return false // Support available is not "booked"
        return isDateInSlot(date, pt)
    })

    let total = 0
    let reasons: string[] = []

    activeTasks.forEach(t => {
        total += 25
        reasons.push(t.title)
    })

    busyPersonal.forEach(pt => {
        total += pt.is_full_day ? 100 : 50
        reasons.push(pt.title)
    })

    return {
        percentage: Math.min(100, total),
        reason: reasons.length > 0 ? reasons[0] : null
    }
}
