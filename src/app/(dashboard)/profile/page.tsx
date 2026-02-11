'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useI18nStore } from '@/stores/i18n-store'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { User, Mail, Briefcase, Star, Plus, Trash2, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Skill {
    id: string
    user_id: string
    skill_name: string
    skill_level: 'beginner' | 'intermediate' | 'advanced'
    description: string | null
    approval_status: 'pending' | 'approved' | 'rejected'
}

export default function ProfilePage() {
    const { user } = useAuthStore()
    const { t } = useI18nStore()
    const [skills, setSkills] = useState<Skill[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    // Skill Form
    const [newSkill, setNewSkill] = useState({
        skill_name: '',
        skill_level: 'beginner',
        description: ''
    })

    // Skill Search / Autocomplete
    const [skillCatalog, setSkillCatalog] = useState<string[]>([])
    const [filteredCatalog, setFilteredCatalog] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (user) {
            fetchSkills()
            fetchSkillCatalog()
        }
    }, [user])

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchSkills = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('skills')
            .select('*')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching skills:', error)
            toast.error('Yetenekler yüklenirken hata oluştu.')
        } else {
            setSkills(data as any[])
        }
        setIsLoading(false)
    }

    // Fetch all distinct skill names from DB as a catalog
    const fetchSkillCatalog = async () => {
        const { data, error } = await supabase
            .from('skills')
            .select('skill_name')

        if (!error && data) {
            const names: string[] = data.map((s: any) => String(s.skill_name))
            const uniqueSkills = names.filter((v, i, a) => a.indexOf(v) === i)
            setSkillCatalog(uniqueSkills.sort())
        }
    }

    const handleSkillNameChange = (value: string) => {
        setNewSkill({ ...newSkill, skill_name: value })
        if (value.length > 0) {
            const filtered = skillCatalog.filter(s =>
                s.toLowerCase().includes(value.toLowerCase())
            )
            setFilteredCatalog(filtered)
            setShowSuggestions(true)
        } else {
            setFilteredCatalog([])
            setShowSuggestions(false)
        }
    }

    const selectSkillFromCatalog = (skillName: string) => {
        setNewSkill({ ...newSkill, skill_name: skillName })
        setShowSuggestions(false)
    }

    const handleAddSkill = async () => {
        if (!user) return
        if (!newSkill.skill_name) {
            toast.error('Yetenek adı zorunludur.')
            return
        }

        // Check if user already has this skill
        const exists = skills.some(s => s.skill_name.toLowerCase() === newSkill.skill_name.toLowerCase())
        if (exists) {
            toast.error('Bu yetenek zaten profilinizde mevcut.')
            return
        }

        try {
            const { error } = await supabase.from('skills').insert({
                user_id: user.id,
                skill_name: newSkill.skill_name,
                skill_level: newSkill.skill_level,
                description: newSkill.description,
                approval_status: user.role === 'gm' ? 'approved' : 'pending'
            })

            if (error) throw error

            toast.success('Yetenek eklendi.' + (user.role !== 'gm' ? ' Onay bekleniyor.' : ''))
            setNewSkill({ skill_name: '', skill_level: 'beginner', description: '' })
            fetchSkills()
            fetchSkillCatalog() // Refresh catalog
        } catch (error) {
            console.error('Add skill error:', error)
            toast.error('Yetenek eklenirken hata oluştu.')
        }
    }

    const handleDeleteSkill = async (id: string) => {
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
            case 'advanced': return 'bg-purple-100 text-purple-700 border-purple-200'
            case 'intermediate': return 'bg-blue-100 text-blue-700 border-blue-200'
            default: return 'bg-slate-100 text-slate-700 border-slate-200'
        }
    }

    if (!user) return null

    return (
        <div className="container mx-auto py-8 max-w-4xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profilim</h1>
                <p className="text-muted-foreground mt-2">
                    Kişisel bilgilerini ve yeteneklerini buradan yönetebilirsin.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User Info Card */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Kullanıcı Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-medium">{user.full_name}</p>
                                <Badge variant="outline" className="capitalize mt-1">{user.role}</Badge>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Mail className="w-4 h-4" />
                                <span>{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <Briefcase className="w-4 h-4" />
                                <span>{user.department || 'Departman Belirtilmedi'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Skills Section */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            Yetenekler & Uzmanlıklar
                        </CardTitle>
                        <CardDescription>
                            Sahip olduğun yetenekleri ekle. Mevcut yetenek havuzundan arayabilir veya yeni bir yetenek tanımlayabilirsin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Add Skill Form with Search */}
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                            <h3 className="font-medium text-sm flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Yeni Yetenek Ekle
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2 relative" ref={searchRef}>
                                    <Label className="flex items-center gap-1.5">
                                        <Search className="w-3.5 h-3.5 text-slate-400" />
                                        Yetenek Ara / Ekle
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            placeholder="Ara veya yeni yetenek yaz..."
                                            value={newSkill.skill_name}
                                            onChange={(e) => handleSkillNameChange(e.target.value)}
                                            onFocus={() => {
                                                if (newSkill.skill_name.length > 0) setShowSuggestions(true)
                                            }}
                                            className="h-9 pr-8"
                                        />
                                        {newSkill.skill_name && (
                                            <button
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                onClick={() => {
                                                    setNewSkill({ ...newSkill, skill_name: '' })
                                                    setShowSuggestions(false)
                                                }}
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Suggestions Dropdown */}
                                    {showSuggestions && (
                                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                            {filteredCatalog.length > 0 ? (
                                                <>
                                                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b">
                                                        Mevcut Yetenekler
                                                    </div>
                                                    {filteredCatalog.map((skill, i) => (
                                                        <button
                                                            key={i}
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors flex items-center gap-2"
                                                            onClick={() => selectSkillFromCatalog(skill)}
                                                        >
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">Mevcut</Badge>
                                                            {skill}
                                                        </button>
                                                    ))}
                                                </>
                                            ) : (
                                                <div className="px-3 py-3 text-sm text-slate-500">
                                                    <p className="font-medium text-slate-700 dark:text-slate-300">
                                                        &quot;{newSkill.skill_name}&quot; bulunamadı
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Yeni yetenek olarak eklenecek.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Seviye</Label>
                                    <Select
                                        value={newSkill.skill_level}
                                        onValueChange={(v: any) => setNewSkill({ ...newSkill, skill_level: v })}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="beginner">Başlangıç (Junior)</SelectItem>
                                            <SelectItem value="intermediate">Orta (Mid)</SelectItem>
                                            <SelectItem value="advanced">İleri (Senior/Expert)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="sm:col-span-2 space-y-2">
                                    <Label>Açıklama (Opsiyonel)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Detaylar (sertifika vb.)..."
                                            value={newSkill.description}
                                            onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                                            className="h-9"
                                        />
                                        <Button size="sm" onClick={handleAddSkill}>Ekle</Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Skills List */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground">Yeteneklerim</h3>
                            {skills.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">Henüz yetenek eklenmemiş.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {skills.map((skill) => (
                                        <div key={skill.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className={cn("capitalize min-w-[80px] justify-center", getLevelBadgeColor(skill.skill_level))}>
                                                    {skill.skill_level}
                                                </Badge>
                                                <div>
                                                    <p className="font-medium text-sm">{skill.skill_name}</p>
                                                    {skill.description && <p className="text-xs text-muted-foreground">{skill.description}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="secondary" className={cn("text-[10px]",
                                                    skill.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                                                        skill.approval_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                )}>
                                                    {skill.approval_status === 'pending' ? 'Onay Bekliyor' :
                                                        skill.approval_status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                                                </Badge>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-slate-400 hover:text-red-500"
                                                    onClick={() => handleDeleteSkill(skill.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
