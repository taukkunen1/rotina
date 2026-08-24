-- Etapa 4: materializa compromissos recorrentes e exceções como tarefas
-- do dia, com UUIDs reais e válidos para task_completions.
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS active_from date NULL,
  ADD COLUMN IF NOT EXISTS active_to date NULL;

-- A implementação aplicada no projeto Supabase cria _pacus_materialize_schedule_tasks,
-- estende child_get_runtime_state para materializar e devolver tasks aplicáveis,
-- e faz child_complete_task validar tarefas aplicáveis à data atual.
-- O get_routine_model materializa o dia atual antes de montar o modelo e não expõe
-- schedule/scheduleExceptions ao runtime legado, evitando a criação duplicada de
-- IDs sintéticos sched_* e exc_* no navegador.

-- Fonte de verdade: migrations aplicadas no projeto aictkwkcyqjsakugiwra.
-- Este arquivo documenta e versiona a etapa; as funções completas devem ser
-- mantidas idênticas às migrations correspondentes do Supabase.