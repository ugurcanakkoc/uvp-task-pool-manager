'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Calendar, Clock, Trash2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { SideTaskDialog } from './side-task-dialog'

interface SideTask {
    id: string
    user_id: string
    title: string
    description: string
    start_time: string
    end_time: string | null
    created_at: string
    status: 'active' | 'completed' | 'suspended' | 'cancelled'
    users?: {
        full_name: string
    }
}

interface SideTaskListProps {
    mode?: 'personal' | 'all'
}

export function SideTaskList({ mode = 'personal' }: SideTaskListProps) {
    const [tasks, setTasks] = useState<SideTask[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { user } = useAuthStore()
    const supabase = createClient()

    const fetchTasks = async () => {
        if (!user && mode === 'personal') return

        setIsLoading(true)
        let query = supabase
            .from('side_tasks')
            .select('*, users(full_name)')
            .order('start_time', { ascending: false })

        if (mode === 'personal' && user) {
            query = query.eq('user_id', user.id)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching side tasks:', error)
            toast.error('Yan görevler yüklenirken hata oluştu.')
        } else {
            setTasks(data || [])
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchTasks()
    }, [user, mode])

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('side_tasks')
            .delete()
            .eq('id', id)

        if (error) {
            toast.error('Yan görev silinirken hata oluştu.')
        } else {
            toast.success('Yan görev silindi.')
            fetchTasks()
        }
    }

    const handleComplete = async (id: string) => {
        try {
            const response = await fetch('/api/side-tasks/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })

            const data = await response.json()

            if (!response.ok) throw new Error(data.error)

            toast.success(`Yan görev tamamlandı! +${data.pointsAwarded || 10} Puan 🌟`)
            fetchTasks()
        } catch (error) {
            console.error('Error completing task:', error)
            toast.error('İşlem başarısız oldu.')
        }
    }

    // Only allow delete if personal or GM (logic on backend RLS should also handle this, but UI safety)
    const canDelete = (taskUserId: string) => {
        if (!user) return false
        if (mode === 'personal') return true
        // If mode is all, assume GM can delete (or check role if available in store)
        // For now, let's assume GM can delete.
        return true
    }

    if (isLoading) {
        return <div className="text-center p-4">Yükleniyor...</div>
    }

    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-lg font-semibold">
                    {mode === 'all' ? 'Tüm Yan Görevler' : 'Yan Görevlerim'}
                </CardTitle>
                {mode === 'personal' && <SideTaskDialog onSuccess={fetchTasks} />}
            </CardHeader>
            <CardContent>
                {tasks.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                        Henüz yan görev kaydı yok.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className={cn(
                                    "flex items-start justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 transition-colors",
                                    task.status === 'completed'
                                        ? "bg-slate-50/80 dark:bg-slate-900/80 opacity-60"
                                        : "bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className={cn("font-medium text-sm text-slate-900 dark:text-slate-100", task.status === 'completed' && "line-through text-slate-500")}>
                                            {task.title}
                                        </h4>
                                        {mode === 'all' && task.users?.full_name && (
                                            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                                {task.users.full_name}
                                            </span>
                                        )}
                                        {task.status === 'completed' && (
                                            <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Tamamlandı
                                            </span>
                                        )}
                                    </div>
                                    {task.description && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {task.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>
                                                {format(new Date(task.start_time), 'dd MMM yyyy', { locale: tr })}
                                            </span>
                                        </div>
                                        {task.end_time && (
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                <span>
                                                    {format(new Date(task.end_time), 'dd MMM yyyy', { locale: tr })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {task.status !== 'completed' && canDelete(task.user_id) && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-green-600 hover:bg-green-50"
                                            onClick={() => handleComplete(task.id)}
                                            title="Tamamla"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    {canDelete(task.user_id) && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(task.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
