'use client'

import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    AlertCircle,
    Calendar,
    Clock,
    MoreVertical,
    User,
    Zap,
    CheckCircle2,
    Eye,
    Pencil
} from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useI18nStore } from '@/stores/i18n-store'
import type { Tables } from '@/types/supabase'

type Task = Tables<'tasks'>

interface TaskCardProps {
    task: Task
    onClaim?: (taskId: string) => void
    onEdit?: (task: Task) => void
    userRole?: 'gm' | 'owner' | 'worker'
    currentUserId?: string
}

export function TaskCard({ task, onClaim, onEdit, userRole, currentUserId }: TaskCardProps) {
    const { t } = useI18nStore()
    const isOwner = task.owner_id === currentUserId
    const isWorker = userRole === 'worker'
    const isClaimable = !task.assigned_worker_id && isWorker && task.status === 'open'

    const priorityConfig = {
        1: { color: 'from-red-500 to-rose-600', bg: 'bg-red-50', text: 'text-red-600', label: t('tasks.priority1').split(' - ')[1] || 'ACİL' },
        2: { color: 'from-orange-500 to-amber-600', bg: 'bg-orange-50', text: 'text-orange-600', label: t('tasks.priority2').split(' - ')[1] || 'YÜKSEK' },
        3: { color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-600', label: t('tasks.priority3').split(' - ')[1] || 'ORTA' },
        4: { color: 'from-slate-400 to-slate-500', bg: 'bg-slate-50', text: 'text-slate-500', label: t('tasks.priority4').split(' - ')[1] || 'DÜŞÜK' },
    }

    const statusMap = {
        'open': { label: t('tasks.statusOpen'), color: 'bg-blue-500/10 text-blue-600 border-blue-200/50' },
        'in_progress': { label: t('tasks.statusInProgress'), color: 'bg-amber-500/10 text-amber-600 border-amber-200/50' },
        'completed': { label: t('tasks.statusCompleted'), color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50' },
        'returned': { label: t('tasks.statusReturned'), color: 'bg-red-500/10 text-red-600 border-red-200/50' }
    }

    const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig[3]

    return (
        <Card className="group relative overflow-hidden border-slate-200/60 dark:border-slate-800/60 hover:border-blue-300/60 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:-translate-y-0.5">
            {/* Priority Gradient Top Bar */}
            <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", priority.color)} />

            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 pt-5 px-5">
                <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="rounded-lg bg-slate-50/80 text-slate-600 border-slate-200/60 text-[10px] font-semibold px-2 py-0.5">
                            {task.department}
                        </Badge>
                        {task.is_strategic && (
                            <Badge className="rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white border-none flex items-center gap-1 text-[10px] px-2 py-0.5 shadow-sm shadow-violet-500/20">
                                <Zap className="h-2.5 w-2.5" /> {t('tasks.strategic')}
                            </Badge>
                        )}
                    </div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight line-clamp-2">
                        {task.title}
                    </h3>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1 text-slate-400 hover:text-slate-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl shadow-xl backdrop-blur-xl w-44">
                        <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg">
                            <Eye className="h-4 w-4 text-slate-400" /> {t('common.details')}
                        </DropdownMenuItem>
                        {(isOwner || userRole === 'gm') && (
                            <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg" onClick={() => onEdit?.(task)}>
                                <Pencil className="h-4 w-4 text-slate-400" /> {t('common.edit')}
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>

            <CardContent className="px-5 pb-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {task.description}
                </p>

                <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{format(new Date(task.start_date), 'dd MMM', { locale: tr })}</span>
                    </div>
                    <div className="w-px h-3 bg-slate-200" />
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{format(new Date(task.end_date), 'dd MMM', { locale: tr })}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="h-7 w-7 rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <Badge
                        variant="outline"
                        className={cn(
                            "rounded-lg border px-2.5 py-0.5 font-semibold text-[10px] uppercase tracking-wider",
                            statusMap[task.status as keyof typeof statusMap]?.color
                        )}
                    >
                        {statusMap[task.status as keyof typeof statusMap]?.label}
                    </Badge>
                </div>
            </CardContent>

            <CardFooter className="px-5 pb-5 pt-0">
                {isClaimable ? (
                    <Button
                        className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold h-10 shadow-lg shadow-blue-500/20 gap-2 transition-all duration-200"
                        onClick={() => onClaim?.(task.id)}
                    >
                        <CheckCircle2 className="h-4 w-4" /> {t('tasks.claimButton')}
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        className="w-full rounded-xl border-slate-200/60 text-slate-500 font-medium h-10 gap-2"
                        disabled
                    >
                        {task.assigned_worker_id ? t('tasks.assigned') : t('tasks.pending')}
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
