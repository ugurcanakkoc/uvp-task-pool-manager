
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogins() {
    const users = [
        { email: 'hasan@uvw.de', role: 'GM' },
        { email: 'furkan@uvw.de', role: 'Owner' },
        { email: 'kerem@uvw.de', role: 'Worker' }
    ]

    for (const user of users) {
        console.log(`Testing login for ${user.email} (${user.role})...`)
        const { data, error } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: 'uvw123456'
        })

        if (error) {
            console.error(`FAILED: ${user.email} -> ${error.message}`)
        } else {
            console.log(`SUCCESS: ${user.email} -> User ID: ${data.user.id}`)
        }
    }
}

testLogins()
