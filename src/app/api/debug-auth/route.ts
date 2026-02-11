
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get('email')

    if (!email) {
        return NextResponse.json({ error: 'Email query parameter is required' }, { status: 400 })
    }

    try {
        const supabase = createAdminClient()

        // 1. Check Public User
        const { data: publicUser, error: publicError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

        // 2. Check Auth User
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
        const authUser = users.find(u => u.email === email)

        return NextResponse.json({
            email,
            publicUser: publicUser || { error: publicError?.message },
            authUser: authUser ? {
                id: authUser.id,
                email: authUser.email,
                confirmed: !!authUser.email_confirmed_at,
                lastSignIn: authUser.last_sign_in_at
            } : { error: 'Not found in auth.users' },
            idMatch: authUser && publicUser ? authUser.id === publicUser.id : 'N/A'
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
