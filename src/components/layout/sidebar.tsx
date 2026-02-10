'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { navItems } from '@/lib/constants'
import { useAuthStore } from '@/stores/auth-store'
import { useI18nStore } from '@/stores/i18n-store'
import { LogOut, Sparkles } from 'lucide-react'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()
    const { user, logout } = useAuthStore()
    const { t } = useI18nStore()
    const userRole = user?.role as 'gm' | 'owner' | 'worker'

    if (!user) return null

    const filteredItems = navItems.filter((item) => item.roles.includes(userRole))

    return (
        <div className={cn("pb-12 h-full flex flex-col relative overflow-hidden", className)}>
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-400/10 to-transparent rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-20 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/10 to-transparent rounded-full blur-2xl pointer-events-none" />

            <div className="px-6 py-8 relative z-10">
                {/* Logo Section */}
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                        <div className="relative w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
                            UVW Havuz
                        </h1>
                        <p className="text-[10px] text-blue-500/80 font-semibold uppercase tracking-[0.2em]">Management</p>
                    </div>
                </div>

                {/* Navigation */}
                <div className="space-y-1">
                    <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400/70 mb-4">
                        {t('nav.menu')}
                    </p>
                    <ScrollArea className="h-[calc(100vh-280px)] px-1">
                        <div className="space-y-1">
                            {filteredItems.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link key={item.href} href={item.href}>
                                        <Button
                                            variant="ghost"
                                            className={cn(
                                                "w-full justify-start gap-3 h-11 px-4 mb-0.5 transition-all duration-200 relative overflow-hidden rounded-xl",
                                                isActive
                                                    ? "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 hover:from-blue-500/15 hover:to-indigo-500/15 font-semibold shadow-sm border border-blue-200/30 dark:border-blue-800/30 dark:text-blue-400"
                                                    : "text-slate-500 hover:text-slate-800 hover:bg-white/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 font-medium"
                                            )}
                                        >
                                            {isActive && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-full" />
                                            )}
                                            <item.icon className={cn(
                                                "w-[18px] h-[18px] transition-colors",
                                                isActive ? "text-blue-500" : "text-slate-400"
                                            )} />
                                            <span className="text-[13px]">{item.title}</span>
                                        </Button>
                                    </Link>
                                )
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Logout Button */}
            <div className="mt-auto px-6 py-4 border-t border-slate-100/60 dark:border-slate-800/40 relative z-10">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11 px-4 text-slate-400 hover:text-red-500 hover:bg-red-50/80 dark:hover:bg-red-900/10 transition-all duration-200 rounded-xl"
                    onClick={() => logout()}
                >
                    <LogOut className="w-[18px] h-[18px]" />
                    <span className="text-[13px] font-medium">{t('common.logout')}</span>
                </Button>
            </div>
        </div>
    )
}
