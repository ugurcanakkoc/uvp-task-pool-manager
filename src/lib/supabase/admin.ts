import { createClient } from '@supabase/supabase-js'

// Bu client sadece sunucu tarafında (Server Actions, API Routes) kullanılmalıdır!
// Service Role Key, RLS politikalarını by-pass eder ve tüm yetkilere sahiptir.
export const createAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is essential for admin operations.')
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
