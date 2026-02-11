'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TaskCard } from './task-card'
import { Input } from '@/components/ui/input'
import {
    Search,
    Filter,
    ArrowUpDown,
    Loader2,
    Inbox
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { useI18nStore } from '@/stores/i18n-store'
import type { Tables } from '@/types/supabase'

type Task = Tables<'tasks'>

export function TaskPool() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedDepts, setSelectedDepts] = useState<string[]>([])
    const { user } = useAuthStore()
    const { t } = useI18nStore()
    const supabase = createClient()

    const departments = ['Yazılım', 'Konstrüksiyon', 'Üretim', 'İK & Satış', 'Finans', 'Yapay Zekâ', 'Teklif/ERP', 'SPS', 'E-Konstrüksiyon']

    const fetchTasks = async () => {
        setIsLoading(true)
        try {
            let query = supabase
                .from('tasks')
                .select(`
                    *,
                    task_volunteers (
                        id,
                        user:users (
                            id,
                            full_name,
                            avatar_url,
                            department
                        )
                    )
                `)
                .order('priority', { ascending: true })
                .order('created_at', { ascending: false })

            if (selectedDepts.length > 0) {
                query = query.in('department', selectedDepts)
            }

            const { data, error } = await query

            if (error) throw error
            setTasks(data || [])
        } catch (error: any) {
            toast.error(t('tasks.loadError') + ' ' + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchTasks()
    }, [selectedDepts])

    const handleVolunteer = async (taskId: string) => {
        if (!user) return

        try {
            // Check if already volunteered
            const task = tasks.find(t => t.id === taskId) as any
            const isApplied = task?.task_volunteers?.some((v: any) => v.user?.id === user.id)

            if (isApplied) {
                // Withdraw
                const { error } = await supabase
                    .from('task_volunteers')
                    .delete()
                    .eq('task_id', taskId)
                    .eq('user_id', user.id)

                if (error) throw error
                toast.success('Başvurunuz geri çekildi.')
            } else {
                // Apply
                const { error } = await supabase
                    .from('task_volunteers')
                    .insert({
                        task_id: taskId,
                        user_id: user.id
                    })

                if (error) throw error
                toast.success('Göreve talip oldunuz! Yönetici onayı bekleniyor.')
            }

            fetchTasks()
        } catch (error: any) {
            toast.error('İşlem sırasında hata oluştu: ' + error.message)
        }
    }

    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:max-w-md group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        placeholder={t('common.searchTasks')}
                        className="pl-10 h-11 border-slate-200/60 rounded-xl bg-white/80 backdrop-blur-sm focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-500/10 dark:bg-slate-900/50 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 rounded-xl gap-2 border-slate-200/60 px-4 bg-white/80 backdrop-blur-sm hover:bg-white dark:bg-slate-900/50">
                                <Filter className="h-4 w-4" />
                                {t('common.departments')}
                                {selectedDepts.length > 0 && (
                                    <span className="ml-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold">
                                        {selectedDepts.length}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl backdrop-blur-xl shadow-xl">
                            <DropdownMenuLabel>{t('common.departmentFilter')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {departments.map((dept) => (
                                <DropdownMenuCheckboxItem
                                    key={dept}
                                    checked={selectedDepts.includes(dept)}
                                    onCheckedChange={(checked) => {
                                        setSelectedDepts(prev =>
                                            checked ? [...prev, dept] : prev.filter(d => d !== dept)
                                        )
                                    }}
                                >
                                    {dept}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                        <ArrowUpDown className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                        <Loader2 className="relative h-10 w-10 animate-spin text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">{t('tasks.scanningPool')}</p>
                </div>
            ) : filteredTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredTasks.map((task: any) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            userRole={user?.role as any}
                            currentUserId={user?.id}
                            onVolunteer={handleVolunteer}
                            onUpdated={() => fetchTasks()} // Callback to refresh
                        />
                    ))}
                </div>
            ) : (
                <div className="h-80 flex flex-col items-center justify-center gap-5 border border-dashed border-slate-200/60 rounded-2xl bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900/50 dark:to-slate-950/50">
                    <div className="relative">
                        <div className="absolute inset-0 bg-slate-200/50 rounded-2xl blur-xl" />
                        <div className="relative w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700">
                            <Inbox className="h-7 w-7 text-slate-400" />
                        </div>
                    </div>
                    <div className="text-center">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">{t('tasks.notFound')}</h3>
                        <p className="text-sm text-slate-500">{t('tasks.notFoundDesc')}</p>
                    </div>
                    <Button
                        variant="outline"
                        className="rounded-xl border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                        onClick={() => { setSearch(''); setSelectedDepts([]) }}
                    >
                        {t('common.clearFilters')}
                    </Button>
                </div>
            )}
        </div>
    )
}
