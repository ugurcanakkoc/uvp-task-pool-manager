'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import {
    ArrowLeft,
    Calendar,
    Clock,
    User,
    Flag,
    CheckCircle,
    AlertTriangle,
    Loader2,
    MessageSquare,
    Building2,
    Zap,
    Hammer,
    FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface TaskDetail {
    id: string
    title: string
    description: string
    department: string
    status: string
    priority: number
    task_type: string
    start_date: string
    end_date: string
    is_strategic: boolean
    is_production: boolean
    order_number: string | null
    customer_deadline: string | null
    created_at: string
    owner: { id: string; full_name: string; avatar_url: string | null } | null
    assigned_worker: { id: string; full_name: string; avatar_url: string | null } | null
}

interface ProgressEntry {
    id: string
    content: string
    created_at: string
    user: { full_name: string; avatar_url: string | null } | null
}

export default function TaskDetailPage() {
    const params = useParams()
    const router = useRouter()
    const taskId = params?.id as string
    const { user } = useAuthStore()
    const supabase = createClient()

    const [task, setTask] = useState<TaskDetail | null>(null)
    const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [newProgress, setNewProgress] = useState('')
    const [isSending, setIsSending] = useState(false)

    useEffect(() => {
        if (!taskId) return
        fetchTask()
        fetchProgress()
    }, [taskId])

    const fetchTask = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                owner:users!tasks_owner_id_fkey(id, full_name, avatar_url),
                assigned_worker:users!tasks_assigned_worker_id_fkey(id, full_name, avatar_url)
            `)
            .eq('id', taskId)
            .single()

        if (!error && data) {
            setTask(data as unknown as TaskDetail)
        }
        setIsLoading(false)
    }

    const fetchProgress = async () => {
        const { data, error } = await supabase
            .from('task_progress')
            .select(`
                id,
                content,
                created_at,
                user:users!task_progress_user_id_fkey(full_name, avatar_url)
            `)
            .eq('task_id', taskId)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setProgressEntries(data as unknown as ProgressEntry[])
        }
    }

    const handleAddProgress = async () => {
        if (!user || newProgress.trim().length < 50) {
            toast.error('İlerleme kaydı en az 50 karakter olmalıdır.')
            return
        }

        // Check for duplicate content
        const isDuplicate = progressEntries.some(
            p => p.content.trim().toLowerCase() === newProgress.trim().toLowerCase()
        )
        if (isDuplicate) {
            toast.error('Bu ilerleme kaydı zaten mevcut. Lütfen farklı bir güncelleme yazın.')
            return
        }

        setIsSending(true)
        const { error } = await supabase.from('task_progress').insert({
            task_id: taskId,
            user_id: user.id,
            content: newProgress.trim()
        })

        if (!error) {
            toast.success('İlerleme kaydı eklendi!')
            setNewProgress('')
            fetchProgress()
        } else {
            toast.error('Hata: ' + error.message)
        }
        setIsSending(false)
    }

    const getPriorityInfo = (priority: number) => {
        switch (priority) {
            case 1: return { label: 'Acil', class: 'bg-red-100 text-red-700 border-red-200', icon: '🔴' }
            case 2: return { label: 'Yüksek', class: 'bg-orange-100 text-orange-700 border-orange-200', icon: '🟠' }
            case 3: return { label: 'Normal', class: 'bg-blue-100 text-blue-700 border-blue-200', icon: '🔵' }
            case 4: return { label: 'Düşük', class: 'bg-slate-100 text-slate-700 border-slate-200', icon: '⚪' }
            default: return { label: 'Belirsiz', class: 'bg-slate-100 text-slate-700', icon: '⚪' }
        }
    }

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'open': return { label: 'Açık', class: 'bg-green-100 text-green-700' }
            case 'in_progress': return { label: 'Devam Ediyor', class: 'bg-blue-100 text-blue-700' }
            case 'review': return { label: 'İnceleme', class: 'bg-yellow-100 text-yellow-700' }
            case 'completed': return { label: 'Tamamlandı', class: 'bg-emerald-100 text-emerald-700' }
            case 'returned': return { label: 'İade Edildi', class: 'bg-red-100 text-red-700' }
            default: return { label: status, class: 'bg-slate-100 text-slate-700' }
        }
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            </DashboardLayout>
        )
    }

    if (!task) {
        return (
            <DashboardLayout>
                <div className="text-center py-16">
                    <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Görev Bulunamadı</h2>
                    <p className="text-slate-500 mb-4">Bu görev silinmiş veya erişim izniniz yok olabilir.</p>
                    <Button onClick={() => router.back()} variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Geri Dön
                    </Button>
                </div>
            </DashboardLayout>
        )
    }

    const priority = getPriorityInfo(task.priority)
    const status = getStatusInfo(task.status)

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back Button */}
                <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-slate-500 hover:text-slate-700">
                    <ArrowLeft className="h-4 w-4" /> Geri
                </Button>

                {/* Header */}
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                        <Badge className={cn("text-xs", priority.class)}>
                            {priority.icon} {priority.label}
                        </Badge>
                        <Badge className={cn("text-xs", status.class)}>
                            {status.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{task.task_type}</Badge>
                        {task.is_strategic && (
                            <Badge className="text-xs bg-indigo-100 text-indigo-700">
                                <Zap className="w-3 h-3 mr-1" /> Stratejik
                            </Badge>
                        )}
                        {task.is_production && (
                            <Badge className="text-xs bg-amber-100 text-amber-700">
                                <Hammer className="w-3 h-3 mr-1" /> Üretim
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">{task.title}</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-500" /> Açıklama
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {task.description}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Progress Section */}
                        <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-green-500" /> İlerleme Kayıtları ({progressEntries.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Add progress */}
                                {task.status === 'in_progress' && task.assigned_worker?.id === user?.id && (
                                    <div className="space-y-2">
                                        <Textarea
                                            placeholder="İlerleme kaydınızı yazın (min 50 karakter)..."
                                            value={newProgress}
                                            onChange={(e) => setNewProgress(e.target.value)}
                                            className="rounded-xl min-h-[80px] resize-none bg-slate-50 border-slate-200"
                                        />
                                        <div className="flex justify-between items-center">
                                            <span className={cn("text-xs", newProgress.length < 50 ? "text-red-400" : "text-green-500")}>
                                                {newProgress.length}/50 karakter
                                            </span>
                                            <Button
                                                onClick={handleAddProgress}
                                                disabled={isSending || newProgress.trim().length < 50}
                                                size="sm"
                                                className="rounded-xl"
                                            >
                                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kaydet'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Progress list */}
                                {progressEntries.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">Henüz ilerleme kaydı yok.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {progressEntries.map((entry) => (
                                            <div key={entry.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={entry.user?.avatar_url || ''} />
                                                        <AvatarFallback className="text-[10px]">
                                                            {entry.user?.full_name?.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs font-medium">{entry.user?.full_name}</span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {format(new Date(entry.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-300">{entry.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Details Card */}
                        <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
                            <CardContent className="p-5 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Building2 className="w-4 h-4 text-slate-400" />
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Departman</p>
                                            <p className="text-sm font-medium">{task.department}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Tarih Aralığı</p>
                                            <p className="text-sm font-medium">
                                                {task.start_date && format(new Date(task.start_date), 'dd MMM', { locale: tr })}
                                                {' → '}
                                                {task.end_date && format(new Date(task.end_date), 'dd MMM yyyy', { locale: tr })}
                                            </p>
                                        </div>
                                    </div>

                                    {task.customer_deadline && (
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                                            <div>
                                                <p className="text-[10px] text-orange-500 uppercase font-bold">Müşteri Termin</p>
                                                <p className="text-sm font-medium text-orange-600">
                                                    {format(new Date(task.customer_deadline), 'dd MMM yyyy', { locale: tr })}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {task.order_number && (
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold">Sipariş No</p>
                                                <p className="text-sm font-medium">{task.order_number}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Oluşturulma</p>
                                            <p className="text-sm font-medium">
                                                {format(new Date(task.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* People Card */}
                        <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
                            <CardContent className="p-5 space-y-4">
                                {task.owner && (
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={task.owner.avatar_url || ''} />
                                            <AvatarFallback className="text-xs">{task.owner.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Görev Sahibi</p>
                                            <p className="text-sm font-medium">{task.owner.full_name}</p>
                                        </div>
                                    </div>
                                )}

                                {task.assigned_worker ? (
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={task.assigned_worker.avatar_url || ''} />
                                            <AvatarFallback className="text-xs">{task.assigned_worker.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Atanan Çalışan</p>
                                            <p className="text-sm font-medium">{task.assigned_worker.full_name}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <User className="w-8 h-8 p-1.5 rounded-full bg-slate-100" />
                                        <div>
                                            <p className="text-[10px] uppercase font-bold">Atanan Çalışan</p>
                                            <p className="text-sm">Henüz atanmadı</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
