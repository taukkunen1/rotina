(() => {
  'use strict';

  const CONFIG_KEY = 'hector_rotina_config_v3';
  const STATE_KEY = 'hector_rotina_state_v3';
  const SUPABASE_URL = 'https://aictkwkcyqjsakugiwra.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_BJUaEs1EMKYDfCkg_6wnYA_7sWmgXWT';
  const ROUTINE_ID = '077cb586-35c1-49a8-b864-8d2d88f1010f';
  const memory = Object.create(null);

  function clone(value) {
    try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; }
  }

  function readJSON(key, fallback = null) {
    return Object.prototype.hasOwnProperty.call(memory, key) ? clone(memory[key]) : fallback;
  }

  function writeJSON(key, value) {
    memory[key] = clone(value);
    return true;
  }

  function remove(key) {
    delete memory[key];
    return true;
  }

  function client() {
    if (window.PacusAuth?.client) return window.PacusAuth.client();
    if (!window.supabase?.createClient) throw new Error('Cliente Supabase não carregado');
    if (!window.PacusSupabase) {
      window.PacusSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
    return window.PacusSupabase;
  }

  function normalizeConfig(config) {
    const cfg = clone(config || {});
    if (!cfg.periods) cfg.periods = {};
    if (!Array.isArray(cfg.badHabits)) cfg.badHabits = [];
    if (!Array.isArray(cfg.rewards)) cfg.rewards = [];
    if (!Array.isArray(cfg.schedule)) cfg.schedule = [];
    if (!Array.isArray(cfg.scheduleExceptions)) cfg.scheduleExceptions = [];
    if (cfg.periodsWeekend === undefined) cfg.periodsWeekend = null;
    return cfg;
  }

  function normalizeState(state) {
    const s = clone(state || {});
    if (!s.checkedToday) s.checkedToday = {};
    if (!s.history) s.history = {};
    if (!Array.isArray(s.log)) s.log = [];
    if (!Array.isArray(s.petCompletedDays)) s.petCompletedDays = [];
    if (!Array.isArray(s.petPerfectBonusDays)) s.petPerfectBonusDays = [];
    if (!s.hairByDate) s.hairByDate = {};
    if (!s.customTaskOrder) s.customTaskOrder = {};
    return s;
  }

  async function getRemote() {
    const sb = client();
    const { data, error } = await sb
      .from('routine_snapshots')
      .select('config,state,revision,updated_at')
      .eq('routine_id', ROUTINE_ID)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Snapshot da rotina não encontrado');

    const config = normalizeConfig(data.config);
    const state = normalizeState(data.state);
    writeJSON(CONFIG_KEY, config);
    writeJSON(STATE_KEY, state);

    return {
      config,
      state,
      revision: Number(data.revision || 0),
      serverUpdatedAt: data.updated_at || null,
      domains: {
        routineConfig: config,
        dailyState: state,
        pointEvents: state.pointEvents || [],
        history: state.history || {}
      }
    };
  }

  async function saveRemote(config, state, baseRevision = 0) {
    const sb = client();
    const current = await sb
      .from('routine_snapshots')
      .select('revision')
      .eq('routine_id', ROUTINE_ID)
      .maybeSingle();

    if (current.error) throw current.error;
    const serverRevision = Number(current.data?.revision || 0);
    const expectedRevision = Number(baseRevision || 0);

    if (expectedRevision && serverRevision !== expectedRevision) {
      const remote = await getRemote();
      const error = new Error('conflict');
      error.result = {
        ok: false,
        conflict: true,
        revision: remote.revision,
        data: remote
      };
      throw error;
    }

    const nextRevision = Math.max(serverRevision, expectedRevision) + 1;
    const payload = {
      routine_id: ROUTINE_ID,
      config: normalizeConfig(config),
      state: normalizeState(state),
      revision: nextRevision
    };

    const { data, error } = await sb
      .from('routine_snapshots')
      .upsert(payload, { onConflict: 'routine_id' })
      .select('revision,updated_at')
      .single();

    if (error) throw error;

    writeJSON(CONFIG_KEY, payload.config);
    writeJSON(STATE_KEY, payload.state);

    return {
      ok: true,
      revision: Number(data.revision || nextRevision),
      serverUpdatedAt: data.updated_at || new Date().toISOString()
    };
  }

  async function replaceRemote(snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || !snapshot.state) throw new Error('Backup inválido');
    return saveRemote(snapshot.config || {}, snapshot.state || {}, Number(snapshot.revision || 0));
  }

  window.RotinaStorage = Object.freeze({
    CONFIG_KEY,
    STATE_KEY,
    APPS_SCRIPT_URL: '',
    DATA_ENDPOINT: '',
    SUPABASE_URL,
    ROUTINE_ID,
    readJSON,
    writeJSON,
    remove,
    getRemote,
    saveRemote,
    replaceRemote
  });

  // Compatibilidade temporária do motor legado. Continua apenas em RAM.
  // Os dados persistentes passam exclusivamente pelo Supabase.
  const sessionOnlyStorage = Object.freeze({
    getItem(key) {
      const value = readJSON(key, null);
      return value == null ? null : JSON.stringify(value);
    },
    setItem(key, value) {
      try { memory[key] = JSON.parse(value); } catch (_) { memory[key] = value; }
    },
    removeItem(key) { remove(key); },
    clear() { Object.keys(memory).forEach(key => delete memory[key]); },
    key(index) { return Object.keys(memory)[index] ?? null; },
    get length() { return Object.keys(memory).length; }
  });

  window.__ROTINA_SESSION_STORAGE__ = sessionOnlyStorage;
})();

const localStorage = window.__ROTINA_SESSION_STORAGE__;
