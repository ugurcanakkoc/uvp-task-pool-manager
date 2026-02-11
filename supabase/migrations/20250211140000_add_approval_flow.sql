-- Modifying tasks table for better approval flow tracking

-- 1. Add 'requested' to the status check constraint
-- First drop the old constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- Add new constraint with 'requested' status
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('requested', 'pending', 'active', 'completed', 'returned', 'cancelled', 'review'));

-- 2. Add approval tracking columns if they don't exist
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 3. Update RLS policies to handle 'requested' status
-- Ensure GMs can see and manage requested tasks
DROP POLICY IF EXISTS "GM can manage all tasks" ON tasks;
CREATE POLICY "GM can manage all tasks" ON tasks
FOR ALL USING (
    (SELECT u.role FROM users u WHERE u.id = auth.uid() LIMIT 1) = 'gm'
);

-- Ensure Owners can only manage their own tasks
DROP POLICY IF EXISTS "Owners can manage own tasks" ON tasks;
CREATE POLICY "Owners can manage own tasks" ON tasks
FOR ALL USING (
    owner_id = auth.uid() AND (SELECT u.role FROM users u WHERE u.id = auth.uid() LIMIT 1) = 'owner'
);
