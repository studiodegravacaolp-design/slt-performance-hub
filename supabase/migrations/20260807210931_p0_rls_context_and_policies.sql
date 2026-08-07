begin;

create schema if not exists slt_private;
revoke all on schema slt_private from public, anon, authenticated;

create or replace function slt_private.setting_text(setting_name text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return nullif(pg_catalog.current_setting(setting_name, true), '');
exception
  when others then
    return null;
end;
$$;

create or replace function slt_private.current_tenant_id()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return slt_private.setting_text('app.current_tenant_id')::uuid;
exception
  when others then
    return null;
end;
$$;

create or replace function slt_private.current_authorization_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select slt_private.setting_text('app.authorization_role');
$$;

create or replace function slt_private.current_tenant_mode()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select slt_private.setting_text('app.tenant_mode');
$$;

create or replace function slt_private.current_cross_branch_access()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return coalesce(slt_private.setting_text('app.cross_branch_access')::boolean, false);
exception
  when others then
    return false;
end;
$$;

create or replace function slt_private.current_authorized_branch_ids()
returns uuid[]
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return coalesce(slt_private.setting_text('app.authorized_branch_ids')::uuid[], '{}'::uuid[]);
exception
  when others then
    return '{}'::uuid[];
end;
$$;

create or replace function slt_private.initialize_context()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_tenant_id uuid;
  v_role text;
  v_tenant_mode text;
  v_branch_ids uuid[] := '{}'::uuid[];
begin
  if v_user_id is null then
    raise exception 'SLT_CONTEXT_AUTH_REQUIRED' using errcode = '28000';
  end if;

  select u.tenant_id, u.role, c.tenant_mode
    into v_tenant_id, v_role, v_tenant_mode
  from public.users u
  join public.companies c
    on c.id = u.tenant_id
   and c.tenant_id = u.tenant_id
  where u.id = v_user_id
    and u.deleted_at is null
    and c.deleted_at is null;

  if v_tenant_id is null then
    raise exception 'SLT_CONTEXT_ACTIVE_USER_REQUIRED' using errcode = '28000';
  end if;

  if v_tenant_mode = 'multi' then
    select coalesce(array_agg(ub.branch_id order by ub.branch_id), '{}'::uuid[])
      into v_branch_ids
    from public.user_branches ub
    join public.branches b
      on b.tenant_id = ub.tenant_id
     and b.id = ub.branch_id
    where ub.tenant_id = v_tenant_id
      and ub.user_id = v_user_id
      and ub.deleted_at is null
      and b.deleted_at is null
      and b.is_active;
  end if;

  perform pg_catalog.set_config('app.current_tenant_id', v_tenant_id::text, true);
  perform pg_catalog.set_config('app.authorized_branch_ids', v_branch_ids::text, true);
  perform pg_catalog.set_config('app.cross_branch_access', 'false', true);
  perform pg_catalog.set_config('app.authorization_role', v_role, true);
  perform pg_catalog.set_config('app.tenant_mode', v_tenant_mode, true);
end;
$$;

create or replace function slt_private.context_is_valid()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_tenant_id uuid := slt_private.current_tenant_id();
  v_role text := slt_private.current_authorization_role();
  v_tenant_mode text := slt_private.current_tenant_mode();
  v_cross_branch boolean := slt_private.current_cross_branch_access();
  v_branch_ids uuid[] := slt_private.current_authorized_branch_ids();
  v_expected_branch_ids uuid[] := '{}'::uuid[];
begin
  if v_user_id is null
     or v_tenant_id is null
     or v_role is null
     or v_tenant_mode not in ('single', 'multi')
     or v_cross_branch then
    return false;
  end if;

  if not exists (
    select 1
    from public.users u
    join public.companies c
      on c.id = u.tenant_id
     and c.tenant_id = u.tenant_id
    where u.id = v_user_id
      and u.tenant_id = v_tenant_id
      and u.role = v_role
      and u.deleted_at is null
      and c.tenant_mode = v_tenant_mode
      and c.deleted_at is null
  ) then
    return false;
  end if;

  if v_tenant_mode = 'single' then
    return v_branch_ids = '{}'::uuid[];
  end if;

  select coalesce(array_agg(ub.branch_id order by ub.branch_id), '{}'::uuid[])
    into v_expected_branch_ids
  from public.user_branches ub
  join public.branches b
    on b.tenant_id = ub.tenant_id
   and b.id = ub.branch_id
  where ub.tenant_id = v_tenant_id
    and ub.user_id = v_user_id
    and ub.deleted_at is null
    and b.deleted_at is null
    and b.is_active;

  return v_branch_ids = v_expected_branch_ids;
exception
  when others then
    return false;
end;
$$;

create or replace function slt_private.has_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select slt_private.context_is_valid()
     and slt_private.current_authorization_role() = any(allowed_roles);
$$;

create or replace function slt_private.can_access_tenant(row_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select slt_private.context_is_valid()
     and row_tenant_id = slt_private.current_tenant_id();
$$;

create or replace function slt_private.can_access_branch(row_tenant_id uuid, row_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select slt_private.can_access_tenant(row_tenant_id)
     and row_branch_id is not null
     and (
       slt_private.current_tenant_mode() = 'single'
       or row_branch_id = any(slt_private.current_authorized_branch_ids())
     );
$$;

create or replace function slt_private.can_access_user(row_tenant_id uuid, row_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select slt_private.can_access_tenant(row_tenant_id)
     and (
       row_user_id = (select auth.uid())
       or slt_private.current_tenant_mode() = 'single'
       or exists (
         select 1
         from public.user_branches ub
         where ub.tenant_id = row_tenant_id
           and ub.user_id = row_user_id
           and ub.deleted_at is null
           and ub.branch_id = any(slt_private.current_authorized_branch_ids())
       )
     );
$$;

create or replace function slt_private.can_access_athlete(row_tenant_id uuid, row_athlete_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select slt_private.can_access_tenant(row_tenant_id)
     and (
       exists (
         select 1
         from public.athletes a
         where a.tenant_id = row_tenant_id
           and a.id = row_athlete_id
           and a.user_id = (select auth.uid())
           and a.deleted_at is null
       )
       or slt_private.current_tenant_mode() = 'single'
       or exists (
         select 1
         from public.athlete_branches ab
         where ab.tenant_id = row_tenant_id
           and ab.athlete_id = row_athlete_id
           and ab.deleted_at is null
           and ab.branch_id = any(slt_private.current_authorized_branch_ids())
       )
     );
$$;

revoke all on all functions in schema slt_private from public, anon, authenticated, service_role;

revoke all privileges on table public.companies from anon, authenticated;
revoke all privileges on table public.branches from anon, authenticated;
revoke all privileges on table public.users from anon, authenticated;
revoke all privileges on table public.athletes from anon, authenticated;
revoke all privileges on table public.workouts from anon, authenticated;
revoke all privileges on table public.user_branches from anon, authenticated;
revoke all privileges on table public.athlete_branches from anon, authenticated;

grant select on table public.companies, public.branches, public.users,
  public.athletes, public.workouts, public.user_branches,
  public.athlete_branches to authenticated;

grant insert on table public.branches, public.athletes, public.workouts,
  public.user_branches, public.athlete_branches to authenticated;

grant update (name, updated_at) on public.companies to authenticated;
grant update (name, is_active, address, updated_at) on public.branches to authenticated;
grant update (email, full_name, updated_at) on public.users to authenticated;
grant update (full_name, birth_date, updated_at) on public.athletes to authenticated;
grant update (branch_id, athlete_id, title, description, updated_at) on public.workouts to authenticated;

create policy companies_select
on public.companies
for select
to authenticated
using (
  deleted_at is null
  and (select slt_private.has_role(array['admin_tenant', 'manager', 'professor', 'athlete']))
  and (select slt_private.can_access_tenant(tenant_id))
);

create policy companies_update
on public.companies
for update
to authenticated
using (
  deleted_at is null
  and (select slt_private.has_role(array['admin_tenant']))
  and (select slt_private.can_access_tenant(tenant_id))
)
with check (
  deleted_at is null
  and (select slt_private.has_role(array['admin_tenant']))
  and (select slt_private.can_access_tenant(tenant_id))
);

create policy branches_select
on public.branches
for select
to authenticated
using (
  deleted_at is null
  and is_active
  and (select slt_private.has_role(array['admin_tenant', 'manager', 'professor', 'athlete']))
  and slt_private.can_access_branch(tenant_id, id)
);

create policy branches_insert
on public.branches
for insert
to authenticated
with check (
  deleted_at is null
  and (select slt_private.has_role(array['admin_tenant']))
  and (select slt_private.can_access_tenant(tenant_id))
  and company_id = tenant_id
);

create policy branches_update
on public.branches
for update
to authenticated
using (
  deleted_at is null
  and (select slt_private.has_role(array['admin_tenant']))
  and slt_private.can_access_branch(tenant_id, id)
)
with check (
  deleted_at is null
  and (select slt_private.has_role(array['admin_tenant']))
  and slt_private.can_access_branch(tenant_id, id)
  and company_id = tenant_id
);

create policy users_select
on public.users
for select
to authenticated
using (
  deleted_at is null
  and (select slt_private.has_role(array['admin_tenant', 'manager', 'professor', 'athlete']))
  and slt_private.can_access_user(tenant_id, id)
);

create policy users_update
on public.users
for update
to authenticated
using (
  deleted_at is null
  and (
    ((select slt_private.has_role(array['admin_tenant', 'manager']))
      and slt_private.can_access_user(tenant_id, id))
    or ((select slt_private.has_role(array['professor'])) and id = (select auth.uid()))
  )
)
with check (
  deleted_at is null
  and (
    ((select slt_private.has_role(array['admin_tenant', 'manager']))
      and slt_private.can_access_user(tenant_id, id))
    or ((select slt_private.has_role(array['professor'])) and id = (select auth.uid()))
  )
);

create policy athletes_select
on public.athletes
for select
to authenticated
using (
  deleted_at is null
  and (select slt_private.has_role(array['admin_tenant', 'manager', 'professor', 'athlete']))
  and slt_private.can_access_athlete(tenant_id, id)
);

create policy athletes_insert
on public.athletes
for insert
to authenticated
with check (
  deleted_at is null
  and (select slt_private.has_role(array['admin_tenant', 'manager']))
  and (select slt_private.can_access_tenant(tenant_id))
  and (user_id is null or slt_private.can_access_user(tenant_id, user_id))
);

create policy athletes_update
on public.athletes
for update
to authenticated
using (
  deleted_at is null
  and (select slt_private.has_role(array['admin_tenant', 'manager', 'professor']))
  and slt_private.can_access_athlete(tenant_id, id)
)
with check (
  deleted_at is null
  and (select slt_private.has_role(array['admin_tenant', 'manager', 'professor']))
  and slt_private.can_access_athlete(tenant_id, id)
);

create policy workouts_select
on public.workouts
for select
to authenticated
using (
  deleted_at is null
  and (select slt_private.has_role(array['admin_tenant', 'manager', 'professor', 'athlete']))
  and (
    slt_private.can_access_athlete(tenant_id, athlete_id)
    or (
      athlete_id is null
      and (select slt_private.has_role(array['admin_tenant', 'manager', 'professor']))
    )
  )
  and (branch_id is null or slt_private.can_access_branch(tenant_id, branch_id))
);

create policy workouts_insert
on public.workouts
for insert
to authenticated
with check (
  deleted_at is null
  and (select slt_private.has_role(array['admin_tenant', 'manager', 'professor']))
  and (select slt_private.can_access_tenant(tenant_id))
  and created_by = (select auth.uid())
  and (athlete_id is null or slt_private.can_access_athlete(tenant_id, athlete_id))
  and (branch_id is null or slt_private.can_access_branch(tenant_id, branch_id))
);

create policy workouts_update
on public.workouts
for update
to authenticated
using (
  deleted_at is null
  and (
    slt_private.can_access_athlete(tenant_id, athlete_id)
    or (
      athlete_id is null
      and (select slt_private.has_role(array['admin_tenant', 'manager', 'professor']))
    )
  )
  and (branch_id is null or slt_private.can_access_branch(tenant_id, branch_id))
  and (
    (select slt_private.has_role(array['admin_tenant', 'manager']))
    or ((select slt_private.has_role(array['professor'])) and created_by = (select auth.uid()))
  )
)
with check (
  deleted_at is null
  and (
    slt_private.can_access_athlete(tenant_id, athlete_id)
    or (
      athlete_id is null
      and (select slt_private.has_role(array['admin_tenant', 'manager', 'professor']))
    )
  )
  and (branch_id is null or slt_private.can_access_branch(tenant_id, branch_id))
  and (
    (select slt_private.has_role(array['admin_tenant', 'manager']))
    or ((select slt_private.has_role(array['professor'])) and created_by = (select auth.uid()))
  )
);

create policy user_branches_select
on public.user_branches
for select
to authenticated
using (
  deleted_at is null
  and (
    ((select slt_private.has_role(array['admin_tenant', 'manager']))
      and slt_private.can_access_branch(tenant_id, branch_id))
    or ((select slt_private.has_role(array['professor', 'athlete']))
      and user_id = (select auth.uid())
      and (select slt_private.can_access_tenant(tenant_id)))
  )
);

create policy user_branches_insert
on public.user_branches
for insert
to authenticated
with check (
  deleted_at is null
  and (select slt_private.has_role(array['admin_tenant']))
  and slt_private.can_access_user(tenant_id, user_id)
  and slt_private.can_access_branch(tenant_id, branch_id)
);

create policy athlete_branches_select
on public.athlete_branches
for select
to authenticated
using (
  deleted_at is null
  and (select slt_private.has_role(array['admin_tenant', 'manager', 'professor', 'athlete']))
  and slt_private.can_access_athlete(tenant_id, athlete_id)
  and slt_private.can_access_branch(tenant_id, branch_id)
);

create policy athlete_branches_insert
on public.athlete_branches
for insert
to authenticated
with check (
  deleted_at is null
  and (select slt_private.has_role(array['admin_tenant', 'manager']))
  and slt_private.can_access_athlete(tenant_id, athlete_id)
  and slt_private.can_access_branch(tenant_id, branch_id)
);

commit;
