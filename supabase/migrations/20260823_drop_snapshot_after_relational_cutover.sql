-- Final cutover. Apply only after the frontend commit that uses get_routine_model/save_routine_model
-- is deployed, otherwise older clients will lose their compatibility RPCs.

revoke execute on function public.get_routine_snapshot(uuid) from public, anon, authenticated;
revoke execute on function public.save_routine_snapshot(uuid, jsonb, jsonb, bigint) from public, anon, authenticated;
revoke execute on function public.save_child_state(uuid, jsonb, bigint) from public, anon, authenticated;

drop function if exists public.get_routine_snapshot(uuid);
drop function if exists public.save_routine_snapshot(uuid, jsonb, jsonb, bigint);
drop function if exists public.save_child_state(uuid, jsonb, bigint);

drop table if exists public.routine_snapshots;
