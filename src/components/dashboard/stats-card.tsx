import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"

interface StatsCardProps {
    label: string
    value: string | number
    icon: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    iconColor?: string
    iconBg?: string
    description?: string
}

export function StatsCard({
    label,
    value,
    icon: Icon,
    trend,
    iconColor = "text-blue-600",
    iconBg = "bg-blue-50"
}: StatsCardProps) {
    return (
        <Card className="flex items-center p-4 md:p-5 relative overflow-hidden group hover:shadow-[0px_18px_40px_rgba(112,144,176,0.2)] transition-all duration-300 border-none">
            <div className={cn(
                "flex items-center justify-center w-14 h-14 rounded-full mr-4 transition-transform group-hover:scale-110 duration-300",
                iconBg
            )}>
                <Icon className={cn("w-7 h-7", iconColor)} />
            </div>

            <div className="flex flex-col">
                <p className="text-sm font-medium text-slate-400 mb-1">{label}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white leading-none">
                        {value}
                    </h3>
                    {trend && (
                        <p className={cn(
                            "text-xs font-bold flex items-center",
                            trend.isPositive ? "text-green-500" : "text-red-500"
                        )}>
                            {trend.isPositive ? '+' : ''}{trend.value}%
                        </p>
                    )}
                </div>
            </div>

            {/* Decorative background glow */}
            <div className={cn(
                "absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none blur-2xl",
                iconBg.replace('bg-', 'bg-') // Simplified, assuming bg class logic
            )} style={{ backgroundColor: 'currentColor' }} />
        </Card>
    )
}
