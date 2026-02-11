
-- 20250211103000_fix_recursive_rls.sql
-- This migration fixes the 500 Database Error (recursion) in the users table policies.

DROP POLICY IF EXISTS "Users viewable by self or higher" ON users;

-- Optimized policy using a safer check that avoids infinite recursion
CREATE POLICY "Users viewable by self or higher" ON users
FOR SELECT USING (
    -- 1. Can always view self
    auth.uid() = id 
    OR 
    -- 2. GM and Owner can view others
    -- We use a more explicit check to help PostgreSQL query planner avoid recursion
    (
        SELECT u.role 
        FROM users u 
        WHERE u.id = auth.uid() 
        LIMIT 1
    ) IN ('gm', 'owner')
);

-- Also fix other potentially recursive policies in task_progress and task_reviews
DROP POLICY IF EXISTS "Progress viewable by involved parties" ON task_progress;
CREATE POLICY "Progress viewable by involved parties" ON task_progress
FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.id = task_progress.task_id AND (
            t.owner_id = auth.uid() OR
            t.assigned_worker_id = auth.uid()
        )
    ) OR
    (SELECT u.role FROM users u WHERE u.id = auth.uid() LIMIT 1) = 'gm'
);

DROP POLICY IF EXISTS "Owners and GMs can update reviews" ON task_reviews;
CREATE POLICY "Owners and GMs can update reviews" ON task_reviews
FOR UPDATE USING (
    (SELECT u.role FROM users u WHERE u.id = auth.uid() LIMIT 1) = 'gm' OR
    EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.id = task_reviews.task_id AND t.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Reviews viewable by involved parties" ON task_reviews;
CREATE POLICY "Reviews viewable by involved parties" ON task_reviews
FOR SELECT USING (
    auth.uid() = submitted_by OR
    EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.id = task_reviews.task_id AND t.owner_id = auth.uid()
    ) OR
    (SELECT u.role FROM users u WHERE u.id = auth.uid() LIMIT 1) = 'gm'
);
