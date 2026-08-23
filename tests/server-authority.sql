-- Regression tests for a fully server-authoritative daily cycle.
-- Run in a transaction so test writes are never retained.

begin;

-- The server calendar is authoritative and must be Sao Paulo based.
select public._pacus_local_date() = (now() at time zone 'America/Sao_Paulo')::date as sao_paulo_calendar;

-- Browser supplied dates other than the current server date must be rejected.
do $$ begin
  perform public.child_get_runtime_state('077cb586-35c1-49a8-b864-8d2d88f1010f', public._pacus_local_date() + 1);
  raise exception 'future runtime date was accepted';
exception when others then
  if sqlerrm <> 'invalid_runtime_date' then raise; end if;
end $$;

do $$ begin
  perform public.child_complete_task(
    '077cb586-35c1-49a8-b864-8d2d88f1010f',
    (select id from public.tasks order by position limit 1),
    'done',
    public._pacus_local_date() + 1
  );
  raise exception 'future task date was accepted';
exception when others then
  if sqlerrm <> 'invalid_task_date' then raise; end if;
end $$;

-- Rollover must create/read the current server day and leave it open.
select (public.child_rollover_current_day('077cb586-35c1-49a8-b864-8d2d88f1010f')->>'date')::date = public._pacus_local_date() as rollover_uses_server_date;
select (public.child_rollover_current_day('077cb586-35c1-49a8-b864-8d2d88f1010f')->'dailyRun'->>'status') = 'open' as current_run_open;

-- Duplicate completion must not award points twice.
select public.child_complete_task(
  '077cb586-35c1-49a8-b864-8d2d88f1010f',
  (select id from public.tasks order by position limit 1),
  'done'
);
select public.child_complete_task(
  '077cb586-35c1-49a8-b864-8d2d88f1010f',
  (select id from public.tasks order by position limit 1),
  'done'
);

select count(*) = 1 as one_completion
from public.task_completions tc
join public.daily_runs dr on dr.id = tc.daily_run_id
where dr.routine_id = '077cb586-35c1-49a8-b864-8d2d88f1010f'
  and dr.date = public._pacus_local_date()
  and tc.task_id = (select id from public.tasks order by position limit 1);

-- Invalid statuses must be rejected by the server.
do $$ begin
  perform public.child_complete_task(
    '077cb586-35c1-49a8-b864-8d2d88f1010f',
    (select id from public.tasks order by position limit 1),
    'invalid'
  );
  raise exception 'invalid status was accepted';
exception when others then
  if sqlerrm <> 'invalid_task_status' then raise; end if;
end $$;

-- Expired runs must close independently of the browser.
insert into public.daily_runs(routine_id,date,status,started_at,task_count)
values('077cb586-35c1-49a8-b864-8d2d88f1010f',public._pacus_local_date()-1,'open',now(),24)
on conflict (routine_id,date) do update set status='open', closed_at=null;
select public.close_expired_daily_runs();
select status = 'closed' as expired_run_closed
from public.daily_runs
where routine_id = '077cb586-35c1-49a8-b864-8d2d88f1010f'
  and date = public._pacus_local_date()-1;

rollback;