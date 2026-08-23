const PACUS_SUPABASE_URL = 'https://aictkwkcyqjsakugiwra.supabase.co';
const PACUS_SUPABASE_ROUTINE_ID = '077cb586-35c1-49a8-b864-8d2d88f1010f';

/*
 * One-time migration from the existing Drive JSON model to PostgreSQL.
 * Set these Script Properties before running migrateDriveModelToSupabase:
 *   SUPABASE_SERVICE_ROLE_KEY = <service role key>
 * The key is never stored in GitHub or in the frontend.
 */
function supabaseRequest_(path, method, payload) {
  const key = PropertiesService.getScriptProperties().getProperty('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) throw new Error('Missing Script Property: SUPABASE_SERVICE_ROLE_KEY');
  const options = {
    method: method || 'get',
    muteHttpExceptions: true,
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=representation' }
  };
  if (payload !== undefined) options.payload = JSON.stringify(payload);
  const response = UrlFetchApp.fetch(PACUS_SUPABASE_URL + '/rest/v1/' + path, options);
  const code = response.getResponseCode();
  const text = response.getContentText();
  if (code < 200 || code >= 300) throw new Error('Supabase ' + code + ': ' + text.slice(0, 1000));
  return text ? JSON.parse(text) : [];
}

function supabaseUpsert_(table, rows, onConflict) {
  if (!rows.length) return [];
  const query = onConflict ? '?on_conflict=' + encodeURIComponent(onConflict) : '';
  const key = PropertiesService.getScriptProperties().getProperty('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) throw new Error('Missing Script Property: SUPABASE_SERVICE_ROLE_KEY');
  const response = UrlFetchApp.fetch(PACUS_SUPABASE_URL + '/rest/v1/' + table + query, {
    method: 'post', muteHttpExceptions: true,
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
    payload: JSON.stringify(rows)
  });
  const code = response.getResponseCode(), text = response.getContentText();
  if (code < 200 || code >= 300) throw new Error('Supabase ' + code + ': ' + text.slice(0, 1000));
  return text ? JSON.parse(text) : [];
}

function migrateDriveModelToSupabase() {
  const file = findDataFile();
  const model = modelFromLegacy(readJson(file));
  const cfg = model.routineConfig || {};
  const state = model.dailyState || {};
  const history = model.history || {};

  supabaseUpsert_('routines', [{ id: PACUS_SUPABASE_ROUTINE_ID, name: 'Rotina do Pacus', timezone: TIMEZONE, active: true }], 'id');

  const periods = [];
  const periodSource = cfg.periods || {};
  ['manha','tarde','noite'].forEach((key, position) => {
    const p = periodSource[key] || {};
    periods.push({ id: deterministicUuid_('period:' + key + ':weekday'), routine_id: PACUS_SUPABASE_ROUTINE_ID, key, label: p.label || key, start_time: normalizeTime_(p.startTime || p.start || null), end_time: normalizeTime_(p.endTime || p.end || null), weekend: false, position });
  });
  if (cfg.periodsWeekend) ['manha','tarde','noite'].forEach((key, position) => {
    const p = cfg.periodsWeekend[key] || {};
    periods.push({ id: deterministicUuid_('period:' + key + ':weekend'), routine_id: PACUS_SUPABASE_ROUTINE_ID, key, label: p.label || key, start_time: normalizeTime_(p.startTime || p.start || null), end_time: normalizeTime_(p.endTime || p.end || null), weekend: true, position });
  });
  supabaseUpsert_('routine_periods', periods, 'routine_id,key,weekend');

  const remotePeriods = supabaseRequest_('routine_periods?routine_id=eq.' + PACUS_SUPABASE_ROUTINE_ID + '&select=id,key,weekend');
  const periodMap = {};
  remotePeriods.forEach(p => periodMap[p.key + ':' + !!p.weekend] = p.id);

  const tasks = [];
  ['manha','tarde','noite'].forEach(key => {
    const list = Array.isArray(periodSource[key] && periodSource[key].tasks) ? periodSource[key].tasks : [];
    list.forEach((task, position) => tasks.push(taskRow_(task, periodMap[key + ':false'], position)));
  });
  if (cfg.periodsWeekend) ['manha','tarde','noite'].forEach(key => {
    const list = Array.isArray(cfg.periodsWeekend[key] && cfg.periodsWeekend[key].tasks) ? cfg.periodsWeekend[key].tasks : [];
    list.forEach((task, position) => tasks.push(taskRow_(task, periodMap[key + ':true'], position)));
  });
  supabaseUpsert_('tasks', tasks, 'id');

  const schedule = Array.isArray(cfg.schedule) ? cfg.schedule : [];
  supabaseUpsert_('recurring_schedule', schedule.map((item, i) => ({ id: deterministicUuid_('schedule:' + i + ':' + JSON.stringify(item)), routine_id: PACUS_SUPABASE_ROUTINE_ID, label: String(item.label || item.title || 'Compromisso'), days_of_week: Array.isArray(item.days) ? item.days.map(Number) : [], start_time: normalizeTime_(item.startTime || item.time || null), end_time: normalizeTime_(item.endTime || null), period_key: item.period || null, points: Number(item.pts || item.points || 0), active: item.active !== false })), 'id');

  const rewards = Array.isArray(cfg.rewards) ? cfg.rewards : [];
  supabaseUpsert_('rewards', rewards.map((r, i) => ({ id: deterministicUuid_('reward:' + i + ':' + JSON.stringify(r)), routine_id: PACUS_SUPABASE_ROUTINE_ID, title: String(r.name || r.title || 'Recompensa'), cost: Number(r.cost || r.price || 0), grants_hours: r.hours == null ? null : Number(r.hours), max_per_day: r.maxPerDay == null ? null : Number(r.maxPerDay), active: r.active !== false, position: i })), 'id');

  const pet = cfg.pet || state.pet || {};
  supabaseUpsert_('pet_state', [{ routine_id: PACUS_SUPABASE_ROUTINE_ID, name: String(pet.name || 'Pacus'), growth_start_date: normalizeDate_(pet.growthStart || pet.growthStartDate), growth_end_date: normalizeDate_(pet.growthEnd || pet.growthEndDate), max_stage_ever_reached: Number(pet.maxStageEverReached || pet.stage || 0) }], 'routine_id');

  const dates = Object.keys(history);
  const dailyRows = dates.map(date => {
    const h = history[date] || {};
    return { id: deterministicUuid_('daily:' + date), routine_id: PACUS_SUPABASE_ROUTINE_ID, date, status: 'closed', closed_at: h.autoClosedAt || null, done_count: Number(h.done || 0), task_count: Number(h.total || 0), points_earned: Number(h.pointsEarnedThatDay || 0), perfect: !!h.perfect, screen_minutes: Number(h.screenMinutes || 0) };
  });
  supabaseUpsert_('daily_runs', dailyRows, 'id');

  const events = Array.isArray(model.pointEvents) ? model.pointEvents : [];
  supabaseUpsert_('point_ledger', events.map((e, i) => ({ id: deterministicUuid_('event:' + i + ':' + JSON.stringify(e)), daily_run_id: e.date ? deterministicUuid_('daily:' + e.date) : null, type: ['task','reward','manual_adjustment','bonus','penalty'].indexOf(e.type) >= 0 ? e.type : 'manual_adjustment', amount: Number(e.amount || 0), description: String(e.description || e.type || 'Migração'), balance_after: e.balanceAfter == null ? null : Number(e.balanceAfter), created_at: e.createdAt || new Date().toISOString() })), 'id');

  return { ok: true, routineId: PACUS_SUPABASE_ROUTINE_ID, migrated: { periods: periods.length, tasks: tasks.length, schedule: schedule.length, rewards: rewards.length, historyDays: dailyRows.length, pointEvents: events.length } };
}

function taskRow_(task, periodId, position) {
  const id = String(task && task.id || deterministicUuid_('task:' + periodId + ':' + position + ':' + JSON.stringify(task || {})));
  return { id: isUuid_(id) ? id : deterministicUuid_('task:' + id), routine_period_id: periodId, title: String(task && (task.title || task.name) || 'Tarefa'), subtitle: task && task.subtitle ? String(task.subtitle) : null, points: Number(task && (task.pts || task.points) || 0), tier: task && task.tier ? String(task.tier) : null, external: !!(task && task.external), full_penalty: !!(task && (task.fullPenalty || task.full_penalty)), active: task && task.active !== false, position };
}
function normalizeTime_(value) { if (!value) return null; const s = String(value).trim(); const m = s.match(/(\d{1,2}):(\d{2})/); return m ? String(Math.min(23, Number(m[1]))).padStart(2,'0') + ':' + m[2] + ':00' : null; }
function normalizeDate_(value) { if (!value) return null; const s = String(value).slice(0,10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null; }
function isUuid_(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
function deterministicUuid_(value) { const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, String(value), Utilities.Charset.UTF_8); const hex = digest.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2,'0')).join(''); return hex.slice(0,8)+'-'+hex.slice(8,12)+'-4'+hex.slice(13,16)+'-8'+hex.slice(17,20)+'-'+hex.slice(20,32); }
