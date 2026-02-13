import { describe, it, expect, vi } from 'vitest'
import { getUserOccupancyForDate } from '@/lib/utils/agenda-utils'

interface WorkerUser {
    id: string;
    full_name: string;
    department: string;
}

interface ActiveTask {
    assigned_worker_id: string;
    title: string;
    status: string;
    start_date: string;
    end_date: string;
}

interface PersonalTask {
    user_id: string;
    title: string;
    is_recurring: boolean;
    recurring_days: number[] | null;
    is_full_day: boolean;
    can_support: boolean;
    start_date: string;
    end_date: string;
}

// Mocking the utility logic used in Dashboard
function processStaffStatus(
    workers: any[],
    activeTasks: any[],
    personalTasks: any[],
    currentUser: { role: string, department: string }
) {
    const workingList: any[] = []
    const availableList: any[] = []
    const today = new Date('2026-02-13') // Consistent test date

    workers.forEach(worker => {
        const workerTasks = activeTasks.filter(t => t.assigned_worker_id === worker.id)
        const workerPersonal = personalTasks.filter(p => p.user_id === worker.id)

        const occupancy = getUserOccupancyForDate(today, workerTasks, workerPersonal)
        const isBusy = occupancy.percentage > 0
        const isSameDept = worker.department === currentUser.department

        if (isBusy) {
            if (currentUser.role === 'owner' && !isSameDept) return
            workingList.push({
                ...worker,
                current_task: occupancy.reason || "Dolu",
                occupancy_rate: occupancy.percentage
            })
        } else {
            availableList.push(worker)
        }
    })

    return { workingList, availableList }
}

describe('Dashboard Logic Verification', () => {
    const mockWorkers: WorkerUser[] = [
        { id: '1', full_name: 'Hasan Yılmaz', department: 'Yazılım' },
        { id: '2', full_name: 'Ayşe Demir', department: 'Konstrüksiyon' },
        { id: '3', full_name: 'Mehmet Kaya', department: 'Üretim' }
    ]

    const mockActiveTasks: ActiveTask[] = [
        {
            assigned_worker_id: '1',
            title: 'API Optimizasyonu',
            status: 'active',
            start_date: '2026-02-10',
            end_date: '2026-02-20'
        },
        {
            assigned_worker_id: '2',
            title: 'Lazer Kesim',
            status: 'active',
            start_date: '2026-02-10',
            end_date: '2026-02-20'
        }
    ]

    const mockPersonalTasks: PersonalTask[] = [
        {
            user_id: '1',
            title: 'Meeting',
            is_recurring: false,
            recurring_days: null,
            is_full_day: true,
            can_support: false,
            start_date: '2026-02-13',
            end_date: '2026-02-13'
        }
    ]

    it('GM should see all working staff', () => {
        const gmUser = { id: 'gm-1', role: 'gm', department: 'Management' }
        const { workingList, availableList } = processStaffStatus(mockWorkers, mockActiveTasks, mockPersonalTasks, gmUser)

        expect(workingList.length).toBe(2) // Hasan and Ayşe
        expect(availableList.length).toBe(1) // Mehmet
        expect(workingList.find(w => w.id === '1').current_task).toBe('API Optimizasyonu')
    })

    it('Owner should only see working staff from their department', () => {
        const ownerUser = { id: 'owner-1', role: 'owner', department: 'Yazılım' }
        const { workingList, availableList } = processStaffStatus(mockWorkers, mockActiveTasks, mockPersonalTasks, ownerUser)

        expect(workingList.length).toBe(1) // Only Hasan (Yazılım)
        expect(workingList[0].full_name).toBe('Hasan Yılmaz')
        expect(availableList.length).toBe(1) // Mehmet (Konstrüksiyon isn't same dept, but it's not in Working list for this Owner)
        // Wait, Mehmet is available and available list is global.
        expect(availableList.find(w => w.id === '3')).toBeDefined()
    })

    it('Hasan (Worker) logic should correctly identify personal busy status', () => {
        const workerUser = { id: 'worker-1', role: 'worker', department: 'Yazılım', full_name: 'Worker', department_id: '1' }
        const { workingList } = processStaffStatus(
            mockWorkers,
            [],
            [{
                user_id: '1',
                title: 'Kişisel Meşguliyet',
                is_recurring: false,
                recurring_days: null,
                is_full_day: true,
                can_support: false,
                start_date: '2026-02-13',
                end_date: '2026-02-13'
            }],
            workerUser as any
        )
        expect(workingList[0].current_task).toBe('Kişisel Meşguliyet')
    })
})
