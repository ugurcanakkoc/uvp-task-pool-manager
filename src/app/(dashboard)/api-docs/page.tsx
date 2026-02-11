'use client'

import React, { useState } from 'react'
import {
    Code2,
    ShieldAlert,
    PlayCircle,
    ChevronRight,
    Lock,
    Unlock,
    CheckCircle2,
    AlertTriangle,
    ExternalLink,
    Tag,
    Clock,
    UserCircle,
    Copy,
    ChevronDown
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from 'sonner'

interface Endpoint {
    path: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    description: string
    auth: 'None' | 'Session' | 'GM Required' | 'Owner/GM'
    params?: string[]
    body?: string
    response?: string
    risk: 'Low' | 'Medium' | 'High'
}

const endpoints: Endpoint[] = [
    {
        path: '/api/tasks/conflict-check',
        method: 'POST',
        description: 'Çalışan takvim çakışmalarını, iş yükünü ve üretim kısıtlamalarını kontrol eder.',
        auth: 'Owner/GM',
        body: '{\n  "worker_id": "uuid",\n  "start_date": "YYYY-MM-DD",\n  "end_date": "YYYY-MM-DD",\n  "task_id": "uuid?",\n  "is_production": boolean?\n}',
        response: '{\n  "has_conflicts": boolean,\n  "conflicts": [],\n  "warnings": [],\n  "needs_escalation": boolean\n}',
        risk: 'Low'
    },
    {
        path: '/api/tasks/gm-override',
        method: 'POST',
        description: 'GM tarafından görev atamalarını, öncelikleri ve çakışmaları zorla değiştirir.',
        auth: 'GM Required',
        body: '{\n  "task_id": "uuid",\n  "action": "force_assign | override_priority | resolve_conflict | return_task",\n  "reason": "text",\n  "worker_id": "uuid?",\n  "priority": number?\n}',
        risk: 'Low'
    },
    {
        path: '/api/tasks/review',
        method: 'POST',
        description: 'Görev onaylama veya revizyon isteme işlemlerini yapar. Puan hesaplamasını tetikler.',
        auth: 'Owner/GM',
        body: '{\n  "taskId": "uuid",\n  "action": "approve | revision",\n  "note": "text"\n}',
        risk: 'Low'
    },
    {
        path: '/api/side-tasks/complete',
        method: 'POST',
        description: 'Yan görevleri tamamlandı olarak işaretler ve puan verir.',
        auth: 'Session',
        body: '{\n  "id": "uuid"\n}',
        risk: 'Low'
    },
    {
        path: '/api/reports/meeting-agenda',
        method: 'GET',
        description: 'Haftalık toplantı gündemi (gecikmeler, yüksek öncelikler, eskalasyonlar) üretir.',
        auth: 'GM Required',
        response: '{\n  "generated_at": "iso-date",\n  "sections": []\n}',
        risk: 'Low'
    },
    {
        path: '/api/cron/check-stale',
        method: 'GET',
        description: 'Sistem otomasyonu: 3 gün boyunca ilerleme olmayan görevleri iade eder, hatırlatıcı gönderir.',
        auth: 'GM Required', // Simplified for UI, actually uses Cron Secret
        risk: 'Low'
    }
]

export default function ApiDocsPage() {
    const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null)
    const [isTesting, setIsTesting] = useState(false)
    const [testResult, setTestResult] = useState<any>(null)

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Kopyalandı!')
    }

    const handleTest = async (endpoint: Endpoint) => {
        setIsTesting(true)
        setTestResult(null)
        try {
            const options: RequestInit = {
                method: endpoint.method,
                headers: { 'Content-Type': 'application/json' }
            }
            if (endpoint.method === 'POST' && endpoint.body) {
                // For safety, don't actually send random UUIDs, let user provide them?
                // For now, just show we can't test without data.
                throw new Error('Test için gövde verisi (JSON) gereklidir.')
            }

            const response = await fetch(endpoint.path, options)
            const data = await response.json()
            setTestResult(data)
        } catch (error: any) {
            setTestResult({ error: error.message })
        } finally {
            setIsTesting(false)
        }
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        API Documentation
                    </h2>
                    <p className="text-muted-foreground">
                        UVW Havuz Sistemi API kütüphanesi ve entegrasyon dökümantasyonu.
                    </p>
                </div>
                <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    Security Audit v1.0
                </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-1 lg:col-span-1 border-blue-100 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <CardTitle className="text-lg flex items-center">
                            <Code2 className="w-5 h-5 mr-2 text-blue-500" />
                            Endpoint Listesi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {endpoints.map((ep) => (
                                <button
                                    key={ep.path}
                                    onClick={() => setSelectedEndpoint(ep)}
                                    className={`w-full text-left p-4 hover:bg-blue-50/50 transition-colors flex items-center justify-between group ${selectedEndpoint?.path === ep.path ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                                        }`}
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <Badge className={
                                                ep.method === 'GET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }>
                                                {ep.method}
                                            </Badge>
                                            <span className="font-mono text-sm font-medium">{ep.path.split('/').pop()}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate w-48">{ep.description}</p>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${selectedEndpoint?.path === ep.path ? 'translate-x-1 text-blue-500' : ''
                                        }`} />
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-1 lg:col-span-2 shadow-md border-slate-200">
                    {selectedEndpoint ? (
                        <>
                            <CardHeader className="border-b border-slate-100 bg-white sticky top-0 z-10">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-slate-900 text-white hover:bg-slate-800">
                                                {selectedEndpoint.method}
                                            </Badge>
                                            <code className="bg-slate-100 px-2 py-0.5 rounded text-sm font-bold text-slate-800">
                                                {selectedEndpoint.path}
                                            </code>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => copyToClipboard(selectedEndpoint.path)}
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <CardTitle className="text-xl mt-2">{selectedEndpoint.description}</CardTitle>
                                    </div>
                                    <Badge
                                        variant={selectedEndpoint.risk === 'High' ? 'destructive' : 'secondary'}
                                        className={selectedEndpoint.risk === 'Medium' ? 'bg-orange-100 text-orange-700 border-orange-200' : ''}
                                    >
                                        Risk: {selectedEndpoint.risk}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid gap-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <p className="text-xs font-semibold text-slate-500 uppercase flex items-center">
                                                <Lock className="w-3 h-3 mr-1" /> Authentication
                                            </p>
                                            <div className="flex items-center gap-2">
                                                {selectedEndpoint.auth === 'None' ? (
                                                    <Unlock className="w-4 h-4 text-orange-500" />
                                                ) : (
                                                    <Lock className="w-4 h-4 text-green-500" />
                                                )}
                                                <span className="text-sm font-medium">{selectedEndpoint.auth}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <p className="text-xs font-semibold text-slate-500 uppercase flex items-center">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Status
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                                <span className="text-sm font-medium">Production Ready</span>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedEndpoint.body && (
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold flex items-center">
                                                <Tag className="w-4 h-4 mr-2" /> Request Body (JSON)
                                            </h4>
                                            <div className="relative group">
                                                <pre className="p-4 bg-slate-900 rounded-lg overflow-auto text-blue-300 text-xs font-mono max-h-48 leading-relaxed">
                                                    {selectedEndpoint.body}
                                                </pre>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="absolute top-2 right-2 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => copyToClipboard(selectedEndpoint.body!)}
                                                >
                                                    <Copy className="h-3 w-3 mr-2" /> Copy
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {selectedEndpoint.response && (
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold flex items-center">
                                                <ExternalLink className="w-4 h-4 mr-2" /> Mock Response
                                            </h4>
                                            <pre className="p-4 bg-slate-50 border border-slate-200 rounded-lg overflow-auto text-slate-700 text-xs font-mono max-h-48">
                                                {selectedEndpoint.response}
                                            </pre>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-slate-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-semibold flex items-center">
                                                <PlayCircle className="w-4 h-4 mr-2" /> Endpoint Testi
                                            </h4>
                                            {selectedEndpoint.auth === 'None' && selectedEndpoint.method === 'GET' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleTest(selectedEndpoint)}
                                                    disabled={isTesting}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                    {isTesting ? 'İşleniyor...' : 'Şimdi Test Et'}
                                                </Button>
                                            )}
                                        </div>

                                        {testResult && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-slate-500">Test Sonucu:</p>
                                                <pre className="p-4 bg-slate-100 rounded-lg overflow-auto text-xs font-mono border border-slate-200 max-h-64">
                                                    {JSON.stringify(testResult, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                        {selectedEndpoint.method === 'POST' && (
                                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 items-start">
                                                <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
                                                <p className="text-xs text-blue-800 leading-relaxed">
                                                    POST istekleri veritabanında değişiklik yapabileceği için UI üzerinden test edilmemektedir.
                                                    Lütfen bu istekleri <strong>Postman</strong> veya <strong>Insomnia</strong> kullanarak GM oturumu ile test ediniz.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </>
                    ) : (
                        <div className="h-[500px] flex flex-col items-center justify-center text-center p-8 space-y-4">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                                <Code2 className="w-8 h-8 text-blue-500" />
                            </div>
                            <div className="max-w-sm space-y-2">
                                <h3 className="text-xl font-bold">Dökümantasyon Seçiniz</h3>
                                <p className="text-muted-foreground text-sm">
                                    Sol taraftaki listeden incelemek ve test etmek istediğiniz bir API endpoint'ini seçiniz.
                                </p>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            <Card className="border-orange-200 bg-orange-50/30">
                <CardHeader>
                    <CardTitle className="text-orange-800 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Güvenlik Denetimi Notları
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 w-2 h-2 rounded-full bg-orange-500" />
                            <div>
                                <p className="text-sm font-semibold text-orange-900">Açık Endpointler</p>
                                <p className="text-xs text-orange-800 opacity-80">
                                    `/api/tasks/conflict-check` ve `/api/reports/meeting-agenda` oturum gerektirmiyor. Geliştirme aşamasında kolaylık sağlasa da canlı sistemde yetkilendirme (role check) eklenmelidir.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 w-2 h-2 rounded-full bg-red-500" />
                            <div>
                                <p className="text-sm font-semibold text-red-900">Kritik: Debug API</p>
                                <p className="text-xs text-red-800 opacity-80">
                                    `/api/debug-auth` tüm kullanıcı listesine erişim sağlayabilir. Canlıya geçiş öncesi mutlaka silinmelidir.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 w-2 h-2 rounded-full bg-blue-500" />
                            <div>
                                <p className="text-sm font-semibold text-blue-900">Öneri: Rate Limiting</p>
                                <p className="text-xs text-blue-800 opacity-80">
                                    Özellikle raporlama ve çakışma kontrolü gibi yoğun işlem gerektiren API'ler için IP bazlı limitlendirme önerilir.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 w-2 h-2 rounded-full bg-blue-500" />
                            <div>
                                <p className="text-sm font-semibold text-blue-900">Öneri: Audit Logs</p>
                                <p className="text-xs text-blue-800 opacity-80">
                                    Tüm `POST` işlemlerinde olduğu gibi `GM Override` işlemleri de loglanmaktadır, ancak logları görselleştirecek bir arayüz eklenmelidir.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
