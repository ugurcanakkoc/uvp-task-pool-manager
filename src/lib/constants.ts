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
    Info
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
    // GM & Owner: Task Management
    {
        title: 'Görev Havuzu',
        href: '/tasks',
        icon: CheckSquare,
        roles: ['gm', 'owner', 'worker']
    },
    // Global: Calendar (Gantt)
    {
        title: 'Takvim (Gantt)',
        href: '/calendar',
        icon: Calendar,
        roles: ['gm', 'owner', 'worker']
    },
    // GM & Owner: User Management/Skills
    {
        title: 'Ekip & Yetkinlikler',
        href: '/team',
        icon: Users,
        roles: ['gm', 'owner']
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
    // Global: Settings
    {
        title: 'Ayarlar',
        href: '/settings',
        icon: Settings,
        roles: ['gm', 'owner', 'worker']
    }
]
