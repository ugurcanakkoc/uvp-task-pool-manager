'use client'

import { useEffect, useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    BarChart3,
    AlertTriangle,
    TrendingUp,
    Users,
    Clock,
    Shield,
    FileText,
    Loader2,
    RefreshCcw,
    PieChart,
    Activity,
    Target
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, subDays } from 'date-fns'
import { tr } from 'date-fns/locale'

// ─── Types ───
interface ReportData {
    departmentStats: DepartmentStat[]
    workerPerformance: WorkerPerf[]
    priorityDistribution: PriorityDist[]
    taskFlowStats: TaskFlowStat
    antiManipulation: AntiManipulationResult
    weeklyTrend: WeeklyTrend[]
}

interface DepartmentStat { department: string; total: number; completed: number; open: number; in_progress: number }
interface WorkerPerf { id: string; full_name: string; completed: number; in_progress: number; avg_days: number; total_points: number }
interface PriorityDist { priority: number; count: number; label: string }
interface TaskFlowStat { total: number; open: number; in_progress: number; completed: number; returned: number; review: number }
interface WeeklyTrend { week: string; created: number; completed: number }
interface AntiManipulationResult {
    monopolyAlerts: { worker_name: string; task_count: number; percentage: number }[]
    priorityInflation: { owner_name: string; high_priority_pct: number; total: number }[]
    fakeProgress: { worker_name: string; task_title: string; duplicate_count: number }[]
    taskSplitting: { owner_name: string; short_tasks: number; total: number; ratio: number }[]
}

export default function ReportsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [reportData, setReportData] = useState<ReportData | null>(null)
    const [activeTab, setActiveTab] = useState('overview')
    const { user } = useAuthStore()
    const supabase = createClient()

    useEffect(() => {
        fetchAllReports()
    }, [])

    const fetchAllReports = async () => {
        setIsLoading(true)

        const [
            deptStats,
            workerPerf,
            priorityDist,
            flowStats,
            antiManip,
            trend
        ] = await Promise.all([
            fetchDepartmentStats(),
            fetchWorkerPerformance(),
            fetchPriorityDistribution(),
            fetchTaskFlowStats(),
            fetchAntiManipulation(),
            fetchWeeklyTrend()
        ])

        setReportData({
            departmentStats: deptStats,
            workerPerformance: workerPerf,
            priorityDistribution: priorityDist,
            taskFlowStats: flowStats,
            antiManipulation: antiManip,
            weeklyTrend: trend
        })
        setIsLoading(false)
    }

    // ─── Report 1: Department Stats ───
    const fetchDepartmentStats = async (): Promise<DepartmentStat[]> => {
        const { data } = await supabase.from('tasks').select('department, status')
        if (!data) return []
        const deptMap: Record<string, DepartmentStat> = {}
        data.forEach((t: any) => {
            if (!deptMap[t.department]) {
                deptMap[t.department] = { department: t.department, total: 0, completed: 0, open: 0, in_progress: 0 }
            }
            deptMap[t.department].total++
            if (t.status === 'completed') deptMap[t.department].completed++
            if (t.status === 'open') deptMap[t.department].open++
            if (t.status === 'in_progress') deptMap[t.department].in_progress++
        })
        return Object.values(deptMap).sort((a, b) => b.total - a.total)
    }

    // ─── Report 2: Worker Performance ───
    const fetchWorkerPerformance = async (): Promise<WorkerPerf[]> => {
        const { data: workers } = await supabase
            .from('users')
            .select('id, full_name, total_points')
            .eq('role', 'worker')
            .eq('is_active', true)

        if (!workers) return []

        const { data: tasks } = await supabase
            .from('tasks')
            .select('assigned_worker_id, status, start_date, end_date')
            .not('assigned_worker_id', 'is', null)

        const perfMap: Record<string, WorkerPerf> = {}
        workers.forEach((w: any) => {
            perfMap[w.id] = { id: w.id, full_name: w.full_name, completed: 0, in_progress: 0, avg_days: 0, total_points: w.total_points || 0 }
        })

        if (tasks) {
            const daysMap: Record<string, number[]> = {}
            tasks.forEach((t: any) => {
                if (!perfMap[t.assigned_worker_id]) return
                if (t.status === 'completed') {
                    perfMap[t.assigned_worker_id].completed++
                    if (t.start_date && t.end_date) {
                        const days = Math.ceil((new Date(t.end_date).getTime() - new Date(t.start_date).getTime()) / (1000 * 60 * 60 * 24))
                        if (!daysMap[t.assigned_worker_id]) daysMap[t.assigned_worker_id] = []
                        daysMap[t.assigned_worker_id].push(days)
                    }
                }
                if (t.status === 'in_progress') perfMap[t.assigned_worker_id].in_progress++
            })
            Object.keys(daysMap).forEach(wid => {
                const arr = daysMap[wid]
                perfMap[wid].avg_days = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
            })
        }

        return Object.values(perfMap).sort((a, b) => b.completed - a.completed)
    }

    // ─── Report 3: Priority Distribution ───
    const fetchPriorityDistribution = async (): Promise<PriorityDist[]> => {
        const labels: Record<number, string> = { 1: 'Acil', 2: 'Yüksek', 3: 'Normal', 4: 'Düşük' }
        const { data } = await supabase.from('tasks').select('priority')
        if (!data) return []
        const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
        data.forEach((t: any) => { if (counts[t.priority] !== undefined) counts[t.priority]++ })
        return Object.entries(counts).map(([p, c]) => ({ priority: parseInt(p), count: c, label: labels[parseInt(p)] }))
    }

    // ─── Report 4: Task Flow Stats ───
    const fetchTaskFlowStats = async (): Promise<TaskFlowStat> => {
        const { data } = await supabase.from('tasks').select('status')
        const stats: TaskFlowStat = { total: 0, open: 0, in_progress: 0, completed: 0, returned: 0, review: 0 }
        if (!data) return stats
        data.forEach((t: any) => {
            stats.total++
            if (t.status === 'open') stats.open++
            if (t.status === 'in_progress') stats.in_progress++
            if (t.status === 'completed') stats.completed++
            if (t.status === 'returned') stats.returned++
            if (t.status === 'review') stats.review++
        })
        return stats
    }

    // ─── Report 5-8: Anti-Manipulation Detection ───
    const fetchAntiManipulation = async (): Promise<AntiManipulationResult> => {
        const result: AntiManipulationResult = {
            monopolyAlerts: [],
            priorityInflation: [],
            fakeProgress: [],
            taskSplitting: []
        }

        // 5. Tekelleşme alarmı (monopoly) — bir çalışan toplam görevlerin %30+'ını alıyorsa
        const { data: tasksByWorker } = await supabase
            .from('tasks')
            .select('assigned_worker_id')
            .not('assigned_worker_id', 'is', null)

        if (tasksByWorker) {
            const workerCounts: Record<string, number> = {}
            tasksByWorker.forEach((t: any) => {
                workerCounts[t.assigned_worker_id] = (workerCounts[t.assigned_worker_id] || 0) + 1
            })
            const total = tasksByWorker.length

            const { data: workers } = await supabase.from('users').select('id, full_name').eq('role', 'worker')
            const nameMap: Record<string, string> = {}
            workers?.forEach((w: any) => { nameMap[w.id] = w.full_name })

            for (const [wid, count] of Object.entries(workerCounts)) {
                const pct = Math.round((count / total) * 100)
                if (pct >= 30) {
                    result.monopolyAlerts.push({
                        worker_name: nameMap[wid] || 'Bilinmiyor',
                        task_count: count,
                        percentage: pct
                    })
                }
            }
        }

        // 6. Öncelik şişmesi — bir owner'ın görevlerinin %50+'ı öncelik 1-2 ise
        const { data: ownerTasks } = await supabase
            .from('tasks')
            .select('owner_id, priority')
            .not('owner_id', 'is', null)

        if (ownerTasks) {
            const ownerStats: Record<string, { high: number; total: number }> = {}
            ownerTasks.forEach((t: any) => {
                if (!ownerStats[t.owner_id]) ownerStats[t.owner_id] = { high: 0, total: 0 }
                ownerStats[t.owner_id].total++
                if (t.priority <= 2) ownerStats[t.owner_id].high++
            })

            const { data: owners } = await supabase.from('users').select('id, full_name').in('role', ['owner', 'gm'])
            const ownerNames: Record<string, string> = {}
            owners?.forEach((o: any) => { ownerNames[o.id] = o.full_name })

            for (const [oid, stats] of Object.entries(ownerStats)) {
                const pct = Math.round((stats.high / stats.total) * 100)
                if (pct >= 50 && stats.total >= 3) {
                    result.priorityInflation.push({
                        owner_name: ownerNames[oid] || 'Bilinmiyor',
                        high_priority_pct: pct,
                        total: stats.total
                    })
                }
            }
        }

        // 7. Sahte ilerleme — aynı içerikli birden fazla progress
        const { data: progressData } = await supabase
            .from('task_progress')
            .select('user_id, task_id, content')

        if (progressData) {
            const contentMap: Record<string, { task_id: string; count: number }> = {}
            progressData.forEach((p: any) => {
                const key = `${p.user_id}_${p.content.trim().toLowerCase()}`
                if (!contentMap[key]) contentMap[key] = { task_id: p.task_id, count: 0 }
                contentMap[key].count++
            })

            const { data: usrs } = await supabase.from('users').select('id, full_name')
            const uNames: Record<string, string> = {}
            usrs?.forEach((u: any) => { uNames[u.id] = u.full_name })

            const { data: tsks } = await supabase.from('tasks').select('id, title')
            const tTitles: Record<string, string> = {}
            tsks?.forEach((t: any) => { tTitles[t.id] = t.title })

            for (const [key, val] of Object.entries(contentMap)) {
                if (val.count >= 3) {
                    const userId = key.split('_')[0]
                    result.fakeProgress.push({
                        worker_name: uNames[userId] || 'Bilinmiyor',
                        task_title: tTitles[val.task_id] || 'Bilinmeyen Görev',
                        duplicate_count: val.count
                    })
                }
            }
        }

        // 8. Görev bölme uyarısı — bir owner kısa süreli görevler oluşturuyorsa (1 günlük görevlerin oranı)
        const { data: allTasks } = await supabase
            .from('tasks')
            .select('owner_id, start_date, end_date')
            .not('owner_id', 'is', null)

        if (allTasks) {
            const ownerShort: Record<string, { short: number; total: number }> = {}
            allTasks.forEach((t: any) => {
                if (!ownerShort[t.owner_id]) ownerShort[t.owner_id] = { short: 0, total: 0 }
                ownerShort[t.owner_id].total++
                if (t.start_date && t.end_date) {
                    const days = Math.ceil((new Date(t.end_date).getTime() - new Date(t.start_date).getTime()) / (1000 * 60 * 60 * 24))
                    if (days <= 1) ownerShort[t.owner_id].short++
                }
            })

            const { data: ownrs } = await supabase.from('users').select('id, full_name').in('role', ['owner', 'gm'])
            const oNames: Record<string, string> = {}
            ownrs?.forEach((o: any) => { oNames[o.id] = o.full_name })

            for (const [oid, stats] of Object.entries(ownerShort)) {
                const ratio = Math.round((stats.short / stats.total) * 100)
                if (ratio >= 40 && stats.total >= 3) {
                    result.taskSplitting.push({
                        owner_name: oNames[oid] || 'Bilinmiyor',
                        short_tasks: stats.short,
                        total: stats.total,
                        ratio
                    })
                }
            }
        }

        return result
    }

    // ─── Weekly Trend ───
    const fetchWeeklyTrend = async (): Promise<WeeklyTrend[]> => {
        const weeks: WeeklyTrend[] = []
        for (let i = 3; i >= 0; i--) {
            const start = subDays(new Date(), (i + 1) * 7)
            const end = subDays(new Date(), i * 7)
            const weekLabel = format(start, 'dd MMM', { locale: tr })

            const { count: created } = await supabase
                .from('tasks')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', start.toISOString())
                .lt('created_at', end.toISOString())

            const { count: completed } = await supabase
                .from('tasks')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'completed')
                .gte('created_at', start.toISOString())
                .lt('created_at', end.toISOString())

            weeks.push({ week: weekLabel, created: created || 0, completed: completed || 0 })
        }
        return weeks
    }

    const tabs = [
        { id: 'overview', label: 'Genel Bakış', icon: PieChart },
        { id: 'performance', label: 'Performans', icon: TrendingUp },
        { id: 'departments', label: 'Departmanlar', icon: Users },
        { id: 'antimanip', label: 'Anti-Manipülasyon', icon: Shield },
    ]

    if (isLoading || !reportData) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-3 text-slate-500">Raporlar hazırlanıyor...</span>
                </div>
            </DashboardLayout>
        )
    }

    const { departmentStats, workerPerformance, priorityDistribution, taskFlowStats, antiManipulation, weeklyTrend } = reportData
    const alertCount = antiManipulation.monopolyAlerts.length + antiManipulation.priorityInflation.length +
        antiManipulation.fakeProgress.length + antiManipulation.taskSplitting.length

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Raporlar & Analizler</h1>
                        <p className="text-sm text-slate-500">Görev dağılımı, performans ve anti-manipülasyon kontrolleri</p>
                    </div>
                    <Button onClick={fetchAllReports} variant="outline" className="gap-2 rounded-xl">
                        <RefreshCcw className="h-4 w-4" /> Yenile
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 flex-wrap">
                    {tabs.map(tab => (
                        <Button
                            key={tab.id}
                            variant={activeTab === tab.id ? 'default' : 'outline'}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn("gap-2 rounded-xl text-sm", activeTab === tab.id && "bg-blue-600 text-white")}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                            {tab.id === 'antimanip' && alertCount > 0 && (
                                <Badge className="ml-1 bg-red-500 text-white text-[10px] px-1.5">{alertCount}</Badge>
                            )}
                        </Button>
                    ))}
                </div>

                {/* ═══ Overview Tab ═══ */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <SummaryCard icon={FileText} label="Toplam Görev" value={taskFlowStats.total} color="blue" />
                            <SummaryCard icon={Clock} label="Devam Eden" value={taskFlowStats.in_progress} color="amber" />
                            <SummaryCard icon={Target} label="Tamamlanan" value={taskFlowStats.completed} color="green" />
                            <SummaryCard icon={AlertTriangle} label="İade Edilen" value={taskFlowStats.returned} color="red" />
                        </div>

                        {/* Priority Distribution */}
                        <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
                            <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-500" /> Öncelik Dağılımı</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {priorityDistribution.map(p => {
                                        const maxCount = Math.max(...priorityDistribution.map(x => x.count), 1)
                                        const colors = ['bg-red-500', 'bg-orange-500', 'bg-blue-500', 'bg-slate-400']
                                        return (
                                            <div key={p.priority} className="flex items-center gap-3">
                                                <span className="text-sm font-medium w-16">{p.label}</span>
                                                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-6 overflow-hidden">
                                                    <div
                                                        className={cn("h-full rounded-full flex items-center justify-end pr-2 text-white text-xs font-bold transition-all", colors[p.priority - 1])}
                                                        style={{ width: `${Math.max((p.count / maxCount) * 100, 8)}%` }}
                                                    >
                                                        {p.count}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Weekly Trend */}
                        <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
                            <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><Activity className="w-4 h-4 text-green-500" /> Haftalık Trend</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 gap-4">
                                    {weeklyTrend.map((w, i) => (
                                        <div key={i} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                                            <p className="text-xs text-slate-400 mb-2">{w.week}</p>
                                            <p className="text-lg font-black text-blue-600">+{w.created}</p>
                                            <p className="text-xs text-slate-500">oluşturuldu</p>
                                            <p className="text-lg font-black text-green-600 mt-1">✓{w.completed}</p>
                                            <p className="text-xs text-slate-500">tamamlandı</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ═══ Performance Tab ═══ */}
                {activeTab === 'performance' && (
                    <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
                        <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" /> Çalışan Performans Tablosu</CardTitle></CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="text-left py-3 px-2 font-bold text-slate-500">#</th>
                                            <th className="text-left py-3 px-2 font-bold text-slate-500">Çalışan</th>
                                            <th className="text-center py-3 px-2 font-bold text-slate-500">Tamamlanan</th>
                                            <th className="text-center py-3 px-2 font-bold text-slate-500">Devam Eden</th>
                                            <th className="text-center py-3 px-2 font-bold text-slate-500">Ort. Süre (gün)</th>
                                            <th className="text-center py-3 px-2 font-bold text-slate-500">Puan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {workerPerformance.map((w, i) => (
                                            <tr key={w.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="py-3 px-2 font-bold text-slate-400">{i + 1}</td>
                                                <td className="py-3 px-2 font-medium">{w.full_name}</td>
                                                <td className="py-3 px-2 text-center"><Badge className="bg-green-100 text-green-700">{w.completed}</Badge></td>
                                                <td className="py-3 px-2 text-center"><Badge className="bg-blue-100 text-blue-700">{w.in_progress}</Badge></td>
                                                <td className="py-3 px-2 text-center text-slate-600">{w.avg_days || '-'}</td>
                                                <td className="py-3 px-2 text-center font-black text-amber-600">{w.total_points}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ═══ Departments Tab ═══ */}
                {activeTab === 'departments' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {departmentStats.map(dept => (
                            <Card key={dept.department} className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
                                <CardContent className="p-5">
                                    <h3 className="font-bold text-sm mb-3">{dept.department}</h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                                            <p className="text-lg font-black">{dept.total}</p>
                                            <p className="text-[10px] text-slate-400">Toplam</p>
                                        </div>
                                        <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                                            <p className="text-lg font-black text-green-600">{dept.completed}</p>
                                            <p className="text-[10px] text-green-500">Biten</p>
                                        </div>
                                        <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                            <p className="text-lg font-black text-blue-600">{dept.in_progress}</p>
                                            <p className="text-[10px] text-blue-500">Devam</p>
                                        </div>
                                        <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                            <p className="text-lg font-black text-amber-600">{dept.open}</p>
                                            <p className="text-[10px] text-amber-500">Açık</p>
                                        </div>
                                    </div>
                                    {/* Completion bar */}
                                    <div className="mt-3">
                                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                            <span>Tamamlanma</span>
                                            <span>{dept.total > 0 ? Math.round((dept.completed / dept.total) * 100) : 0}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 rounded-full transition-all"
                                                style={{ width: `${dept.total > 0 ? (dept.completed / dept.total) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* ═══ Anti-Manipulation Tab ═══ */}
                {activeTab === 'antimanip' && (
                    <div className="space-y-4">
                        {alertCount === 0 && (
                            <Card className="border-none shadow-lg bg-green-50/60 dark:bg-green-900/20 border-green-200">
                                <CardContent className="p-6 text-center">
                                    <Shield className="h-10 w-10 mx-auto text-green-500 mb-2" />
                                    <p className="font-bold text-green-700">Herşey yolunda!</p>
                                    <p className="text-sm text-green-600">Şu anda herhangi bir manipülasyon alarmı tespit edilmedi.</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Monopoly Alerts */}
                        {antiManipulation.monopolyAlerts.length > 0 && (
                            <AlertCard
                                title="Tekelleşme Alarmı"
                                description="Bir çalışan toplam görevlerin %30'undan fazlasını üstlenmiş."
                                icon={Users}
                                color="red"
                                items={antiManipulation.monopolyAlerts.map(a =>
                                    `${a.worker_name}: ${a.task_count} görev (%${a.percentage})`
                                )}
                            />
                        )}

                        {/* Priority Inflation */}
                        {antiManipulation.priorityInflation.length > 0 && (
                            <AlertCard
                                title="Öncelik Şişmesi"
                                description="Bir owner'ın görevlerinin %50'den fazlası yüksek öncelikli."
                                icon={TrendingUp}
                                color="orange"
                                items={antiManipulation.priorityInflation.map(a =>
                                    `${a.owner_name}: ${a.total} görevin %${a.high_priority_pct}'i yüksek öncelikli`
                                )}
                            />
                        )}

                        {/* Fake Progress */}
                        {antiManipulation.fakeProgress.length > 0 && (
                            <AlertCard
                                title="Sahte İlerleme Tespiti"
                                description="Aynı içerikli 3+ tekrar eden ilerleme kaydı tespit edildi."
                                icon={FileText}
                                color="yellow"
                                items={antiManipulation.fakeProgress.map(a =>
                                    `${a.worker_name}: "${a.task_title}" görevinde ${a.duplicate_count} tekrar`
                                )}
                            />
                        )}

                        {/* Task Splitting */}
                        {antiManipulation.taskSplitting.length > 0 && (
                            <AlertCard
                                title="Görev Bölme Uyarısı"
                                description="Kısa süreli (≤1 gün) görevlerin oranı %40'ı aşıyor."
                                icon={Target}
                                color="violet"
                                items={antiManipulation.taskSplitting.map(a =>
                                    `${a.owner_name}: ${a.total} görevin ${a.short_tasks}'i kısa süreli (%${a.ratio})`
                                )}
                            />
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}

// ─── Summary Card Component ───
function SummaryCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
    const colorMap: Record<string, string> = {
        blue: 'from-blue-500 to-blue-600',
        amber: 'from-amber-500 to-amber-600',
        green: 'from-green-500 to-green-600',
        red: 'from-red-500 to-red-600',
    }
    return (
        <Card className="border-none shadow-lg overflow-hidden">
            <CardContent className={cn("p-4 bg-gradient-to-br text-white", colorMap[color])}>
                <Icon className="h-5 w-5 opacity-80 mb-2" />
                <p className="text-2xl font-black">{value}</p>
                <p className="text-xs opacity-80">{label}</p>
            </CardContent>
        </Card>
    )
}

// ─── Alert Card Component ───
function AlertCard({ title, description, icon: Icon, color, items }: { title: string; description: string; icon: any; color: string; items: string[] }) {
    const colorClasses: Record<string, string> = {
        red: 'border-red-200 bg-red-50/60 dark:bg-red-900/20',
        orange: 'border-orange-200 bg-orange-50/60 dark:bg-orange-900/20',
        yellow: 'border-yellow-200 bg-yellow-50/60 dark:bg-yellow-900/20',
        violet: 'border-violet-200 bg-violet-50/60 dark:bg-violet-900/20',
    }
    const iconColors: Record<string, string> = { red: 'text-red-500', orange: 'text-orange-500', yellow: 'text-yellow-500', violet: 'text-violet-500' }

    return (
        <Card className={cn("border shadow-lg", colorClasses[color])}>
            <CardContent className="p-5">
                <div className="flex items-start gap-3">
                    <Icon className={cn("h-5 w-5 mt-0.5", iconColors[color])} />
                    <div>
                        <h3 className="font-bold text-sm">{title}</h3>
                        <p className="text-xs text-slate-500 mb-3">{description}</p>
                        <ul className="space-y-1">
                            {items.map((item, i) => (
                                <li key={i} className="text-sm flex items-center gap-2">
                                    <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
