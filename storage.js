(() => {
  'use strict';

  const CONFIG_KEY = 'hector_rotina_config_v3';
  const STATE_KEY = 'hector_rotina_state_v3';
  const SUPABASE_URL = 'https://aictkwkcyqjsakugiwra.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_BJUaEs1EMKYDfCkg_6wnYA_7sWmgXWT';
  const ROUTINE_ID = '077cb586-35c1-49a8-b864-8d2d88f1010f';
  const memory = Object.create(null);
  let supabaseClient = null;

  function clone(value) {
    try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; }
  }
  function readJSON(key, fallback = null) {
    return Object.prototype.hasOwnProperty.call(memory, key) ? clone(memory[key]) : fallback;
  }
  function writeJSON(key, value) { memory[key] = clone(value); return true; }
  function remove(key) { delete memory[key]; return true; }

  function client() {
    if (supabaseClient) return supabaseClient;
    if (!window.supabase?.createClient) throw new Error('Cliente Supabase não carregado');
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    return supabaseClient;
  }

  async function getRemote() {
    const { data, error } = await client().rpc('get_routine_snapshot', { p_routine_id: ROUTINE_ID });
    if (error) throw error;
    if (!data || typeof data !== 'object') throw new Error('Snapshot inválido do Supabase');

    const config = data.config || {};
    const state = data.state || {};
    writeJSON(CONFIG_KEY, config);
    writeJSON(STATE_KEY, state);
    return {
      config,
      state,
      revision: Number(data.revision || 0),
      serverUpdatedAt: data.serverUpdatedAt || null,
      domains: data.domains || {
        routineConfig: config,
        dailyState: state,
        pointEvents: state.pointEvents || [],
        history: state.history || {}
      }
    };
  }

  async function saveRemote(config, state, baseRevision = 0) {
    const domains = window.RotinaDataModel
      ? window.RotinaDataModel.create(config || {}, state || {})
      : { schemaVersion: 2, routineConfig: config || {}, dailyState: state || {}, pointEvents: state?.pointEvents || [], history: state?.history || {} };

    const { data, error } = await client().rpc('save_routine_snapshot', {
      p_routine_id: ROUTINE_ID,
      p_config: domains.routineConfig || {},
      p_state: Object.assign({}, domains.dailyState || {}, {
        history: domains.history || {},
        pointEvents: domains.pointEvents || []
      }),
      p_base_revision: Number(baseRevision || 0)
    });
    if (error) throw error;
    if (!data || data.ok === false) {
      const err = new Error(data?.error || (data?.conflict ? 'conflict' : 'server_error'));
      err.result = data;
      throw err;
    }
    return data;
  }

  async function replaceRemote(snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || !snapshot.state) throw new Error('Backup inválido');
    return saveRemote(snapshot.config || {}, snapshot.state || {}, Number(snapshot.revision || 0));
  }

  window.RotinaStorage = Object.freeze({
    CONFIG_KEY,
    STATE_KEY,
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    ROUTINE_ID,
    readJSON,
    writeJSON,
    remove,
    getRemote,
    saveRemote,
    replaceRemote
  });

  // Compatibilidade temporária do motor legado. É somente RAM.
  const sessionOnlyStorage = Object.freeze({
    getItem(key) { const value = readJSON(key, null); return value == null ? null : JSON.stringify(value); },
    setItem(key, value) { try { memory[key] = JSON.parse(value); } catch (_) { memory[key] = value; } },
    removeItem(key) { remove(key); },
    clear() { Object.keys(memory).forEach(key => delete memory[key]); },
    key(index) { return Object.keys(memory)[index] ?? null; },
    get length() { return Object.keys(memory).length; }
  });
  window.__ROTINA_SESSION_STORAGE__ = sessionOnlyStorage;
})();

const localStorage = window.__ROTINA_SESSION_STORAGE__;
