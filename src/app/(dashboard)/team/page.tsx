'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2, Check, X, Shield, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Skill {
    id: string
    user_id: string
    skill_name: string
    skill_level: 'beginner' | 'intermediate' | 'advanced'
    description: string | null
    approval_status: 'pending' | 'approved' | 'rejected'
    users?: {
        full_name: string
        email: string
        department: string
    }
}

export default function TeamPage() {
    const { user } = useAuthStore()
    const [skills, setSkills] = useState<Skill[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [userRole, setUserRole] = useState<'gm' | 'owner' | 'worker' | null>(null)
    const supabase = createClient()

    // Form state
    const [newSkill, setNewSkill] = useState({
        skill_name: '',
        skill_level: 'beginner',
        description: ''
    })

    useEffect(() => {
        if (user) {
            setUserRole(user.role as any)
            fetchSkills()
        }
    }, [user])

    const fetchSkills = async () => {
        setIsLoading(true)

        let query = supabase
            .from('skills')
            .select('*, users(full_name, email, department)')
            .order('created_at', { ascending: false })

        // If worker, only show own skills (or approved skills of others? Let's show all for transparency for now, or just own)
        // Spec implies Talent Pool management, usually GM/Owner sees all. 
        // Let's let everyone see all approved skills (Transparency), but workers only see their own pending ones.

        const { data, error } = await query

        if (error) {
            console.error('Error fetching skills:', error)
            toast.error('Yetenek verileri alınamadı.')
        } else {
            setSkills(data as any[])
        }
        setIsLoading(false)
    }

    const handleAddSkill = async () => {
        if (!user) return
        if (!newSkill.skill_name) {
            toast.error('Yetenek adı zorunludur.')
            return
        }

        try {
            const { error } = await supabase.from('skills').insert({
                user_id: user.id,
                skill_name: newSkill.skill_name,
                skill_level: newSkill.skill_level,
                description: newSkill.description,
                approval_status: user.role === 'gm' ? 'approved' : 'pending' // GM adds directly as approved
            })

            if (error) throw error

            toast.success('Yetenek eklendi.' + (user.role !== 'gm' ? ' Onay bekleniyor.' : ''))
            setIsAddOpen(false)
            setNewSkill({ skill_name: '', skill_level: 'beginner', description: '' })
            fetchSkills()
        } catch (error) {
            console.error('Add skill error:', error)
            toast.error('Yetenek eklenirken hata oluştu.')
        }
    }

    const handleApprove = async (id: string, status: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('skills')
                .update({
                    approval_status: status,
                    approved_by: user?.id,
                    approved_at: new Date().toISOString()
                })
                .eq('id', id)

            if (error) throw error

            toast.success(`Yetenek ${status === 'approved' ? 'onaylandı' : 'reddedildi'}.`)
            fetchSkills()
        } catch (error) {
            toast.error('İşlem başarısız.')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu yeteneği silmek istediğinize emin misiniz?')) return

        const { error } = await supabase.from('skills').delete().eq('id', id)
        if (error) {
            toast.error('Silme işlemi başarısız.')
        } else {
            toast.success('Yetenek silindi.')
            fetchSkills()
        }
    }

    const getLevelBadgeColor = (level: string) => {
        switch (level) {
            case 'advanced': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800'
            case 'intermediate': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
            case 'rejected': return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
            default: return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20'
        }
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Yetenek Havuzu & Ekip</h1>
                    <p className="text-muted-foreground mt-2">
                        Ekip arkadaşlarımızın yetkinlikleri ve uzmanlık alanları.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {skills.map((skill) => (
                    <Card key={skill.id} className="relative overflow-hidden group hover:shadow-md transition-all">
                        <div className={cn("absolute top-0 left-0 w-1 h-full",
                            skill.approval_status === 'approved' ? 'bg-green-500' :
                                skill.approval_status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                        )} />
                        <CardHeader className="pb-2 pl-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {skill.skill_name}
                                        {skill.skill_level === 'advanced' && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-1">
                                        <span className="font-medium text-foreground">{skill.users?.full_name}</span>
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                            {skill.users?.department}
                                        </span>
                                    </CardDescription>
                                </div>
                                <Badge variant="outline" className={cn("capitalize shadow-sm", getLevelBadgeColor(skill.skill_level))}>
                                    {skill.skill_level}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pl-6 pt-2">
                            {skill.description && (
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                    {skill.description}
                                </p>
                            )}

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <span className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded", getStatusColor(skill.approval_status))}>
                                    {skill.approval_status === 'pending' ? 'Onay Bekliyor' :
                                        skill.approval_status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                                </span>

                                <div className="flex gap-2">
                                    {/* GM Actions */}
                                    {userRole === 'gm' && skill.approval_status === 'pending' && (
                                        <>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={() => handleApprove(skill.id, 'approved')}>
                                                <Check className="w-4 h-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => handleApprove(skill.id, 'rejected')}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </>
                                    )}

                                    {/* Owner Delete (Only own) or GM Delete */}
                                    {(user?.id === skill.user_id || userRole === 'gm') && (
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => handleDelete(skill.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {skills.length === 0 && !isLoading && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Henüz yetenek eklenmemiş</h3>
                    <p className="text-muted-foreground">Ekip yetkinlikleri burada listelenecek.</p>
                </div>
            )}
        </div>
    )
}
