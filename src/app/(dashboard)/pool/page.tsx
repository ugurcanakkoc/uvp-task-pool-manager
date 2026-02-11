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

import { DashboardLayout } from '@/components/layout/dashboard-layout'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search, Filter, Users, LayoutGrid, Calendar as CalendarDays } from 'lucide-react'

export default function PoolPage() {
    const { user } = useAuthStore()
    const [tasks, setTasks] = useState<PoolTask[]>([])
    const [workers, setWorkers] = useState<any[]>([])
    const [myApplications, setMyApplications] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [deptFilter, setDeptFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')

    const supabase = createClient()

    const fetchPoolTasks = async () => {
        setIsLoading(true)

        // 1. Fetch Open Tasks
        let taskQuery = supabase
            .from('tasks')
            .select('*, owner:users!owner_id(full_name)')
            .is('assigned_worker_id', null)
            .neq('status', 'cancelled')
            .neq('status', 'completed')
            .order('created_at', { ascending: false })

        if (deptFilter !== 'all') taskQuery = taskQuery.eq('department', deptFilter)
        if (priorityFilter !== 'all') taskQuery = taskQuery.eq('priority', parseInt(priorityFilter))

        const { data: taskData, error: taskError } = await taskQuery

        if (taskError) {
            toast.error('Görevler yüklenirken hata oluştu.')
        } else {
            setTasks(taskData as any[])
        }

        // 2. Fetch Workers for Schedule (Timeslap)
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, full_name, role, department, avatar_url, tasks(status, start_date, end_date)')
            .eq('is_active', true)
            .order('full_name')

        if (!userError) setWorkers(userData)

        // 3. Fetch my applications
        if (user) {
            const { data: volData } = await supabase
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
    }, [user, deptFilter, priorityFilter])

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleVolunteer = async (taskId: string) => {
        if (!user) return

        try {
            const isApplied = myApplications.includes(taskId)

            if (isApplied) {
                const { error } = await supabase
                    .from('task_volunteers')
                    .delete()
                    .eq('task_id', taskId)
                    .eq('user_id', user.id)

                if (error) throw error
                toast.success('Başvurunuz geri çekildi.')
                setMyApplications(prev => prev.filter(id => id !== taskId))
            } else {
                const { error } = await supabase
                    .from('task_volunteers')
                    .insert({ task_id: taskId, user_id: user.id })

                if (error) throw error
                toast.success('Görevi üstlenme isteğiniz GM\'e iletildi.')
                setMyApplications(prev => [...prev, taskId])
            }
        } catch (error) {
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
        <DashboardLayout>
            <div className="container mx-auto py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Görev Havuzu</h1>
                        <p className="text-muted-foreground">
                            Atanmamış görevleri inceleyin veya çalışan takvimini kontrol edin.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Görev ara..."
                                className="pl-9 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={deptFilter} onValueChange={setDeptFilter}>
                            <SelectTrigger className="w-full md:w-40 rounded-xl bg-white/50 border-slate-200">
                                <SelectValue placeholder="Departman" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">Tüm Departmanlar</SelectItem>
                                <SelectItem value="Yazılım">Yazılım</SelectItem>
                                <SelectItem value="SPS">SPS</SelectItem>
                                <SelectItem value="E-Konstrüksiyon">E-Konstrüksiyon</SelectItem>
                                <SelectItem value="Üretim">Üretim</SelectItem>
                                <SelectItem value="Tasarım">Tasarım</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-full md:w-40 rounded-xl bg-white/50 border-slate-200">
                                <SelectValue placeholder="Öncelik" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">Tüm Öncelikler</SelectItem>
                                <SelectItem value="1">P1 - Acil</SelectItem>
                                <SelectItem value="2">P2 - Yüksek</SelectItem>
                                <SelectItem value="3">P3 - Normal</SelectItem>
                                <SelectItem value="4">P4 - Düşük</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Tabs defaultValue="tasks" className="space-y-6">
                    <TabsList className="bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
                        <TabsTrigger value="tasks" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <LayoutGrid className="w-4 h-4 mr-2" /> Görev Listesi
                        </TabsTrigger>
                        <TabsTrigger value="timeline" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <CalendarDays className="w-4 h-4 mr-2" /> Çalışan Çizelgesi (Timeslap)
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="tasks">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse border border-slate-200" />
                                ))}
                            </div>
                        ) : filteredTasks.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800">
                                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700">
                                    <AlertCircle className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Aranan Görev Bulunamadı</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mt-2 text-pretty">
                                    Filtrelerinizi değiştirerek tekrar aramayı deneyebilirsiniz.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredTasks.map((task) => {
                                    const isApplied = myApplications.includes(task.id)
                                    return (
                                        <Card key={task.id} className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-slate-200/60 dark:border-slate-800 rounded-[24px] overflow-hidden flex flex-col bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
                                            <CardHeader className="pb-3 px-6 pt-6">
                                                <div className="flex justify-between items-start mb-3">
                                                    {getPriorityBadge(task.priority)}
                                                    <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase bg-slate-50">
                                                        {task.department}
                                                    </Badge>
                                                </div>
                                                <CardTitle className="line-clamp-2 text-xl font-black leading-tight group-hover:text-blue-600 transition-colors">
                                                    {task.title}
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-2 mt-2 font-medium">
                                                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <User className="w-3 h-3 text-slate-500" />
                                                    </div>
                                                    {task.owner?.full_name}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex-1 pb-6 px-6">
                                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-6 leading-relaxed">
                                                    {task.description}
                                                </p>
                                                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400">Başlangıç</span>
                                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                            {format(new Date(task.start_date), 'dd MMM', { locale: tr })}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400">Bitiş</span>
                                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                            {format(new Date(task.end_date), 'dd MMM', { locale: tr })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="p-6 pt-0">
                                                <Button
                                                    variant={isApplied ? "outline" : "default"}
                                                    className={cn(
                                                        "w-full h-11 rounded-xl font-bold transition-all duration-300",
                                                        isApplied
                                                            ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                                            : "bg-slate-900 hover:bg-blue-600 text-white shadow-lg shadow-slate-200 hover:shadow-blue-200"
                                                    )}
                                                    onClick={() => handleVolunteer(task.id)}
                                                >
                                                    {isApplied ? (
                                                        <>
                                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
                                                            Talep İletildi
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Hand className="w-4 h-4 mr-2" />
                                                            Görevi Üstlen
                                                        </>
                                                    )}
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="timeline">
                        <Card className="border-none shadow-xl rounded-[32px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-md overflow-hidden">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-xl font-black">Haftalık Çalışan Çizelgesi</CardTitle>
                                <CardDescription>Gelecek haftaki iş yükü ve çalışan müsaitlik durumu.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
                                                <th className="p-6 text-left font-black w-64">Çalışan</th>
                                                {/* Generating next 7 days */}
                                                {[...Array(7)].map((_, i) => (
                                                    <th key={i} className="p-4 text-center font-bold">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                                {format(new Date(Date.now() + i * 86400000), 'EEE', { locale: tr })}
                                                            </span>
                                                            <span className="text-sm">
                                                                {format(new Date(Date.now() + i * 86400000), 'dd MMM', { locale: tr })}
                                                            </span>
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {workers.map(worker => (
                                                <tr key={worker.id} className="hover:bg-slate-50/30 transition-colors group">
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 flex items-center justify-center font-black text-blue-600 dark:text-blue-400 border border-white dark:border-slate-700 shadow-sm">
                                                                {worker.full_name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                                    {worker.full_name}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400 uppercase font-black">{worker.department}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {[...Array(7)].map((_, i) => {
                                                        const dateStr = format(new Date(Date.now() + i * 86400000), 'yyyy-MM-dd')
                                                        const activeTask = worker.tasks?.find((t: any) =>
                                                            t.status === 'active' &&
                                                            dateStr >= t.start_date &&
                                                            dateStr <= t.end_date
                                                        )
                                                        return (
                                                            <td key={i} className="p-2 align-middle">
                                                                <div className={cn(
                                                                    "h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                                                                    activeTask
                                                                        ? "bg-blue-50/50 text-blue-600 border border-blue-100 font-bold text-[10px] shadow-inner"
                                                                        : "bg-slate-50/30 border border-dashed border-slate-100"
                                                                )}>
                                                                    {activeTask ? 'Dolu' : ''}
                                                                </div>
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
