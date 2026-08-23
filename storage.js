(() => {
  'use strict';
  const CONFIG_KEY = 'hector_rotina_config_v3';
  const STATE_KEY = 'hector_rotina_state_v3';
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0RETrtzuA3pwdXu3qB2PN611q3PRY0Tw8CUyF7AyashsCKTm3yZ93s7iGtDe8m35p/exec';
  const DATA_ENDPOINT = APPS_SCRIPT_URL + '?data=1';
  const memory = Object.create(null);

  function clone(value) { try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; } }
  function readJSON(key, fallback = null) { return Object.prototype.hasOwnProperty.call(memory, key) ? clone(memory[key]) : fallback; }
  function writeJSON(key, value) { memory[key] = clone(value); return true; }
  function remove(key) { delete memory[key]; return true; }

  async function getRemote() {
    const response = await fetch(DATA_ENDPOINT, { cache: 'no-store' });
    const remote = await response.json();
    if (!remote || remote.ok === false) throw new Error('Resposta inválida do servidor');
    writeJSON(CONFIG_KEY, remote.config || {});
    writeJSON(STATE_KEY, remote.state || {});
    return {
      config: remote.config || {}, state: remote.state || {},
      revision: Number(remote.revision || 0), serverUpdatedAt: remote.serverUpdatedAt || null,
      domains: remote.domains || {
        routineConfig: remote.config || {},
        dailyState: remote.state || {},
        pointEvents: remote.state?.pointEvents || [],
        history: remote.state?.history || {}
      }
    };
  }

  async function saveRemote(config, state, baseRevision = 0) {
    const domains = window.RotinaDataModel
      ? window.RotinaDataModel.create(config || {}, state || {})
      : { schemaVersion: 2, routineConfig: config || {}, dailyState: state || {}, pointEvents: state?.pointEvents || [], history: state?.history || {} };
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        schemaVersion: 2,
        domains: {
          routineConfig: domains.routineConfig,
          dailyState: domains.dailyState,
          pointEvents: domains.pointEvents,
          history: domains.history
        },
        config: domains.routineConfig,
        state: Object.assign({}, domains.dailyState, { history: domains.history, pointEvents: domains.pointEvents }),
        baseRevision: Number(baseRevision || 0)
      })
    });
    const result = await response.json();
    if (!result || result.ok === false) {
      const error = new Error(result?.error || (result?.conflict ? 'conflict' : 'server_error'));
      error.result = result;
      throw error;
    }
    return result;
  }

  async function replaceRemote(snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || !snapshot.state) throw new Error('Backup inválido');
    return saveRemote(snapshot.config || {}, snapshot.state || {}, Number(snapshot.revision || 0));
  }

  window.RotinaStorage = Object.freeze({ CONFIG_KEY, STATE_KEY, APPS_SCRIPT_URL, DATA_ENDPOINT, readJSON, writeJSON, remove, getRemote, saveRemote, replaceRemote });

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
