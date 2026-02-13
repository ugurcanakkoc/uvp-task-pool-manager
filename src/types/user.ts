export type UserRole = 'gm' | 'owner' | 'worker';

export interface BaseUser {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string | null;
    role: UserRole;
    department?: string | null;
    is_active: boolean;
    total_points?: number | null;
    utilization?: number | null;
    location?: string | null;
    pool_percentage?: number | null;
}

export interface Profile extends BaseUser {
    created_at?: string;
    updated_at?: string;
}

export interface DashboardStaff extends BaseUser {
    current_task?: string;
    task_objects?: any[];
}
