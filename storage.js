(() => {
  'use strict';

  const CONFIG_KEY = 'hector_rotina_config_v3';
  const STATE_KEY = 'hector_rotina_state_v3';
  const SUPABASE_URL = 'https://aictkwkcyqjsakugiwra.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_BJUaEs1EMKYDfCkg_6wnYA_7sWmgXWT';
  const ROUTINE_ID = '077cb586-35c1-49a8-b864-8d2d88f1010f';
  const LEGACY_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0RETrtzuA3pwdXu3qB2PN611q3PRY0Tw8CUyF7AyashsCKTm3yZ93s7iGtDe8m35p/exec';
  const memory = Object.create(null);

  const DOW_TO_PT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

  const PET_STAGES = [
    { key: 'ovo', label: 'Ovo intacto' }, { key: 'ovo1', label: 'Primeira rachadura' },
    { key: 'ovo2', label: 'Rachadura inicial' }, { key: 'ovo3', label: 'Rachando' },
    { key: 'ovo4', label: 'Mais rachaduras' }, { key: 'ovo5', label: 'Casca cedendo' },
    { key: 'ovo6', label: 'Quase abrindo' }, { key: 'ovo7', label: 'Casca bem rachada' },
    { key: 'ovo8', label: 'Pronto para nascer' }, { key: 'hatch1', label: 'Começando a eclodir' },
    { key: 'hatch2', label: 'Cabeça aparecendo' }, { key: 'hatch3', label: 'Saindo da casca' },
    { key: 'hatch4', label: 'Recém-nascido' }, { key: 'hatch5', label: 'Primeiros movimentos' },
    { key: 'baby1', label: 'Bebê Pacus' }, { key: 'baby2', label: 'Bebê crescendo' },
    { key: 'baby3', label: 'Filhote' }, { key: 'baby4', label: 'Filhote forte' },
    { key: 'baby5', label: 'Jovem' }, { key: 'young1', label: 'Jovem crescendo' },
    { key: 'young2', label: 'Quase adulto' }, { key: 'young3', label: 'Quase pronto' },
    { key: 'young4', label: 'Última fase' }, { key: 'adulto', label: 'Pacus adulto' }
  ];

  function clone(value) { try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; } }
  function readJSON(key, fallback = null) { return Object.prototype.hasOwnProperty.call(memory, key) ? clone(memory[key]) : fallback; }
  function writeJSON(key, value) { memory[key] = clone(value); return true; }
  function remove(key) { delete memory[key]; return true; }
  function todayISO() { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function hhmm(t) { return t ? String(t).slice(0, 5) : null; }

  function client() {
    if (!window.supabase?.createClient) throw new Error('Cliente Supabase não carregado');
    if (!window.PacusSupabase) {
      window.PacusSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
      });
    }
    return window.PacusSupabase;
  }

  async function ensureSession() {
    const { data, error } = await client().auth.getSession();
    if (error) throw error;
    if (data.session) return data.session;
    const { data: anon, error: anonError } = await client().auth.signInAnonymously();
    if (anonError) throw anonError;
    return anon.session;
  }

  async function accessToken() {
    try { const session = await ensureSession(); return session?.access_token || null; }
    catch (_) { return null; }
  }

  async function request(path, options = {}) {
    const token = await accessToken();
    if (!token) throw new Error('Sessão não encontrada');
    const headers = new Headers(options.headers || {});
    headers.set('apikey', SUPABASE_PUBLISHABLE_KEY);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers, cache: 'no-store' });
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch (_) { body = text; }
    if (!response.ok) {
      const message = body?.message || body?.error_description || body?.hint || body?.details || `Supabase HTTP ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.body = body;
      throw error;
    }
    return body;
  }

  async function loadConfig() {
    const [periods, tasks, rewards, settingsRows, petRows, schedule, exceptions] = await Promise.all([
      request(`routine_periods?routine_id=eq.${ROUTINE_ID}&order=position.asc`),
      request(`tasks?active=eq.true&order=position.asc&select=*,routine_periods!inner(routine_id,key)&routine_periods.routine_id=eq.${ROUTINE_ID}`),
      request(`rewards?routine_id=eq.${ROUTINE_ID}&active=eq.true&order=position.asc`),
      request(`routine_settings?routine_id=eq.${ROUTINE_ID}&limit=1`),
      request(`pet_state?routine_id=eq.${ROUTINE_ID}&limit=1`),
      request(`recurring_schedule?routine_id=eq.${ROUTINE_ID}&active=eq.true`),
      request(`schedule_exceptions?routine_id=eq.${ROUTINE_ID}`)
    ]);

    const periodsByKey = {};
    (periods || []).filter(p => p.key !== 'outros').forEach(p => {
      periodsByKey[p.key] = { label: p.label, time: `${hhmm(p.start_time)} – ${hhmm(p.end_time)}`, tasks: [] };
    });
    (tasks || []).forEach(t => {
      const key = t.routine_periods?.key;
      if (!key || !periodsByKey[key]) return;
      const entry = { id: t.id, txt: t.title, pts: t.points };
      if (t.subtitle) entry.sub = t.subtitle;
      if (t.tier) entry.tier = t.tier;
      if (t.external) entry.external = true;
      if (t.full_penalty) entry.fullPenalty = true;
      periodsByKey[key].tasks.push(entry);
    });

    const settings = settingsRows?.[0] || {};
    const pet = petRows?.[0] || {};

    return {
      periods: periodsByKey,
      periodsWeekend: null,
      badHabits: [],
      rewards: (rewards || []).map(r => {
        const entry = { id: r.id, txt: r.title, cost: r.cost };
        if (r.grants_hours != null) entry.grantsHours = Number(r.grants_hours);
        if (r.max_per_day != null) entry.maxPerDay = r.max_per_day;
        return entry;
      }),
      screenDailyLimitHours: settings.screen_daily_limit_hours ?? 2,
      perfectDayBonusMinutes: settings.perfect_day_bonus_minutes ?? 30,
      historyStartDate: settings.history_start_date || null,
      schedule: (schedule || []).map(s => ({
        id: s.id, label: s.label,
        days: (s.days_of_week || []).map(n => DOW_TO_PT[n]).filter(Boolean),
        start: hhmm(s.start_time), end: hhmm(s.end_time), period: s.period_key, pts: s.points
      })),
      scheduleExceptions: (exceptions || []).map(e => ({
        id: e.id, date: e.date, label: e.label, period: e.period_key, pts: e.points,
        start: hhmm(e.start_time), end: hhmm(e.end_time)
      })),
      pet: {
        name: pet.name || 'Pacus',
        growthStartDate: pet.growth_start_date || null,
        growthEndDate: pet.growth_end_date || null,
        stages: PET_STAGES
      }
    };
  }

  async function loadState() {
    const today = todayISO();
    const [todayRun, allRuns, ledgerRows, uiRows, redemptionRows] = await Promise.all([
      request(`daily_runs?routine_id=eq.${ROUTINE_ID}&date=eq.${today}&limit=1`),
      request(`daily_runs?routine_id=eq.${ROUTINE_ID}&order=date.asc`),
      request(`point_ledger?order=created_at.desc&limit=1`),
      request(`daily_ui_state?routine_id=eq.${ROUTINE_ID}&order=date.desc&limit=1`),
      request(`reward_redemptions?select=reward_id`)
    ]);

    const run = todayRun?.[0] || null;
    const checkedToday = {};
    if (run) {
      const completions = await request(`task_completions?daily_run_id=eq.${run.id}`);
      (completions || []).forEach(c => { checkedToday[c.task_id] = c.status; });
    }

    const history = {};
    (allRuns || []).forEach(r => {
      history[r.date] = { doneCount: r.done_count, taskCount: r.task_count, points: r.points_earned, perfect: r.perfect, screenMinutes: r.screen_minutes };
    });

    const ui = uiRows?.[0] || {};
    const lifetimeRedemptions = {};
    (redemptionRows || []).forEach(r => { lifetimeRedemptions[r.reward_id] = (lifetimeRedemptions[r.reward_id] || 0) + 1; });

    return {
      lastDate: today,
      checkedToday,
      customTaskOrder: {},
      totalPoints: ledgerRows?.[0]?.balance_after ?? 0,
      log: [],
      history,
      hairByDate: {},
      petCompletedDays: ui.pet_completed_days || [],
      petPerfectBonusDays: ui.pet_perfect_bonus_days || [],
      lastSeenPetStage: ui.last_seen_pet_stage ?? 0,
      petLastCompletionISO: ui.pet_last_completion_at ? ui.pet_last_completion_at.slice(0, 10) : null,
      petMaxDaysEquivalentEverSeen: 0,
      gameTimer: {
        date: today,
        usedSeconds: ui.game_used_seconds || 0,
        runningSince: ui.game_running_since || null,
        bonusSeconds: ui.game_bonus_seconds || 0,
        redemptions: ui.reward_redemptions || {}
      },
      lifetimeRedemptions
    };
  }

  async function getRemote() {
    const [config, state] = await Promise.all([loadConfig(), loadState()]);
    writeJSON(CONFIG_KEY, config);
    writeJSON(STATE_KEY, state);
    return {
      config, state, revision: 0, serverUpdatedAt: new Date().toISOString(),
      domains: { routineConfig: config, dailyState: state, pointEvents: [], history: state.history || {} }
    };
  }

  async function saveRemote() {
    throw new Error('Gravação ainda não implementada — só leitura por enquanto (fase de teste)');
  }

  async function replaceRemote(snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || !snapshot.state) throw new Error('Backup inválido');
    return saveRemote();
  }

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async function(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (!url.startsWith(LEGACY_APPS_SCRIPT_URL)) return nativeFetch(input, init);
    try {
      const method = (init.method || (typeof input !== 'string' && input?.method) || 'GET').toUpperCase();
      if (method === 'GET') {
        const remote = await getRemote();
        return new Response(JSON.stringify({ ok: true, ...remote }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      const result = await saveRemote();
      return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      const result = error?.result || { ok: false, error: error?.message || 'storage_error' };
      return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  };

  window.RotinaStorage = Object.freeze({
    CONFIG_KEY, STATE_KEY, APPS_SCRIPT_URL: '', DATA_ENDPOINT: '', SUPABASE_URL, ROUTINE_ID,
    readJSON, writeJSON, remove, getRemote, saveRemote, replaceRemote
  });

  const realBrowserStorage = window.localStorage;
  const sessionOnlyStorage = Object.freeze({
    getItem(key) { const value = readJSON(key, null); if (value != null) return JSON.stringify(value); try { return realBrowserStorage.getItem(key); } catch (_) { return null; } },
    setItem(key, value) { try { memory[key] = JSON.parse(value); } catch (_) { memory[key] = value; } try { realBrowserStorage.setItem(key, value); } catch (_) {} },
    removeItem(key) { remove(key); try { realBrowserStorage.removeItem(key); } catch (_) {} },
    clear() { Object.keys(memory).forEach(key => delete memory[key]); try { realBrowserStorage.clear(); } catch (_) {} },
    key(index) { return Object.keys(memory)[index] ?? null; },
    get length() { return Object.keys(memory).length; }
  });
  window.__ROTINA_SESSION_STORAGE__ = sessionOnlyStorage;
})();

const localStorage = window.__ROTINA_SESSION_STORAGE__;
