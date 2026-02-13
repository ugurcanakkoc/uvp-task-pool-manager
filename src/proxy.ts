import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Simple in-memory rate limiter
// Note: In a serverless/edge environment (like Vercel), this Map is not shared across all lambda instances.
// For production-grade rate limiting, usage of Redis (e.g., Upstash) is recommended.
const RATE_LIMIT_MAP = new Map<string, { count: number, reset: number }>()

// Configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 100 // requests per window per IP

export async function proxy(request: NextRequest) {
    // 1. Rate Limiting for API routes
    if (request.nextUrl.pathname.startsWith('/api')) {
        // Use headers for IP since 'request.ip' might be deprecated or environment-specific in Next.js 16
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            '127.0.0.1'

        const now = Date.now()
        const record = RATE_LIMIT_MAP.get(ip)

        if (record && now < record.reset) {
            if (record.count >= RATE_LIMIT_MAX) {
                return new NextResponse(
                    JSON.stringify({ error: 'Too Many Requests', message: 'Please try again later.' }),
                    { status: 429, headers: { 'Content-Type': 'application/json' } }
                )
            }
            record.count++
        } else {
            RATE_LIMIT_MAP.set(ip, { count: 1, reset: now + RATE_LIMIT_WINDOW })
        }

        // Simple garbage collection to prevent memory leaks in long-running instances
        if (RATE_LIMIT_MAP.size > 5000) {
            RATE_LIMIT_MAP.clear()
        }
    }

    // 2. Supabase Auth Session Update
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
