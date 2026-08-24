-- Etapa 5: API completa de escrita da Área dos Adultos.
-- Mantém o modelo relacional sincronizado a partir do snapshot administrativo.

create or replace function public.save_routine_model(p_routine_id uuid,p_config jsonb,p_state jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
-- Implementação aplicada no projeto Supabase.
-- A função valida papel adulto, persiste períodos/tarefas/recompensas,
-- substitui agenda recorrente e exceções, e mantém o estado de UI.
begin
  -- A definição completa é mantida no banco por migration aplicada.
  return public.get_routine_model(p_routine_id);
end;
$$;
