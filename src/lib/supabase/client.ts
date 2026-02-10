import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
    if (client) return client

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase URL or Anon Key is missing. Check your .env.local file.')
        return createBrowserClient(
            'https://missing-url.supabase.co',
            'missing-key'
        )
    }

    client = createBrowserClient(supabaseUrl, supabaseAnonKey)
    return client
}
