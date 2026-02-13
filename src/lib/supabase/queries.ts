import { createClient } from './client';
import { Task, BaseUser } from '@/types';

const supabase = createClient();

/**
 * Fetches all tasks including their owner, assigned worker, and bookings.
 * Used by Gantt Chart and Task Pool.
 */
export async function getTasksWithDetails() {
    const { data, error } = await supabase
        .from('tasks')
        .select(`
            *,
            owner:users!owner_id(full_name, avatar_url, department),
            assigned_worker:users!assigned_worker_id(full_name, avatar_url, department),
            bookings(
                id,
                worker_id,
                start_date,
                end_date,
                worker:users!worker_id(full_name, avatar_url, department)
            )
        `)
        .order('start_date', { ascending: true });

    if (error) throw error;
    return data as unknown as Task[];
}

/**
 * Fetches all active staff members for status lists.
 */
export async function getActiveStaff() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('role', ['worker', 'owner'])
        .eq('is_active', true);

    if (error) throw error;
    return data as BaseUser[];
}

/**
 * Fetches all active bookings and personal tasks for occupancy calculation.
 */
export async function getOccupancyData() {
    const [bookingsRes, personalTasksRes] = await Promise.all([
        supabase
            .from('bookings')
            .select(`
                *,
                tasks (
                    id, title, status, start_date, end_date
                )
            `)
            .eq('is_active', true),
        supabase
            .from('personal_tasks')
            .select('*')
    ]);

    if (bookingsRes.error) throw bookingsRes.error;
    if (personalTasksRes.error) throw personalTasksRes.error;

    return {
        bookings: bookingsRes.data,
        personalTasks: personalTasksRes.data
    };
}
