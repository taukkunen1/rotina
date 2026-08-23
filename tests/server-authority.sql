-- Regression tests for server-authoritative task state.
-- Run in a transaction so production data is never retained.

begin;

-- Duplicate completion must not award points twice.
select public.child_complete_task(
  '077cb586-35c1-49a8-b864-8d2d88f1010f',
  (select id from public.tasks order by position limit 1),
  'done',
  '2099-01-01'
);
select public.child_complete_task(
  '077cb586-35c1-49a8-b864-8d2d88f1010f',
  (select id from public.tasks order by position limit 1),
  'done',
  '2099-01-01'
);

-- Exactly one completion and one task ledger event must exist.
select count(*) = 1 as one_completion
from public.task_completions tc
join public.daily_runs dr on dr.id = tc.daily_run_id
where dr.routine_id = '077cb586-35c1-49a8-b864-8d2d88f1010f'
  and dr.date = '2099-01-01';

select count(*) = 1 as one_task_ledger_event
from public.point_ledger pl
join public.daily_runs dr on dr.id = pl.daily_run_id
where dr.routine_id = '077cb586-35c1-49a8-b864-8d2d88f1010f'
  and dr.date = '2099-01-01'
  and pl.type = 'task';

-- Invalid statuses must be rejected by the server.
do $$ begin
  perform public.child_complete_task(
    '077cb586-35c1-49a8-b864-8d2d88f1010f',
    (select id from public.tasks order by position limit 1),
    'invalid',
    '2099-01-01'
  );
  raise exception 'invalid status was accepted';
exception when others then
  if sqlerrm <> 'invalid_task_status' then raise; end if;
end $$;

-- Expired runs must close on the server, independently of the browser.
insert into public.daily_runs(routine_id,date,status,started_at,task_count)
values('077cb586-35c1-49a8-b864-8d2d88f1010f','2020-01-01','open',now(),24);
select public.close_expired_daily_runs();
select status = 'closed' as expired_run_closed
from public.daily_runs
where routine_id = '077cb586-35c1-49a8-b864-8d2d88f1010f'
  and date = '2020-01-01';

rollback;
