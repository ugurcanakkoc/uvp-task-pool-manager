'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Save } from 'lucide-react'
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

// Validation schema
const progressSchema = z.object({
    content: z.string().min(50, {
        message: 'İlerleme kaydı en az 50 karakter olmalıdır.',
    }),
})

interface ProgressDialogProps {
    taskId: string
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onSuccess?: () => void
}

export function ProgressDialog({ taskId, trigger, open: controlledOpen, onOpenChange: setControlledOpen, onSuccess }: ProgressDialogProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { user } = useAuthStore()
    const supabase = createClient()

    // Control internal or external state
    const isOpen = controlledOpen ?? open
    const onOpenChange = setControlledOpen ?? setOpen

    const form = useForm<z.infer<typeof progressSchema>>({
        resolver: zodResolver(progressSchema),
        defaultValues: {
            content: '',
        },
    })

    const onSubmit = async (values: z.infer<typeof progressSchema>) => {
        if (!user) return

        setIsSubmitting(true)
        try {
            // 1. Insert progress record
            const { error } = await supabase
                .from('task_progress')
                .insert({
                    task_id: taskId,
                    user_id: user.id,
                    content: values.content,
                })

            if (error) throw error

            toast.success('İlerleme başarıyla kaydedildi.')
            form.reset()
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            console.error('Progress error:', error)
            toast.error('İlerleme kaydedilirken bir hata oluştu.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>İlerleme Kaydı Ekle</DialogTitle>
                    <DialogDescription>
                        Bugün bu destek talebi üzerinde neler yaptığınızı detaylıca açıklayın.
                        En az 50 karakter gereklidir.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Açıklama</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Bugün yapılanlar..."
                                            className="min-h-[150px] resize-none"
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
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Kaydediliyor...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Kaydet
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
