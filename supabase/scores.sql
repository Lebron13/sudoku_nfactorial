create table if not exists scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  display_name text,
  city text,
  difficulty text,
  time_seconds integer,
  mistakes integer,
  stars integer,
  puzzle_date text,
  is_daily boolean default false,
  completed_at timestamptz default now()
);
alter table scores enable row level security;
create policy "Anyone can read scores" on scores for select using (true);
create policy "Users insert own scores" on scores for insert
  with check (auth.uid() = user_id);
