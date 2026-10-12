-- Murder Room: ett delat spelrum per kod.
-- Kör skriptet i Supabase SQL Editor. Lägg sedan projektets URL och anon-nyckel i .env.local.

create table if not exists public.rooms (
  code text primary key,
  version integer not null default 1,
  state jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

grant select, insert, update on public.rooms to anon, authenticated;

drop policy if exists "rooms can be read" on public.rooms;
drop policy if exists "rooms can be created" on public.rooms;
drop policy if exists "rooms can be updated" on public.rooms;

create policy "rooms can be read"
  on public.rooms for select
  to anon, authenticated
  using (true);

create policy "rooms can be created"
  on public.rooms for insert
  to anon, authenticated
  with check (true);

create policy "rooms can be updated"
  on public.rooms for update
  to anon, authenticated
  using (true)
  with check (true);

do $$
begin
  alter publication supabase_realtime add table public.rooms;
exception
  when duplicate_object then null;
end $$;
