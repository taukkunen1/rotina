-- Server authority for daily state and task completion.
-- Applied to the production Supabase project as migration server_authority_daily_cycle.

create or replace function public._pacus_local_date() returns date language sql stable as $$
  select (now() at time zone 'America/Sao_Paulo')::date
$$;

create or replace function public._pacus_ensure_daily_run(p_routine_id uuid, p_date date default public._pacus_local_date())
returns public.daily_runs
language plpgsql security definer set search_path = public as $$
declare v_run public.daily_runs;
begin
  insert into public.daily_runs(routine_id,date,status,started_at,done_count,task_count,points_earned,perfect,screen_minutes)
  select p_routine_id,p_date,'open',now(),0,count(*),0,false,0
  from public.tasks t
  join public.routine_periods rp on rp.id=t.routine_period_id
  where rp.routine_id=p_routine_id and t.active=true
  on conflict (routine_id,date) do nothing;
  select * into v_run from public.daily_runs where routine_id=p_routine_id and date=p_date;
  return v_run;
end $$;

create or replace function public.child_get_daily_state(p_routine_id uuid, p_date date default public._pacus_local_date())
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_run public.daily_runs;
begin
  select public._pacus_ensure_daily_run(p_routine_id,p_date) into v_run;
  return jsonb_build_object(
    'routineId',p_routine_id,
    'date',p_date,
    'dailyRun',to_jsonb(v_run),
    'completions',coalesce((select jsonb_agg(to_jsonb(tc) order by tc.completed_at) from public.task_completions tc where tc.daily_run_id=v_run.id),'[]'::jsonb),
    'points',coalesce((select sum(amount) from public.point_ledger pl where pl.daily_run_id=v_run.id),0)
  );
end $$;

create or replace function public.child_get_runtime_state(p_routine_id uuid, p_date date default public._pacus_local_date())
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_run public.daily_runs;
begin
  select public._pacus_ensure_daily_run(p_routine_id,p_date) into v_run;
  return jsonb_build_object(
    'routineId',p_routine_id,
    'date',p_date,
    'dailyRun',to_jsonb(v_run),
    'completions',coalesce((select jsonb_agg(to_jsonb(tc) order by tc.completed_at) from public.task_completions tc where tc.daily_run_id=v_run.id),'[]'::jsonb),
    'balance',coalesce((select sum(amount) from public.point_ledger pl join public.daily_runs dr on dr.id=pl.daily_run_id where dr.routine_id=p_routine_id),0),
    'history',coalesce((select jsonb_object_agg(dr.date::text,jsonb_build_object('done',dr.done_count,'total',dr.task_count,'pointsEarnedThatDay',dr.points_earned,'perfect',dr.perfect,'screenMinutes',dr.screen_minutes)) from public.daily_runs dr where dr.routine_id=p_routine_id),'{}'::jsonb)
  );
end $$;

create or replace function public.child_complete_task(p_routine_id uuid,p_task_id uuid,p_status text default 'done',p_date date default public._pacus_local_date())
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_run public.daily_runs; v_task public.tasks; v_existing public.task_completions; v_points integer:=0;
begin
  if p_status not in ('done','help','skipped','failed') then raise exception 'invalid_task_status'; end if;
  if not exists(select 1 from public.routines where id=p_routine_id and active) then raise exception 'routine_not_active'; end if;
  select t.* into v_task
  from public.tasks t join public.routine_periods rp on rp.id=t.routine_period_id
  where t.id=p_task_id and rp.routine_id=p_routine_id and t.active=true;
  if not found then raise exception 'task_not_found'; end if;
  select public._pacus_ensure_daily_run(p_routine_id,p_date) into v_run;
  select * into v_existing from public.task_completions where daily_run_id=v_run.id and task_id=p_task_id for update;
  if found then return jsonb_build_object('ok',true,'duplicate',true,'dailyRun',to_jsonb(v_run),'completion',to_jsonb(v_existing)); end if;
  v_points := case when p_status='done' then greatest(v_task.points,0) when p_status='help' then greatest(least(v_task.points,1),0) else 0 end;
  insert into public.task_completions(daily_run_id,task_id,status,points_awarded) values(v_run.id,p_task_id,p_status,v_points);
  if v_points <> 0 then insert into public.point_ledger(daily_run_id,type,amount,description) values(v_run.id,'task',v_points,'Tarefa: '||v_task.title); end if;
  update public.daily_runs dr set
    done_count=(select count(*) from public.task_completions tc where tc.daily_run_id=dr.id and tc.status in ('done','help')),
    points_earned=coalesce((select sum(pl.amount) from public.point_ledger pl where pl.daily_run_id=dr.id),0),
    perfect=((select count(*) from public.tasks t join public.routine_periods rp on rp.id=t.routine_period_id where rp.routine_id=dr.routine_id and t.active=true)=(select count(*) from public.task_completions tc where tc.daily_run_id=dr.id and tc.status in ('done','help')))
  where dr.id=v_run.id;
  return public.child_get_runtime_state(p_routine_id,p_date) || jsonb_build_object('ok',true,'duplicate',false,'pointsAwarded',v_points);
end $$;

create or replace function public.child_mark_task(p_routine_id uuid,p_task_id uuid,p_status text default 'done',p_date date default public._pacus_local_date())
returns jsonb language sql security definer set search_path = public as $$
  select public.child_complete_task(p_routine_id,p_task_id,p_status,p_date)
$$;

create or replace function public.close_expired_daily_runs()
returns integer language plpgsql security definer set search_path = public as $$
declare v_today date:=public._pacus_local_date(); v_count integer;
begin
  update public.daily_runs dr set
    status='closed',
    closed_at=coalesce(closed_at,now()),
    done_count=(select count(*) from public.task_completions tc where tc.daily_run_id=dr.id and tc.status in ('done','help')),
    points_earned=coalesce((select sum(pl.amount) from public.point_ledger pl where pl.daily_run_id=dr.id),0),
    perfect=((select count(*) from public.tasks t join public.routine_periods rp on rp.id=t.routine_period_id where rp.routine_id=dr.routine_id and t.active=true)=(select count(*) from public.task_completions tc where tc.daily_run_id=dr.id and tc.status in ('done','help')))
  where dr.status='open' and dr.date < v_today;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

revoke all on function public.child_get_daily_state(uuid,date) from public,anon,authenticated;
grant execute on function public.child_get_daily_state(uuid,date) to anon,authenticated;
revoke all on function public.child_get_runtime_state(uuid,date) from public,anon,authenticated;
grant execute on function public.child_get_runtime_state(uuid,date) to anon,authenticated;
revoke all on function public.child_complete_task(uuid,uuid,text,date) from public,anon,authenticated;
grant execute on function public.child_complete_task(uuid,uuid,text,date) to anon,authenticated;
revoke all on function public.child_mark_task(uuid,uuid,text,date) from public,anon,authenticated;
grant execute on function public.child_mark_task(uuid,uuid,text,date) to anon,authenticated;
revoke all on function public.close_expired_daily_runs() from public,anon,authenticated;

do $$ begin create extension if not exists pg_cron with schema extensions; exception when others then null; end $$;
do $$ begin perform cron.unschedule('pacus-close-expired-daily-runs') where exists(select 1 from cron.job where jobname='pacus-close-expired-daily-runs'); exception when undefined_table then null; end $$;
do $$ begin perform cron.schedule('pacus-close-expired-daily-runs','15 * * * *','select public.close_expired_daily_runs()'); exception when undefined_table then null; end $$;
