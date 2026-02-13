'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { format } from 'date-fns'
import { tr, enUS, de } from 'date-fns/locale'
import {
    CalendarIcon,
    Loader2,
    Plus,
    Briefcase,
    Clock,
    AlignLeft
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
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
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

const personalTaskSchema = z.object({
    title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'),
    description: z.string().optional(),
    start_date: z.date({ required_error: 'Başlangıç tarihi zorunludur' }),
    end_date: z.date({ required_error: 'Bitiş tarihi zorunludur' }),
    is_full_day: z.boolean(),
    can_support: z.boolean().default(false),
    is_recurring: z.boolean().default(false),
    recurring_days: z.array(z.number()).optional(),
}).refine((data) => data.end_date >= data.start_date, {
    message: "Bitiş tarihi başlangıç tarihinden önce olamaz",
    path: ["end_date"],
})

type PersonalTaskFormValues = z.infer<typeof personalTaskSchema>

interface PersonalTaskDialogProps {
    onSuccess?: () => void
    trigger?: React.ReactNode
    targetUserId?: string
    task?: any // For editing
    openOverride?: boolean
    onOpenChangeOverride?: (open: boolean) => void
}

export function PersonalTaskDialog({
    onSuccess,
    trigger,
    targetUserId,
    task,
    openOverride,
    onOpenChangeOverride
}: PersonalTaskDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const open = openOverride ?? internalOpen
    const setOpen = onOpenChangeOverride ?? setInternalOpen
    const [isLoading, setIsLoading] = useState(false)
    const { user } = useAuthStore()
    const { t, locale } = useI18nStore()
    const supabase = createClient()

    const dateLocale = locale === 'tr' ? tr : locale === 'de' ? de : enUS

    const form = useForm<PersonalTaskFormValues>({
        resolver: zodResolver(personalTaskSchema),
        defaultValues: {
            title: task?.title || '',
            description: task?.description || '',
            is_full_day: task?.is_full_day ?? true,
            can_support: task?.can_support ?? false,
            is_recurring: task?.is_recurring ?? false,
            recurring_days: task?.recurring_days || [],
            start_date: task?.start_date ? new Date(task.start_date) : new Date(),
            end_date: task?.end_date ? new Date(task.end_date) : new Date(),
        },
    })

    // Reset form when task changes or modal opens
    useEffect(() => {
        if (open) {
            form.reset({
                title: task?.title || '',
                description: task?.description || '',
                is_full_day: task?.is_full_day ?? true,
                can_support: task?.can_support ?? false,
                is_recurring: task?.is_recurring ?? false,
                recurring_days: task?.recurring_days || [],
                start_date: task?.start_date ? new Date(task.start_date) : new Date(),
                end_date: task?.end_date ? new Date(task.end_date) : new Date(),
            })
        }
    }, [open, task])

    async function onSubmit(data: PersonalTaskFormValues) {
        if (!user) return

        setIsLoading(true)
        try {
            const taskData = {
                user_id: targetUserId || task?.user_id || user.id,
                title: data.title,
                description: data.description,
                start_date: data.start_date.toISOString(),
                end_date: data.end_date.toISOString(),
                is_full_day: data.is_full_day,
                can_support: data.can_support,
                is_recurring: data.is_recurring,
                recurring_days: data.recurring_days,
            }

            let error
            if (task?.originalId || task?.id) {
                const id = task.originalId || task.id
                const { error: updateError } = await supabase
                    .from('personal_tasks')
                    .update(taskData)
                    .eq('id', id)
                error = updateError
            } else {
                const { error: insertError } = await supabase
                    .from('personal_tasks')
                    .insert(taskData)
                error = insertError
            }

            if (error) throw error

            toast.success(task ? t('tasks.updatedSuccess') : t('agenda.personalEntries') + " " + t('tasks.createdSuccess'))
            form.reset()
            setOpen(false)
            onSuccess?.()
        } catch (error: any) {
            toast.error(t('tasks.createError') + ' ' + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDelete() {
        if (!task?.id && !task?.originalId) return
        const id = task.originalId || task.id

        setIsLoading(true)
        try {
            const { error } = await supabase.from('personal_tasks').delete().eq('id', id)
            if (error) throw error
            toast.success(t('common.success'))
            setOpen(false)
            onSuccess?.()
        } catch (error: any) {
            toast.error(t('common.error'))
        } finally {
            setIsLoading(false)
        }
    }

    const weekDays = [
        { label: 'Pzt', value: 1 },
        { label: 'Sal', value: 2 },
        { label: 'Çar', value: 3 },
        { label: 'Per', value: 4 },
        { label: 'Cum', value: 5 },
        { label: 'Cmt', value: 6 },
        { label: 'Paz', value: 7 },
    ]

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 shadow-lg shadow-indigo-500/20 gap-2 transition-all hover:scale-105 active:scale-95">
                        <Plus className="h-5 w-5" /> {t('agenda.addEntry')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-[32px] p-0 border-none shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                <DialogHeader className="p-8 pb-6 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-slate-800/50 dark:to-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Clock className="h-7 w-7" />
                        </div>
                        <div className="flex flex-col">
                            <span>{t('agenda.formTitle')}</span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 normal-case tracking-normal mt-0.5">
                                {t('agenda.formDesc')}
                            </span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-8">
                        <div className="flex flex-col gap-6">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Briefcase className="w-4 h-4 text-indigo-500" />
                                            <FormLabel className="font-bold">İş Başlığı</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Input
                                                placeholder="Örn: Proje Analizi, Bakım Çalışması"
                                                className="rounded-xl h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="can_support"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col justify-end">
                                            <div className="flex items-center space-x-3 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50 h-16 shadow-sm">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="h-5 w-5 rounded-md border-emerald-300 data-[state=checked]:bg-emerald-600"
                                                    />
                                                </FormControl>
                                                <div className="grid gap-1 leading-none">
                                                    <FormLabel className="font-bold text-sm text-emerald-900 dark:text-emerald-100 cursor-pointer">
                                                        Destek Olabilirim
                                                    </FormLabel>
                                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                        Boşta kaldığımda davet alabilirim
                                                    </p>
                                                </div>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="is_full_day"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col justify-end">
                                            <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800 h-16 shadow-sm">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="h-5 w-5 rounded-md border-indigo-300 data-[state=checked]:bg-indigo-600"
                                                    />
                                                </FormControl>
                                                <FormLabel className="font-bold text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                                                    Tam Gün Meşguliyet
                                                </FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="is_recurring"
                                render={({ field }) => (
                                    <FormItem className="space-y-4">
                                        <div className="flex items-center space-x-3 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="h-5 w-5 rounded-md border-indigo-300 data-[state=checked]:bg-indigo-600"
                                                />
                                            </FormControl>
                                            <FormLabel className="font-bold text-sm text-indigo-900 dark:text-indigo-100 cursor-pointer">
                                                Haftalık Tekrarla
                                            </FormLabel>
                                        </div>

                                        {field.value && (
                                            <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300 px-1">
                                                {weekDays.map((day) => (
                                                    <Button
                                                        key={day.value}
                                                        type="button"
                                                        variant={form.watch('recurring_days')?.includes(day.value) ? "default" : "outline"}
                                                        className={cn(
                                                            "h-9 px-3 text-xs font-bold rounded-lg border-slate-200 transition-all",
                                                            form.watch('recurring_days')?.includes(day.value)
                                                                ? "bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 text-white"
                                                                : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                                                        )}
                                                        onClick={() => {
                                                            const current = form.getValues('recurring_days') || []
                                                            const next = current.includes(day.value)
                                                                ? current.filter(d => d !== day.value)
                                                                : [...current, day.value]
                                                            form.setValue('recurring_days', next)
                                                        }}
                                                    >
                                                        {day.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="start_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="font-bold mb-1 ml-1 text-xs text-slate-500">{t('tasks.startDate')}</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full h-12 pl-3 text-left font-normal rounded-xl bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 hover:bg-white transition-all shadow-sm",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP", { locale: dateLocale })
                                                            ) : (
                                                                <span>Tarih seçin</span>
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
                                            <FormLabel className="font-bold mb-1 ml-1 text-xs text-slate-500">{t('tasks.endDate')}</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full h-12 pl-3 text-left font-normal rounded-xl bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 hover:bg-white transition-all shadow-sm",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP", { locale: dateLocale })
                                                            ) : (
                                                                <span>Tarih seçin</span>
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
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center gap-2 mb-1">
                                            <AlignLeft className="w-4 h-4 text-indigo-500" />
                                            <FormLabel className="font-bold">Açıklama (Opsiyonel)</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Textarea
                                                placeholder="İşin detaylarını buraya yazın..."
                                                className="rounded-xl min-h-[100px] resize-none bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 focus:bg-white transition-all text-sm shadow-sm"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex gap-4">
                            {task && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 h-14 rounded-2xl text-rose-600 border-rose-100 hover:bg-rose-50 dark:border-rose-900/30 dark:hover:bg-rose-900/20 font-black uppercase tracking-widest transition-all"
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                >
                                    {t('common.delete')}
                                </Button>
                            )}
                            <Button
                                type="submit"
                                className={cn(
                                    "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 h-14 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 text-white transition-all hover:scale-[1.02] active:scale-[0.98]",
                                    task ? "flex-[2]" : "w-full"
                                )}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    t('common.save')
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
