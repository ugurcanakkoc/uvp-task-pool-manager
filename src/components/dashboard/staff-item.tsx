'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Briefcase } from "lucide-react"
import { DashboardStaff } from "@/types"

interface StaffItemProps {
    person: DashboardStaff
    type: 'working' | 'available'
    onTaskClick: (task: any) => void
    onOpenList: (person: DashboardStaff) => void
}

export function StaffItem({ person, type, onTaskClick, onOpenList }: StaffItemProps) {
    return (
        <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 hover:shadow-sm group">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-700 shadow-sm shrink-0">
                    <AvatarImage src={person.avatar_url || undefined} />
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
                                            onClick={() => onOpenList(person)}
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
                                                if (person.task_objects?.[0]) onTaskClick(person.task_objects[0])
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
    )
}
