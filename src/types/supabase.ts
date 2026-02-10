export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            audit_logs: {
                Row: {
                    action: string
                    created_at: string | null
                    description: string | null
                    entity_id: string | null
                    entity_type: string
                    id: string
                    ip_address: string | null
                    new_value: Json | null
                    old_value: Json | null
                    user_agent: string | null
                    user_id: string | null
                }
                Insert: {
                    action: string
                    created_at?: string | null
                    description?: string | null
                    entity_id?: string | null
                    entity_type: string
                    id?: string
                    ip_address?: string | null
                    new_value?: Json | null
                    old_value?: Json | null
                    user_agent?: string | null
                    user_id?: string | null
                }
                Update: {
                    action?: string
                    created_at?: string | null
                    description?: string | null
                    entity_id?: string | null
                    entity_type?: string
                    id?: string
                    ip_address?: string | null
                    new_value?: Json | null
                    old_value?: Json | null
                    user_agent?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "audit_logs_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            badges: {
                Row: {
                    code: string
                    color: string
                    criteria: string
                    description: string | null
                    icon: string
                    id: string
                    name: string
                }
                Insert: {
                    code: string
                    color: string
                    criteria: string
                    description?: string | null
                    icon: string
                    id?: string
                    name: string
                }
                Update: {
                    code?: string
                    color?: string
                    criteria?: string
                    description?: string | null
                    icon?: string
                    id?: string
                    name?: string
                }
                Relationships: []
            }
            bookings: {
                Row: {
                    created_at: string | null
                    end_date: string
                    id: string
                    is_active: boolean | null
                    owner_id: string
                    start_date: string
                    task_id: string
                    worker_id: string
                }
                Insert: {
                    created_at?: string | null
                    end_date: string
                    id?: string
                    is_active?: boolean | null
                    owner_id: string
                    start_date: string
                    task_id: string
                    worker_id: string
                }
                Update: {
                    created_at?: string | null
                    end_date?: string
                    id?: string
                    is_active?: boolean | null
                    owner_id?: string
                    start_date?: string
                    task_id?: string
                    worker_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "bookings_owner_id_fkey"
                        columns: ["owner_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "bookings_task_id_fkey"
                        columns: ["task_id"]
                        isOneToOne: false
                        referencedRelation: "tasks"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "bookings_worker_id_fkey"
                        columns: ["worker_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            notifications: {
                Row: {
                    body: string | null
                    created_at: string | null
                    id: string
                    is_read: boolean | null
                    reference_id: string | null
                    reference_type: string | null
                    title: string
                    type: string
                    user_id: string
                }
                Insert: {
                    body?: string | null
                    created_at?: string | null
                    id?: string
                    is_read?: boolean | null
                    reference_id?: string | null
                    reference_type?: string | null
                    title: string
                    type: string
                    user_id: string
                }
                Update: {
                    body?: string | null
                    created_at?: string | null
                    id?: string
                    is_read?: boolean | null
                    reference_id?: string | null
                    reference_type?: string | null
                    title?: string
                    type?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            owner_support_requests: {
                Row: {
                    created_at: string | null
                    description: string
                    id: string
                    owner_id: string
                    reviewed_at: string | null
                    reviewed_by: string | null
                    status: string | null
                    title: string
                }
                Insert: {
                    created_at?: string | null
                    description: string
                    id?: string
                    owner_id: string
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                    status?: string | null
                    title: string
                }
                Update: {
                    created_at?: string | null
                    description?: string
                    id?: string
                    owner_id?: string
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                    status?: string | null
                    title?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "owner_support_requests_owner_id_fkey"
                        columns: ["owner_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "owner_support_requests_reviewed_by_fkey"
                        columns: ["reviewed_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            points_log: {
                Row: {
                    created_at: string | null
                    id: string
                    points: number
                    reason: string
                    reference_id: string | null
                    reference_type: string | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    points: number
                    reason: string
                    reference_id?: string | null
                    reference_type?: string | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    points?: number
                    reason?: string
                    reference_id?: string | null
                    reference_type?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "points_log_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            side_tasks: {
                Row: {
                    assigned_to: string
                    created_at: string | null
                    created_by: string
                    deadline: string | null
                    description: string | null
                    id: string
                    postpone_reason: string | null
                    status: string | null
                    title: string
                    updated_at: string | null
                }
                Insert: {
                    assigned_to: string
                    created_at?: string | null
                    created_by: string
                    deadline?: string | null
                    description?: string | null
                    id?: string
                    postpone_reason?: string | null
                    status?: string | null
                    title: string
                    updated_at?: string | null
                }
                Update: {
                    assigned_to?: string
                    created_at?: string | null
                    created_by?: string
                    deadline?: string | null
                    description?: string | null
                    id?: string
                    postpone_reason?: string | null
                    status?: string | null
                    title?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "side_tasks_assigned_to_fkey"
                        columns: ["assigned_to"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "side_tasks_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            skills: {
                Row: {
                    approval_status: string | null
                    approved_at: string | null
                    approved_by: string | null
                    created_at: string | null
                    description: string | null
                    id: string
                    skill_level: string
                    skill_name: string
                    user_id: string
                }
                Insert: {
                    approval_status?: string | null
                    approved_at?: string | null
                    approved_by?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    skill_level: string
                    skill_name: string
                    user_id: string
                }
                Update: {
                    approval_status?: string | null
                    approved_at?: string | null
                    approved_by?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    skill_level?: string
                    skill_name?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "skills_approved_by_fkey"
                        columns: ["approved_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "skills_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            task_progress: {
                Row: {
                    content: string
                    created_at: string | null
                    id: string
                    task_id: string
                    user_id: string
                }
                Insert: {
                    content: string
                    created_at?: string | null
                    id?: string
                    task_id: string
                    user_id: string
                }
                Update: {
                    content?: string
                    created_at?: string | null
                    id?: string
                    task_id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "task_progress_task_id_fkey"
                        columns: ["task_id"]
                        isOneToOne: false
                        referencedRelation: "tasks"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "task_progress_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            task_reviews: {
                Row: {
                    id: string
                    review_note: string | null
                    review_status: string | null
                    reviewed_at: string | null
                    reviewed_by: string | null
                    submit_note: string | null
                    submitted_at: string | null
                    submitted_by: string
                    task_id: string
                }
                Insert: {
                    id?: string
                    review_note?: string | null
                    review_status?: string | null
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                    submit_note?: string | null
                    submitted_at?: string | null
                    submitted_by: string
                    task_id: string
                }
                Update: {
                    id?: string
                    review_note?: string | null
                    review_status?: string | null
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                    submit_note?: string | null
                    submitted_at?: string | null
                    submitted_by?: string
                    task_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "task_reviews_reviewed_by_fkey"
                        columns: ["reviewed_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "task_reviews_submitted_by_fkey"
                        columns: ["submitted_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "task_reviews_task_id_fkey"
                        columns: ["task_id"]
                        isOneToOne: false
                        referencedRelation: "tasks"
                        referencedColumns: ["id"]
                    }
                ]
            }
            tasks: {
                Row: {
                    assigned_worker_id: string | null
                    created_at: string | null
                    customer_deadline: string | null
                    department: string
                    description: string
                    end_date: string
                    gm_approved: boolean | null
                    gm_approved_by: string | null
                    id: string
                    is_production: boolean | null
                    is_strategic: boolean | null
                    order_number: string | null
                    owner_id: string
                    priority: number
                    return_reason: string | null
                    returned_at: string | null
                    start_date: string
                    status: string | null
                    task_type: string
                    title: string
                    updated_at: string | null
                    volunteer_id: string | null
                }
                Insert: {
                    assigned_worker_id?: string | null
                    created_at?: string | null
                    customer_deadline?: string | null
                    department: string
                    description: string
                    end_date: string
                    gm_approved?: boolean | null
                    gm_approved_by?: string | null
                    id?: string
                    is_production?: boolean | null
                    is_strategic?: boolean | null
                    order_number?: string | null
                    owner_id: string
                    priority: number
                    return_reason?: string | null
                    returned_at?: string | null
                    start_date: string
                    status?: string | null
                    task_type: string
                    title: string
                    updated_at?: string | null
                    volunteer_id?: string | null
                }
                Update: {
                    assigned_worker_id?: string | null
                    created_at?: string | null
                    customer_deadline?: string | null
                    department?: string
                    description?: string
                    end_date?: string
                    gm_approved?: boolean | null
                    gm_approved_by?: string | null
                    id?: string
                    is_production?: boolean | null
                    is_strategic?: boolean | null
                    order_number?: string | null
                    owner_id?: string
                    priority?: number
                    return_reason?: string | null
                    returned_at?: string | null
                    start_date?: string
                    status?: string | null
                    task_type?: string
                    title?: string
                    updated_at?: string | null
                    volunteer_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "tasks_assigned_worker_id_fkey"
                        columns: ["assigned_worker_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "tasks_gm_approved_by_fkey"
                        columns: ["gm_approved_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "tasks_owner_id_fkey"
                        columns: ["owner_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "tasks_volunteer_id_fkey"
                        columns: ["volunteer_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            user_badges: {
                Row: {
                    badge_id: string
                    earned_at: string | null
                    id: string
                    user_id: string
                }
                Insert: {
                    badge_id: string
                    earned_at?: string | null
                    id?: string
                    user_id: string
                }
                Update: {
                    badge_id?: string
                    earned_at?: string | null
                    id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_badges_badge_id_fkey"
                        columns: ["badge_id"]
                        isOneToOne: false
                        referencedRelation: "badges"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_badges_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            users: {
                Row: {
                    avatar_url: string | null
                    can_production: boolean | null
                    created_at: string | null
                    department: string | null
                    email: string
                    full_name: string
                    id: string
                    is_active: boolean | null
                    location: string | null
                    pool_percentage: number | null
                    role: string
                    status: string | null
                    total_points: number | null
                    updated_at: string | null
                    utilization: number | null
                }
                Insert: {
                    avatar_url?: string | null
                    can_production?: boolean | null
                    created_at?: string | null
                    department?: string | null
                    email: string
                    full_name: string
                    id?: string
                    is_active?: boolean | null
                    location?: string | null
                    pool_percentage?: number | null
                    role: string
                    status?: string | null
                    total_points?: number | null
                    updated_at?: string | null
                    utilization?: number | null
                }
                Update: {
                    avatar_url?: string | null
                    can_production?: boolean | null
                    created_at?: string | null
                    department?: string | null
                    email?: string
                    full_name?: string
                    id?: string
                    is_active?: boolean | null
                    location?: string | null
                    pool_percentage?: number | null
                    role?: string
                    status?: string | null
                    total_points?: number | null
                    updated_at?: string | null
                    utilization?: number | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
}
    ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
}
    ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
}
    ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
}
    ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][DefaultSchemaEnumNameOrOptions]
    : never
