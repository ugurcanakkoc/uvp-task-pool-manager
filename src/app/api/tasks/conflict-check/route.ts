import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

/**
 * POST /api/tasks/conflict-check
 * Checks if a worker has scheduling conflicts for a given date range.
 * Also detects escalation-worthy situations (overloaded workers, production constraints).
 * 
 * Body: { worker_id, start_date, end_date, task_id? (exclude self), is_production? }
 */
export async function POST(req: NextRequest) {
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

        // 2. Role check (Must be GM or Owner)
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', authUser.id)
            .single()

        if (!userData || !['gm', 'owner'].includes(userData.role)) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok.' }, { status: 403 })
        }

        const body = await req.json()
        const { worker_id, start_date, end_date, task_id, is_production } = body

        if (!worker_id || !start_date || !end_date) {
            return NextResponse.json(
                { error: 'worker_id, start_date ve end_date zorunludur.' },
                { status: 400 }
            )
        }

        const conflicts: any[] = []
        const warnings: string[] = []

        // 1. Check for overlapping tasks (same worker, date range overlap)
        let overlappingQuery = supabase
            .from('tasks')
            .select('id, title, start_date, end_date, priority, status, is_production')
            .eq('assigned_worker_id', worker_id)
            .in('status', ['in_progress', 'open'])
            .lte('start_date', end_date)
            .gte('end_date', start_date)

        if (task_id) {
            overlappingQuery = overlappingQuery.neq('id', task_id)
        }

        const { data: overlappingTasks, error: overlapError } = await overlappingQuery

        if (overlapError) {
            return NextResponse.json({ error: overlapError.message }, { status: 500 })
        }

        if (overlappingTasks && overlappingTasks.length > 0) {
            for (const t of overlappingTasks) {
                conflicts.push({
                    type: 'date_overlap',
                    task_id: t.id,
                    task_title: t.title,
                    start_date: t.start_date,
                    end_date: t.end_date,
                    priority: t.priority,
                    message: `"${t.title}" görevi ile tarih çakışması var (${t.start_date} - ${t.end_date}).`
                })
            }
        }

        // 2. Check total active task count (overload detection)
        const { count: activeCount } = await supabase
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_worker_id', worker_id)
            .in('status', ['in_progress', 'open'])

        if (activeCount && activeCount >= 3) {
            warnings.push(`Bu çalışanın ${activeCount} aktif görevi var. Yoğunluk yüksek!`)
        }

        if (activeCount && activeCount >= 5) {
            conflicts.push({
                type: 'overload',
                message: `Çalışan zaten ${activeCount} aktif göreve sahip. Eskalasyon gerekebilir.`,
                needs_escalation: true
            })
        }

        // 3. Check for bookings in the date range (buklama çakışması)
        const { data: bookings } = await supabase
            .from('bookings')
            .select('id, worker_id, task_id, booked_date, shift_type')
            .eq('worker_id', worker_id)
            .gte('booked_date', start_date)
            .lte('booked_date', end_date)

        if (bookings && bookings.length > 0) {
            const bookedDates = bookings.map(b => b.booked_date)
            warnings.push(`Bu tarih aralığında ${bookings.length} buklama kaydı var: ${bookedDates.slice(0, 3).join(', ')}${bookings.length > 3 ? '...' : ''}`)
        }

        // 4. Home Office / Production restriction check
        if (is_production) {
            const homeOfficeBookings = bookings?.filter(b => b.shift_type === 'home_office') || []
            if (homeOfficeBookings.length > 0) {
                conflicts.push({
                    type: 'home_office_production',
                    message: `Üretim görevi Home Office günlerine atanamaz. ${homeOfficeBookings.length} Home Office günü çakışıyor.`,
                    dates: homeOfficeBookings.map(b => b.booked_date)
                })
            }
        }

        // 5. Determine if escalation is needed
        const needsEscalation = conflicts.some(c => c.needs_escalation) ||
            conflicts.filter(c => c.type === 'date_overlap').some(c => c.priority <= 2)

        return NextResponse.json({
            has_conflicts: conflicts.length > 0,
            conflicts,
            warnings,
            needs_escalation: needsEscalation,
            active_task_count: activeCount || 0
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
