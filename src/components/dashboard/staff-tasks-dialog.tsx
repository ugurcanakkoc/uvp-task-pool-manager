'use client'

import { Briefcase, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Task } from "@/types"

interface StaffTasksDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    personName: string
    tasks: any[]
    onTaskClick: (task: any) => void
}

export function StaffTasksDialog({ open, onOpenChange, personName, tasks, onTaskClick }: StaffTasksDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-8 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                            <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black text-white">{personName}</DialogTitle>
                            <DialogDescription className="text-amber-100 font-bold opacity-90">
                                {tasks.length} Farklı Görev Üzerinde Çalışıyor
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-50/50">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            onClick={() => onTaskClick(task)}
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
                        onClick={() => onOpenChange(false)}
                        className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 px-4 py-2"
                    >
                        Kapat
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
