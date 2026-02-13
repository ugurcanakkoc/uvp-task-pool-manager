import { cn } from "@/lib/utils"

interface DashboardSectionProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
    headerAction?: React.ReactNode;
    icon?: React.ElementType;
    iconClassName?: string;
}

export function DashboardSection({
    title,
    subtitle,
    children,
    className,
    headerAction,
    icon: Icon,
    iconClassName
}: DashboardSectionProps) {
    return (
        <section className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                            iconClassName || "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                        )}>
                            <Icon className="w-5 h-5" />
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
                {headerAction && (
                    <div className="flex-shrink-0">
                        {headerAction}
                    </div>
                )}
            </div>

            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-[32px] border border-white/60 dark:border-slate-800/60 p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
                {children}
            </div>
        </section>
    )
}
