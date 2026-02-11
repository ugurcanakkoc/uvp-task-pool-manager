import { createClient } from '@/lib/supabase/client'

interface WorkloadCheckResult {
    isOverloaded: boolean
    activeTaskCount: number
    utilization: number
    message?: string
}

export async function checkWorkerLoad(workerId: string): Promise<WorkloadCheckResult> {
    const supabase = createClient()

    // 1. Get worker's current utilization and active tasks count
    const { data: worker, error } = await supabase
        .from('users')
        .select(`
      utilization,
      tasks!assigned_worker_id(count)
    `)
        .eq('id', workerId)
        .eq('tasks.status', 'active') // Only count active tasks
        .single()

    if (error || !worker) {
        console.error('Error checking worker load:', error)
        return { isOverloaded: false, activeTaskCount: 0, utilization: 0 }
    }

    const activeTaskCount = worker.tasks[0]?.count || 0
    const utilization = worker.utilization || 0

    // 2. Define Overload Rules
    // Rule A: Utilization > 100%
    if (utilization > 100) {
        return {
            isOverloaded: true,
            activeTaskCount,
            utilization,
            message: `Kullanıcı kapasitesi dolu (%${utilization}).`
        }
    }

    // Rule B: Active Tasks > 3 (Hard limit example, can be dynamic)
    if (activeTaskCount >= 3) {
        return {
            isOverloaded: true,
            activeTaskCount,
            utilization,
            message: `Kullanıcının üzerinde zaten ${activeTaskCount} aktif görev var.`
        }
    }

    return {
        isOverloaded: false,
        activeTaskCount,
        utilization
    }
}
