'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
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
import { Plus, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'

interface SupportRequestDialogProps {
    onSuccess?: () => void
    initialCategory?: string
    trigger?: React.ReactNode
}

export function SupportRequestDialog({ onSuccess, initialCategory, trigger }: SupportRequestDialogProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState(initialCategory || '')
    const [priority, setPriority] = useState('normal')

    const supabase = createClient()
    const { user } = useAuthStore()

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
            setCategory(initialCategory || '')
            setPriority('normal')
            setOpen(false)
            onSuccess?.()
        } else {
            toast.error('Hata: ' + error.message)
        }
        setIsSubmitting(false)
    }

    const categories = [
        { value: 'resource', label: 'Kaynak Talebi' },
        { value: 'conflict', label: 'Çakışma / Problem' },
        { value: 'priority_change', label: 'Öncelik Değişikliği' },
        { value: 'deadline_extension', label: 'Süre Uzatma' },
        { value: 'general', label: 'Genel Destek' },
    ]

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4" /> Yeni Talep
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[24px]">
                <DialogHeader>
                    <DialogTitle className="font-black text-xl">Yeni Destek Talebi</DialogTitle>
                    <DialogDescription>
                        GM'e talebinizi iletin. Gerekli tüm detayları paylaştığınızdan emin olun.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400">Talep Başlığı</label>
                        <Input
                            placeholder="Örn: X Projesi için Yazılımcı İhtiyacı"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="rounded-xl h-11"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400">Kategori</label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="rounded-xl h-11">
                                    <SelectValue placeholder="Seçin" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {categories.map(c => (
                                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400">Öncelik</label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger className="rounded-xl h-11">
                                    <SelectValue placeholder="Seçin" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="low">Düşük</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="high">Yüksek</SelectItem>
                                    <SelectItem value="urgent">Acil</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400">Açıklama</label>
                        <Textarea
                            placeholder="Talebinizin detaylarını buraya yazın..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="rounded-xl min-h-[120px] resize-none"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl h-11 px-6">İptal</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 h-11 px-6 font-bold"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Talebi Gönder
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
