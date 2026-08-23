-- API hardening for the routine snapshot boundary.
-- Public child read/write remains intentionally limited until the child
-- account/session model is introduced. Full configuration writes require
-- an authenticated adult.

create or replace function public.get_routine_snapshot(p_routine_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare r public.routine_snapshots%rowtype;
begin
  select * into r from public.routine_snapshots where routine_id = p_routine_id;
  if not found then raise exception 'Routine snapshot not found'; end if;

  if auth.uid() is not null and public.is_adult_for_routine(p_routine_id) then
    return jsonb_build_object(
      'config', r.config,
      'state', r.state,
      'revision', r.revision,
      'serverUpdatedAt', r.updated_at,
      'domains', jsonb_build_object(
        'routineConfig', r.config,
        'dailyState', r.state,
        'pointEvents', coalesce(r.state->'pointEvents','[]'::jsonb),
        'history', coalesce(r.state->'history','{}'::jsonb)
      )
    );
  end if;

  return jsonb_build_object(
    'config', r.config - 'editorPin',
    'state', r.state - 'history',
    'revision', r.revision,
    'serverUpdatedAt', r.updated_at,
    'domains', jsonb_build_object(
      'routineConfig', r.config - 'editorPin',
      'dailyState', r.state - 'history',
      'pointEvents', coalesce(r.state->'pointEvents','[]'::jsonb),
      'history', '{}'::jsonb
    )
  );
end;
$$;

create or replace function public.save_routine_snapshot(
  p_routine_id uuid,
  p_config jsonb,
  p_state jsonb,
  p_base_revision bigint default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare r public.routine_snapshots%rowtype; next_revision bigint;
begin
  if auth.uid() is null or not public.is_adult_for_routine(p_routine_id) then
    raise exception 'Adult authentication required';
  end if;

  select * into r from public.routine_snapshots where routine_id = p_routine_id for update;
  if not found then raise exception 'Routine snapshot not found'; end if;

  if r.revision > 0 and p_base_revision <> r.revision then
    return jsonb_build_object(
      'conflict', true,
      'revision', r.revision,
      'data', jsonb_build_object('config',r.config,'state',r.state,'revision',r.revision,'serverUpdatedAt',r.updated_at)
    );
  end if;

  next_revision := r.revision + 1;
  update public.routine_snapshots
  set config=coalesce(p_config,'{}'::jsonb),
      state=coalesce(p_state,'{}'::jsonb),
      revision=next_revision,
      updated_at=now(),
      updated_by=auth.uid()
  where routine_id=p_routine_id;

  return jsonb_build_object('ok',true,'revision',next_revision,'serverUpdatedAt',now());
end;
$$;

create or replace function public.save_child_state(
  p_routine_id uuid,
  p_state jsonb,
  p_base_revision bigint default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.routine_snapshots%rowtype;
  key_name text;
  safe_state jsonb;
  next_revision bigint;
begin
  select * into r from public.routine_snapshots where routine_id = p_routine_id for update;
  if not found then raise exception 'Routine snapshot not found'; end if;

  if r.revision > 0 and p_base_revision <> 0 and p_base_revision <> r.revision then
    return jsonb_build_object(
      'conflict', true,
      'revision', r.revision,
      'data', jsonb_build_object(
        'config',r.config - 'editorPin',
        'state',r.state - 'history',
        'revision',r.revision,
        'serverUpdatedAt',r.updated_at
      )
    );
  end if;

  safe_state := coalesce(r.state, '{}'::jsonb);
  foreach key_name in array array[
    'checkedToday','totalPoints','timers','autonomy','customTaskOrder',
    'hairState','gameTimer','rewardState','petState','pointEvents'
  ] loop
    if coalesce(p_state, '{}'::jsonb) ? key_name then
      safe_state := jsonb_set(safe_state, array[key_name], p_state->key_name, true);
    end if;
  end loop;

  safe_state := safe_state - 'history' - 'driveLastSyncISO';
  next_revision := r.revision + 1;

  update public.routine_snapshots
  set state=safe_state, revision=next_revision, updated_at=now(), updated_by=null
  where routine_id=p_routine_id;

  return jsonb_build_object('ok',true,'revision',next_revision,'serverUpdatedAt',now());
end;
$$;

revoke execute on function public.get_routine_snapshot(uuid) from public;
revoke execute on function public.save_routine_snapshot(uuid,jsonb,jsonb,bigint) from public;
revoke execute on function public.save_child_state(uuid,jsonb,bigint) from public;
revoke execute on function public.save_routine_snapshot(uuid,jsonb,jsonb,bigint) from anon;
revoke execute on function public.save_child_state(uuid,jsonb,bigint) from authenticated;
grant execute on function public.get_routine_snapshot(uuid) to anon, authenticated;
grant execute on function public.save_child_state(uuid,jsonb,bigint) to anon;
grant execute on function public.save_routine_snapshot(uuid,jsonb,jsonb,bigint) to authenticated;

revoke all on table public.routine_snapshots from anon, authenticated;
