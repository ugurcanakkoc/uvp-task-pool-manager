'use client'

import { useEffect, useState } from 'react'
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
    History,
    Loader2,
    RefreshCcw,
    Filter,
    Shield,
    User,
    Calendar as CalendarIcon,
    FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface AuditLog {
    id: string
    user_id: string
    action: string
    entity_type: string
    entity_id: string
    details: string | null
    created_at: string
    user?: { full_name: string } | null
}

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filterType, setFilterType] = useState('all')
    const supabase = createClient()
    const { user } = useAuthStore()

    useEffect(() => {
        fetchLogs()
    }, [filterType])

    const fetchLogs = async () => {
        setIsLoading(true)
        let query = supabase
            .from('audit_logs')
            .select(`
                id,
                user_id,
                action,
                entity_type,
                entity_id,
                details,
                created_at,
                user:users!audit_logs_user_id_fkey(full_name)
            `)
            .order('created_at', { ascending: false })
            .limit(100)

        if (filterType !== 'all') {
            query = query.eq('entity_type', filterType)
        }

        const { data, error } = await query

        if (!error && data) {
            setLogs(data as unknown as AuditLog[])
        }
        setIsLoading(false)
    }

    const getActionColor = (action: string) => {
        if (action.includes('Override') || action.includes('override')) return 'bg-red-100 text-red-700 border-red-200'
        if (action.includes('oluştur') || action.includes('create') || action.includes('eklendi')) return 'bg-green-100 text-green-700 border-green-200'
        if (action.includes('sil') || action.includes('delete') || action.includes('iade')) return 'bg-red-100 text-red-700 border-red-200'
        if (action.includes('güncelle') || action.includes('update') || action.includes('değiştir')) return 'bg-blue-100 text-blue-700 border-blue-200'
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }

    const getEntityIcon = (type: string) => {
        switch (type) {
            case 'task': return FileText
            case 'user': return User
            case 'booking': return CalendarIcon
            default: return Shield
        }
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">İşlem Kayıtları</h1>
                        <p className="text-sm text-slate-500">Sistem genelindeki tüm işlem ve değişiklik kayıtları</p>
                    </div>
                    <div className="flex gap-2">
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-[150px] rounded-xl">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Filtre" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">Tümü</SelectItem>
                                <SelectItem value="task">Görevler</SelectItem>
                                <SelectItem value="user">Kullanıcılar</SelectItem>
                                <SelectItem value="booking">Buklamalar</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={fetchLogs} variant="outline" className="gap-2 rounded-xl">
                            <RefreshCcw className="h-4 w-4" /> Yenile
                        </Button>
                    </div>
                </div>

                {/* Logs */}
                <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <History className="w-4 h-4 text-blue-500" /> Son İşlemler ({logs.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-8">
                                <History className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                                <p className="text-sm text-slate-400">Henüz işlem kaydı bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {logs.map(log => {
                                    const EntityIcon = getEntityIcon(log.entity_type)
                                    return (
                                        <div
                                            key={log.id}
                                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <EntityIcon className="w-4 h-4 text-slate-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug">
                                                    {log.action}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getActionColor(log.action))}>
                                                        {log.entity_type}
                                                    </Badge>
                                                    {log.user && (
                                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                            <User className="w-3 h-3" /> {(log.user as any)?.full_name}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-slate-400">
                                                        {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
