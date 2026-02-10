---
name: api-route
description: Next.js API route oluşturur. Yeni endpoint eklerken kullan.
---
# API Route Skill

Her API route şu yapıda olmalı:

1. Auth kontrolü (Supabase server client ile)
2. Rol kontrolü (gm, owner, worker)
3. Input validasyonu (Zod schema)
4. İş mantığı
5. Audit log kaydı (değişiklik yapan işlemlerde)
6. Hata yakalama (try-catch, generic error response)

Şablon:
```typescript
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({ /* ... */ })

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Giriş yapmanız gerekiyor' } }, { status: 401 })

    // Rol kontrolü
    // Input validasyonu
    // İş mantığı
    // Audit log
    // Response

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Bir hata oluştu' } }, { status: 500 })
  }
}
```
