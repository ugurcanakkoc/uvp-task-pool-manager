import { describe, it, expect } from 'vitest'
import { isDateInSlot, getUserOccupancyForDate } from './agenda-utils'

describe('agenda-utils', () => {
    describe('isDateInSlot', () => {
        it('should correctly identify static date slots', () => {
            const slot = {
                start_date: '2026-02-10',
                end_date: '2026-02-15',
                is_recurring: false
            }
            expect(isDateInSlot(new Date('2026-02-13'), slot as any)).toBe(true)
            expect(isDateInSlot(new Date('2026-02-16'), slot as any)).toBe(false)
        })

        it('should correctly identify recurring day slots', () => {
            const slot = {
                is_recurring: true,
                recurring_days: [1, 5] // Monday, Friday
            }
            // 2026-02-13 is Friday
            expect(isDateInSlot(new Date('2026-02-13'), slot as any)).toBe(true)
            // 2026-02-12 is Thursday
            expect(isDateInSlot(new Date('2026-02-12'), slot as any)).toBe(false)
        })
    })

    describe('getUserOccupancyForDate', () => {
        it('should calculate total occupancy correctly', () => {
            const date = new Date('2026-02-13') // Friday
            const tasks = [
                { title: 'Task A', status: 'active', start_date: '2026-02-10', end_date: '2026-02-20' }
            ]
            const personalTasks = [
                { title: 'Friday Meeting', is_recurring: true, recurring_days: [5], is_full_day: false, can_support: false }
            ]

            const result = getUserOccupancyForDate(date, tasks, personalTasks)
            // 1 task (25%) + 1 half-day personal (50%) = 75%
            expect(result.percentage).toBe(75)
            expect(result.reason).toBe('Task A')
        })

        it('should return 100% for full day personal tasks', () => {
            const date = new Date('2026-02-13')
            const tasks = []
            const personal = [{ title: 'Vacation', start_date: '2026-02-01', end_date: '2026-02-28', is_full_day: true, is_recurring: false }]

            const result = getUserOccupancyForDate(date, tasks, personal)
            expect(result.percentage).toBe(100)
            expect(result.reason).toBe('Vacation')
        })
    })
})
