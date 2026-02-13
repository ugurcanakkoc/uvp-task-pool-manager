import { useState } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ProgressDialog } from './progress-dialog'
import { SubmitDialog } from './submit-dialog'
import { ReviewDialog } from './review-dialog'
import {
    AlertCircle,
    Calendar,
    Clock,
    MoreVertical,
    User,
    Zap,
    CheckCircle2,
    Eye,
    Pencil,
    Users,
    UserCheck,
    XCircle
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useI18nStore } from '@/stores/i18n-store'
import type { Tables } from '@/types/supabase'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Task = Tables<'tasks'> & {
    assigned_worker?: {
        id: string
        full_name: string
        avatar_url?: string
        department?: string
    } | null
    task_volunteers?: {
        id: string
        user: {
            id: string
            full_name: string
            avatar_url?: string
            department?: string
        }
    }[]
}

interface TaskCardProps {
    task: Task
    onVolunteer?: (taskId: string) => void
    onEdit?: (task: Task) => void
    onUpdated?: () => void
    userRole?: 'gm' | 'owner' | 'worker'
    currentUserId?: string
}

export function TaskCard({ task, onVolunteer, onEdit, onUpdated, userRole, currentUserId }: TaskCardProps) {
    const { t } = useI18nStore()
    const supabase = createClient()
    const isOwner = task.owner_id === currentUserId
    const isWorker = userRole === 'worker'

    // Volunteer Logic
    const volunteers = task.task_volunteers || []
    const hasVolunteers = volunteers.length > 0
    const isOwnerOrGM = isOwner || userRole === 'gm'
    const canManageVolunteers = isOwnerOrGM && !task.assigned_worker_id && hasVolunteers

    const hasApplied = volunteers.some(v => v.user?.id === currentUserId)

    const statusMap = {
        'requested': { label: t('tasks.statusRequested'), color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200/50' },
        'pending': { label: t('tasks.statusOpen'), color: 'bg-blue-500/10 text-blue-600 border-blue-200/50' },
        'active': { label: t('tasks.statusActive'), color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50' },
        'in_progress': { label: t('tasks.statusInProgress'), color: 'bg-amber-500/10 text-amber-600 border-amber-200/50' },
        'completed': { label: t('tasks.statusCompleted'), color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50' },
        'returned': { label: t('tasks.statusReturned'), color: 'bg-red-500/10 text-red-600 border-red-200/50' },
        'cancelled': { label: t('tasks.statusCancelled'), color: 'bg-slate-500/10 text-slate-600 border-slate-200/50' },
        'review': { label: t('tasks.statusReview'), color: 'bg-violet-500/10 text-violet-600 border-violet-200/50' }
    }

    const priorityConfig = {
        1: { color: 'from-red-500 to-rose-600', bg: 'bg-red-50', text: 'text-red-600', label: t('tasks.priority1').split(' - ')[1] || 'ACİL' },
        2: { color: 'from-orange-500 to-amber-600', bg: 'bg-orange-50', text: 'text-orange-600', label: t('tasks.priority2').split(' - ')[1] || 'YÜKSEK' },
        3: { color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-600', label: t('tasks.priority3').split(' - ')[1] || 'ORTA' },
        4: { color: 'from-slate-400 to-slate-500', bg: 'bg-slate-50', text: 'text-slate-500', label: t('tasks.priority4').split(' - ')[1] || 'DÜŞÜK' },
    }

    const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig[3]

    const [showProgressDialog, setShowProgressDialog] = useState(false)
    const [showSubmitDialog, setShowSubmitDialog] = useState(false)
    const [showReviewDialog, setShowReviewDialog] = useState(false)
    const [showCandidatesDialog, setShowCandidatesDialog] = useState(false)

    // Worker Actions: Assigned worker can add progress or submit
    const canAction = isWorker && task.assigned_worker_id === currentUserId && (task.status === 'in_progress' || task.status === 'active' || task.status === 'pending')

    // Owner Actions: Owner or GM can review submitted tasks
    const canReview = (isOwner || userRole === 'gm') && task.status === 'review'

    // Volunteer logic: Only for 'pending' tasks
    const canVolunteer = isWorker && !task.assigned_worker_id && task.status === 'pending' && !hasApplied
    const canWithdraw = isWorker && !task.assigned_worker_id && task.status === 'pending' && hasApplied

    const handleApproveVolunteer = async (userId: string) => {
        try {
            // 1. Assign worker
            const { error: assignError } = await supabase
                .from('tasks')
                .update({
                    assigned_worker_id: userId,
                    status: 'in_progress', // or active
                    updated_at: new Date().toISOString()
                })
                .eq('id', task.id)

            if (assignError) throw assignError

            // 2. Clear volunteers (optional, or just keep them for record/transparency)
            // They will automatically not show as candidates anymore because task is assigned.

            toast.success(t('tasks.volunteerApproved'))
            setShowCandidatesDialog(false)
            onUpdated?.()

        } catch (error) {
            console.error('Error approving volunteer:', error)
            toast.error(t('tasks.assignError'))
        }
    }

    const handleRejectVolunteer = async (volunteerId: string) => {
        try {
            const { error } = await supabase
                .from('task_volunteers')
                .delete()
                .eq('id', volunteerId)

            if (error) throw error

            toast.success(t('tasks.volunteerRejected'))
            onUpdated?.()
        } catch (error) {
            console.error('Error rejecting volunteer:', error)
            toast.error(t('tasks.opError'))
        }
    }

    const handleApproveRequest = async () => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({
                    status: 'pending', // GM approved, now pending for workers
                    approved_at: new Date().toISOString()
                })
                .eq('id', task.id)

            if (error) throw error
            toast.success(t('tasks.requestApproved'))
            onUpdated?.()
        } catch (error: any) {
            toast.error(t('tasks.approveError') + ' ' + error.message)
        }
    }

    const handleRejectRequest = async () => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({
                    status: 'returned' // Returned to owner
                })
                .eq('id', task.id)

            if (error) throw error
            toast.success(t('tasks.requestRejected'))
            onUpdated?.()
        } catch (error: any) {
            toast.error(t('tasks.rejectError') + ' ' + error.message)
        }
    }

    return (
        <>
            <Card className="group relative overflow-hidden border border-white dark:border-slate-800 hover:shadow-[0px_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 rounded-[24px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl hover:-translate-y-1.5 shadow-sm">
                {/* Priority Gradient Top Bar */}
                <div className={cn("absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r", priority.color)} />

                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 pt-5 px-5">
                    <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="rounded-lg bg-slate-50/80 text-slate-600 border-slate-200/60 text-[10px] font-semibold px-2 py-0.5">
                                {task.department}
                            </Badge>
                        </div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight line-clamp-2">
                            {task.title}
                        </h3>
                    </div>

                    {/* Menu removed to favor direct click for common UI */}
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
                        <div className="flex -space-x-2 overflow-hidden">
                            {(task as any).bookings && (task as any).bookings.length > 0 ? (
                                (task as any).bookings.map((booking: any) => (
                                    <TooltipProvider key={booking.id}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Avatar className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-110">
                                                    <AvatarImage src={booking.worker?.avatar_url} />
                                                    <AvatarFallback className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 font-black text-[10px]">
                                                        {booking.worker?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-[10px] font-bold">{booking.worker?.full_name}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))
                            ) : task.assigned_worker ? (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Avatar className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                                                <AvatarImage src={task.assigned_worker.avatar_url} />
                                                <AvatarFallback className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 font-black text-[10px]">
                                                    {task.assigned_worker?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-[10px] font-bold">{task.assigned_worker.full_name}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <div className="h-8 w-8 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50/50">
                                    <User className="h-3.5 w-3.5 text-slate-300" />
                                </div>
                            )}
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

                <CardFooter className="px-5 pb-5 pt-0 gap-2">
                    {/* Simplified footer for common UI */}
                    <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">KAYIT NO: #{task.id.slice(0, 4)}</span>
                        {task.status === 'pending' && !task.assigned_worker_id && (
                            <Badge className="bg-blue-600 text-white border-none text-[10px]">TALEBE AÇIK</Badge>
                        )}
                    </div>
                </CardFooter>
            </Card>

            <ProgressDialog
                taskId={task.id}
                open={showProgressDialog}
                onOpenChange={setShowProgressDialog}
            />

            <SubmitDialog
                taskId={task.id}
                open={showSubmitDialog}
                onOpenChange={setShowSubmitDialog}
                onSuccess={() => onUpdated?.()}
            />

            <ReviewDialog
                taskId={task.id}
                open={showReviewDialog}
                onOpenChange={setShowReviewDialog}
                onSuccess={() => onUpdated?.()}
            />

            <Dialog open={showCandidatesDialog} onOpenChange={setShowCandidatesDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('tasks.candidatesTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('tasks.candidatesDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        {volunteers.map((volunteer) => (
                            <div key={volunteer.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={volunteer.user?.avatar_url} />
                                        <AvatarFallback>{volunteer.user?.full_name?.substring(0, 2).toUpperCase() || '??'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-bold">{volunteer.user?.full_name || t('tasks.unknownUser')}</p>
                                        <p className="text-xs text-slate-500">{volunteer.user?.department || t('profile.notFound')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200/60"
                                        onClick={() => handleRejectVolunteer(volunteer.id)}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        {t('tasks.reject')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={() => volunteer.user?.id && handleApproveVolunteer(volunteer.user.id)}
                                        disabled={!volunteer.user?.id}
                                    >
                                        <UserCheck className="w-4 h-4 mr-2" />
                                        {t('tasks.approve')}
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {volunteers.length === 0 && (
                            <p className="text-center text-slate-500">{t('tasks.noCandidates')}</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
