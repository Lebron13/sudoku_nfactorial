create table if not exists profiles (
  id uuid references auth.users primary key,
  display_name text,
  city text,
  updated_at timestamptz
);
alter table profiles enable row level security;
create policy "Users can manage own profile" on profiles
  for all using (auth.uid() = id);
