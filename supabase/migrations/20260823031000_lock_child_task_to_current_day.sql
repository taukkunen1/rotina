-- Child task writes are only valid for the server's current Sao Paulo calendar day.
create or replace function public.child_complete_task(p_routine_id uuid,p_task_id uuid,p_status text default 'done',p_date date default public._pacus_local_date()) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_run public.daily_runs; v_task public.tasks; v_existing public.task_completions; v_points integer:=0;
begin
  if p_date <> public._pacus_local_date() then raise exception 'invalid_task_date'; end if;
  if p_status not in ('done','help','skipped','failed') then raise exception 'invalid_task_status'; end if;
  if not exists(select 1 from public.routines where id=p_routine_id and active) then raise exception 'routine_not_active'; end if;
  select t.* into v_task from public.tasks t join public.routine_periods rp on rp.id=t.routine_period_id where t.id=p_task_id and rp.routine_id=p_routine_id and t.active=true;
  if not found then raise exception 'task_not_found'; end if;
  select * into v_run from public._pacus_ensure_daily_run(p_routine_id,p_date);
  if v_run.status <> 'open' then raise exception 'daily_run_closed'; end if;
  select * into v_existing from public.task_completions where daily_run_id=v_run.id and task_id=p_task_id for update;
  if found then return public.child_get_runtime_state(p_routine_id,p_date) || jsonb_build_object('ok',true,'duplicate',true,'completion',to_jsonb(v_existing),'pointsAwarded',0); end if;
  v_points := case when p_status='done' then greatest(v_task.points,0) when p_status='help' then greatest(least(v_task.points,1),0) else 0 end;
  insert into public.task_completions(daily_run_id,task_id,status,points_awarded) values(v_run.id,p_task_id,p_status,v_points);
  if v_points <> 0 then insert into public.point_ledger(daily_run_id,type,amount,description) values(v_run.id,'task',v_points,'Tarefa: '||v_task.title); end if;
  update public.daily_runs dr set done_count=(select count(*) from public.task_completions tc where tc.daily_run_id=dr.id and tc.status in ('done','help')),points_earned=coalesce((select sum(pl.amount) from public.point_ledger pl where pl.daily_run_id=dr.id),0),perfect=((select count(*) from public.tasks t join public.routine_periods rp on rp.id=t.routine_period_id where rp.routine_id=dr.routine_id and t.active=true)=(select count(*) from public.task_completions tc where tc.daily_run_id=dr.id and tc.status in ('done','help'))) where dr.id=v_run.id;
  return public.child_get_runtime_state(p_routine_id,p_date) || jsonb_build_object('ok',true,'duplicate',false,'pointsAwarded',v_points);
end $$;
