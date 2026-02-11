'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useI18nStore } from '@/stores/i18n-store'
import type { Locale } from '@/lib/i18n'
import {
    Bell,
    Search,
    Menu,
    ChevronDown,
    User,
    Settings,
    LogOut,
    HelpCircle,
    Globe
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"
import { NotificationsPopover } from '@/components/layout/notifications-popover'

const LOCALE_LABELS: Record<Locale, string> = {
    tr: '🇹🇷 Türkçe',
    en: '🇬🇧 English',
    de: '🇩🇪 Deutsch',
}

export function Header() {
    const router = useRouter()
    const { user, logout } = useAuthStore()
    const { t, locale, setLocale } = useI18nStore()
    const supabase = createClient()

    if (!user) return null

    const handleLogout = async () => {
        await supabase.auth.signOut()
        logout()
        router.replace('/login')
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'gm': return 'GM'
            case 'owner': return 'Owner'
            case 'worker': return 'Worker'
            default: return role
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'gm': return 'from-rose-500 to-red-600'
            case 'owner': return 'from-blue-500 to-indigo-600'
            case 'worker': return 'from-emerald-500 to-teal-600'
            default: return 'from-slate-500 to-slate-600'
        }
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200/40 bg-white/70 px-4 md:px-8 backdrop-blur-xl backdrop-saturate-150 dark:border-slate-800/40 dark:bg-slate-950/70">
            {/* Mobile Menu */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                    <Sidebar />
                </SheetContent>
            </Sheet>

            {/* Search Bar */}
            <div className="flex-1 hidden md:flex items-center gap-4">
                <div className="relative w-full max-w-md group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        placeholder={t('common.search')}
                        className="pl-10 bg-slate-100/60 border-transparent hover:bg-slate-100 focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-500/10 transition-all h-10 text-sm rounded-xl"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
                {/* Language Switcher */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                            <Globe className="h-[18px] w-[18px] text-slate-500" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 backdrop-blur-xl border-slate-200/60 shadow-xl rounded-xl">
                        {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(([key, label]) => (
                            <DropdownMenuItem
                                key={key}
                                onClick={() => setLocale(key)}
                                className={`py-2.5 cursor-pointer rounded-lg ${locale === key ? 'bg-blue-50 text-blue-600 font-semibold dark:bg-blue-900/20 dark:text-blue-400' : ''}`}
                            >
                                {label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Notifications */}
                <NotificationsPopover />

                {/* User Profile */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="pl-1.5 pr-3 h-10 gap-2.5 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-all rounded-xl border border-slate-100 dark:border-slate-800">
                            <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                                <AvatarImage src={user.avatar_url || ''} />
                                <AvatarFallback className={`bg-gradient-to-br ${getRoleColor(user.role)} text-white text-[10px] font-bold`}>
                                    {user.full_name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-left hidden lg:block">
                                <p className="text-[13px] font-semibold text-slate-800 dark:text-white leading-none mb-0.5">{user.full_name}</p>
                                <div className="flex items-center gap-1.5">
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-gradient-to-r ${getRoleColor(user.role)} text-white`}>
                                        {getRoleBadge(user.role)}
                                    </span>
                                    <ChevronDown className="h-3 w-3 text-slate-400" />
                                </div>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mt-1.5 shadow-2xl border-slate-200/60 dark:border-slate-800/60 backdrop-blur-xl rounded-xl">
                        <DropdownMenuLabel className="font-normal text-xs text-slate-400 py-3 px-3">
                            {user.email}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2.5 py-2.5 cursor-pointer rounded-lg mx-1" onClick={() => router.push('/profile')}>
                            <User className="h-4 w-4 text-slate-400" /> {t('common.profile')}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2.5 py-2.5 cursor-pointer rounded-lg mx-1" onClick={() => router.push('/settings')}>
                            <Settings className="h-4 w-4 text-slate-400" /> {t('common.settings')}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2.5 py-2.5 cursor-pointer rounded-lg mx-1">
                            <HelpCircle className="h-4 w-4 text-slate-400" /> Destek Al
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="gap-2.5 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-900/20 rounded-lg mx-1"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" /> {t('common.logout')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
