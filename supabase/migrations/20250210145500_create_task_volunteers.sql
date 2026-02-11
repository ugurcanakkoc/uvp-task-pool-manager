create table if not exists public.task_volunteers (
    id uuid not null default gen_random_uuid(),
    task_id uuid not null references public.tasks(id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (id),
    unique (task_id, user_id)
);

-- RLS Policies
alter table public.task_volunteers enable row level security;

-- Everyone can read volunteers (transparency) or just GM/Owner and the volunteer themselves.
-- Let's allow everyone to read for now (e.g. to show "3 candidates").
create policy "Volunteers are viewable by everyone" 
on public.task_volunteers for select 
to authenticated 
using (true);

-- Users can volunteer themselves
create policy "Users can volunteer themselves" 
on public.task_volunteers for insert 
to authenticated 
with check (auth.uid() = user_id);

-- Users can withdraw their application
create policy "Users can withdraw" 
on public.task_volunteers for delete 
to authenticated 
using (auth.uid() = user_id);

-- GM/Owner can delete (reject/clear) - handled by cascade usually but good to have
create policy "GM and Owners can manage volunteers" 
on public.task_volunteers for all
to authenticated 
using (
    exists (
        select 1 from public.users 
        where users.id = auth.uid() 
        and (users.role = 'gm' or users.role = 'owner')
    )
);
