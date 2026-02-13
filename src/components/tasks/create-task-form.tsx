'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { format } from 'date-fns'
import { tr, enUS, de } from 'date-fns/locale'
import {
    CalendarIcon,
    Loader2,
    Plus,
    Zap,
    Hammer,
    Layout,
    Sparkles,
    Search,
    CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useI18nStore } from '@/stores/i18n-store'
import { toast } from 'sonner'

const taskSchema = z.object({
    title: z.string().min(5, 'Başlık en az 5 karakter olmalıdır'),
    description: z.string().min(20, 'Açıklama en az 20 karakter olmalıdır'),
    department: z.string().min(1, 'Lütfen bir departman seçin'),
    assigned_worker_id: z.string().optional(),
    task_type: z.string().min(1, 'Lütfen destek talebi tipi seçin'),
    priority: z.string().min(1, 'Lütfen öncelik seçin'),
    start_date: z.date({ required_error: 'Başlangıç tarihi zorunludur' }),
    end_date: z.date({ required_error: 'Bitiş tarihi zorunludur' }),
    is_strategic: z.boolean(),
    is_production: z.boolean(),
    order_number: z.string().optional(),
    customer_deadline: z.date().optional(),
}).refine((data) => data.end_date >= data.start_date, {
    message: "Bitiş tarihi başlangıç tarihinden önce olamaz",
    path: ["end_date"],
})

type TaskFormValues = z.infer<typeof taskSchema>

interface CreateTaskFormProps {
    onSuccess?: () => void
}

export function CreateTaskForm({ onSuccess }: CreateTaskFormProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { user } = useAuthStore()
    const { t, locale } = useI18nStore()
    const supabase = createClient()

    const dateLocale = locale === 'tr' ? tr : locale === 'de' ? de : enUS

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: '',
            description: '',
            department: '',
            assigned_worker_id: '',
            task_type: 'Havuz Destek Talebi',
            priority: '3',
            is_strategic: false,
            is_production: false,
            order_number: '',
        },
    })

    async function onSubmit(data: TaskFormValues) {
        if (!user) return

        setIsLoading(true)
        try {
            const { error } = await supabase.from('tasks').insert({
                title: data.title,
                description: data.description,
                department: data.department,
                assigned_worker_id: data.assigned_worker_id || null,
                task_type: data.task_type,
                priority: parseInt(data.priority),
                start_date: data.start_date.toISOString(),
                end_date: data.end_date.toISOString(),
                is_strategic: data.is_strategic,
                is_production: data.is_production,
                order_number: data.order_number || null,
                customer_deadline: data.customer_deadline?.toISOString() || null,
                owner_id: user.id,
                status: user.role === 'gm'
                    ? (data.assigned_worker_id ? 'active' : 'pending')
                    : 'requested'
            })

            if (error) throw error

            toast.success(t('tasks.createdSuccess'))
            form.reset()
            setOpen(false)
            onSuccess?.()
        } catch (error: any) {
            toast.error(t('tasks.createError') + ' ' + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const departments = [
        { label: t('departments.software'), value: 'Yazılım' },
        { label: t('departments.construction'), value: 'Konstrüksiyon' },
        { label: t('departments.production'), value: 'Üretim' },
        { label: t('departments.hrSales'), value: 'İK & Satış' },
        { label: t('departments.finance'), value: 'Finans' },
        { label: t('departments.ai'), value: 'Yapay Zekâ' },
        { label: t('departments.erp'), value: 'Teklif/ERP' },
        { label: t('departments.sps'), value: 'SPS' },
        { label: t('departments.eConstruction'), value: 'E-Konstrüksiyon' }
    ]

    // Fetch workers with their skills and active task count
    const [workers, setWorkers] = useState<any[]>([])
    const [skillFilter, setSkillFilter] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState('')
    const [allSkillNames, setAllSkillNames] = useState<string[]>([])

    useEffect(() => {
        const fetchWorkers = async () => {
            const { data: workerData, error } = await supabase
                .from('users')
                .select(`
                    id, 
                    full_name, 
                    role,
                    department,
                    items: skills(skill_name),
                    active_tasks: tasks(count),
                    support_slots: personal_tasks(can_support, is_recurring, recurring_days, start_date, end_date)
                `)
                .eq('role', 'worker')
                .eq('is_active', true)

            if (!error && workerData) {
                const formattedWorkers = workerData.map((w: any) => ({
                    ...w,
                    skill_names: w.items?.map((s: any) => s.skill_name) || [],
                    active_task_count: w.active_tasks?.[0]?.count || 0,
                    can_support_now: w.support_slots?.some((s: any) => s.can_support) || false
                }))
                setWorkers(formattedWorkers)

                // Collect all unique skill names for filter dropdown
                const skillSet = new Set<string>()
                formattedWorkers.forEach((w: any) => {
                    w.skill_names.forEach((s: string) => skillSet.add(s))
                })
                setAllSkillNames([...skillSet].sort())
            }
        }
        fetchWorkers()
    }, [])

    const titleInput = form.watch('title')

    // Recommendation Logic
    const recommendedWorkers = useMemo(() => {
        if (!titleInput || titleInput.length < 3) return []
        const titleLower = titleInput.toLowerCase()
        return workers.filter(w =>
            w.skill_names.some((skill: string) => titleLower.includes(skill.toLowerCase()))
        )
    }, [titleInput, workers])

    // Filter workers by selected skill and search query
    const filteredWorkers = useMemo(() => {
        let result = workers
        if (skillFilter) {
            result = result.filter(w =>
                w.skill_names.some((s: string) => s.toLowerCase() === skillFilter.toLowerCase())
            )
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase().trim()
            result = result.filter(w =>
                w.full_name?.toLowerCase().includes(query) ||
                w.department?.toLowerCase().includes(query)
            )
        }
        return result
    }, [skillFilter, searchQuery, workers])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 shadow-lg shadow-blue-500/20 gap-2 transition-all hover:scale-105 active:scale-95">
                    <Plus className="h-5 w-5" /> {t('tasks.createButton')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto rounded-[32px] p-0 border-none shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                <DialogHeader className="p-8 pb-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-800/50 dark:to-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Plus className="h-7 w-7" />
                        </div>
                        <div className="flex flex-col">
                            <span>{t('tasks.createTitle')}</span>
                            <span className="text-xs font-medium text-slate-500 normal-case tracking-normal mt-0.5">
                                UVW Pool Management System
                            </span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem className="col-span-1 md:col-span-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Layout className="w-4 h-4 text-blue-500" />
                                            <FormLabel className="font-bold">{t('tasks.titleLabel')}</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Input
                                                placeholder={t('tasks.titlePlaceholder')}
                                                className="rounded-xl h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all focus:ring-2 focus:ring-blue-500/20"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="department"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold">{t('tasks.departmentLabel')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-200">
                                                    <SelectValue placeholder={t('tasks.departmentPlaceholder')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                                {departments.map(dept => (
                                                    <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold">{t('tasks.priorityLabel')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-200 font-medium">
                                                    <SelectValue placeholder={t('tasks.priorityPlaceholder')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                                <SelectItem value="1" className="text-red-600 font-bold">{t('tasks.priority1')}</SelectItem>
                                                <SelectItem value="2" className="text-orange-600 font-bold">{t('tasks.priority2')}</SelectItem>
                                                <SelectItem value="3" className="text-blue-600 font-medium">{t('tasks.priority3')}</SelectItem>
                                                <SelectItem value="4" className="text-slate-600">{t('tasks.priority4')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Conditional fields for high priority (1=Acil, 2=Yüksek) */}
                            {(form.watch('priority') === '1' || form.watch('priority') === '2') && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="order_number"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold text-orange-600">Sipariş Numarası</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="ÖRN: SIP-2026-001"
                                                        className="rounded-xl h-12 bg-orange-50/50 border-orange-200 focus:bg-white transition-all focus:ring-2 focus:ring-orange-500/20"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-[10px] text-orange-500">
                                                    Yüksek öncelikli destek talepleri için sipariş numarası girilmesi önerilir.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="customer_deadline"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="font-bold text-orange-600 mb-1">Müşteri Termin Tarihi</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full h-12 pl-3 text-left font-normal rounded-xl bg-orange-50/50 border-orange-200",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP", { locale: dateLocale })
                                                                ) : (
                                                                    <span>Müşteri termin tarihi seçin</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) => date < new Date()}
                                                            initialFocus
                                                            locale={dateLocale}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormDescription className="text-[10px] text-orange-500">
                                                    Müşteriye taahhüt edilen teslim tarihi.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}

                            {/* Worker Search & Skill Filter */}
                            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-bold text-sm flex items-center gap-2">
                                        <Search className="w-4 h-4 text-blue-500" />
                                        İsim veya Departman Ara
                                    </Label>
                                    <Input
                                        placeholder="İsim, departman..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="rounded-xl h-10 bg-blue-50/50 border-blue-200 text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-sm flex items-center gap-2">
                                        <Search className="w-4 h-4 text-blue-500" />
                                        Yeteneğe Göre Filtrele
                                    </Label>
                                    <Select value={skillFilter} onValueChange={(v) => setSkillFilter(v === '__all__' ? '' : v)}>
                                        <SelectTrigger className="rounded-xl h-10 bg-blue-50/50 border-blue-200 text-sm">
                                            <SelectValue placeholder="Tüm yetenekler (filtre yok)" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-[250px]">
                                            <SelectItem value="__all__">Tüm Yetenekler (Filtre Yok)</SelectItem>
                                            {allSkillNames.map(skill => (
                                                <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <FormField
                                control={form.control}
                                name="assigned_worker_id"
                                render={({ field }) => (
                                    <FormItem className="col-span-1 md:col-span-2">
                                        <FormLabel className="font-bold">Atanan Kişi (Opsiyonel)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-200">
                                                    <SelectValue placeholder="Çalışan seçin" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-[300px]">
                                                {recommendedWorkers.length > 0 && (
                                                    <SelectGroup>
                                                        <SelectLabel className="flex items-center gap-2 text-green-600 bg-green-50 px-2 py-1 rounded mb-1">
                                                            <Sparkles className="w-3 h-3" /> Önerilenler (Skill Eşleşmesi)
                                                        </SelectLabel>
                                                        {recommendedWorkers.map((worker) => (
                                                            <SelectItem key={worker.id} value={worker.id} className="cursor-pointer">
                                                                <div className="flex flex-col text-left">
                                                                    <span className="font-medium">{worker.full_name}</span>
                                                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                                                        {worker.skill_names.slice(0, 3).map((s: string, i: number) => (
                                                                            <span key={i} className="text-[9px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded border border-green-200">{s}</span>
                                                                        ))}
                                                                        {worker.skill_names.length > 3 && <span className="text-[9px] text-slate-400">+{worker.skill_names.length - 3}</span>}
                                                                    </div>
                                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                        {worker.department}
                                                                        {worker.active_task_count > 2 && <span className="text-red-500 font-bold ml-1">(Yoğun!)</span>}
                                                                        {worker.can_support_now && (
                                                                            <span className="flex items-center gap-1 text-emerald-600 font-black ml-2 bg-emerald-50 px-1 rounded">
                                                                                <CheckCircle2 className="w-3 h-3" /> DESTEK OLABİLİR
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                )}
                                                <SelectGroup>
                                                    <SelectLabel>{
                                                        skillFilter ? `${skillFilter} yeteneğine sahip çalışanlar` : 'Tüm Çalışanlar'
                                                    }</SelectLabel>
                                                    {filteredWorkers.filter(w => !recommendedWorkers.find(rw => rw.id === w.id)).map((worker) => (
                                                        <SelectItem key={worker.id} value={worker.id}>
                                                            <div className="flex flex-col text-left">
                                                                <span className="font-medium">{worker.full_name}</span>
                                                                <div className="flex flex-wrap gap-1 mt-0.5">
                                                                    {worker.skill_names.slice(0, 3).map((s: string, i: number) => (
                                                                        <span key={i} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">{s}</span>
                                                                    ))}
                                                                    {worker.skill_names.length > 3 && <span className="text-[9px] text-slate-400">+{worker.skill_names.length - 3}</span>}
                                                                </div>
                                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                    {worker.department}
                                                                    {worker.active_task_count > 2 && <span className="text-red-500 font-bold ml-1">(Yoğun!)</span>}
                                                                    {worker.can_support_now && (
                                                                        <span className="flex items-center gap-1 text-emerald-600 font-black ml-2 bg-emerald-50 px-1 rounded">
                                                                            <CheckCircle2 className="w-3 h-3" /> DESTEK OLABİLİR
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                    {filteredWorkers.filter(w => !recommendedWorkers.find(rw => rw.id === w.id)).length === 0 && (
                                                        <div className="px-3 py-2 text-sm text-slate-400 italic">Bu yeteneğe sahip çalışan yok</div>
                                                    )}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="start_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="font-bold mb-1">{t('tasks.startDate')}</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full h-12 pl-3 text-left font-normal rounded-xl bg-slate-50 border-slate-200",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: dateLocale })
                                                        ) : (
                                                            <span>{t('tasks.selectDate')}</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date < new Date('1900-01-01')}
                                                    initialFocus
                                                    locale={dateLocale}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="end_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="font-bold mb-1">{t('tasks.endDate')}</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full h-12 pl-3 text-left font-normal rounded-xl bg-slate-50 border-slate-200",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: dateLocale })
                                                        ) : (
                                                            <span>{t('tasks.selectDate')}</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date < (form.getValues('start_date') || new Date())}
                                                    initialFocus
                                                    locale={dateLocale}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="col-span-1 md:col-span-2">
                                        <FormLabel className="font-bold">{t('tasks.descriptionLabel')}</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t('tasks.descriptionPlaceholder')}
                                                className="rounded-xl min-h-[120px] resize-none bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">{t('tasks.descriptionHint')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row gap-6 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200/60 dark:border-slate-800">
                                <FormField
                                    control={form.control}
                                    name="is_strategic"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="h-5 w-5 rounded-md border-indigo-300 data-[state=checked]:bg-indigo-600"
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer">
                                                    <Zap className="h-4 w-4" /> {t('tasks.strategic')}
                                                </FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="is_production"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="h-5 w-5 rounded-md border-amber-300 data-[state=checked]:bg-amber-600"
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold cursor-pointer">
                                                    <Hammer className="h-4 w-4" /> {t('tasks.production')}
                                                </FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-14 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                t('tasks.publishButton')
                            )}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
