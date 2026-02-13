'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, CheckCircle2 } from 'lucide-react'
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

const submitSchema = z.object({
    note: z.string().min(10, {
        message: 'Teslim notu en az 10 karakter olmalıdır.',
    }),
})

interface SubmitDialogProps {
    taskId: string
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onSuccess?: () => void
}

export function SubmitDialog({ taskId, trigger, open: controlledOpen, onOpenChange: setControlledOpen, onSuccess }: SubmitDialogProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { user } = useAuthStore()
    const supabase = createClient()

    const isOpen = controlledOpen ?? open
    const onOpenChange = setControlledOpen ?? setOpen

    const form = useForm<z.infer<typeof submitSchema>>({
        resolver: zodResolver(submitSchema),
        defaultValues: {
            note: '',
        },
    })

    const onSubmit = async (values: z.infer<typeof submitSchema>) => {
        if (!user) return

        setIsSubmitting(true)
        try {
            // 1. Insert into task_reviews
            const { error: reviewError } = await supabase
                .from('task_reviews')
                .insert({
                    task_id: taskId,
                    submitted_by: user.id,
                    submit_note: values.note,
                    review_status: 'pending'
                })

            if (reviewError) throw reviewError

            // 2. Update task status to 'review'
            const { error: taskError } = await supabase
                .from('tasks')
                .update({ status: 'review' })
                .eq('id', taskId)

            if (taskError) throw taskError

            toast.success('Destek talebi başarıyla onaya gönderildi.')
            form.reset()
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            console.error('Submit error:', error)
            toast.error('Destek talebi gönderilirken bir hata oluştu.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Destek Talebini Tamamla ve Gönder</DialogTitle>
                    <DialogDescription>
                        Destek talebini tamamladığınızdan eminseniz, proje sahibine bir not bırakarak onaya gönderin.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teslim Notu</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Destek talebini tamamladım, şu dosyalar eklendi..."
                                            className="min-h-[100px] resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                İptal
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Gönderiliyor...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Onaya Gönder
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
