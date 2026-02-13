'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Users, TrendingUp, Clock, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPIStatsProps {
    availableStaffCount: number;
    weeklySavedHours?: number;
    totalActiveTasks: number;
    pendingApprovals: number;
}

export function KPIStats({
    availableStaffCount,
    weeklySavedHours = 42, // Default or mock for now
    totalActiveTasks,
    pendingApprovals
}: KPIStatsProps) {
    const stats = [
        {
            title: "Bugün Boş Personel",
            value: availableStaffCount,
            unit: "Kişi",
            icon: Users,
            color: "text-emerald-600",
            bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
            description: "Şu an talep gönderilebilir"
        },
        {
            title: "Haftalık Kazanılan Verimlilik",
            value: weeklySavedHours,
            unit: "Saat",
            icon: TrendingUp,
            color: "text-blue-600",
            bgColor: "bg-blue-50 dark:bg-blue-900/20",
            description: "Sistem tasarrufu (ROI)"
        },
        {
            title: "Aktif Destek Talepleri",
            value: totalActiveTasks,
            unit: "İş",
            icon: Zap,
            color: "text-amber-600",
            bgColor: "bg-amber-50 dark:bg-amber-900/20",
            description: "Sahada devam eden"
        },
        {
            title: "Bekleyen Onaylar",
            value: pendingApprovals,
            unit: "Adet",
            icon: Clock,
            color: "text-violet-600",
            bgColor: "bg-violet-50 dark:bg-violet-900/20",
            description: "GM / Owner onayı"
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <Card key={index} className="border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:translate-y-[-2px] transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn("p-2.5 rounded-xl", stat.bgColor)}>
                                <stat.icon className={cn("w-5 h-5", stat.color)} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {stat.unit}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                                {stat.value}
                            </h3>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                                {stat.title}
                            </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-medium text-slate-400 italic">
                                {stat.description}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
