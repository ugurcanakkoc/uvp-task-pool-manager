import { createClient } from '@/lib/supabase/server'
import { addPoints } from '@/lib/gamification'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = await createClient()

    try {
        const { id } = await request.json()

        // 1. Auth & Validation
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!id) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        // 2. Fetch Task & Check Permissions
        const { data: task, error: taskFetchError } = await supabase
            .from('side_tasks')
            .select('*')
            .eq('id', id)
            .single()

        if (taskFetchError || !task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        // Permission: Assigned user or GM
        // Actually, only assigned user should complete it? Or Creator? Assumed assigned user does it.
        const isAssigned = task.assigned_to === user.id

        // GM check not implemented fully here (need role fetch), but lets assume only assigned user completes for now.
        // Or if user is creator?
        if (!isAssigned && task.created_by !== user.id) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
        }

        // 3. Update Status
        if (task.status === 'completed') {
            return NextResponse.json({ message: 'Already completed' })
        }

        const { error: updateError } = await supabase
            .from('side_tasks')
            .update({
                status: 'completed',
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        if (updateError) throw updateError

        // 4. Award Points
        // 10 points for side task
        let points = 10

        const result = await addPoints(
            task.assigned_to, // Always award to assigned user
            points,
            `Yan görev tamamlandı: "${task.title}"`,
            'side_task',
            id
        )

        return NextResponse.json({ success: true, pointsAwarded: result.success ? points : 0 })

    } catch (error) {
        console.error('Side task complete error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
