'use client'

import { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { UserIcon } from "lucide-react"
import { TaskDetailDialog } from "@/components/calendar/task-detail-dialog"
import { StaffItem } from "./staff-item"
import { StaffTasksDialog } from "./staff-tasks-dialog"
import { DashboardStaff } from "@/types"

interface StaffStatusListProps {
    title: string;
    staff: DashboardStaff[];
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
        setIsListDialogOpen(false)
    }

    const handleOpenList = (person: DashboardStaff) => {
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
                            <StaffItem
                                key={person.id}
                                person={person}
                                type={type}
                                onTaskClick={handleTaskClick}
                                onOpenList={handleOpenList}
                            />
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

            <StaffTasksDialog
                open={isListDialogOpen}
                onOpenChange={setIsListDialogOpen}
                personName={selectedPersonName}
                tasks={listTasks}
                onTaskClick={handleTaskClick}
            />
        </div>
    )
}
