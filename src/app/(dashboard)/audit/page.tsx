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
    Activity,
    History,
    Loader2,
    RefreshCcw,
    Filter,
    Shield,
    User as UserIcon,
    Calendar as CalendarIcon,
    FileText,
    ArrowRight,
    Search,
    AlertCircle,
    Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface AuditLog {
    id: string
    user_id: string
    action: string
    entity_type: string
    entity_id: string
    details: string | null
    created_at: string
    user?: {
        full_name: string
        role?: string
    } | null
}

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filterType, setFilterType] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
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
                user:users!audit_logs_user_id_fkey(full_name, role)
            `)
            .order('created_at', { ascending: false })
            .limit(100)

        if (filterType !== 'all') {
            if (filterType === 'gm_override') {
                query = query.ilike('action', '%override%')
            } else {
                query = query.eq('entity_type', filterType)
            }
        }

        const { data, error } = await query

        if (!error && data) {
            setLogs(data as unknown as AuditLog[])
        }
        setIsLoading(false)
    }

    const getActionType = (action: string) => {
        const a = action.toLowerCase()
        if (a.includes('override')) return { label: 'Zorla Değiştirme', color: 'bg-red-50 text-red-700 border-red-100', icon: Shield }
        if (a.includes('sil') || a.includes('delete') || a.includes('cancelled')) return { label: 'Silme/İptal', color: 'bg-orange-50 text-orange-700 border-orange-100', icon: RefreshCcw }
        if (a.includes('oluştur') || a.includes('create') || a.includes('eklendi')) return { label: 'Oluşturma', color: 'bg-green-50 text-green-700 border-green-100', icon: FileText }
        if (a.includes('güncelle') || a.includes('update') || a.includes('değiştir')) return { label: 'Güncelleme', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: Activity }
        return { label: 'İşlem', color: 'bg-slate-50 text-slate-700 border-slate-100', icon: Info }
    }

    const filteredLogs = logs.filter(l =>
        l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <DashboardLayout>
            <div className="container mx-auto py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                <History className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Denetim İzi</h1>
                        </div>
                        <p className="text-muted-foreground ml-1">
                            Sistemdeki kritik değişiklikleri ve kullanıcı aktivitelerini izleyin.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="İşlem veya kullanıcı ara..."
                                className="pl-9 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-full md:w-48 rounded-xl bg-white/50 border-slate-200">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="İşlem Tipi" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">Tüm Kayıtlar</SelectItem>
                                <SelectItem value="gm_override">GM Müdahaleleri</SelectItem>
                                <SelectItem value="task">Görev Değişiklikleri</SelectItem>
                                <SelectItem value="user">Kullanıcı İşlemleri</SelectItem>
                                <SelectItem value="booking">Planalama (Booking)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={fetchLogs} variant="outline" className="rounded-xl gap-2 font-bold px-4 border-slate-200">
                            <RefreshCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                            {isLoading ? 'Yükleniyor' : 'Yenile'}
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <Card className="border-none shadow-2xl rounded-[32px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-md overflow-hidden">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 border-4 border-blue-100 rounded-full animate-spin border-t-blue-600" />
                                    <History className="w-5 h-5 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <p className="text-sm font-bold text-slate-400 animate-pulse">Kayıtlar getiriliyor...</p>
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="text-center py-24 bg-slate-50/50">
                                <div className="w-20 h-20 bg-white shadow-sm rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                                    <AlertCircle className="w-10 h-10 text-slate-200" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Kayıt Bulunamadı</h3>
                                <p className="text-slate-500 mt-2">Aradığınız kriterlere uygun işlem kaydı mevcut değil.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredLogs.map((log) => {
                                    const actionInfo = getActionType(log.action)
                                    const ActionIcon = actionInfo.icon
                                    return (
                                        <div
                                            key={log.id}
                                            className="group p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300 flex items-start gap-4"
                                        >
                                            {/* Action Icon */}
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                                                actionInfo.color
                                            )}>
                                                <ActionIcon className="w-6 h-6" />
                                            </div>

                                            {/* Action Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-4 mb-1">
                                                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                                                        {log.action}
                                                    </h3>
                                                    <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-1 rounded-lg">
                                                        {format(new Date(log.created_at), 'dd MMM, HH:mm', { locale: tr })}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                                    {/* User Info */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                            <UserIcon className="w-3 h-3 text-slate-500" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                                {log.user?.full_name || 'Sistem'}
                                                            </span>
                                                            <span className="text-[10px] uppercase font-black tracking-tighter text-blue-500">
                                                                {log.user?.role || 'System'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="h-6 w-px bg-slate-200 hidden sm:block" />

                                                    {/* Entity & Details */}
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-white">
                                                            {log.entity_type}
                                                        </Badge>
                                                        {log.details && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                                            <Info className="w-3 h-3 mr-1" /> Detaylar
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="max-w-[300px] p-4 rounded-xl bg-slate-900 text-white border-none shadow-xl">
                                                                        <p className="text-xs leading-relaxed">{log.details}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Indicator */}
                                            <div className="hidden md:flex flex-col items-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" className="rounded-lg h-8 text-[11px] font-bold">
                                                    Kayda Git <ArrowRight className="w-3 h-3 ml-2" />
                                                </Button>
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
