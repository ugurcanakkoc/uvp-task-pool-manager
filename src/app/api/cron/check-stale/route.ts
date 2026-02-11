import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const now = new Date()

    try {
        // 1. AUTO-RETURN: 3 gün boyunca ilerleme girilmeyen görevleri iade et
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()

        // Find stale tasks (active/in_progress and not updated in 3 days)
        // Note: Ideally check task_progress table too, but updated_at on tasks should change when progress is added if we used a trigger.
        // For this MVP, we assume updated_at on task is reliable enough or we just check task table for simplicity.
        // To be precise: we should fetch tasks, then check their last progress entry.

        const { data: staleTasks, error: staleError } = await supabase
            .from('tasks')
            .select('id, title, assigned_worker_id')
            .in('status', ['active', 'in_progress'])
            .lt('updated_at', threeDaysAgo)

        if (staleError) throw staleError

        const returnedTasks = []

        for (const task of staleTasks || []) {
            // Double check: has really no progress in last 3 days?
            const { data: recentProgress } = await supabase
                .from('task_progress')
                .select('created_at')
                .eq('task_id', task.id)
                .gte('created_at', threeDaysAgo)
                .limit(1)

            if (!recentProgress?.length) {
                // RETURN TASK
                const { error: updateError } = await supabase
                    .from('tasks')
                    .update({
                        status: 'returned',
                        assigned_worker_id: null,
                        return_reason: 'SİSTEM: 3 gün boyunca ilerleme kaydedilmediği için otomatik iade edildi.',
                        returned_at: now.toISOString(),
                        updated_at: now.toISOString()
                    })
                    .eq('id', task.id)

                if (!updateError) {
                    returnedTasks.push(task.id)

                    // Notify Worker
                    if (task.assigned_worker_id) {
                        await supabase.from('notifications').insert({
                            user_id: task.assigned_worker_id,
                            type: 'system',
                            title: 'Görev İade Edildi',
                            body: `"${task.title}" görevi ilerleme kaydedilmediği için otomatik olarak havuza iade edildi.`
                        })
                    }
                }
            }
        }

        // 2. REVIEW REMINDER: 48 saattir onay bekleyen görevler
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()

        const { data: pendingReviews, error: reviewError } = await supabase
            .from('tasks')
            .select('id, title, owner_id')
            .eq('status', 'review')
            .lt('updated_at', twoDaysAgo)

        if (reviewError) throw reviewError

        const notifiedOwners = []

        for (const task of pendingReviews || []) {
            // Check if we already notified recently? (Skip for MVP complexity)
            // Just send notification

            await supabase.from('notifications').insert({
                user_id: task.owner_id,
                type: 'reminder',
                title: 'Onay Bekleyen Görev',
                body: `"${task.title}" görevi 48 saattir onayınızı bekliyor. Lütfen inceleyiniz.`
            })

            notifiedOwners.push(task.owner_id)
        }

        // 3. DEADLINE REMINDER: Bitiş tarihine 2 gün kalan görevler
        // Get tasks where end_date is exactly 2 days from now (ignoring time for date comparison ideally, but here we use simple ISO check)
        // Simplification: Check tasks where end_date is between 48h and 72h from now? 
        // Or simpler: tasks where end_date = (now + 2 days).toDateString()

        const targetDate = new Date(now)
        targetDate.setDate(targetDate.getDate() + 2)
        const targetDateStr = targetDate.toISOString().split('T')[0] // YYYY-MM-DD

        const { data: deadlineTasks, error: deadlineError } = await supabase
            .from('tasks')
            .select('id, title, assigned_worker_id, end_date')
            .in('status', ['active', 'in_progress'])
            .eq('end_date', targetDateStr)

        if (deadlineError) throw deadlineError

        const notifiedWorkers = []

        for (const task of deadlineTasks || []) {
            if (task.assigned_worker_id) {
                // Check if already notified for this today? (Skip for MVP)

                await supabase.from('notifications').insert({
                    user_id: task.assigned_worker_id,
                    type: 'alert',
                    title: 'Yaklaşan Teslim Tarihi',
                    body: `"${task.title}" görevinin teslimine 2 gün kaldı (${task.end_date}).`
                })
                notifiedWorkers.push(task.assigned_worker_id)
            }
        }

        return NextResponse.json({
            success: true,
            returnedTasksCount: returnedTasks.length,
            reviewRemindersCount: notifiedOwners.length,
            deadlineRemindersCount: notifiedWorkers.length
        })

    } catch (error) {
        console.error('Check stale error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
