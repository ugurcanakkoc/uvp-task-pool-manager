'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Calendar, Clock, Hand, ArrowRight, User, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface PoolTask {
    id: string
    title: string
    description: string
    department: string
    priority: number
    start_date: string
    end_date: string
    created_at: string
    owner: {
        full_name: string
    }
}

export default function PoolPage() {
    const { user } = useAuthStore()
    const [tasks, setTasks] = useState<PoolTask[]>([])
    const [myApplications, setMyApplications] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    const fetchPoolTasks = async () => {
        setIsLoading(true)
        // Fetch tasks that are open and have NO assigned worker
        const { data, error } = await supabase
            .from('tasks')
            .select('*, owner:users!owner_id(full_name)')
            .is('assigned_worker_id', null)
            .neq('status', 'cancelled')
            .neq('status', 'completed')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching pool tasks:', error)
            toast.error('Havuz görevleri yüklenirken hata oluştu.')
        } else {
            setTasks(data as any[])
        }

        // Fetch my applications
        if (user) {
            const { data: volData, error: volError } = await supabase
                .from('task_volunteers')
                .select('task_id')
                .eq('user_id', user.id)

            if (volData) {
                setMyApplications(volData.map((v: any) => v.task_id))
            }
        }

        setIsLoading(false)
    }

    useEffect(() => {
        if (user) {
            fetchPoolTasks()
        }
    }, [user])

    const handleVolunteer = async (taskId: string) => {
        if (!user) return

        try {
            const isApplied = myApplications.includes(taskId)

            if (isApplied) {
                // Withdraw application
                const { error } = await supabase
                    .from('task_volunteers')
                    .delete()
                    .eq('task_id', taskId)
                    .eq('user_id', user.id)

                if (error) throw error

                toast.success('Başvurunuz geri çekildi.')
                setMyApplications(prev => prev.filter(id => id !== taskId))
            } else {
                // Apply
                const { error } = await supabase
                    .from('task_volunteers')
                    .insert({
                        task_id: taskId,
                        user_id: user.id
                    })

                if (error) throw error

                toast.success('Göreve talip oldunuz! Yöneticiye bilgi verildi.')
                setMyApplications(prev => [...prev, taskId])
            }

        } catch (error) {
            console.error('Volunteer error:', error)
            toast.error('İşlem sırasında bir hata oluştu.')
        }
    }

    const getPriorityBadge = (p: number) => {
        switch (p) {
            case 1: return <Badge variant="destructive" className="bg-red-600">Acil (P1)</Badge>
            case 2: return <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200">Yüksek (P2)</Badge>
            case 3: return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">Normal (P3)</Badge>
            default: return <Badge variant="outline">Düşük (P4)</Badge>
        }
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Açık Görev Havuzu</h1>
                <p className="text-muted-foreground">
                    Henüz bir çalışana atanmamış görevler. Uygun olduklarınıza talip olabilirsiniz.
                </p>
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg w-fit mt-2">
                    <Hand className="w-4 h-4" />
                    <span className="font-medium">İpucu:</span> Havuzdan görev alarak Gönüllü rozeti kazanabilirsiniz!
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Havuzda Açık Görev Yok</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                        Şu an için tüm görevler atanmış durumda. Daha sonra tekrar kontrol edin.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map((task) => {
                        const isApplied = myApplications.includes(task.id)
                        return (
                            <Card key={task.id} className="group hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-800 flex flex-col">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start mb-2">
                                        {getPriorityBadge(task.priority)}
                                        <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                            {task.department}
                                        </span>
                                    </div>
                                    <CardTitle className="line-clamp-2 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                                        {task.title}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-1">
                                        <User className="w-3.5 h-3.5" />
                                        {task.owner?.full_name}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 pb-4">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4">
                                        {task.description}
                                    </p>
                                    <div className="flex flex-col gap-2 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Başlangıç: <span className="font-medium text-slate-700 dark:text-slate-300">{format(new Date(task.start_date), 'dd MMM', { locale: tr })}</span></span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Bitiş: <span className="font-medium text-slate-700 dark:text-slate-300">{format(new Date(task.end_date), 'dd MMM', { locale: tr })}</span></span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <Button
                                        variant={isApplied ? "secondary" : "default"}
                                        className={cn(
                                            "w-full transition-colors group-hover:shadow-md",
                                            isApplied ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-900 hover:bg-blue-600 text-white"
                                        )}
                                        onClick={() => handleVolunteer(task.id)}
                                    >
                                        {isApplied ? (
                                            <>
                                                <Badge className="mr-2 bg-green-500 hover:bg-green-600">Başvuruldu</Badge>
                                                Geri Çek
                                            </>
                                        ) : (
                                            <>
                                                <Hand className="w-4 h-4 mr-2" />
                                                Göreve Talip Ol
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
