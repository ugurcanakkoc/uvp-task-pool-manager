'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    HelpCircle,
    Plus,
    Loader2,
    MessageSquare,
    Clock,
    CheckCircle,
    AlertCircle,
    Send
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

interface SupportRequest {
    id: string
    title: string
    description: string
    category: string
    status: string
    priority: string
    created_at: string
    resolved_at: string | null
    response: string | null
    user_id: string
}

export default function SupportPage() {
    const [requests, setRequests] = useState<SupportRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('')
    const [priority, setPriority] = useState('normal')
    const supabase = createClient()
    const { user } = useAuthStore()

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('support_requests')
            .select('*')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setRequests(data as SupportRequest[])
        }
        setIsLoading(false)
    }

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim() || !category) {
            toast.error('Lütfen tüm alanları doldurun.')
            return
        }

        setIsSubmitting(true)
        const { error } = await supabase.from('support_requests').insert({
            user_id: user?.id,
            title: title.trim(),
            description: description.trim(),
            category,
            priority,
            status: 'open'
        })

        if (!error) {
            toast.success('Destek talebiniz başarıyla oluşturuldu!')
            setTitle('')
            setDescription('')
            setCategory('')
            setPriority('normal')
            setShowForm(false)
            fetchRequests()
        } else {
            toast.error('Hata: ' + error.message)
        }
        setIsSubmitting(false)
    }

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'open': return { label: 'Açık', class: 'bg-blue-100 text-blue-700', icon: Clock }
            case 'in_review': return { label: 'İnceleniyor', class: 'bg-amber-100 text-amber-700', icon: AlertCircle }
            case 'resolved': return { label: 'Çözüldü', class: 'bg-green-100 text-green-700', icon: CheckCircle }
            default: return { label: status, class: 'bg-slate-100 text-slate-700', icon: Clock }
        }
    }

    const categories = [
        { value: 'resource', label: 'Kaynak Talebi' },
        { value: 'conflict', label: 'Çakışma / Problem' },
        { value: 'priority_change', label: 'Öncelik Değişikliği' },
        { value: 'deadline_extension', label: 'Süre Uzatma' },
        { value: 'general', label: 'Genel Destek' },
    ]

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Destek Talepleri</h1>
                        <p className="text-sm text-slate-500">GM'e destek talebi gönderin veya mevcut taleplerinizi takip edin</p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)} className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4" /> Yeni Talep
                    </Button>
                </div>

                {/* New Request Form */}
                {showForm && (
                    <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-l-4 border-l-blue-500">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="font-bold text-sm">Yeni Destek Talebi</h3>

                            <Input
                                placeholder="Talep başlığı"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="rounded-xl h-11"
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="rounded-xl h-11">
                                        <SelectValue placeholder="Kategori seçin" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {categories.map(c => (
                                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={priority} onValueChange={setPriority}>
                                    <SelectTrigger className="rounded-xl h-11">
                                        <SelectValue placeholder="Öncelik" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="low">Düşük</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="high">Yüksek</SelectItem>
                                        <SelectItem value="urgent">Acil</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Textarea
                                placeholder="Detaylı açıklama yazın..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="rounded-xl min-h-[100px] resize-none"
                            />

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">İptal</Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700">
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    Gönder
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Request List */}
                <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-500" /> Taleplerim ({requests.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="text-center py-8">
                                <HelpCircle className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                                <p className="text-sm text-slate-400">Henüz destek talebiniz bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {requests.map(req => {
                                    const statusInfo = getStatusInfo(req.status)
                                    const StatusIcon = statusInfo.icon
                                    return (
                                        <div key={req.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-sm">{req.title}</h4>
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{req.description}</p>
                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                        <Badge className={cn("text-[10px] px-1.5 py-0", statusInfo.class)}>
                                                            <StatusIcon className="w-3 h-3 mr-1" /> {statusInfo.label}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                            {categories.find(c => c.value === req.category)?.label || req.category}
                                                        </Badge>
                                                        <span className="text-[10px] text-slate-400">
                                                            {format(new Date(req.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {req.response && (
                                                <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                                                    <p className="text-xs font-bold text-green-700 mb-1">GM Yanıtı:</p>
                                                    <p className="text-sm text-green-600">{req.response}</p>
                                                </div>
                                            )}
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
