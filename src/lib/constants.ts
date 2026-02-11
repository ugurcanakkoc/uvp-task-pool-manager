import {
    LayoutDashboard,
    CheckSquare,
    Calendar,
    Trophy,
    Users,
    FileText,
    Settings,
    Bell,
    PlusCircle,
    BarChart3,
    History,
    Info,
    Layers,
    HelpCircle,
    Code2,
    BadgeCheck
} from 'lucide-react'

export type NavItem = {
    title: string
    href: string
    icon: any
    roles: ('gm' | 'owner' | 'worker')[]
}

export const navItems: NavItem[] = [
    // Dashboard (Global)
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['gm', 'owner', 'worker']
    },
    // GM & Owner & Worker: Task Pool (Görev Havuzu + Açık İlanlar birleştirildi)
    {
        title: 'Görev Havuzu',
        href: '/pool',
        icon: Layers,
        roles: ['gm', 'owner', 'worker']
    },
    {
        title: 'Takvim (Gantt)',
        href: '/calendar',
        icon: Calendar,
        roles: ['gm', 'owner', 'worker']
    },
    // Global: Gamification (Leaderboard)
    {
        title: 'Liderlik Tablosu',
        href: '/leaderboard',
        icon: Trophy,
        roles: ['gm', 'owner', 'worker']
    },
    // GM: Reports
    {
        title: 'Raporlar ve Analiz',
        href: '/reports',
        icon: BarChart3,
        roles: ['gm']
    },
    // Global: Audit Logs
    {
        title: 'İşlem Kayıtları',
        href: '/audit',
        icon: History,
        roles: ['gm', 'owner']
    },
    // Owner: Support Requests
    {
        title: 'Destek Talepleri',
        href: '/support',
        icon: HelpCircle,
        roles: ['owner']
    },
    // Global: Settings
    {
        title: 'Ayarlar',
        href: '/settings',
        icon: Settings,
        roles: ['gm', 'owner', 'worker']
    },
    // GM: Approvals
    {
        title: 'Onay Bekleyenler',
        href: '/approvals',
        icon: BadgeCheck,
        roles: ['gm']
    },
    // GM & Owner: API Documentation
    {
        title: 'API Dökümanı',
        href: '/api-docs',
        icon: Code2,
        roles: ['gm', 'owner']
    }
]
