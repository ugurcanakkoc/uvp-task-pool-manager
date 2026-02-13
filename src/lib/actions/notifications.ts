'use server'

import { createClient } from '@/lib/supabase/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
    id: string
    user_id: string
    type: NotificationType
    title: string
    body: string
    is_read: boolean
    created_at: string
    link?: string
    reference_type?: string
    reference_id?: string
}

export async function getNotifications(userId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error('Error fetching notifications:', error)
        return []
    }

    return data as Notification[]
}

export async function getUnreadCount(userId: string) {
    const supabase = createClient()

    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

    if (error) {
        console.error('Error fetching unread count:', error)
        return 0
    }

    return count || 0
}

export async function markAsRead(notificationId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

    if (error) {
        console.error('Error marking notification as read:', error)
        throw error
    }

    revalidatePath('/')
}

export async function markAllAsRead(userId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

    if (error) {
        console.error('Error marking all notifications as read:', error)
        throw error
    }

    revalidatePath('/')
}

export async function createNotification(data: {
    userId: string
    type: NotificationType
    title: string
    body: string
    link?: string
    referenceType?: string
    referenceId?: string
}) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: data.userId,
            type: data.type,
            title: data.title,
            body: data.body,
            link: data.link,
            reference_type: data.referenceType,
            reference_id: data.referenceId,
            is_read: false
        })

    if (error) {
        console.error('Error creating notification:', error)
        throw error
    }
}
