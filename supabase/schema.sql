-- ZenSudoku Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  city text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Scores table
create table if not exists public.scores (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  puzzle_id text not null,
  time_seconds integer not null check (time_seconds > 0),
  mistakes integer not null default 0 check (mistakes >= 0),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'expert')),
  completed_at timestamptz not null default now()
);

alter table public.scores enable row level security;

create policy "Users can view all scores"
  on public.scores for select
  using (true);

create policy "Users can insert their own scores"
  on public.scores for insert
  with check (auth.uid() = user_id);

create index scores_user_id_idx on public.scores(user_id);
create index scores_difficulty_idx on public.scores(difficulty);
create index scores_completed_at_idx on public.scores(completed_at desc);

-- Daily challenges table
create table if not exists public.daily_challenges (
  id uuid default uuid_generate_v4() primary key,
  date date not null unique,
  puzzle_seed text not null,
  puzzle_data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.daily_challenges enable row level security;

create policy "Daily challenges are publicly readable"
  on public.daily_challenges for select
  using (true);

create policy "Only service role can insert daily challenges"
  on public.daily_challenges for insert
  with check (auth.role() = 'service_role');

create index daily_challenges_date_idx on public.daily_challenges(date desc);

-- Leaderboard view
create or replace view public.leaderboard as
  select
    s.id,
    s.user_id,
    u.email,
    u.city,
    s.difficulty,
    s.time_seconds,
    s.mistakes,
    s.completed_at,
    rank() over (
      partition by s.difficulty
      order by s.time_seconds asc, s.mistakes asc
    ) as rank
  from public.scores s
  join public.users u on u.id = s.user_id;
