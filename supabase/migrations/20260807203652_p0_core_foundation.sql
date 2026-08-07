begin;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  name text not null,
  tenant_mode text not null default 'single',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint companies_tenant_self_check check (tenant_id = id),
  constraint companies_tenant_mode_check check (tenant_mode in ('single', 'multi')),
  constraint companies_tenant_id_id_key unique (tenant_id, id)
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  company_id uuid not null,
  name text not null,
  is_active boolean not null default true,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint branches_tenant_company_check check (tenant_id = company_id),
  constraint branches_tenant_id_fkey
    foreign key (tenant_id) references public.companies (id) on delete restrict,
  constraint branches_tenant_company_fkey
    foreign key (tenant_id, company_id)
    references public.companies (tenant_id, id) on delete restrict,
  constraint branches_tenant_id_id_key unique (tenant_id, id)
);

create table public.users (
  id uuid primary key,
  tenant_id uuid not null,
  email text not null,
  role text not null,
  full_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint users_auth_user_fkey
    foreign key (id) references auth.users (id) on delete restrict,
  constraint users_tenant_id_fkey
    foreign key (tenant_id) references public.companies (id) on delete restrict,
  constraint users_role_check
    check (role in ('admin_tenant', 'manager', 'professor', 'finance', 'athlete')),
  constraint users_tenant_id_id_key unique (tenant_id, id)
);

create table public.athletes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  user_id uuid,
  full_name text not null,
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint athletes_tenant_id_fkey
    foreign key (tenant_id) references public.companies (id) on delete restrict,
  constraint athletes_tenant_user_fkey
    foreign key (tenant_id, user_id)
    references public.users (tenant_id, id) match simple on delete restrict,
  constraint athletes_tenant_id_id_key unique (tenant_id, id)
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  branch_id uuid,
  athlete_id uuid,
  created_by uuid not null,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint workouts_tenant_id_fkey
    foreign key (tenant_id) references public.companies (id) on delete restrict,
  constraint workouts_tenant_branch_fkey
    foreign key (tenant_id, branch_id)
    references public.branches (tenant_id, id) match simple on delete restrict,
  constraint workouts_tenant_athlete_fkey
    foreign key (tenant_id, athlete_id)
    references public.athletes (tenant_id, id) match simple on delete restrict,
  constraint workouts_tenant_creator_fkey
    foreign key (tenant_id, created_by)
    references public.users (tenant_id, id) on delete restrict
);

create table public.user_branches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  user_id uuid not null,
  branch_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint user_branches_tenant_id_fkey
    foreign key (tenant_id) references public.companies (id) on delete restrict,
  constraint user_branches_tenant_user_fkey
    foreign key (tenant_id, user_id)
    references public.users (tenant_id, id) on delete restrict,
  constraint user_branches_tenant_branch_fkey
    foreign key (tenant_id, branch_id)
    references public.branches (tenant_id, id) on delete restrict
);

create table public.athlete_branches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  athlete_id uuid not null,
  branch_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint athlete_branches_tenant_id_fkey
    foreign key (tenant_id) references public.companies (id) on delete restrict,
  constraint athlete_branches_tenant_athlete_fkey
    foreign key (tenant_id, athlete_id)
    references public.athletes (tenant_id, id) on delete restrict,
  constraint athlete_branches_tenant_branch_fkey
    foreign key (tenant_id, branch_id)
    references public.branches (tenant_id, id) on delete restrict
);

create index idx_companies_tenant on public.companies (tenant_id);
create index idx_companies_deleted on public.companies (tenant_id, deleted_at);

create index idx_branches_tenant on public.branches (tenant_id);
create index idx_branches_tenant_company on public.branches (tenant_id, company_id);
create index idx_branches_tenant_active
  on public.branches (tenant_id, is_active, deleted_at);

create index idx_users_tenant on public.users (tenant_id);
create index idx_users_tenant_email on public.users (tenant_id, email);
create index idx_users_tenant_role on public.users (tenant_id, role);
create index idx_users_deleted on public.users (tenant_id, deleted_at);

create index idx_athletes_tenant on public.athletes (tenant_id);
create index idx_athletes_tenant_user on public.athletes (tenant_id, user_id);
create index idx_athletes_deleted on public.athletes (tenant_id, deleted_at);

create index idx_workouts_tenant on public.workouts (tenant_id);
create index idx_workouts_tenant_branch on public.workouts (tenant_id, branch_id);
create index idx_workouts_tenant_athlete on public.workouts (tenant_id, athlete_id);
create index idx_workouts_created_by on public.workouts (tenant_id, created_by);
create index idx_workouts_deleted on public.workouts (tenant_id, deleted_at);

create index idx_ub_tenant_user on public.user_branches (tenant_id, user_id);
create index idx_ub_tenant_branch on public.user_branches (tenant_id, branch_id);
create unique index uq_ub_active
  on public.user_branches (tenant_id, user_id, branch_id)
  where deleted_at is null;
create index idx_ub_deleted on public.user_branches (tenant_id, deleted_at);

create index idx_ab_tenant_athlete
  on public.athlete_branches (tenant_id, athlete_id);
create index idx_ab_tenant_branch
  on public.athlete_branches (tenant_id, branch_id);
create unique index uq_ab_active
  on public.athlete_branches (tenant_id, athlete_id, branch_id)
  where deleted_at is null;
create index idx_ab_deleted on public.athlete_branches (tenant_id, deleted_at);

alter table public.companies enable row level security;
alter table public.companies force row level security;
alter table public.branches enable row level security;
alter table public.branches force row level security;
alter table public.users enable row level security;
alter table public.users force row level security;
alter table public.athletes enable row level security;
alter table public.athletes force row level security;
alter table public.workouts enable row level security;
alter table public.workouts force row level security;
alter table public.user_branches enable row level security;
alter table public.user_branches force row level security;
alter table public.athlete_branches enable row level security;
alter table public.athlete_branches force row level security;

revoke all privileges on table public.companies from anon, authenticated;
revoke all privileges on table public.branches from anon, authenticated;
revoke all privileges on table public.users from anon, authenticated;
revoke all privileges on table public.athletes from anon, authenticated;
revoke all privileges on table public.workouts from anon, authenticated;
revoke all privileges on table public.user_branches from anon, authenticated;
revoke all privileges on table public.athlete_branches from anon, authenticated;

commit;
