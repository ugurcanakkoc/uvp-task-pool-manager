-- Step 8: Task Progress & Review Policies

-- task_progress Policies
-- 1. Workers can insert progress for tasks assigned to them
CREATE POLICY "Workers can log progress for their tasks" ON task_progress
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM tasks
        WHERE id = task_id AND assigned_worker_id = auth.uid()
    )
);

-- 2. Everyone involved (Worker, Owner, GM) can view progress
CREATE POLICY "Progress viewable by involved parties" ON task_progress
FOR SELECT USING (
    auth.uid() = user_id OR -- The worker themselves
    EXISTS (
        SELECT 1 FROM tasks
        WHERE id = task_progress.task_id AND (
            owner_id = auth.uid() OR -- The task owner
            assigned_worker_id = auth.uid() -- redundant but safe
        )
    ) OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'gm' -- GM
);

-- task_reviews Policies
-- 1. Workers can submit tasks for review
CREATE POLICY "Workers can submit for review" ON task_reviews
FOR INSERT WITH CHECK (
    auth.uid() = submitted_by AND
    EXISTS (
        SELECT 1 FROM tasks
        WHERE id = task_id AND assigned_worker_id = auth.uid()
    )
);

-- 2. Owners and GMs can update reviews (approve/reject)
CREATE POLICY "Owners and GMs can update reviews" ON task_reviews
FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'gm' OR
    EXISTS (
        SELECT 1 FROM tasks
        WHERE id = task_reviews.task_id AND owner_id = auth.uid()
    )
);

-- 3. Involved parties can view reviews
CREATE POLICY "Reviews viewable by involved parties" ON task_reviews
FOR SELECT USING (
    auth.uid() = submitted_by OR
    EXISTS (
        SELECT 1 FROM tasks
        WHERE id = task_reviews.task_id AND (
            owner_id = auth.uid()
        )
    ) OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'gm'
);
