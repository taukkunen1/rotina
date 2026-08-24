-- Etapa 2: transições de tarefas são calculadas no servidor.
-- O cliente informa apenas rotina, tarefa e status desejado.
-- pending/remove desmarca; done/help/skipped/failed atualizam a conclusão.

CREATE OR REPLACE FUNCTION public.child_complete_task(
  p_routine_id uuid,
  p_task_id uuid,
  p_status text DEFAULT 'done'::text,
  p_date date DEFAULT public._pacus_local_date()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_today date := public._pacus_local_date();
  v_run public.daily_runs;
  v_task public.tasks;
  v_existing public.task_completions;
  v_old_points integer := 0;
  v_new_points integer := 0;
  v_delta integer := 0;
  v_had_existing boolean := false;
  v_action text;
BEGIN
  IF p_date IS NOT NULL AND p_date <> v_today THEN RAISE EXCEPTION 'invalid_task_date'; END IF;
  IF p_status IS NULL OR p_status = 'pending' THEN p_status := 'pending';
  ELSIF p_status NOT IN ('done','help','skipped','failed') THEN RAISE EXCEPTION 'invalid_task_status'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.routines WHERE id=p_routine_id AND active) THEN
    RAISE EXCEPTION 'routine_not_active';
  END IF;

  PERFORM public.close_expired_daily_runs();

  SELECT t.* INTO v_task
  FROM public.tasks t
  JOIN public.routine_periods rp ON rp.id=t.routine_period_id
  WHERE t.id=p_task_id AND rp.routine_id=p_routine_id AND t.active=true;
  IF NOT FOUND THEN RAISE EXCEPTION 'task_not_found'; END IF;

  SELECT * INTO v_run FROM public._pacus_ensure_daily_run(p_routine_id,v_today);
  IF v_run.status <> 'open' THEN RAISE EXCEPTION 'daily_run_closed'; END IF;

  SELECT * INTO v_existing
  FROM public.task_completions
  WHERE daily_run_id=v_run.id AND task_id=p_task_id
  FOR UPDATE;
  v_had_existing := FOUND;
  IF v_had_existing THEN v_old_points := COALESCE(v_existing.points_awarded,0); END IF;

  IF p_status='pending' THEN
    IF v_had_existing THEN DELETE FROM public.task_completions WHERE id=v_existing.id; END IF;
    v_new_points:=0;
    v_action:='cleared';
  ELSE
    v_new_points := CASE
      WHEN p_status='done' THEN GREATEST(v_task.points,0)
      WHEN p_status='help' THEN GREATEST(LEAST(v_task.points,1),0)
      ELSE 0
    END;

    IF v_had_existing THEN
      UPDATE public.task_completions
      SET status=p_status, points_awarded=v_new_points
      WHERE id=v_existing.id;
      v_action:='updated';
    ELSE
      INSERT INTO public.task_completions(daily_run_id,task_id,status,points_awarded)
      VALUES(v_run.id,p_task_id,p_status,v_new_points);
      v_action:='created';
    END IF;
  END IF;

  v_delta:=v_new_points-v_old_points;
  IF v_delta<>0 THEN
    INSERT INTO public.point_ledger(daily_run_id,type,amount,description)
    VALUES(v_run.id,'task',v_delta,'Tarefa: '||v_task.title||' ('||COALESCE(NULLIF(p_status,'pending'),'desmarcada')||')');
  END IF;

  UPDATE public.daily_runs dr
  SET done_count=(
        SELECT COUNT(*) FROM public.task_completions tc
        WHERE tc.daily_run_id=dr.id AND tc.status IN ('done','help')
      ),
      task_count=(
        SELECT COUNT(*) FROM public.tasks t
        JOIN public.routine_periods rp ON rp.id=t.routine_period_id
        WHERE rp.routine_id=dr.routine_id AND t.active=true
      ),
      points_earned=COALESCE((
        SELECT SUM(pl.amount) FROM public.point_ledger pl WHERE pl.daily_run_id=dr.id
      ),0),
      perfect=((
        SELECT COUNT(*) FROM public.tasks t
        JOIN public.routine_periods rp ON rp.id=t.routine_period_id
        WHERE rp.routine_id=dr.routine_id AND t.active=true
      )=(
        SELECT COUNT(*) FROM public.task_completions tc
        WHERE tc.daily_run_id=dr.id AND tc.status IN ('done','help')
      ))
  WHERE dr.id=v_run.id;

  RETURN public.child_get_runtime_state(p_routine_id,v_today)
    || jsonb_build_object(
      'ok',true,
      'action',v_action,
      'pointsAwarded',v_delta,
      'status',NULLIF(p_status,'pending')
    );
END
$function$;

CREATE OR REPLACE FUNCTION public.child_mark_task(
  p_routine_id uuid,
  p_task_id uuid,
  p_status text DEFAULT 'done'::text,
  p_date date DEFAULT public._pacus_local_date()
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.child_complete_task(p_routine_id,p_task_id,p_status,p_date)
$function$;
