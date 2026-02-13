'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/stores/auth-store'
import { Separator } from '@/components/ui/separator'

const reviewSchema = z.object({
    note: z.string().optional(),
})

interface ReviewDialogProps {
    taskId: string
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onSuccess?: () => void
}

export function ReviewDialog({ taskId, trigger, open: controlledOpen, onOpenChange: setControlledOpen, onSuccess }: ReviewDialogProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [lastReview, setLastReview] = useState<any>(null)
    const { user } = useAuthStore()
    const supabase = createClient()

    const isOpen = controlledOpen ?? open
    const onOpenChange = setControlledOpen ?? setOpen

    const form = useForm<z.infer<typeof reviewSchema>>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            note: '',
        },
    })

    // Fetch the latest review submission when dialog opens
    useEffect(() => {
        if (isOpen && taskId) {
            const fetchReview = async () => {
                const { data, error } = await supabase
                    .from('task_reviews')
                    .select('*, submitted_by_user:users!submitted_by(full_name)')
                    .eq('task_id', taskId)
                    .order('submitted_at', { ascending: false })
                    .limit(1)
                    .single()

                if (!error && data) {
                    setLastReview(data)
                }
            }
            fetchReview()
        }
    }, [isOpen, taskId, supabase])

    const handleAction = async (action: 'approve' | 'revision', values: z.infer<typeof reviewSchema>) => {
        if (!user || !lastReview) return

        setIsSubmitting(true)
        try {
            const response = await fetch('/api/tasks/review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    taskId,
                    action,
                    note: values.note,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'İşlem başarısız oldu.')
            }

            if (data.pointsAwarded && data.pointsAwarded > 0) {
                toast.success(`Destek talebi onaylandı! Çalışana ${data.pointsAwarded} puan kazandırıldı. 🏆`)
            } else {
                toast.success(action === 'approve' ? 'Destek talebi onaylandı ve tamamlandı.' : 'Destek talebi revizyon için iade edildi.')
            }

            form.reset()
            onOpenChange(false)
            onSuccess?.()
        } catch (error: any) {
            console.error('Review error:', error)
            toast.error(error.message || 'İşlem sırasında bir hata oluştu.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Destek Talebini İncele</DialogTitle>
                    <DialogDescription>
                        Çalışanın gönderdiği teslim notunu inceleyin ve onaylayın veya revizyon isteyin.
                    </DialogDescription>
                </DialogHeader>

                {lastReview && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800 text-sm mb-4">
                        <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            {lastReview.submitted_by_user?.full_name || 'Çalışan'} Diyor ki:
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 italic">
                            "{lastReview.submit_note}"
                        </p>
                    </div>
                )}

                <Separator />

                <Form {...form}>
                    <form className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>İnceleme Notu / Revizyon Nedeni</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Onay mesajı veya iade nedeni..."
                                            className="min-h-[80px] resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={form.handleSubmit((values) => handleAction('revision', values))}
                                disabled={isSubmitting}
                                className="flex-1 sm:flex-none"
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                                Revizyon İste
                            </Button>
                            <Button
                                type="button"
                                onClick={form.handleSubmit((values) => handleAction('approve', values))}
                                disabled={isSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none"
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                Onayla ve Tamamla
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
