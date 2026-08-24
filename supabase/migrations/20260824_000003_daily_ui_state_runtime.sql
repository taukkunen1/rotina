-- Etapa 3: incluir estado visual diário no runtime e manter gameTimer/Pacus no Supabase.
-- A função child_get_runtime_state passa a devolver uiState do dia atual.
-- save_child_ui_state continua sendo a única escrita para gameTimer e progresso visual do Pacus.

create or replace function public.child_get_runtime_state(
  p_routine_id uuid,
  p_date date default public._pacus_local_date()
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_today date := public._pacus_local_date();
  v_run public.daily_runs;
  v_ui public.daily_ui_state;
  v_has_ui boolean := false;
begin
  if p_date is not null and p_date <> v_today then
    raise exception 'invalid_runtime_date';
  end if;

  perform public.close_expired_daily_runs();
  select * into v_run from public._pacus_ensure_daily_run(p_routine_id, v_today);
  select * into v_ui from public.daily_ui_state where routine_id = p_routine_id and date = v_today;
  v_has_ui := found;

  return jsonb_build_object(
    'routineId', p_routine_id,
    'date', v_today,
    'dailyRun', to_jsonb(v_run),
    'completions', coalesce((select jsonb_agg(to_jsonb(tc) order by tc.completed_at) from public.task_completions tc where tc.daily_run_id = v_run.id), '[]'::jsonb),
    'balance', coalesce((select sum(pl.amount) from public.point_ledger pl join public.daily_runs dr on dr.id = pl.daily_run_id where dr.routine_id = p_routine_id), 0),
    'history', coalesce((select jsonb_object_agg(dr.date::text, jsonb_build_object('done',dr.done_count,'total',dr.task_count,'pointsEarnedThatDay',dr.points_earned,'perfect',dr.perfect,'screenMinutes',dr.screen_minutes,'status',dr.status)) from public.daily_runs dr where dr.routine_id = p_routine_id), '{}'::jsonb),
    'uiState', case when not v_has_ui then jsonb_build_object(
      'gameTimer', jsonb_build_object('date',v_today,'usedSeconds',0,'runningSince',null,'bonusSeconds',0,'redemptions','{}'::jsonb),
      'lastSeenPetStage',0,'petCompletedDays','[]'::jsonb,'petPerfectBonusDays','[]'::jsonb,'petLastCompletionISO',null
    ) else jsonb_build_object(
      'gameTimer',jsonb_build_object('date',v_today,'usedSeconds',v_ui.game_used_seconds,'runningSince',v_ui.game_running_since,'bonusSeconds',v_ui.game_bonus_seconds,'redemptions',coalesce(v_ui.reward_redemptions,'{}'::jsonb)),
      'lastSeenPetStage',v_ui.last_seen_pet_stage,'petCompletedDays',coalesce(v_ui.pet_completed_days,'[]'::jsonb),'petPerfectBonusDays',coalesce(v_ui.pet_perfect_bonus_days,'[]'::jsonb),'petLastCompletionISO',v_ui.pet_last_completion_at
    )
  );
end $$;