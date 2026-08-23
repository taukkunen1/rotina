-- Complete server authority for the current daily cycle.

create or replace function public.child_rollover_current_day(p_routine_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_today date := public._pacus_local_date();
        v_run public.daily_runs;
begin
  perform public.close_expired_daily_runs();
  select * into v_run from public._pacus_ensure_daily_run(p_routine_id, v_today);
  if v_run.status <> 'open' then raise exception 'current_daily_run_not_open'; end if;
  return public.child_get_runtime_state(p_routine_id, v_today);
end $$;

create or replace function public.child_get_runtime_state(p_routine_id uuid, p_date date default public._pacus_local_date())
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_today date := public._pacus_local_date(); v_run public.daily_runs;
begin
  if p_date is not null and p_date <> v_today then raise exception 'invalid_runtime_date'; end if;
  perform public.close_expired_daily_runs();
  select * into v_run from public._pacus_ensure_daily_run(p_routine_id, v_today);
  return jsonb_build_object(
    'routineId',p_routine_id,'date',v_today,'dailyRun',to_jsonb(v_run),
    'completions',coalesce((select jsonb_agg(to_jsonb(tc) order by tc.completed_at) from public.task_completions tc where tc.daily_run_id=v_run.id),'[]'::jsonb),
    'balance',coalesce((select sum(pl.amount) from public.point_ledger pl join public.daily_runs dr on dr.id=pl.daily_run_id where dr.routine_id=p_routine_id),0),
    'history',coalesce((select jsonb_object_agg(dr.date::text,jsonb_build_object('done',dr.done_count,'total',dr.task_count,'pointsEarnedThatDay',dr.points_earned,'perfect',dr.perfect,'screenMinutes',dr.screen_minutes,'status',dr.status)) from public.daily_runs dr where dr.routine_id=p_routine_id),'{}'::jsonb)
  );
end $$;

create or replace function public.child_complete_task(p_routine_id uuid,p_task_id uuid,p_status text default 'done',p_date date default public._pacus_local_date())
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_today date := public._pacus_local_date(); v_run public.daily_runs; v_task public.tasks; v_existing public.task_completions; v_points integer:=0;
begin
  if p_date is not null and p_date <> v_today then raise exception 'invalid_task_date'; end if;
  if p_status not in ('done','help','skipped','failed') then raise exception 'invalid_task_status'; end if;
  if not exists(select 1 from public.routines where id=p_routine_id and active) then raise exception 'routine_not_active'; end if;
  perform public.close_expired_daily_runs();
  select t.* into v_task from public.tasks t join public.routine_periods rp on rp.id=t.routine_period_id where t.id=p_task_id and rp.routine_id=p_routine_id and t.active=true;
  if not found then raise exception 'task_not_found'; end if;
  select * into v_run from public._pacus_ensure_daily_run(p_routine_id,v_today);
  if v_run.status <> 'open' then raise exception 'daily_run_closed'; end if;
  select * into v_existing from public.task_completions where daily_run_id=v_run.id and task_id=p_task_id for update;
  if found then return public.child_get_runtime_state(p_routine_id,v_today)||jsonb_build_object('ok',true,'duplicate',true,'completion',to_jsonb(v_existing),'pointsAwarded',0); end if;
  v_points:=case when p_status='done' then greatest(v_task.points,0) when p_status='help' then greatest(least(v_task.points,1),0) else 0 end;
  insert into public.task_completions(daily_run_id,task_id,status,points_awarded) values(v_run.id,p_task_id,p_status,v_points);
  if v_points<>0 then insert into public.point_ledger(daily_run_id,type,amount,description) values(v_run.id,'task',v_points,'Tarefa: '||v_task.title); end if;
  update public.daily_runs dr set done_count=(select count(*) from public.task_completions tc where tc.daily_run_id=dr.id and tc.status in ('done','help')),points_earned=coalesce((select sum(pl.amount) from public.point_ledger pl where pl.daily_run_id=dr.id),0),perfect=((select count(*) from public.tasks t join public.routine_periods rp on rp.id=t.routine_period_id where rp.routine_id=dr.routine_id and t.active=true)=(select count(*) from public.task_completions tc where tc.daily_run_id=dr.id and tc.status in ('done','help'))) where dr.id=v_run.id;
  return public.child_get_runtime_state(p_routine_id,v_today)||jsonb_build_object('ok',true,'duplicate',false,'pointsAwarded',v_points);
end $$;

revoke all on function public.child_rollover_current_day(uuid) from public,anon,authenticated;
grant execute on function public.child_rollover_current_day(uuid) to anon,authenticated;
revoke all on function public.child_get_runtime_state(uuid,date) from public,anon,authenticated;
grant execute on function public.child_get_runtime_state(uuid,date) to anon,authenticated;
revoke all on function public.child_complete_task(uuid,uuid,text,date) from public,anon,authenticated;
grant execute on function public.child_complete_task(uuid,uuid,text,date) to anon,authenticated;

do $$ begin perform cron.unschedule('pacus-close-expired-daily-runs') where exists(select 1 from cron.job where jobname='pacus-close-expired-daily-runs'); exception when undefined_table then null; end $$;
do $$ begin perform cron.schedule('pacus-close-expired-daily-runs','*/15 * * * *','select public.close_expired_daily_runs()'); exception when undefined_table then null; end $$;