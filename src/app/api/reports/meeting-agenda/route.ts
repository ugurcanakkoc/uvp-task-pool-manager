import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

/**
 * GET /api/reports/meeting-agenda
 * Generates an automated weekly meeting agenda with:
 * - Overdue tasks
 * - High priority tasks in progress
 * - Escalation items (conflicts, returned tasks)
 * - Anti-manipulation alerts summary
 * - Worker workload overview
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabase()

        // 1. Auth check
        const authHeader = req.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !authUser) {
            return NextResponse.json({ error: 'Geçersiz oturum.' }, { status: 401 })
        }

        // 2. Role check (Must be GM)
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', authUser.id)
            .single()

        if (!userData || userData.role !== 'gm') {
            return NextResponse.json({ error: 'Bu rapor sadece GM tarafından görüntülenebilir.' }, { status: 403 })
        }

        const now = new Date()

        // 1. Overdue tasks (end_date passed, not completed)
        const { data: overdueTasks } = await supabase
            .from('tasks')
            .select('id, title, department, priority, end_date, assigned_worker_id')
            .in('status', ['open', 'in_progress'])
            .lt('end_date', now.toISOString().split('T')[0])
            .order('priority', { ascending: true })

        // 2. High priority tasks in progress
        const { data: highPriority } = await supabase
            .from('tasks')
            .select('id, title, department, priority, start_date, end_date, assigned_worker_id')
            .in('priority', [1, 2])
            .eq('status', 'in_progress')
            .order('priority', { ascending: true })

        // 3. Returned / escalated tasks
        const { data: returnedTasks } = await supabase
            .from('tasks')
            .select('id, title, department, priority')
            .eq('status', 'returned')
            .order('created_at', { ascending: false })
            .limit(10)

        // 4. Tasks pending review
        const { data: reviewTasks } = await supabase
            .from('tasks')
            .select('id, title, department, priority')
            .eq('status', 'review')
            .order('created_at', { ascending: false })

        // 5. Worker workload
        const { data: workers } = await supabase
            .from('users')
            .select('id, full_name')
            .eq('role', 'worker')
            .eq('is_active', true)

        const workerLoads: { name: string; active: number; overdue: number }[] = []
        if (workers) {
            for (const w of workers) {
                const { count: active } = await supabase
                    .from('tasks')
                    .select('id', { count: 'exact', head: true })
                    .eq('assigned_worker_id', w.id)
                    .in('status', ['in_progress', 'open'])

                const overdueCount = overdueTasks?.filter(t => t.assigned_worker_id === w.id).length || 0

                workerLoads.push({
                    name: w.full_name,
                    active: active || 0,
                    overdue: overdueCount
                })
            }
        }

        // Build agenda
        const agenda = {
            generated_at: now.toISOString(),
            title: `Haftalık Toplantı Gündemi — ${now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
            sections: [
                {
                    title: '🔴 Gecikmeli Görevler',
                    priority: 'critical',
                    items: overdueTasks?.map(t => ({
                        id: t.id,
                        title: t.title,
                        department: t.department,
                        priority: t.priority,
                        end_date: t.end_date
                    })) || [],
                    count: overdueTasks?.length || 0
                },
                {
                    title: '🟠 Yüksek Öncelikli Aktif Görevler',
                    priority: 'high',
                    items: highPriority?.map(t => ({
                        id: t.id,
                        title: t.title,
                        department: t.department,
                        priority: t.priority,
                        end_date: t.end_date
                    })) || [],
                    count: highPriority?.length || 0
                },
                {
                    title: '🔄 İnceleme Bekleyen Görevler',
                    priority: 'medium',
                    items: reviewTasks?.map(t => ({
                        id: t.id,
                        title: t.title,
                        department: t.department
                    })) || [],
                    count: reviewTasks?.length || 0
                },
                {
                    title: '⚠️ İade Edilen Görevler',
                    priority: 'warning',
                    items: returnedTasks?.map(t => ({
                        id: t.id,
                        title: t.title,
                        department: t.department
                    })) || [],
                    count: returnedTasks?.length || 0
                },
                {
                    title: '👥 Çalışan Yoğunluk Tablosu',
                    priority: 'info',
                    items: workerLoads.sort((a, b) => b.active - a.active),
                    count: workerLoads.length
                }
            ]
        }

        return NextResponse.json(agenda)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
