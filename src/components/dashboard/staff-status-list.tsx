'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Briefcase, Clock, UserIcon } from "lucide-react"

interface StaffStatus {
    id: string;
    full_name: string;
    avatar_url?: string;
    department?: string;
    current_task?: string;
    task_objects?: any[];
    role: string;
}

import { useState } from 'react'
import { TaskDetailDialog } from "@/components/calendar/task-detail-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"

interface StaffStatusListProps {
    title: string;
    staff: StaffStatus[];
    type: 'working' | 'available';
    emptyText: string;
}

export function StaffStatusList({ title, staff, type, emptyText }: StaffStatusListProps) {
    const [selectedTask, setSelectedTask] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isListDialogOpen, setIsListDialogOpen] = useState(false)
    const [listTasks, setListTasks] = useState<any[]>([])
    const [selectedPersonName, setSelectedPersonName] = useState('')

    const handleTaskClick = (task: any) => {
        if (!task) return
        setSelectedTask(task)
        setIsDialogOpen(true)
        setIsListDialogOpen(false) // Close list if it was open
    }

    const handleOpenList = (person: StaffStatus) => {
        setListTasks(person.task_objects || [])
        setSelectedPersonName(person.full_name)
        setIsListDialogOpen(true)
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 rounded-t-[30px]">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <div className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        type === 'working' ? "bg-amber-500" : "bg-emerald-500"
                    )} />
                    {title}
                </h3>
                <Badge variant="outline" className="rounded-lg bg-white/50 dark:bg-slate-800 font-black">
                    {staff.length}
                </Badge>
            </div>

            <div className="p-4 overflow-y-auto max-h-[400px] custom-scrollbar">
                {staff.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center text-center px-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3">
                            <UserIcon className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">{emptyText}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {staff.map((person) => (
                            <div
                                key={person.id}
                                className="flex items-center justify-between p-3 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 hover:shadow-sm group"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-700 shadow-sm shrink-0">
                                        <AvatarImage src={person.avatar_url} />
                                        <AvatarFallback className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 font-black text-xs">
                                            {person.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-700 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {person.full_name}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {person.department}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {type === 'working' && person.current_task && (
                                        <div onClick={(e) => e.stopPropagation()}>
                                            {person.task_objects && person.task_objects.length > 1 ? (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div
                                                                onClick={() => handleOpenList(person)}
                                                                className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer shadow-sm flex items-center justify-center transition-all animate-pulse"
                                                            >
                                                                <Briefcase className="w-4 h-4" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="text-xs font-bold">{person.task_objects.length} Aktif Görev</p>
                                                            <p className="text-[10px] text-amber-600 mt-1 uppercase font-black">Listeyi gör</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ) : (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div
                                                                onClick={() => {
                                                                    if (person.task_objects?.[0]) handleTaskClick(person.task_objects[0])
                                                                }}
                                                                className={cn(
                                                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                                                    person.task_objects?.[0]
                                                                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer shadow-sm"
                                                                        : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 cursor-help"
                                                                )}
                                                            >
                                                                <Briefcase className="w-4 h-4" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="text-xs font-bold">{person.current_task}</p>
                                                            {person.task_objects?.[0] && <p className="text-[10px] text-amber-600 mt-1 uppercase font-black">Detay için tıkla</p>}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    )}
                                    {type === 'available' && (
                                        <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-tight">
                                            Müsait
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <TaskDetailDialog
                task={selectedTask}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={() => { }}
            />

            {/* Multiple Tasks List Dialog */}
            <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                <Briefcase className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-white">{selectedPersonName}</DialogTitle>
                                <DialogDescription className="text-amber-100 font-bold opacity-90">
                                    {listTasks.length} Farklı Görev Üzerinde Çalışıyor
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-50/50">
                        {listTasks.map((task) => (
                            <div
                                key={task.id}
                                onClick={() => handleTaskClick(task)}
                                className="group flex items-center justify-between p-4 rounded-[24px] bg-white border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all cursor-pointer"
                            >
                                <div className="space-y-1">
                                    <h4 className="font-bold text-slate-800 group-hover:text-amber-600 transition-colors line-clamp-1">
                                        {task.title}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tight py-0 bg-slate-50 border-slate-200 text-slate-500">
                                            {task.department}
                                        </Badge>
                                        <span className="text-[10px] font-bold text-slate-400">#{task.id.slice(0, 4)}</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-amber-50 flex items-center justify-center text-slate-300 group-hover:text-amber-500 transition-all">
                                    <Clock className="w-5 h-5" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
                        <button
                            onClick={() => setIsListDialogOpen(false)}
                            className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 px-4 py-2"
                        >
                            Kapat
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
