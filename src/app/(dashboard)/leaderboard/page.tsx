'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Trophy, Medal, Crown, X, CheckCircle, Clock, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface BadgeData {
    code: string
    name: string
    icon: string
    color: string
}

interface UserBadge {
    badges: BadgeData
}

interface RankedUser {
    id: string
    full_name: string
    avatar_url: string | null
    total_points: number
    user_badges: UserBadge[]
}

interface CompletedTask {
    id: string
    title: string
    department: string
    status: string
    start_date: string
    end_date: string
    priority: number
}

export default function LeaderboardPage() {
    const [users, setUsers] = useState<RankedUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { user: currentUser } = useAuthStore()
    const supabase = createClient()

    // Task history popup state
    const [selectedUser, setSelectedUser] = useState<RankedUser | null>(null)
    const [taskHistory, setTaskHistory] = useState<CompletedTask[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true)

            const { data, error } = await supabase
                .from('users')
                .select(`
                    id,
                    full_name,
                    avatar_url,
                    total_points,
                    user_badges (
                        badges (
                            code,
                            name,
                            icon,
                            color
                        )
                    )
                `)
                .eq('role', 'worker')
                .order('total_points', { ascending: false })
                .limit(50)

            if (error) {
                console.error('Error fetching leaderboard:', error)
            } else {
                setUsers(data as unknown as RankedUser[])
            }
            setIsLoading(false)
        }

        fetchLeaderboard()
    }, [])

    const handleUserClick = async (user: RankedUser) => {
        setSelectedUser(user)
        setIsLoadingHistory(true)

        const { data, error } = await supabase
            .from('tasks')
            .select('id, title, department, status, start_date, end_date, priority')
            .eq('assigned_worker_id', user.id)
            .eq('status', 'completed')
            .order('end_date', { ascending: false })
            .limit(20)

        if (!error && data) {
            setTaskHistory(data as CompletedTask[])
        } else {
            setTaskHistory([])
        }
        setIsLoadingHistory(false)
    }

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Trophy className="h-6 w-6 text-yellow-500" />
            case 1: return <Medal className="h-6 w-6 text-slate-400" />
            case 2: return <Medal className="h-6 w-6 text-amber-600" />
            default: return <span className="text-lg font-bold text-slate-400 w-6 text-center">{index + 1}</span>
        }
    }

    const getRankClass = (index: number) => {
        switch (index) {
            case 0: return 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/50'
            case 1: return 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-800'
            case 2: return 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/50'
            default: return 'bg-white/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'
        }
    }

    const getBadgeStyle = (color: string) => {
        if (color.includes('amber')) return 'bg-amber-100 text-amber-700 border-amber-200'
        if (color.includes('slate')) return 'bg-slate-100 text-slate-700 border-slate-200'
        if (color.includes('yellow')) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
        if (color.includes('violet')) return 'bg-violet-100 text-violet-700 border-violet-200'
        return 'bg-blue-100 text-blue-700 border-blue-200'
    }

    const getPriorityLabel = (priority: number) => {
        switch (priority) {
            case 1: return { text: 'Acil', class: 'bg-red-100 text-red-700' }
            case 2: return { text: 'Yüksek', class: 'bg-orange-100 text-orange-700' }
            case 3: return { text: 'Normal', class: 'bg-blue-100 text-blue-700' }
            case 4: return { text: 'Düşük', class: 'bg-slate-100 text-slate-700' }
            default: return { text: 'Normal', class: 'bg-blue-100 text-blue-700' }
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-4xl mx-auto">
                {/* Hero */}
                <div className="text-center space-y-2 py-8">
                    <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                        Liderlik Tablosu
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        En çalışkan havuz üyeleri ve kazandıkları rozetler. Kişilere tıklayarak görev geçmişini görebilirsiniz.
                    </p>
                </div>

                <Card className="border-none shadow-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-500">Yükleniyor...</div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {users.map((user, index) => (
                                    <div
                                        key={user.id}
                                        onClick={() => handleUserClick(user)}
                                        className={cn(
                                            "flex items-center gap-4 p-4 transition-all hover:bg-white/50 dark:hover:bg-slate-800/50 cursor-pointer",
                                            getRankClass(index),
                                            currentUser?.id === user.id && "ring-2 ring-blue-500/20 z-10 relative"
                                        )}
                                    >
                                        <div className="flex-shrink-0 w-8 flex justify-center">
                                            {getRankIcon(index)}
                                        </div>

                                        <Avatar className={cn("h-10 w-10 border-2",
                                            index === 0 ? "border-yellow-400" :
                                                index === 1 ? "border-slate-300" :
                                                    index === 2 ? "border-amber-500" : "border-transparent"
                                        )}>
                                            <AvatarImage src={user.avatar_url || ''} />
                                            <AvatarFallback>{user.full_name?.substring(0, 2).toUpperCase() || '??'}</AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                {user.full_name}
                                                {currentUser?.id === user.id && <span className="ml-2 text-xs text-blue-500 font-normal">(Sen)</span>}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {user.user_badges.map((ub, i) => (
                                                    <div
                                                        key={i}
                                                        className={cn(
                                                            "text-[10px] px-1.5 py-0.5 rounded border font-medium flex items-center gap-1",
                                                            getBadgeStyle(ub.badges.color)
                                                        )}
                                                        title={ub.badges.name}
                                                    >
                                                        {ub.badges.code === 'platinum_worker' ? <Crown className="w-3 h-3" /> : <Medal className="w-3 h-3" />}
                                                        <span>{ub.badges.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-lg font-black text-slate-900 dark:text-slate-100">
                                                {user.total_points}
                                            </p>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                Puan
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Task History Dialog */}
            <Dialog open={!!selectedUser} onOpenChange={(open) => { if (!open) setSelectedUser(null) }}>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            {selectedUser && (
                                <>
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={selectedUser.avatar_url || ''} />
                                        <AvatarFallback>{selectedUser.full_name?.substring(0, 2).toUpperCase() || '??'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{selectedUser.full_name}</p>
                                        <p className="text-xs text-muted-foreground font-normal">Tamamlanan Görevler</p>
                                    </div>
                                </>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="overflow-y-auto flex-1 space-y-2 pr-1">
                        {isLoadingHistory ? (
                            <div className="text-center py-8 text-slate-400">Yükleniyor...</div>
                        ) : taskHistory.length === 0 ? (
                            <div className="text-center py-8">
                                <CheckCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                <p className="text-slate-400 text-sm">Henüz tamamlanmış görev yok.</p>
                            </div>
                        ) : (
                            taskHistory.map((task) => {
                                const priority = getPriorityLabel(task.priority)
                                return (
                                    <div
                                        key={task.id}
                                        className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{task.title}</p>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{task.department}</Badge>
                                                    <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", priority.class)}>
                                                        {priority.text}
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700">
                                                        <CheckCircle className="w-2.5 h-2.5 mr-1" /> Tamamlandı
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {task.start_date && format(new Date(task.start_date), 'dd MMM', { locale: tr })}
                                                {' → '}
                                                {task.end_date && format(new Date(task.end_date), 'dd MMM yyyy', { locale: tr })}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    <div className="border-t pt-3 mt-2">
                        <p className="text-xs text-center text-slate-400">
                            Toplam {taskHistory.length} tamamlanmış görev • {selectedUser?.total_points || 0} puan
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
