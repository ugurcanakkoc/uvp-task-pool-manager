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

    // Can volunteer if: Worker + Open + Not Assigned + Not Applied
    const canVolunteer = isWorker && !task.assigned_worker_id && task.status === 'open' && !hasApplied
    // Can Withdraw if: Worker + Open + Not Assigned + Applied
    const canWithdraw = isWorker && !task.assigned_worker_id && task.status === 'open' && hasApplied

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

    const [showProgressDialog, setShowProgressDialog] = useState(false)
    const [showSubmitDialog, setShowSubmitDialog] = useState(false)
    const [showReviewDialog, setShowReviewDialog] = useState(false)
    const [showCandidatesDialog, setShowCandidatesDialog] = useState(false)

    // Worker Actions: Assigned worker can add progress or submit
    const canAction = isWorker && task.assigned_worker_id === currentUserId && (task.status === 'in_progress' || task.status === 'active' || task.status === 'open')

    // Owner Actions: Owner or GM can review submitted tasks
    const canReview = (isOwner || userRole === 'gm') && task.status === 'review'

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

            toast.success('Aday onaylandı ve görev atandı.')
            setShowCandidatesDialog(false)
            onUpdated?.()

        } catch (error) {
            console.error('Error approving volunteer:', error)
            toast.error('Atama işlemi sırasında hata oluştu.')
        }
    }

    const handleRejectVolunteer = async (volunteerId: string) => {
        try {
            const { error } = await supabase
                .from('task_volunteers')
                .delete()
                .eq('id', volunteerId)

            if (error) throw error

            toast.success('Aday başvurusu reddedildi.')
            onUpdated?.()
        } catch (error) {
            console.error('Error rejecting volunteer:', error)
            toast.error('İşlem başarısız.')
        }
    }

    return (
        <>
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

                <CardFooter className="px-5 pb-5 pt-0 gap-2">
                    {/* CASE 1: MANAGE VOLUNTEERS (Owner/GM) */}
                    {canManageVolunteers ? (
                        <Button
                            className="w-full rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold h-10 border border-orange-200 gap-2"
                            onClick={() => setShowCandidatesDialog(true)}
                        >
                            <Users className="h-4 w-4" />
                            {volunteers.length} Adayı İncele
                        </Button>
                    ) : canVolunteer ? (
                        /* CASE 2: VOLUNTEER (Apply) */
                        <Button
                            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold h-10 shadow-lg shadow-blue-500/20 gap-2 transition-all duration-200"
                            onClick={() => onVolunteer?.(task.id)}
                        >
                            <CheckCircle2 className="h-4 w-4" /> Göreve Talip Ol
                        </Button>
                    ) : canWithdraw ? (
                        /* CASE 2.5: WITHDRAW APPLICATION */
                        <Button
                            className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold h-10 border border-slate-200 gap-2"
                            onClick={() => onVolunteer?.(task.id)}
                        >
                            <XCircle className="h-4 w-4" /> Başvuruyu Çek
                        </Button>
                    ) : canReview ? (
                        /* CASE 3: OWNER REVIEW ACTION */
                        <Button
                            className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold h-10 shadow-lg shadow-violet-500/20 gap-2"
                            onClick={() => setShowReviewDialog(true)}
                        >
                            <Eye className="h-4 w-4" /> İncele ve Onayla
                        </Button>
                    ) : canAction ? (
                        /* CASE 4: WORKER ACTIONS */
                        <div className="flex gap-2 w-full">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl border-blue-200/60 text-blue-600 hover:bg-blue-50 font-medium h-10 gap-2"
                                onClick={() => setShowProgressDialog(true)}
                            >
                                <Clock className="h-4 w-4" /> İlerleme
                            </Button>
                            <Button
                                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 shadow-lg shadow-emerald-500/20 gap-2"
                                onClick={() => setShowSubmitDialog(true)}
                            >
                                <CheckCircle2 className="h-4 w-4" /> Tamamla
                            </Button>
                        </div>
                    ) : (
                        /* CASE 5: DEFAULT */
                        <Button
                            variant="outline"
                            className="w-full rounded-xl border-slate-200/60 text-slate-500 font-medium h-10 gap-2"
                            disabled
                        >
                            {task.assigned_worker_id ? (task.status === 'review' ? 'İncelemede' : t('tasks.assigned')) : (hasApplied ? 'Başvuruldu' : t('tasks.pending'))}
                        </Button>
                    )}
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
                        <DialogTitle>Adaylar</DialogTitle>
                        <DialogDescription>
                            Bu görev için başvuran adayları inceleyin ve onaylayın.
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
                                        <p className="text-sm font-bold">{volunteer.user?.full_name || "Gizli Kullanıcı"}</p>
                                        <p className="text-xs text-slate-500">{volunteer.user?.department || "Departman Belirtilmemiş"}</p>
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
                                        Reddet
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={() => volunteer.user?.id && handleApproveVolunteer(volunteer.user.id)}
                                        disabled={!volunteer.user?.id}
                                    >
                                        <UserCheck className="w-4 h-4 mr-2" />
                                        Onayla
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {volunteers.length === 0 && (
                            <p className="text-center text-slate-500">Henüz aday yok.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
