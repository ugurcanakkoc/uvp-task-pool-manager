'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles } from 'lucide-react'
import type { Tables } from '@/types/supabase'

const loginSchema = z.object({
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [attempts, setAttempts] = useState(0)
    const router = useRouter()
    const supabase = createClient()
    const { setUser } = useAuthStore()

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    async function onSubmit(data: LoginFormValues) {
        if (attempts >= 5) {
            toast.error('Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.')
            return
        }

        setIsLoading(true)
        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            })

            if (authError) {
                setAttempts((prev) => prev + 1)
                throw authError
            }

            if (!authData.user) {
                throw new Error('Kullanıcı bilgisi alınamadı')
            }

            // Kullanıcı profilini al
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', authData.user.id)
                .single()

            if (userError) throw userError

            // Store'a direkt kaydet - auth hook'u beklemeye gerek yok
            setUser(userData as Tables<'users'>)

            toast.success('Giriş başarılı! Yönlendiriliyorsunuz...')

            const role = userData.role
            if (role === 'gm') router.push('/gm')
            else if (role === 'owner') router.push('/owner')
            else router.push('/worker')

        } catch (error: any) {
            // AbortError'ları yok say
            if (error?.name === 'AbortError') return
            toast.error(error.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 px-4 relative overflow-hidden">
            {/* Premium Gradient Orbs */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/8 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/8 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-sky-400/5 rounded-full blur-[100px]" />
            </div>

            {/* Dot Grid */}
            <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05]"
                style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <Card className="w-full max-w-md shadow-2xl shadow-blue-500/5 border-slate-200/60 dark:border-slate-800/60 z-10 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 overflow-hidden rounded-2xl">
                <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />
                <CardHeader className="space-y-2 text-center pb-8 pt-10">
                    <div className="mx-auto relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                        <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                            <Sparkles className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-slate-950 to-slate-600 dark:from-white dark:to-slate-400">
                        Hoş Geldiniz
                    </CardTitle>
                    <CardDescription className="text-base font-medium text-slate-500 dark:text-slate-400">
                        Merkezi Havuz Yönetim Sistemi
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold">E-posta</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="ad.soyad@uvw.de"
                                {...form.register('email')}
                                className={`h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all ${form.formState.errors.email ? 'border-destructive' : ''}`}
                            />
                            {form.formState.errors.email && (
                                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-semibold">Şifre</Label>
                                <Button variant="link" className="px-0 font-normal h-auto text-xs text-blue-500" type="button">
                                    Şifremi Unuttum
                                </Button>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                {...form.register('password')}
                                className={`h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all ${form.formState.errors.password ? 'border-destructive' : ''}`}
                            />
                            {form.formState.errors.password && (
                                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                            )}
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Giriş yapılıyor...
                                </>
                            ) : (
                                'Giriş Yap'
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pb-8">
                    <div className="text-sm text-center text-muted-foreground">
                        Sistem ile ilgili sorun yaşıyorsanız <span className="text-blue-500 font-medium cursor-pointer hover:underline">BT Departmanı</span> ile iletişime geçin.
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
