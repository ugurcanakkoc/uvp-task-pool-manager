import { createAdminClient } from '@/lib/supabase/admin'

type PointAction =
    | 'TASK_COMPLETED'
    | 'TASK_COMPLETED_EARLY'
    | 'SIDE_TASK_COMPLETED'
    | 'REVIEW_APPROVED'
    | 'BADGE_EARNED'

const POINTS_MAP: Record<PointAction, number> = {
    'TASK_COMPLETED': 50,
    'TASK_COMPLETED_EARLY': 20, // Bonus
    'SIDE_TASK_COMPLETED': 10,
    'REVIEW_APPROVED': 5, // Review approving counts? Maybe for GM/Owner. Let's stick to worker points.
    'BADGE_EARNED': 100 // Bonus for earning a badge? Or badge is the reward. Let's keep points separate.
}

export async function addPoints(userId: string, amount: number, reason: string, referenceType?: string, referenceId?: string) {
    const supabase = createAdminClient()

    try {
        // 1. Log points
        const { error: logError } = await supabase
            .from('points_log')
            .insert({
                user_id: userId,
                points: amount,
                reason: reason,
                reference_type: referenceType,
                reference_id: referenceId,
            })

        if (logError) throw logError

        // 2. Update user total points
        // We can use RPC `increment_points` if concurrency is high, but for this scale, direct update is fine.
        // Or simpler: User `utilization` update style.
        // Let's first fetch current points.
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('total_points')
            .eq('id', userId)
            .single()

        if (userError) throw userError

        const newTotal = (user.total_points || 0) + amount

        const { error: updateError } = await supabase
            .from('users')
            .update({ total_points: newTotal })
            .eq('id', userId)

        if (updateError) throw updateError

        // 3. Check for new badges
        await checkBadges(userId, newTotal)

        return { success: true, newTotal }
    } catch (error) {
        console.error('Error adding points:', error)
        return { success: false, error }
    }
}

export async function checkBadges(userId: string, totalPoints: number) {
    const supabase = createAdminClient()

    // Define badges logic here or fetch from DB criteria
    // For MVP, let's hardcode some criteria or fetch all badges and check.
    // Assuming `badges` table has `criteria` column which is text description, we might need code logic.
    // Let's hardcode for now for safety and simplicity.

    const BADGE_RULES = [
        { code: 'bronze_worker', minPoints: 100 },
        { code: 'silver_worker', minPoints: 500 },
        { code: 'gold_worker', minPoints: 1000 },
        { code: 'platinum_worker', minPoints: 5000 },
    ]

    for (const rule of BADGE_RULES) {
        if (totalPoints >= rule.minPoints) {
            // Check if already earned
            const { data: existing } = await supabase
                .from('user_badges')
                .select('id')
                .eq('user_id', userId)
            // We need to join with badges table to check code, or assume we know badge_id.
            // Better: Fetch badge ID by code first.
            // Actually, let's just get the badge by code.

            const { data: badge } = await supabase
                .from('badges')
                .select('id')
                .eq('code', rule.code)
                .single()

            if (badge) {
                const { data: hasBadge } = await supabase
                    .from('user_badges')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('badge_id', badge.id)
                    .single()

                if (!hasBadge) {
                    // Award badge!
                    await supabase.from('user_badges').insert({
                        user_id: userId,
                        badge_id: badge.id
                    })

                    // Notify user
                    await supabase.from('notifications').insert({
                        user_id: userId,
                        type: 'alert',
                        title: 'Yeni Rozet Kazandınız!',
                        body: `${rule.code.replace('_', ' ')} rozeti profilinize eklendi.`
                    })
                }
            }
        }
    }
}
