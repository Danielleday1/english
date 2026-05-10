create table if not exists public.english_app_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.english_app_snapshots enable row level security;

drop policy if exists "Users can view their own english snapshots"
on public.english_app_snapshots;

create policy "Users can view their own english snapshots"
on public.english_app_snapshots
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own english snapshots"
on public.english_app_snapshots;

create policy "Users can insert their own english snapshots"
on public.english_app_snapshots
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own english snapshots"
on public.english_app_snapshots;

create policy "Users can update their own english snapshots"
on public.english_app_snapshots
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own english snapshots"
on public.english_app_snapshots;

create policy "Users can delete their own english snapshots"
on public.english_app_snapshots
for delete
to authenticated
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('english-recordings', 'english-recordings', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload their own english recordings"
on storage.objects;

create policy "Users can upload their own english recordings"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'english-recordings'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can read their own english recordings"
on storage.objects;

create policy "Users can read their own english recordings"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'english-recordings'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update their own english recordings"
on storage.objects;

create policy "Users can update their own english recordings"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'english-recordings'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'english-recordings'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete their own english recordings"
on storage.objects;

create policy "Users can delete their own english recordings"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'english-recordings'
  and auth.uid()::text = (storage.foldername(name))[1]
);
