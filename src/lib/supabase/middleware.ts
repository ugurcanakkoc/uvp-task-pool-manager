import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // 3. Role-based Redirection
    const url = request.nextUrl.clone()
    const pathname = url.pathname

    // Public routes (login, etc.)
    const isPublicRoute = pathname === '/login'

    if (!user && !isPublicRoute) {
        // Redirect to login if not authenticated and not on a public route
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (user) {
        // Fetch user role from public.users table
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = userData?.role

        // If on login page and authenticated, redirect to role-specific dashboard
        if (isPublicRoute) {
            if (role === 'gm') url.pathname = '/gm'
            else if (role === 'owner') url.pathname = '/owner'
            else url.pathname = '/worker'
            return NextResponse.redirect(url)
        }

        // Dashboard route protection
        if (pathname.startsWith('/gm') && role !== 'gm') {
            url.pathname = role === 'owner' ? '/owner' : '/worker'
            return NextResponse.redirect(url)
        }
        if (pathname.startsWith('/owner') && role !== 'owner') {
            url.pathname = role === 'gm' ? '/gm' : '/worker'
            return NextResponse.redirect(url)
        }
        if (pathname.startsWith('/worker') && role !== 'worker') {
            url.pathname = role === 'gm' ? '/gm' : '/owner'
            return NextResponse.redirect(url)
        }
    }

    return response
}
