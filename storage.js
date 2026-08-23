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
  function writeJSON(key, value) { memory[key] = clone(value); return true; }
  function remove(key) { delete memory[key]; return true; }

  function authClient() {
    try { return window.PacusAuth?.client?.() || null; } catch (_) { return null; }
  }

  async function rpcRest(name, body) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || data?.hint || `Supabase RPC ${name} falhou (${response.status})`);
    return data;
  }

  async function rpc(name, body) {
    const client = authClient();
    if (client) {
      const { data, error } = await client.rpc(name, body);
      if (error) throw error;
      return data;
    }
    return rpcRest(name, body);
  }

  async function getRemote() {
    const data = await rpc('get_routine_snapshot', { p_routine_id: ROUTINE_ID });
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

    return rpc('save_routine_snapshot', {
      p_routine_id: ROUTINE_ID,
      p_config: domains.routineConfig || {},
      p_state: Object.assign({}, domains.dailyState || {}, {
        history: domains.history || {},
        pointEvents: domains.pointEvents || []
      }),
      p_base_revision: Number(baseRevision || 0)
    });
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
