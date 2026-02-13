'use client'

import { useState, useEffect } from 'react'
import { Bell, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Notification {
    id: string
    type: 'system' | 'assignment' | 'reminder' | 'alert'
    title: string
    body: string
    is_read: boolean
    link?: string
    created_at: string
}

export function NotificationsPopover() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const { user } = useAuthStore()
    const supabase = createClient()

    const fetchNotifications = async () => {
        if (!user) return

        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (data) {
            const typedData = data as Notification[]
            setNotifications(typedData)
            setUnreadCount(typedData.filter((n: Notification) => !n.is_read).length)
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [user])

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
    }

    const markAllAsRead = async () => {
        // Optimistic update
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)

        if (!user) return
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false)
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                    <Bell className="h-5 w-5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="font-semibold text-sm">Bildirimler</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto py-1 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={markAllAsRead}
                        >
                            Tümünü Okundu İşaretle
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p>Bildiriminiz yok.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer",
                                        !notification.is_read && "bg-blue-50/50 dark:bg-blue-900/10"
                                    )}
                                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "mt-1 h-2 w-2 rounded-full shrink-0",
                                            notification.is_read ? "bg-slate-500/0" : "bg-blue-500"
                                        )} />
                                        <div className="space-y-1 flex-1">
                                            <p className={cn("text-sm leading-none", !notification.is_read ? "font-semibold text-slate-900 dark:text-slate-100" : "font-medium text-slate-600 dark:text-slate-400")}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                                {notification.body}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: tr })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
