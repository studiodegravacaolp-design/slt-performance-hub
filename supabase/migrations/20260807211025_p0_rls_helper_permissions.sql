begin;

grant usage on schema slt_private to authenticated;

grant execute on function slt_private.setting_text(text) to authenticated;
grant execute on function slt_private.current_tenant_id() to authenticated;
grant execute on function slt_private.current_authorization_role() to authenticated;
grant execute on function slt_private.current_tenant_mode() to authenticated;
grant execute on function slt_private.current_cross_branch_access() to authenticated;
grant execute on function slt_private.current_authorized_branch_ids() to authenticated;
grant execute on function slt_private.context_is_valid() to authenticated;
grant execute on function slt_private.has_role(text[]) to authenticated;
grant execute on function slt_private.can_access_tenant(uuid) to authenticated;
grant execute on function slt_private.can_access_branch(uuid, uuid) to authenticated;
grant execute on function slt_private.can_access_user(uuid, uuid) to authenticated;
grant execute on function slt_private.can_access_athlete(uuid, uuid) to authenticated;

revoke execute on function slt_private.initialize_context()
  from public, anon, authenticated, service_role;

commit;
