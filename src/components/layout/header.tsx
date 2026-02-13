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
import { NotificationBell } from '@/components/notifications/notification-bell'
import { ModeToggle } from '@/components/mode-toggle'
import { cn } from '@/lib/utils'

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

    return (
        <header className="sticky top-4 z-30 mx-4 md:mx-6 mb-4 flex h-[88px] items-center gap-4 bg-white/80 px-6 backdrop-blur-xl rounded-[30px] shadow-sm border border-slate-100 dark:bg-slate-900/80 dark:border-slate-800 transition-all duration-300">
            {/* Mobile Menu */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden text-slate-500 hover:text-blue-600">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 border-r-0">
                    <Sidebar />
                </SheetContent>
            </Sheet>

            {/* Current Page Title (Optional) or Breadcrumbs could go here */}
            <div className="hidden md:block">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Dashboard</h2>
                <p className="text-xl font-black text-slate-800 dark:text-white leading-none mt-0.5">Genel Bakış</p>
            </div>

            {/* Search Bar - Disabled as per request */}
            <div className="flex-1 hidden items-center justify-center max-w-xl mx-auto">
                <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <Input
                        placeholder={t('common.search')}
                        className="pl-12 bg-slate-50 border-none hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-600/20 transition-all h-14 text-base rounded-[20px] shadow-sm font-medium placeholder:text-slate-400"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 ml-auto bg-white dark:bg-slate-950 p-2 pl-4 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800">
                {/* Language Switcher */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 transition-all">
                            <Globe className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl border-slate-100 shadow-xl p-1">
                        {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(([key, label]) => (
                            <DropdownMenuItem
                                key={key}
                                onClick={() => setLocale(key)}
                                className={cn(
                                    "py-2.5 px-3 cursor-pointer rounded-lg font-medium text-sm transition-colors",
                                    locale === key ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                                )}
                            >
                                {label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Theme Toggle */}
                <ModeToggle />

                {/* Notifications */}
                <NotificationBell userId={user.id} />

                {/* User Profile (Simplified/Hidden on Desktop since it's in Sidebar, keeps visible on mobile or just removed) 
                    Spike Admin often keeps it clean. Let's remove the big profile block and just keep a minimal one 
                    OR rely on Sidebar. User said "header separate, navigation separate", "logout bottom left".
                    We should probably keep the header clean. 
                    However, keeping a minimal profile avatar is standard. Let's keep just the avatar for quick access 
                    to settings, but remove the text.
                */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url || ''} />
                                <AvatarFallback className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold">
                                    {user.full_name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mt-2 shadow-xl border-slate-100 rounded-[20px] p-2">
                        <DropdownMenuLabel className="font-medium text-xs text-slate-400 py-3 px-4">
                            Hesap Ayarları
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-100" />
                        <DropdownMenuItem className="gap-3 py-3 px-4 cursor-pointer rounded-xl hover:bg-slate-50 hover:text-blue-600 font-medium text-slate-600 transition-colors" onClick={() => router.push('/profile')}>
                            <User className="h-4 w-4" /> {t('common.profile')}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 py-3 px-4 cursor-pointer rounded-xl hover:bg-slate-50 hover:text-blue-600 font-medium text-slate-600 transition-colors" onClick={() => router.push('/settings')}>
                            <Settings className="h-4 w-4" /> {t('common.settings')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
