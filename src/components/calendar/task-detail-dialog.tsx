'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Calendar as CalendarIcon,
    Clock,
    User,
    UserCircle,
    CheckCircle2,
    Edit2,
    Save,
    Trash2,
    Loader2,
    RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { format, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ResourceRequestModal } from './resource-request-modal'

import { Task } from '@/types'

interface TaskDetailDialogProps {
    task: Task | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function TaskDetailDialog({ task, open, onOpenChange, onSuccess }: TaskDetailDialogProps) {
    const { user } = useAuthStore()
    const supabase = createClient()
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!task) return null

    const isGM = user?.role === 'gm'
    const isOwner = user?.id === task.owner_id

    // Owners can only delete if it's NOT approved yet (requested)
    const canDelete = isGM || (isOwner && task.status === 'requested')

    // Anyone can edit their own task, but ResourceRequestModal will handle 
    // resetting it to 'requested' if they are not GM.
    const canEdit = isGM || (isOwner && task.status !== 'completed' && task.status !== 'cancelled')

    const handleUpdateStatus = async (newStatus: string) => {
        // Enforce: Cannot be active without workers
        let targetStatus = newStatus
        const workerCount = task.bookings?.length || 0

        if (newStatus === 'active' && workerCount === 0) {
            targetStatus = 'pending'
            toast.info('Henüz kişi atanmadığı için talep havuza (Atanmamış İşler) alındı.')
        }

        setIsSubmitting(true)
        try {
            const updates: any = { status: targetStatus }
            if (targetStatus === 'active' || targetStatus === 'pending') {
                if (isGM) {
                    updates.gm_approved = true
                    updates.gm_approved_by = user?.id
                    updates.approved_at = new Date().toISOString()
                }
            }

            const { error } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', task.id)

            if (error) throw error

            if (targetStatus === 'pending' && newStatus === 'active') {
                toast.success('Talep onaylandı ve havuza eklendi.')
            } else {
                toast.success('Destek talebi durumu güncellendi.')
            }

            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error('Giriş yetkisi veya bağlantı hatası.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteTask = async () => {
        if (!confirm('Bu destek talebini silmek istediğinize emin misiniz?')) return

        setIsSubmitting(true)
        try {
            // Bookings should be deleted automatically if CASCADE is on, 
            // but let's be safe. RLS already allows deletion now.
            await supabase.from('bookings').delete().eq('task_id', task.id)

            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', task.id)

            if (error) throw error
            toast.success('Destek talebi başarıyla silindi.')
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error('Silme işlemi başarısız.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-blue-600'
            case 'pending': return 'bg-blue-400'
            case 'requested': return 'bg-indigo-500'
            case 'completed': return 'bg-green-600'
            case 'cancelled': return 'bg-red-600'
            default: return 'bg-slate-500'
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-[32px] border-none shadow-2xl">
                <div className={cn("h-2 w-full", getStatusColor(task.status))} />

                <div className="p-8 space-y-8">
                    <DialogHeader className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Badge className={cn("uppercase font-black text-[10px] tracking-widest px-3 py-1", getStatusColor(task.status))}>
                                {task.status === 'requested' ? '📌 ONAY BEKLİYOR' :
                                    task.status === 'pending' ? '🔓 HAVUZDA' :
                                        task.status === 'active' ? '⚡ AKTİF' :
                                            task.status === 'review' ? '👀 İNCELEMEDE' :
                                                task.status === 'completed' ? '✅ TAMAMLANDI' :
                                                    task.status === 'returned' ? '↩️ REVİZYON' :
                                                        task.status.toUpperCase()}
                            </Badge>
                            <div className="flex items-center gap-2">
                                {canDelete && (
                                    <Button variant="ghost" size="sm" onClick={handleDeleteTask} className="h-8 rounded-xl gap-2 font-bold text-red-400 hover:text-red-500 hover:bg-red-50">
                                        <Trash2 className="w-3.5 h-3.5" /> Sil
                                    </Button>
                                )}
                                {canEdit && (
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(true)} className="h-8 rounded-xl gap-2 font-bold text-slate-500">
                                        <Edit2 className="w-3.5 h-3.5" /> Düzenle
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 text-left">
                            <DialogTitle className="text-3xl font-black tracking-tight text-slate-800">
                                {task.title}
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium text-base leading-relaxed">
                                {task.description || "Açıklama belirtilmedi."}
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    {/* Meta Info Grid */}
                    <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-[24px]">
                        <div className="space-y-2 text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">BAŞLANGIÇ</p>
                            <div className="flex items-center gap-2 text-slate-700 font-black">
                                <CalendarIcon className="w-5 h-5 text-blue-500" />
                                {task.start_date ? format(new Date(task.start_date), 'd MMMM yyyy') : '---'}
                            </div>
                        </div>
                        <div className="space-y-2 text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">BİTİŞ</p>
                            <div className="flex items-center gap-2 text-slate-700 font-black">
                                <Clock className="w-5 h-5 text-red-500" />
                                {task.end_date ? format(new Date(task.end_date), 'd MMMM yyyy') : '---'}
                            </div>
                        </div>
                    </div>

                    {/* Assigned People */}
                    <div className="space-y-4 text-left">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ATANAN EKİP</p>
                            <Badge variant="outline" className="rounded-lg text-[10px] font-black text-slate-500 border-slate-200">
                                {task.bookings?.length || 0} KİŞİ
                            </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {task.bookings && task.bookings.length > 0 ? (
                                task.bookings.map(booking => {
                                    const duration = differenceInDays(new Date(booking.end_date), new Date(booking.start_date)) + 1
                                    const workerName = booking.worker?.full_name || 'Atanmamış'
                                    return (
                                        <div key={booking.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar className="h-8 w-8 ring-2 ring-white">
                                                    <AvatarImage src={booking.worker?.avatar_url || ''} />
                                                    <AvatarFallback className="bg-blue-600 text-white font-black text-[10px]">
                                                        {workerName.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs font-black text-slate-700 truncate">{workerName}</span>
                                            </div>
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-black text-[10px] shrink-0">
                                                {duration} GÜN
                                            </Badge>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="col-span-full p-8 border-2 border-dashed border-slate-100 rounded-[28px] text-center bg-slate-50/30">
                                    <UserCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Henüz personel atanmadı</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User Info Section */}
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <UserCircle className="w-10 h-10 text-slate-300" />
                            <div className="text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">OLUŞTURAN</p>
                                <p className="text-sm font-black text-slate-700">{task.owner?.full_name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-black text-[10px]">
                                {task.department.toUpperCase()} DEPARTMANI
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <DialogFooter className="p-6 bg-slate-50/50 border-t items-center gap-3 sm:justify-between">
                    <div className="flex items-center gap-2">
                        {isGM && task.status === 'requested' && (
                            <>
                                <Button
                                    onClick={() => handleUpdateStatus('active')}
                                    disabled={isSubmitting}
                                    className="bg-green-600 hover:bg-green-700 rounded-2xl h-12 px-6 font-black gap-2 shadow-lg shadow-green-600/20"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                    TALEBİ ONAYLA
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleUpdateStatus('cancelled')}
                                    disabled={isSubmitting}
                                    className="border-red-200 text-red-600 hover:bg-red-50 rounded-2xl h-12 px-6 font-black gap-2"
                                >
                                    İPTAL ET
                                </Button>
                            </>
                        )}
                        {isGM && task.status === 'active' && (
                            <Button
                                variant="outline"
                                onClick={() => handleUpdateStatus('completed')}
                                disabled={isSubmitting}
                                className="border-green-200 text-green-600 hover:bg-green-50 rounded-2xl h-12 px-6 font-black gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5" /> TAMAMLANDI OLARAK İŞARETLE
                            </Button>
                        )}
                        {isGM && task.status === 'cancelled' && (
                            <Button
                                onClick={() => handleUpdateStatus('requested')}
                                disabled={isSubmitting}
                                className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-12 px-6 font-black gap-2 shadow-lg shadow-indigo-600/20"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                TALEBİ GERİ GETİR
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-bold text-slate-500 rounded-xl">
                            Kapat
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>

            {/* Robust Edit Modal */}
            <ResourceRequestModal
                editingTask={task}
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                onSuccess={() => {
                    onSuccess()
                    onOpenChange(false) // Close the detail view too
                }}
            />
        </Dialog>
    )
}
