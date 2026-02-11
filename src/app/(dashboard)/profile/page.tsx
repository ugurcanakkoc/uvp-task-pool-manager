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
import { User, Mail, Briefcase, Star, Plus, Trash2, Search, X, CheckCircle2, Clock, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

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
            toast.error(t('common.unknown'))
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
            toast.error(t('profile.skillNameRequired'))
            return
        }

        // Check if user already has this skill
        const exists = skills.some(s => s.skill_name.toLowerCase() === newSkill.skill_name.toLowerCase())
        if (exists) {
            toast.error(t('profile.skillExists'))
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

            toast.success(t('profile.skillAddSuccess') + (user.role !== 'gm' ? ' ' + t('profile.pendingApproval') : ''))
            setNewSkill({ skill_name: '', skill_level: 'beginner', description: '' })
            fetchSkills()
            fetchSkillCatalog() // Refresh catalog
        } catch (error) {
            console.error('Add skill error:', error)
            toast.error(t('profile.skillAddError'))
        }
    }

    const handleDeleteSkill = async (id: string) => {
        if (!confirm(t('profile.deleteConfirm'))) return

        const { error } = await supabase.from('skills').delete().eq('id', id)
        if (error) {
            toast.error(t('profile.skillDeleteError'))
        } else {
            toast.success(t('profile.skillDeleteSuccess'))
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

    const [stats, setStats] = useState({
        completed: 0,
        active: 0,
        total: 0,
        utilization: 0
    })
    const [recentTasks, setRecentTasks] = useState<any[]>([])

    useEffect(() => {
        if (user) {
            fetchProfileData()
        }
    }, [user])

    const fetchProfileData = async () => {
        if (!user) return

        // Fetch stats
        const { count: completedCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_worker_id', user.id)
            .eq('status', 'completed')

        const { count: activeCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_worker_id', user.id)
            .in('status', ['active', 'in_progress'])

        const { count: totalCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_worker_id', user.id)

        // Fetch User Utilization from DB
        const { data: userData } = await supabase
            .from('users')
            .select('utilization')
            .eq('id', user.id)
            .single()

        setStats({
            completed: completedCount || 0,
            active: activeCount || 0,
            total: totalCount || 0,
            utilization: userData?.utilization || 0
        })

        // Fetch Recent Tasks
        const { data: tasksData } = await supabase
            .from('tasks')
            .select('*')
            .eq('assigned_worker_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5)

        setRecentTasks(tasksData || [])
    }

    // Existing skills code... (Need to keep it, but I replaced the whole component in my thought process, wait.
    // The instruction says "Replace the return statement".
    // But I also need to add the state I defined above.
    // I should use `multi_replace_file_content` or make sure I insert the state correctly.
    // I will use `replace_file_content` to Insert state and fetching logic first, then another call to replace the Return.
    // Actually, I can do it in one go if I replace a large chunk.
    // But inserting state inside the function body is tricky if I don't replace the whole function body.
    // I'll insert state at line 46 (after newSkill state).

    // ... logic for insert state ...

    return (
        <div className="container mx-auto py-8 max-w-5xl space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Left Column: Profile Card */}
                <Card className="w-full md:w-80 shrink-0">
                    <CardHeader className="text-center pb-2">
                        <div className="w-24 h-24 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-3 border-4 border-white shadow-lg overflow-hidden">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-slate-400" />
                            )}
                        </div>
                        <CardTitle>{user?.full_name}</CardTitle>
                        <Badge variant="secondary" className="mt-2 capitalize">{user?.role}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Mail className="w-4 h-4" />
                                <span className="truncate">{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <Briefcase className="w-4 h-4" />
                                <span>{user?.department || t('profile.noDepartment')}</span>
                            </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-slate-50 p-2 rounded-lg">
                                <div className="text-xl font-bold text-blue-600">{stats.completed}</div>
                                <div className="text-xs text-slate-500">{t('profile.completedTasks')}</div>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg">
                                <div className="text-xl font-bold text-amber-500">{user?.pool_percentage || 0}</div>
                                <div className="text-xs text-slate-500">{t('profile.totalPoints')}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Information & Skills */}
                <div className="flex-1 space-y-6 w-full">

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Card className="p-4 flex items-center gap-3 bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm">
                            <div className="p-2 bg-white rounded-full shadow-sm"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
                            <div>
                                <div className="text-lg font-bold text-slate-800">{stats.completed}</div>
                                <div className="text-xs text-slate-500 font-medium">{t('profile.completedTasks')}</div>
                            </div>
                        </Card>
                        <Card className="p-4 flex items-center gap-3 bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm">
                            <div className="p-2 bg-white rounded-full shadow-sm"><Clock className="w-4 h-4 text-blue-600" /></div>
                            <div>
                                <div className="text-lg font-bold text-slate-800">{stats.active}</div>
                                <div className="text-xs text-slate-500 font-medium">{t('profile.activeTasks')}</div>
                            </div>
                        </Card>
                        <Card className="p-4 flex items-center gap-3 bg-gradient-to-br from-violet-50 to-white border-violet-100 shadow-sm">
                            <div className="p-2 bg-white rounded-full shadow-sm"><Star className="w-4 h-4 text-violet-600" /></div>
                            <div>
                                <div className="text-lg font-bold text-slate-800">
                                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                                </div>
                                <div className="text-xs text-slate-500 font-medium">{t('profile.successRate')}</div>
                            </div>
                        </Card>
                        <Card className="p-4 flex items-center gap-3 bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm">
                            <div className="p-2 bg-white rounded-full shadow-sm"><Briefcase className="w-4 h-4 text-amber-600" /></div>
                            <div>
                                <div className="text-lg font-bold text-slate-800">{stats.utilization}%</div>
                                <div className="text-xs text-slate-500 font-medium">{t('profile.utilization')}</div>
                            </div>
                        </Card>
                    </div>

                    <Tabs defaultValue="tasks" className="w-full">
                        <TabsList className="bg-white border border-slate-200 p-1 w-full justify-start h-12 rounded-xl">
                            <TabsTrigger value="tasks" className="rounded-lg px-6">{t('profile.recentTasks')}</TabsTrigger>
                            <TabsTrigger value="skills" className="rounded-lg px-6">{t('profile.skillsTab')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="tasks" className="space-y-4 pt-2">
                            {recentTasks.length > 0 ? (
                                recentTasks.map((task) => (
                                    <div key={task.id} className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 hover:shadow-md transition-all">
                                        <div className="flex gap-4 items-center">
                                            <div className={cn(
                                                "w-1.5 h-10 rounded-full",
                                                task.priority === 1 ? "bg-red-500" :
                                                    task.priority === 2 ? "bg-orange-500" :
                                                        task.priority === 3 ? "bg-blue-500" : "bg-slate-300"
                                            )} />
                                            <div>
                                                <h4 className="font-bold text-slate-800">{task.title}</h4>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                    <span className="flex items-center gap-1">{task.department}</span>
                                                    <span>•</span>
                                                    <span>{format(new Date(task.end_date), 'dd MMM yyyy', { locale: tr })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className={cn(
                                            "capitalize",
                                            task.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                                                task.status === 'in_progress' ? "bg-blue-100 text-blue-700" :
                                                    "bg-slate-100 text-slate-700"
                                        )}>
                                            {task.status}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                    <p>{t('profile.noHistory')}</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="skills" className="space-y-6 pt-2">
                            {/* Copy-paste existing Skills Content here... or reuse */}
                            {/* I will reuse existing skills content logic for the replacement */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('profile.skillsManagement')}</CardTitle>
                                    <CardDescription>{t('profile.skillsDesc')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Add Skill Form */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                                        {/* ... skill inputs ... */}
                                        {/* Since I am replacing the entire return statement, I need to make sure I include the JSX for the form correctly */}
                                        {/* It is simpler to keep the Return statement structure simpler and reference sub-components if possible, but I don't have sub-components */}
                                        {/* I will paste the previous form code */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2 relative" ref={searchRef}>
                                                <Label>{t('profile.searchSkill')}</Label>
                                                <div className="relative">
                                                    <Input
                                                        placeholder={t('profile.searchSkill') + "..."}
                                                        value={newSkill.skill_name}
                                                        onChange={(e) => handleSkillNameChange(e.target.value)}
                                                        onFocus={() => { if (newSkill.skill_name) setShowSuggestions(true) }}
                                                        className="h-9"
                                                    />
                                                    {showSuggestions && filteredCatalog.length > 0 && (
                                                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                                            {filteredCatalog.map((skill, i) => (
                                                                <button key={i} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50" onClick={() => selectSkillFromCatalog(skill)}>
                                                                    {skill}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('profile.level')}</Label>
                                                <Select value={newSkill.skill_level} onValueChange={(v: any) => setNewSkill({ ...newSkill, skill_level: v })}>
                                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="beginner">{t('profile.beginner')}</SelectItem>
                                                        <SelectItem value="intermediate">{t('profile.intermediate')}</SelectItem>
                                                        <SelectItem value="advanced">{t('profile.advanced')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="sm:col-span-2 flex gap-2">
                                                <Input placeholder={t('profile.description')} value={newSkill.description} onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })} className="h-9" />
                                                <Button size="sm" onClick={handleAddSkill}>{t('profile.add')}</Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Skills List */}
                                    <div className="space-y-3">
                                        {skills.length === 0 ? (
                                            <p className="text-sm text-slate-400 italic text-center py-4">{t('profile.noSkills')}</p>
                                        ) : (
                                            <div className="grid gap-3">
                                                {skills.map((skill) => (
                                                    <div key={skill.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50">
                                                        <div className="flex gap-3 items-center">
                                                            <Badge variant="outline" className={cn("capitalize w-24 justify-center", getLevelBadgeColor(skill.skill_level))}>{t('profile.' + skill.skill_level)}</Badge>
                                                            <span className="font-medium">{skill.skill_name}</span>
                                                        </div>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => handleDeleteSkill(skill.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
