import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { addPoints } from '@/lib/gamification'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = await createClient()
    const adminAuthClient = createAdminClient() // For admin operations if needed, but addPoints handles it.

    try {
        const { taskId, action, note } = await request.json()

        // 1. Auth & Validation
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!taskId || !['approve', 'revision'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        // 2. Fetch Task & Check Permissions
        const { data: task, error: taskFetchError } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single()

        if (taskFetchError || !task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        // Permission check: Owner or GM
        // Allow GM to review any task? Yes. Owner only their tasks.
        const isGM = user.user_metadata?.role === 'gm' || user.role === 'authenticated' // Role check logic needs to be consistent with auth-store or DB
        // Better to fetch user role from DB to be safe
        const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

        const canReview = userData?.role === 'gm' || task.owner_id === user.id

        if (!canReview) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
        }

        // 3. Update Review Record
        // We need to find the latest pending review or create a new one?
        // Usually review is created when worker submits.
        // Let's find the review record that is pending.
        const { data: review, error: reviewFetchError } = await supabase
            .from('task_reviews')
            .select('id')
            .eq('task_id', taskId)
            .eq('review_status', 'pending')
            .order('submitted_at', { ascending: false })
            .limit(1)
            .single()

        if (review) {
            const { error: reviewUpdateError } = await supabase
                .from('task_reviews')
                .update({
                    reviewed_by: user.id,
                    reviewed_at: new Date().toISOString(),
                    review_status: action === 'approve' ? 'approved' : 'revision_requested',
                    review_note: note
                })
                .eq('id', review.id)

            if (reviewUpdateError) throw reviewUpdateError
        } else {
            // Case where maybe manual review without submission? Or error.
            // For MVP let's assume valid flow.
        }

        // 4. Update Task Status
        const newStatus = action === 'approve' ? 'completed' : 'returned'
        const updateData: any = {
            status: newStatus,
            updated_at: new Date().toISOString()
        }

        if (action === 'revision') {
            updateData.return_reason = note
            updateData.returned_at = new Date().toISOString()
        }

        const { error: taskUpdateError } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', taskId)

        if (taskUpdateError) throw taskUpdateError

        // 5. Award Points (only if approved)
        let pointsAwarded = 0
        if (action === 'approve' && task.assigned_worker_id) {
            let points = 50 // Base points
            let reason = `"${task.title}" görevi tamamlandı.`

            // Early completion bonus
            if (task.end_date) {
                const deadline = new Date(task.end_date)
                const now = new Date()
                if (now < deadline) {
                    points += 20
                    reason += ' (Erken teslim bonusu +20)'
                }
            }

            const result = await addPoints(
                task.assigned_worker_id,
                points,
                reason,
                'task',
                taskId
            )

            if (result.success) {
                pointsAwarded = points
            }
        }

        return NextResponse.json({ success: true, pointsAwarded })

    } catch (error) {
        console.error('Review API error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
