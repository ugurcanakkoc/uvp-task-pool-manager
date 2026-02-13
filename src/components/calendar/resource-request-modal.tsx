'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Search,
    Users,
    Calendar as CalendarIcon,
    Filter,
    Plus,
    Send,
    Loader2,
    X,
    CheckCircle2,
    Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { format, addDays, isWithinInterval, startOfDay, differenceInDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

interface Person {
    id: string
    full_name: string
    avatar_url: string | null
    department: string
    skills: string[]
    availability?: { start: string; end: string }[]
    can_support_now?: boolean
}

interface ResourceRequestModalProps {
    onSuccess?: () => void
    trigger?: React.ReactNode
    editingTask?: any | null
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function ResourceRequestModal({ onSuccess, trigger, editingTask, open: controlledOpen, onOpenChange }: ResourceRequestModalProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = onOpenChange || setInternalOpen

    const [isSubmitting, setIsSubmitting] = useState(false)
    const { user } = useAuthStore()
    const supabase = createClient()

    // Form State
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState('3')
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'))

    // Selection state
    const [selectedPeople, setSelectedPeople] = useState<Map<string, { id: string, name: string, days: number }>>(new Map())
    const [people, setPeople] = useState<Person[]>([])
    const [allSkills, setAllSkills] = useState<string[]>([])
    const [selectedSkills, setSelectedSkills] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoadingPeople, setIsLoadingPeople] = useState(false)

    useEffect(() => {
        if (open) {
            fetchInitialData()
            if (editingTask) {
                setTitle(editingTask.title)
                setDescription(editingTask.description || '')
                setPriority(editingTask.priority.toString())
                setStartDate(editingTask.start_date)
                setEndDate(editingTask.end_date)

                // Set selected people from bookings
                const selected = new Map()
                if (editingTask.bookings) {
                    editingTask.bookings.forEach((b: any) => {
                        const duration = differenceInDays(new Date(editingTask.end_date), new Date(editingTask.start_date)) + 1
                        selected.set(b.worker_id, {
                            id: b.worker_id,
                            name: b.worker?.full_name || 'Bilinmiyor',
                            days: duration
                        })
                    })
                }
                setSelectedPeople(selected)
            } else {
                resetForm()
            }
        }
    }, [open, editingTask])

    useEffect(() => {
        if (open) {
            fetchPeople()
        }
    }, [selectedSkills, searchQuery, open])

    const fetchInitialData = async () => {
        // Fetch all unique skill names
        const { data, error } = await supabase
            .from('skills')
            .select('skill_name')
            .eq('approval_status', 'approved')

        if (!error && data) {
            const uniqueSkills = Array.from(new Set(data.map((s: { skill_name: string }) => s.skill_name))) as string[]
            setAllSkills(uniqueSkills)
        }
    }

    const fetchPeople = async () => {
        setIsLoadingPeople(true)
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id, 
                    full_name, 
                    avatar_url, 
                    department,
                    role,
                    skills!user_id (skill_name),
                    support_slots: personal_tasks(can_support, is_recurring, recurring_days, start_date, end_date),
                    assignments: bookings!worker_id(start_date, end_date, is_active)
                `)
                .eq('is_active', true)

            if (error) {
                console.error('Error fetching people:', error)
                toast.error('Kişiler yüklenirken bir hata oluştu: ' + error.message)
                return
            }

            if (data) {
                const sDate = new Date(startDate)
                const eDate = new Date(endDate)
                const query = searchQuery.toLowerCase().trim()

                let filteredPeople = data.map((p: any) => {
                    const hasSupportSlot = p.support_slots?.some((slot: any) => {
                        if (!slot.can_support) return false
                        if (slot.is_recurring) return true
                        const start = new Date(slot.start_date)
                        const end = new Date(slot.end_date)
                        return (start <= eDate && end >= sDate)
                    })

                    const hasConflict = p.assignments?.some((b: any) => {
                        if (!b.is_active) return false
                        const start = new Date(b.start_date)
                        const end = new Date(b.end_date)
                        return (start <= eDate && end >= sDate)
                    }) || p.support_slots?.some((slot: any) => {
                        if (slot.can_support) return false // Support slots are not conflicts
                        if (slot.is_recurring) return false // Simple check for now
                        const start = new Date(slot.start_date)
                        const end = new Date(slot.end_date)
                        return (start <= eDate && end >= sDate)
                    })

                    return {
                        ...p,
                        skills: (p.skills as { skill_name: string }[] | undefined)?.map(s => s.skill_name) || [],
                        can_support_now: !hasConflict, // Available if NO conflict
                        has_explicit_support: hasSupportSlot // Extra info if needed
                    }
                })

                // Apply multi-field flexible search
                if (query) {
                    filteredPeople = filteredPeople.filter((p: any) =>
                        p.full_name?.toLowerCase().includes(query) ||
                        p.department?.toLowerCase().includes(query) ||
                        p.role?.toLowerCase().includes(query)
                    )
                }

                if (selectedSkills.length > 0) {
                    filteredPeople = filteredPeople.filter((p: any) =>
                        selectedSkills.every((skill: string) => p.skills.includes(skill))
                    )
                }

                setPeople(filteredPeople)
            }
        } catch (err: any) {
            console.error('Fetch people crash:', err)
        } finally {
            setIsLoadingPeople(false)
        }
    }

    const maxDays = useMemo(() => {
        try {
            const start = new Date(startDate)
            const end = new Date(endDate)
            return differenceInDays(end, start) + 1
        } catch (e) {
            return 1
        }
    }, [startDate, endDate])

    const handlePersonToggle = (person: Person) => {
        const newSelected = new Map(selectedPeople)
        if (newSelected.has(person.id)) {
            newSelected.delete(person.id)
        } else {
            newSelected.set(person.id, { id: person.id, name: person.full_name, days: maxDays })
        }
        setSelectedPeople(newSelected)
    }

    // Update all selected people's duration if it exceeds new maxDays
    useEffect(() => {
        const newSelected = new Map(selectedPeople)
        let changed = false
        newSelected.forEach((val, key) => {
            if (val.days > maxDays) {
                newSelected.set(key, { ...val, days: maxDays })
                changed = true
            }
        });
        if (changed) setSelectedPeople(newSelected)
    }, [maxDays])

    const updatePersonDuration = (id: string, days: number) => {
        const newSelected = new Map(selectedPeople)
        const personData = newSelected.get(id)
        if (personData) {
            newSelected.set(id, { ...personData, days })
            setSelectedPeople(newSelected)
        }
    }

    const handleSubmit = async () => {
        if (!title || !description) {
            toast.error('Lütfen başlık ve açıklama girin.')
            return
        }

        setIsSubmitting(true)
        let targetTaskId: string | null = null
        try {
            if (editingTask) {
                // UPDATE MODE
                const updates: any = {
                    title,
                    description,
                    priority: parseInt(priority),
                    start_date: startDate,
                    end_date: endDate,
                    task_type: selectedPeople.size > 0 ? 'development' : 'pool',
                    status: (editingTask.status === 'active' && selectedPeople.size === 0) ? 'pending' : editingTask.status
                }

                // If NOT GM, every edit requires new approval
                if (user?.role !== 'gm') {
                    updates.status = 'requested'
                    updates.gm_approved = false
                    updates.approved_at = null
                }

                const { error: taskError } = await supabase
                    .from('tasks')
                    .update(updates)
                    .eq('id', editingTask.id)

                if (taskError) throw taskError

                // Refresh bookings: delete old ones and insert new ones
                await supabase.from('bookings').delete().eq('task_id', editingTask.id)
                targetTaskId = editingTask.id
            } else {
                // CREATE MODE
                const { data: taskData, error: taskError } = await supabase
                    .from('tasks')
                    .insert({
                        title,
                        description,
                        priority: parseInt(priority),
                        start_date: startDate,
                        end_date: endDate,
                        department: user?.department || 'Genel',
                        owner_id: user?.id,
                        task_type: selectedPeople.size > 0 ? 'development' : 'pool',
                        status: user?.role === 'gm' ? (selectedPeople.size > 0 ? 'active' : 'pending') : 'requested',
                        gm_approved: user?.role === 'gm',
                        gm_approved_by: user?.role === 'gm' ? user?.id : null,
                        approved_at: user?.role === 'gm' ? new Date().toISOString() : null
                    })
                    .select()
                    .single()

                if (taskError) throw taskError
                targetTaskId = taskData.id
            }

            const activeTaskId = targetTaskId
            if (!activeTaskId) throw new Error("Destek talebi ID'si bulunamadı")

            // 2. If people are selected, create/update bookings
            if (selectedPeople.size > 0) {
                const assignments = Array.from(selectedPeople.values()).map(p => ({
                    task_id: activeTaskId,
                    worker_id: p.id,
                    owner_id: editingTask?.owner_id || user?.id,
                    start_date: startDate,
                    end_date: format(addDays(new Date(startDate), p.days - 1), 'yyyy-MM-dd'),
                    is_active: true
                }))

                const { error: bookingError } = await supabase
                    .from('bookings')
                    .insert(assignments)

                if (bookingError) throw bookingError
            }

            toast.success(editingTask ? 'Talep başarıyla güncellendi.' : 'Talep başarıyla oluşturuldu.')
            setOpen(false)
            if (!editingTask) resetForm()
            if (onSuccess) onSuccess()
        } catch (error: any) {
            console.error('Submission error:', error)
            toast.error('İşlem sırasında bir hata oluştu.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setTitle('')
        setDescription('')
        setSelectedPeople(new Map())
        setSelectedSkills([])
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && (
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
            )}
            {!trigger && controlledOpen === undefined && (
                <DialogTrigger asChild>
                    <Button className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4" /> Yeni Destek Talebi
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[85vw] w-full h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-[40px] shadow-2xl border-none">
                <DialogHeader className="p-6 border-b shrink-0">
                    <DialogTitle className="text-2xl font-black">
                        {editingTask ? 'Talebi Düzenle' : 'Destek Talebi Oluştur'}
                    </DialogTitle>
                    <DialogDescription>
                        {editingTask
                            ? 'Mevcut destek talebini güncelleyin veya kişileri değiştirin.'
                            : 'Destek talebinde bulunun. Kişi seçebilir veya talebi doğrudan havuza bırakabilirsiniz.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Filters & Form Info */}
                    <div className="w-[380px] shrink-0 border-r bg-slate-50/80 dark:bg-slate-900/80 p-8 flex flex-col gap-8 overflow-y-auto">
                        <div className="space-y-4">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Talep Bilgileri</h3>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400">BAŞLIK</label>
                                <Input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Örn: X Projesi PLC Yazılımı"
                                    className="rounded-xl border-slate-200 bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400">AÇIKLAMA</label>
                                <Textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Destek talebinin kapsamı..."
                                    className="rounded-xl border-slate-200 bg-white min-h-[100px]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">BAŞLANGIÇ</label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        min={format(new Date(), 'yyyy-MM-dd')}
                                        onChange={e => {
                                            setStartDate(e.target.value)
                                            if (endDate < e.target.value) setEndDate(e.target.value)
                                        }}
                                        className="rounded-xl border-slate-200 bg-white h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">BİTİŞ</label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        min={startDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className="rounded-xl border-slate-200 bg-white h-11"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400">ÖNCELİK</label>
                                <select
                                    value={priority}
                                    onChange={e => setPriority(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="1">1 - ACİL</option>
                                    <option value="2">2 - YÜKSEK</option>
                                    <option value="3">3 - NORMAL</option>
                                    <option value="4">4 - DÜŞÜK</option>
                                </select>
                            </div>

                            {user?.role === 'gm' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400">DEPARTMAN (GM ÖZEL)</label>
                                    <Input
                                        value={user?.department || ''}
                                        placeholder="Departman seçin"
                                        className="rounded-xl"
                                        readOnly
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Yetenek Filtreleri</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {allSkills.map(skill => (
                                    <Badge
                                        key={skill}
                                        variant={selectedSkills.includes(skill) ? "default" : "outline"}
                                        className={cn(
                                            "cursor-pointer px-3 py-1 rounded-lg transition-all",
                                            selectedSkills.includes(skill)
                                                ? "bg-blue-600 hover:bg-blue-700"
                                                : "bg-white hover:bg-slate-100 dark:bg-slate-800"
                                        )}
                                        onClick={() => {
                                            setSelectedSkills(prev =>
                                                prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
                                            )
                                        }}
                                    >
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Person List */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
                        <div className="p-6 border-b shrink-0 flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Kişi ara..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-10 rounded-xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                />
                            </div>
                            <Badge variant="secondary" className="h-10 px-4 rounded-xl font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                {isLoadingPeople ? "Aranıyor..." : `${people.length} Kişi Bulundu`}
                            </Badge>
                        </div>

                        <ScrollArea className="flex-1 w-full">
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
                                {people.map(person => (
                                    <div
                                        key={person.id}
                                        onClick={() => handlePersonToggle(person)}
                                        className={cn(
                                            "group relative p-6 rounded-3xl border transition-all cursor-pointer flex gap-5 items-start min-w-0 w-full",
                                            !person.can_support_now && "bg-slate-50/30 dark:bg-slate-900/10",
                                            selectedPeople.has(person.id)
                                                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                                                : "border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700"
                                        )}
                                    >
                                        {!person.can_support_now && (
                                            <div className="absolute top-4 right-4 z-10">
                                                <Badge variant="destructive" className="bg-rose-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 shadow-lg shadow-rose-500/20">
                                                    Meşgul
                                                </Badge>
                                            </div>
                                        )}
                                        {person.can_support_now && !selectedPeople.has(person.id) && (
                                            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Badge className="bg-emerald-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
                                                    Müsait
                                                </Badge>
                                            </div>
                                        )}
                                        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm shrink-0">
                                            <Users className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1 gap-2">
                                                <h4 className="font-bold text-slate-900 dark:text-white truncate text-base">{person.full_name}</h4>
                                                {selectedPeople.has(person.id) && (
                                                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-tight mb-3">{person.department}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {person.skills.slice(0, 3).map(skill => (
                                                    <Badge key={skill} variant="secondary" className="text-[9px] px-1.5 py-0 bg-slate-100 dark:bg-slate-800 text-slate-500 border-none">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                                {person.skills.length > 3 && (
                                                    <span className="text-[9px] font-bold text-slate-400">+{person.skills.length - 3}</span>
                                                )}
                                            </div>

                                            {selectedPeople.has(person.id) && (
                                                <div className="mt-4 pt-4 border-t flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">SÜRE</span>
                                                        <span className="text-xs font-black text-blue-600">{selectedPeople.get(person.id)?.days} GÜN</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max={maxDays}
                                                        step="1"
                                                        value={selectedPeople.get(person.id)?.days}
                                                        onChange={e => updatePersonDuration(person.id, parseInt(e.target.value))}
                                                        className="w-full h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="p-6 border-t bg-slate-50/50 dark:bg-slate-900/50 shrink-0 flex items-center justify-between sm:justify-between">
                    <div className="flex items-center gap-2">
                        {selectedPeople.size > 0 && (
                            <Badge className="bg-blue-600 rounded-lg h-10 px-4 font-bold animate-in fade-in zoom-in duration-300">
                                {selectedPeople.size} Kişi Seçildi
                            </Badge>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="rounded-2xl h-12 px-8 font-bold text-slate-600 hover:bg-slate-100"
                        >
                            İptal
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={cn(
                                "gap-2 rounded-2xl h-12 px-8 font-bold shadow-lg transition-all",
                                selectedPeople.size > 0
                                    ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                            )}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                selectedPeople.size > 0 ? <Users className="w-5 h-5" /> : <Send className="w-5 h-5" />
                            )}
                            {selectedPeople.size > 0 ? "Kişileri Ata" : "Kişisiz Ata"}
                            {editingTask && " & Güncelle"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent >
        </Dialog >
    )
}
