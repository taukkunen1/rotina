# Arquitetura de dados da Rotina do Pacus

## Objetivo

A aplicação não deve depender de armazenamento persistente no navegador. A fonte de verdade é o servidor. Atualmente o servidor é o Google Apps Script + Google Drive; a interface já está isolada atrás de `RotinaStorage` para permitir trocar esse backend por um banco de dados real sem reescrever as telas.

## Fonte de verdade

Fluxo atual:

`index.html / adultos.html / historico.html`
→ `storage.js`
→ `Apps Script /exec`
→ `rotina-backup.json` no Drive

O navegador mantém somente dados temporários em RAM durante a sessão. Fechar ou recarregar a página elimina esse cache.

## Modelo futuro recomendado

### routines

- `id` UUID
- `name`
- `timezone` (`America/Sao_Paulo`)
- `active`
- `created_at`
- `updated_at`

### routine_periods

- `id` UUID
- `routine_id`
- `key` (`manha`, `tarde`, `noite`)
- `label`
- `start_time`
- `end_time`
- `weekend`
- `position`

### tasks

- `id` UUID
- `routine_period_id`
- `title`
- `subtitle`
- `points`
- `tier`
- `external`
- `full_penalty`
- `active`
- `position`
- `created_at`
- `updated_at`

### recurring_schedule

- `id` UUID
- `routine_id`
- `label`
- `days_of_week`
- `start_time`
- `end_time`
- `period_key`
- `points`
- `active`

### schedule_exceptions

- `id` UUID
- `routine_id`
- `date`
- `label`
- `period_key`
- `start_time`
- `end_time`
- `points`

### daily_runs

Uma linha por dia, criada quando o dia começa ou quando a primeira interação daquele dia ocorre.

- `id` UUID
- `routine_id`
- `date`
- `status`
- `started_at`
- `closed_at`
- `done_count`
- `task_count`
- `points_earned`
- `perfect`
- `screen_minutes`

Restrição: `UNIQUE(routine_id, date)`.

### task_completions

- `id` UUID
- `daily_run_id`
- `task_id`
- `status` (`done`, `help`, `skipped`, `failed`)
- `points_awarded`
- `completed_at`

Restrição: `UNIQUE(daily_run_id, task_id)`.

### point_ledger

Não guardar somente o saldo. Registrar cada alteração.

- `id` UUID
- `daily_run_id` nullable
- `type` (`task`, `reward`, `manual_adjustment`, `bonus`, `penalty`)
- `amount`
- `description`
- `created_at`

O saldo é a soma do ledger. Isso evita perder a explicação de onde os pontos vieram, fenômeno que bancos de dados adoram transformar em incidente de produção.

### rewards

- `id` UUID
- `routine_id`
- `title`
- `cost`
- `grants_hours`
- `max_per_day`
- `active`

### reward_redemptions

- `id` UUID
- `reward_id`
- `daily_run_id`
- `cost`
- `created_at`

### pet_state

- `routine_id`
- `name`
- `growth_start_date`
- `growth_end_date`
- `max_stage_ever_reached`
- `updated_at`

O estágio do Pacus deve ser derivado do histórico sempre que possível. O valor máximo persistido serve apenas para preservar a regra de não regressão.

## Regras de ciclo diário

- O calendário usa `America/Sao_Paulo`.
- O novo dia começa às `00:00`.
- A rotina pode existir no estado do dia antes do início da manhã.
- A rotina da manhã do Pacus começa às `08:00`.
- O fechamento automático deve ser executado no servidor, não pelo navegador.
- O navegador pode ficar fechado e o histórico ainda deve ser fechado corretamente.

## Concorrência

Toda gravação deve carregar `baseRevision`. O servidor rejeita uma gravação baseada em revisão antiga com `conflict=true`. O cliente então recarrega os dados e resolve o conflito antes de tentar novamente.

## Migração para banco

O Apps Script deve permanecer como API de compatibilidade durante a migração. O contrato HTTP deve continuar aceitando:

`GET /exec?data=1`

Retorno:

```json
{
  "ok": true,
  "revision": 12,
  "config": {},
  "state": {},
  "serverUpdatedAt": "2026-08-22T..."
}
```

E:

`POST /exec`

```json
{
  "config": {},
  "state": {},
  "baseRevision": 12
}
```

O futuro backend SQL pode implementar exatamente esse contrato. Depois disso, somente a implementação de `RotinaStorage` precisa mudar.

## Próxima etapa técnica

1. Separar configuração de rotina e estado diário no backend.
2. Criar IDs estáveis para rotina, tarefas e usuários.
3. Transformar conclusão de tarefa em eventos/ledger.
4. Mover fechamento diário definitivamente para o backend.
5. Criar autenticação para a Área dos Adultos.
6. Substituir o JSON no Drive por PostgreSQL/Supabase.
7. Remover o adaptador de compatibilidade do `app.js` e fazer o motor consumir `RotinaStorage` diretamente.
