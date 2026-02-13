'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuHeader,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Notification, getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/lib/actions/notifications'
import { NotificationItem } from './notification-item'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function NotificationBell({ userId }: { userId: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const refreshNotifications = async () => {
        const [list, count] = await Promise.all([
            getNotifications(userId),
            getUnreadCount(userId)
        ])
        setNotifications(list)
        setUnreadCount(count as number)
    }

    useEffect(() => {
        // Initial fetch
        refreshNotifications()

        // Fallback: Polling every 30 seconds (in case Realtime fails)
        const intervalId = setInterval(() => {
            console.log('🔔 Polling for new notifications...')
            refreshNotifications()
        }, 30000)

        // Realtime subscription
        const channelName = `notifications-${userId}`
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload: any) => {
                    console.log('🔔 Notification RECEIVED:', payload)
                    const newNotification = payload.new as Notification

                    // Show toast
                    toast(newNotification.title, {
                        description: newNotification.body,
                        action: newNotification.link ? {
                            label: 'Git',
                            onClick: () => router.push(newNotification.link!)
                        } : undefined,
                    })

                    // Update list
                    setNotifications(prev => [newNotification, ...prev])
                    setUnreadCount(c => c + 1)
                }
            )
            .subscribe((status: string, err: Error | null) => {
                console.log(`🔔 Subscription status (${channelName}):`, status)
                if (status === 'TIMED_OUT') {
                    console.error('🔔 Realtime subscription timed out. Check network or console.')
                }
                if (err) {
                    console.error('🔔 Realtime subscription error:', err)
                }
            })

        return () => {
            console.log(`🔔 Unsubscribing from ${channelName}...`)
            clearInterval(intervalId)
            supabase.removeChannel(channel)
        }
    }, [userId])

    const handleRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        setUnreadCount(c => Math.max(0, c - 1))

        await markAsRead(id)

        // Check link navigation logic if needed within item click
        const notification = notifications.find(n => n.id === id)
        if (notification?.link) {
            setIsOpen(false)
            router.push(notification.link)
        }
    }

    const handleMarkAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
        await markAllAsRead(userId)
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-medium text-white ring-2 ring-background">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuHeader className="flex items-center justify-between p-4">
                    <DropdownMenuLabel>Bildirimler</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-auto px-2 text-xs" onClick={handleMarkAllRead}>
                            Tümünü okundu işaretle
                        </Button>
                    )}
                </DropdownMenuHeader>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Bildiriminiz yok.
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onRead={handleRead}
                            />
                        ))
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
