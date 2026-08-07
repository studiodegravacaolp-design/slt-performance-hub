begin;

create or replace function slt_private.context_is_valid()
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_tenant_id uuid;
  v_role text;
  v_tenant_mode text;
  v_cross_branch boolean;
  v_branch_ids uuid[];
  v_expected_branch_ids uuid[] := '{}'::uuid[];
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    return false;
  end if;

  if slt_private.current_tenant_id() is null then
    perform slt_private.initialize_context();
  end if;

  v_tenant_id := slt_private.current_tenant_id();
  v_role := slt_private.current_authorization_role();
  v_tenant_mode := slt_private.current_tenant_mode();
  v_cross_branch := slt_private.current_cross_branch_access();
  v_branch_ids := slt_private.current_authorized_branch_ids();

  if v_tenant_id is null
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
volatile
security definer
set search_path = ''
as $$
  select slt_private.context_is_valid()
     and slt_private.current_authorization_role() = any(allowed_roles);
$$;

create or replace function slt_private.can_access_tenant(row_tenant_id uuid)
returns boolean
language sql
volatile
security definer
set search_path = ''
as $$
  select slt_private.context_is_valid()
     and row_tenant_id = slt_private.current_tenant_id();
$$;

create or replace function slt_private.can_access_branch(row_tenant_id uuid, row_branch_id uuid)
returns boolean
language sql
volatile
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
volatile
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
volatile
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

revoke execute on function slt_private.initialize_context()
  from public, anon, authenticated, service_role;

commit;
