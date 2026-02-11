'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, User, Bell, Shield, Globe } from 'lucide-react'

export default function SettingsPage() {
    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Ayarlar</h1>
                    <p className="text-sm text-slate-500 text-pretty"> Uygulama ve profil tercihlerinizi buradan yönetin. </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm cursor-not-allowed opacity-70">
                        <CardHeader className="pb-3 text-center md:text-left">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center mx-auto md:mx-0 mb-3">
                                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <CardTitle className="text-sm font-bold">Profil Ayarları</Highlight>
                            <CardDescription className="text-xs">Kişisel bilgilerinizi ve avatarınızı güncelleyin.</CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm cursor-not-allowed opacity-70">
                        <CardHeader className="pb-3 text-center md:text-left">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/40 flex items-center justify-center mx-auto md:mx-0 mb-3">
                                <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <CardTitle className="text-sm font-bold">Bildirimler</CardTitle>
                            <CardDescription className="text-xs">Hangi durumlarda bildirim alacağınızı seçin.</CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm cursor-not-allowed opacity-70">
                        <CardHeader className="pb-3 text-center md:text-left">
                            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/40 flex items-center justify-center mx-auto md:mx-0 mb-3">
                                <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <CardTitle className="text-sm font-bold">Dil ve Bölge</CardTitle>
                            <CardDescription className="text-xs">Uygulama dilini (TR/EN) buradan değiştirebilirsiniz.</CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm cursor-not-allowed opacity-70">
                        <CardHeader className="pb-3 text-center md:text-left">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/40 flex items-center justify-center mx-auto md:mx-0 mb-3">
                                <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <CardTitle className="text-sm font-bold">Güvenlik</CardTitle>
                            <CardDescription className="text-xs">Şifre değiştirme ve iki faktörlü doğrulama.</CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                <div className="p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/20 text-center">
                    <p className="text-sm text-blue-600/70 dark:text-blue-400/70 italic">
                        Ayarlar sayfası şu an yapım aşamasındadır. Yakında aktif olacaktır.
                    </p>
                </div>
            </div>
        </DashboardLayout>
    )
}
