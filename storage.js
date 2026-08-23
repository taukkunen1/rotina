(() => {
  'use strict';

  const CONFIG_KEY = 'rotina_config_session_v4';
  const STATE_KEY = 'rotina_state_session_v4';
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
    const client = authClient();
    const session = client ? await client.auth.getSession().catch(() => ({ data: { session: null } })) : { data: { session: null } };
    const token = session?.data?.session?.access_token || SUPABASE_PUBLISHABLE_KEY;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${token}`,
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

  function normalizeModel(data) {
    if (!data || typeof data !== 'object') throw new Error('Modelo inválido do Supabase');
    const config = data.config || {};
    const state = data.state || {};
    writeJSON(CONFIG_KEY, config);
    writeJSON(STATE_KEY, state);
    return {
      config,
      state,
      revision: Number(data.revision || 0),
      serverUpdatedAt: data.serverUpdatedAt || null,
      domains: window.RotinaDataModel
        ? window.RotinaDataModel.create(config, state)
        : { routineConfig: config, dailyState: state, pointEvents: [], history: {} }
    };
  }

  async function getRemote() {
    return normalizeModel(await rpc('get_routine_model', { p_routine_id: ROUTINE_ID }));
  }

  async function getRuntimeState(date = null) {
    const data = await rpc('child_get_runtime_state', {
      p_routine_id: ROUTINE_ID,
      ...(date ? { p_date: date } : {})
    });
    if (!data || typeof data !== 'object') throw new Error('Estado diário inválido do servidor');
    return data;
  }

  async function completeTask(taskId, status = 'done', date = null) {
    return rpc('child_complete_task', {
      p_routine_id: ROUTINE_ID,
      p_task_id: taskId,
      p_status: status,
      ...(date ? { p_date: date } : {})
    });
  }

  async function saveRemote(config, state) {
    const adult = window.PacusAuth?.hasAdultAccess
      ? await window.PacusAuth.hasAdultAccess().catch(() => false)
      : false;
    const data = adult
      ? await rpc('save_routine_model', { p_routine_id: ROUTINE_ID, p_config: config || {}, p_state: state || {} })
      : await rpc('save_child_ui_state', { p_routine_id: ROUTINE_ID, p_state: state || {} });
    return normalizeModel(data);
  }

  async function replaceRemote(snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || !snapshot.state) throw new Error('Backup inválido');
    const adult = window.PacusAuth?.hasAdultAccess
      ? await window.PacusAuth.hasAdultAccess().catch(() => false)
      : false;
    if (!adult) throw new Error('Autenticação adulta necessária para restaurar backup');
    return normalizeModel(await rpc('save_routine_model', {
      p_routine_id: ROUTINE_ID,
      p_config: snapshot.config || {},
      p_state: snapshot.state || {}
    }));
  }

  window.RotinaStorage = Object.freeze({
    CONFIG_KEY, STATE_KEY, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, ROUTINE_ID,
    readJSON, writeJSON, remove, getRemote, getRuntimeState, completeTask,
    saveRemote, replaceRemote
  });

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