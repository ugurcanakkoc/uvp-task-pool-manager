'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '@/types/supabase'
import {
    User,
    Mail,
    Briefcase,
    Trophy,
    Star,
    Calendar,
    CheckCircle2,
    Clock,
    Medal,
    MapPin,
    Loader2
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/stores/auth-store'
import { useI18nStore } from '@/stores/i18n-store'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface ProfileViewProps {
    userId?: string
}

export function ProfileView({ userId }: ProfileViewProps) {
    const { user: currentUser } = useAuthStore()
    const { t } = useI18nStore()
    const targetUserId = userId || currentUser?.id
    const [profile, setProfile] = useState<Tables<'users'> | null>(null)
    const [stats, setStats] = useState({
        completed: 0,
        active: 0,
        total: 0
    })
    const [recentTasks, setRecentTasks] = useState<Tables<'tasks'>[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    const [allBadges, setAllBadges] = useState<any[]>([])
    const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (!targetUserId) return

        const fetchData = async () => {
            setIsLoading(true)
            try {
                // 1. Fetch User Profile
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', targetUserId)
                    .single()

                if (userError) throw userError
                setProfile(userData)

                // 2. Fetch Task Stats
                const { count: completedCount } = await supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .eq('assigned_worker_id', targetUserId)
                    .eq('status', 'completed')

                const { count: activeCount } = await supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .eq('assigned_worker_id', targetUserId)
                    .in('status', ['active', 'in_progress'])

                const { count: totalCount } = await supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .eq('assigned_worker_id', targetUserId)

                setStats({
                    completed: completedCount || 0,
                    active: activeCount || 0,
                    total: totalCount || 0
                })

                // 3. Fetch Recent Tasks
                const { data: tasksData } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('assigned_worker_id', targetUserId)
                    .order('created_at', { ascending: false })
                    .limit(5)

                setRecentTasks(tasksData || [])

                // 4. Fetch Badges
                const { data: badgesData } = await supabase
                    .from('badges')
                    .select('*')
                    .order('min_points', { ascending: true }) // Assuming there is some order, or defaults

                if (badgesData) setAllBadges(badgesData)

                const { data: userBadgesData } = await supabase
                    .from('user_badges')
                    .select('badge_id')
                    .eq('user_id', targetUserId)

                if (userBadgesData) {
                    setEarnedBadgeIds(new Set(userBadgesData.map((ub: { badge_id: string }) => ub.badge_id)))
                }

            } catch (error) {
                console.error('Error fetching profile:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [targetUserId])

    const getBadgeIcon = (iconName: string) => {
        switch (iconName) {
            case 'crown': return <User className="w-6 h-6" /> // Crown not imported, using User as placeholder or import it
            case 'medal': return <Medal className="w-6 h-6" />
            default: return <Star className="w-6 h-6" />
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!profile) {
        return <div className="text-center p-10">{t('profile.notFound')}</div>
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header / Banner */}
            <div className="relative">
                <div className="h-48 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 overflow-hidden relative">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                </div>

                <div className="px-8 pb-4 relative -mt-20 flex flex-col md:flex-row items-end md:items-center gap-6">
                    <Avatar className="w-32 h-32 border-4 border-white dark:border-slate-950 shadow-2xl rounded-2xl">
                        <AvatarImage src={profile.avatar_url || ''} className="object-cover" />
                        <AvatarFallback className="text-3xl font-bold bg-white text-blue-600 rounded-2xl">
                            {profile.full_name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 mb-2">
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            {profile.full_name}
                            {profile.role === 'gm' && <Badge variant="secondary" className="bg-violet-100 text-violet-700 hover:bg-violet-200">GM</Badge>}
                            {profile.role === 'owner' && <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">Proje Sahibi</Badge>}
                        </h1>
                        <div className="flex flex-wrap gap-4 mt-2 text-slate-600 dark:text-slate-400 text-sm font-medium">
                            <div className="flex items-center gap-1.5">
                                <Briefcase className="w-4 h-4" />
                                {profile.department || t('profile.notFound')}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Mail className="w-4 h-4" />
                                {profile.email}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                {profile.location === 'home_office' ? 'Evden Çalışma' : (profile.location === 'production' ? 'Üretim Sahası' : 'Ofis')}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mb-2">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('profile.totalPoints')}</span>
                            <div className="flex items-center gap-2 text-2xl font-black text-amber-500">
                                <Trophy className="w-6 h-6 fill-amber-500" />
                                {profile.total_points}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-slate-500">{t('profile.completedTasks')}</CardTitle>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.completed}</div>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-slate-500">{t('profile.activeTasks')}</CardTitle>
                        <Clock className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.active}</div>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-slate-500">{t('profile.successRate')}</CardTitle>
                        <Star className="w-4 h-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-slate-500">{t('profile.utilization')}</CardTitle>
                        <Medal className="w-4 h-4 text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{profile.utilization}%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="tasks" className="w-full">
                <TabsList className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 p-1 rounded-xl h-auto">
                    <TabsTrigger value="tasks" className="rounded-lg px-4 py-2">{t('profile.recentTasks')}</TabsTrigger>
                    <TabsTrigger value="skills" className="rounded-lg px-4 py-2">{t('profile.skillsTab')}</TabsTrigger>
                    <TabsTrigger value="badges" className="rounded-lg px-4 py-2">{t('profile.badgesTab')}</TabsTrigger>
                </TabsList>

                <TabsContent value="tasks" className="mt-6">
                    <div className="grid gap-4">
                        {recentTasks.length > 0 ? (
                            recentTasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="flex gap-4 items-center">
                                        <div className={cn(
                                            "w-2 h-12 rounded-full",
                                            task.priority === 1 ? "bg-red-500" :
                                                task.priority === 2 ? "bg-orange-500" :
                                                    task.priority === 3 ? "bg-blue-500" : "bg-slate-300"
                                        )} />
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">{task.title}</h4>
                                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {task.department}</span>
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(task.end_date), 'dd MMM yyyy', { locale: tr })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "capitalize",
                                        task.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                            task.status === 'in_progress' ? "bg-blue-50 text-blue-600 border-blue-200" :
                                                "bg-slate-50 text-slate-600 border-slate-200"
                                    )}>
                                        {task.status === 'in_progress' ? t('tasks.statusInProgress') :
                                            task.status === 'completed' ? t('tasks.statusCompleted') : task.status}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                {t('profile.noHistory')}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="skills" className="mt-6">
                    <div className="text-center py-12 text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        {t('profile.skillsComingSoon')}
                    </div>
                </TabsContent>

                <TabsContent value="badges" className="mt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {allBadges.map((badge) => {
                            const isEarned = earnedBadgeIds.has(badge.id)
                            return (
                                <Card key={badge.id} className={cn(
                                    "text-center p-6 transition-all",
                                    isEarned ? "bg-white dark:bg-slate-900 border-amber-200 ring-1 ring-amber-100" : "bg-slate-50 dark:bg-slate-900/50 opacity-60 grayscale border-dashed"
                                )}>
                                    <div className={cn(
                                        "w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110",
                                        isEarned ? `bg-${badge.color}-100 text-${badge.color}-600` : "bg-slate-200 text-slate-400"
                                    )}>
                                        {getBadgeIcon(badge.icon)}
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">{badge.name}</h3>
                                    <p className="text-xs text-slate-500">{badge.description}</p>
                                    {isEarned && (
                                        <Badge variant="secondary" className="mt-3 bg-amber-100 text-amber-700 text-[10px] h-5 hidden">
                                            Kazanıldı
                                        </Badge>
                                    )}
                                </Card>
                            )
                        })}
                        {allBadges.length === 0 && (
                            <div className="col-span-full text-center py-12 text-slate-500">
                                {t('profile.badgesComingSoon')}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

