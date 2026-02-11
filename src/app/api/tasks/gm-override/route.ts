import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

/**
 * POST /api/tasks/gm-override
 * GM can override task assignments, resolve conflicts, and force-assign tasks.
 * Only accessible by GM role users.
 * 
 * Body: { task_id, action, worker_id?, priority?, reason }
 * Actions: 'force_assign', 'override_priority', 'resolve_conflict', 'return_task'
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabase()
        const body = await req.json()
        const { task_id, action, worker_id, priority, reason } = body

        if (!task_id || !action || !reason) {
            return NextResponse.json(
                { error: 'task_id, action ve reason zorunludur.' },
                { status: 400 }
            )
        }

        // Verify GM role from auth header
        const authHeader = req.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !authUser) {
            return NextResponse.json({ error: 'Geçersiz oturum.' }, { status: 401 })
        }

        // Check role
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', authUser.id)
            .single()

        if (!userData || userData.role !== 'gm') {
            return NextResponse.json({ error: 'Bu işlem sadece GM tarafından yapılabilir.' }, { status: 403 })
        }

        // Get current task
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', task_id)
            .single()

        if (taskError || !task) {
            return NextResponse.json({ error: 'Görev bulunamadı.' }, { status: 404 })
        }

        let updateData: any = {}
        let auditAction = ''

        switch (action) {
            case 'force_assign':
                if (!worker_id) {
                    return NextResponse.json({ error: 'force_assign için worker_id gereklidir.' }, { status: 400 })
                }
                updateData = {
                    assigned_worker_id: worker_id,
                    status: 'in_progress'
                }
                auditAction = `GM Override: Görev zorla atandı. Sebep: ${reason}`
                break

            case 'override_priority':
                if (!priority || priority < 1 || priority > 4) {
                    return NextResponse.json({ error: 'Geçerli bir öncelik değeri (1-4) gereklidir.' }, { status: 400 })
                }
                updateData = { priority }
                auditAction = `GM Override: Öncelik ${task.priority} → ${priority} olarak değiştirildi. Sebep: ${reason}`
                break

            case 'resolve_conflict':
                updateData = {
                    assigned_worker_id: worker_id || task.assigned_worker_id,
                    status: worker_id ? 'in_progress' : task.status
                }
                auditAction = `GM Override: Çakışma çözüldü. Sebep: ${reason}`
                break

            case 'return_task':
                updateData = {
                    assigned_worker_id: null,
                    status: 'open'
                }
                auditAction = `GM Override: Görev havuza iade edildi. Sebep: ${reason}`
                break

            default:
                return NextResponse.json({ error: `Bilinmeyen action: ${action}` }, { status: 400 })
        }

        // Update task
        const { error: updateError } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', task_id)

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        // Log audit entry
        try {
            await supabase.from('audit_logs').insert({
                user_id: authUser.id,
                action: auditAction,
                entity_type: 'task',
                entity_id: task_id,
                details: JSON.stringify({ action, worker_id, priority, reason, previous_state: task })
            })
        } catch {
            console.warn('Audit log insert failed')
        }

        // Create notification for affected users
        const notifyUserIds = [task.owner_id, task.assigned_worker_id, worker_id].filter(Boolean)
        for (const uid of notifyUserIds) {
            if (uid && uid !== authUser.id) {
                try {
                    await supabase.from('notifications').insert({
                        user_id: uid,
                        type: 'gm_override',
                        title: 'GM Kararı',
                        message: auditAction,
                        data: JSON.stringify({ task_id, action })
                    })
                } catch { /* ignore notification failures */ }
            }
        }

        return NextResponse.json({
            success: true,
            message: auditAction,
            task_id,
            updated_fields: updateData
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
