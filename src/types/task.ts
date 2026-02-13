import { BaseUser } from './user';

export type TaskStatus = 'requested' | 'pending' | 'active' | 'completed' | 'cancelled' | 'returned' | 'review' | 'in_progress';

export interface Booking {
    id: string;
    task_id: string;
    worker_id: string;
    owner_id: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    worker?: Partial<BaseUser>;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: number;
    department: string;
    start_date: string;
    end_date: string;
    owner_id: string;
    assigned_worker_id?: string | null;
    is_strategic: boolean;
    is_production: boolean;
    task_type: string;
    customer_deadline?: string | null;
    return_reason?: string | null;
    gm_approved?: boolean;
    created_at: string;
    completed_at?: string | null;
    cancelled_at?: string | null;

    // Joint data
    owner?: Partial<BaseUser>;
    assigned_worker?: Partial<BaseUser>;
    bookings?: Booking[];
}

export interface PersonalTask {
    id: string;
    user_id: string;
    title: string;
    description?: string | null;
    start_date: string;
    end_date: string;
    is_recurring: boolean;
    recurring_days?: number[] | null;
    is_full_day: boolean;
    can_support: boolean;
}
