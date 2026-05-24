
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  athlete_id text not null,
  sport text not null,
  title text,
  blocks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workouts enable row level security;

create policy "own_select" on public.workouts for select using (auth.uid() = tenant_id);
create policy "own_insert" on public.workouts for insert with check (auth.uid() = tenant_id);
create policy "own_update" on public.workouts for update using (auth.uid() = tenant_id);
create policy "own_delete" on public.workouts for delete using (auth.uid() = tenant_id);

create index workouts_tenant_athlete_idx on public.workouts (tenant_id, athlete_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger workouts_set_updated_at
before update on public.workouts
for each row execute function public.set_updated_at();
