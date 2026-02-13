'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { navItems } from '@/lib/constants'
import { useAuthStore } from '@/stores/auth-store'
import { useI18nStore } from '@/stores/i18n-store'
import { LogOut, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useAuthStore()
    const { t } = useI18nStore()
    const supabase = createClient()
    const userRole = user?.role as 'gm' | 'owner' | 'worker'

    if (!user) return null

    const handleLogout = async () => {
        await supabase.auth.signOut()
        logout()
        router.replace('/login')
    }

    const filteredItems = navItems.filter((item) => item.roles.includes(userRole))

    return (
        <div className={cn("pb-10 h-full flex flex-col relative overflow-hidden bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800", className)}>
            <div className="px-6 py-8">
                {/* Logo Section */}
                <div className="flex items-center gap-3 mb-12 px-2 justify-center border-b border-slate-100/50 pb-8 dark:border-slate-800/50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 text-white">
                            <Sparkles className="w-5 h-5 fill-current" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-white leading-none">
                                HAVUZ
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">YÖNETİM</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="space-y-1">
                    <ScrollArea className="h-[calc(100vh-250px)] px-2">
                        <div className="space-y-1.5 p-1">
                            {filteredItems.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link key={item.href} href={item.href}>
                                        <Button
                                            variant="ghost"
                                            className={cn(
                                                "w-full justify-start gap-4 h-12 px-5 transition-all duration-300 relative overflow-hidden rounded-xl",
                                                isActive
                                                    ? "text-blue-600 font-bold bg-blue-50/50 dark:bg-blue-900/10"
                                                    : "text-slate-500 hover:text-blue-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 font-medium"
                                            )}
                                        >
                                            <item.icon className={cn(
                                                "w-5 h-5 transition-colors",
                                                isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"
                                            )} />
                                            <span className="text-sm tracking-tight">{item.title}</span>

                                            {/* Spike Admin Style Active Indicator */}
                                            {isActive && (
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-blue-600 rounded-l-md" />
                                            )}
                                        </Button>
                                    </Link>
                                )
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* User Profile Footer (Spike Admin Style) */}
            <div className="mt-auto px-6 pb-6">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-600/20">
                            {user.full_name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-700 dark:text-white truncate">
                            {user.full_name}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            {userRole.toUpperCase()}
                        </p>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                        onClick={handleLogout}
                        title={t('common.logout')}
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
