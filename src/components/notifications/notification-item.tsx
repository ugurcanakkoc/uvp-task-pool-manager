'use client'

import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Bell, Check, Info, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Notification } from '@/lib/actions/notifications'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

interface NotificationItemProps {
    notification: Notification
    onRead: (id: string) => void
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
    const getIcon = () => {
        switch (notification.type) {
            case 'success':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />
            case 'warning':
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-500" />
            default:
                return <Info className="h-4 w-4 text-blue-500" />
        }
    }

    return (
        <DropdownMenuItem
            className={cn(
                "flex flex-col items-start gap-1 p-3 cursor-pointer focus:bg-accent",
                !notification.is_read && "bg-muted/50"
            )}
            onClick={() => onRead(notification.id)}
        >
            <div className="flex w-full gap-2">
                <div className="mt-1 shrink-0">{getIcon()}</div>
                <div className="flex-1 space-y-1">
                    <p className={cn("text-sm font-medium leading-none", !notification.is_read && "font-semibold")}>
                        {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.body}
                    </p>
                </div>
                {!notification.is_read && (
                    <span className="flex h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                )}
            </div>
            <div className="ml-6 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: tr })}
                </span>
            </div>
        </DropdownMenuItem>
    )
}
