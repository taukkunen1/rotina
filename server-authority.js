(() => {
  'use strict';

  const storage = window.RotinaStorage;
  if (!storage || !storage.completeTask) return;

  const synced = new Map();
  let bootstrapped = false;

  function currentDate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  async function syncState(state) {
    if (!state || !state.checkedToday) return;
    const date = state.lastDate || currentDate();
    const entries = Object.entries(state.checkedToday);
    for (const [taskId, status] of entries) {
      if (!['done','help','failed','skipped'].includes(status)) continue;
      const key = `${date}:${taskId}`;
      if (synced.has(key) && synced.get(key) === status) continue;
      try {
        const result = await storage.completeTask(taskId, status, date);
        synced.set(key, status);
        if (result?.balance != null) state.totalPoints = Number(result.balance) || 0;
        if (result?.history) state.history = result.history;
      } catch (error) {
        console.warn('[Pacus] server sync failed:', error);
      }
    }
  }

  function install() {
    if (window.__PACUS_SERVER_AUTHORITY_V1) return;
    if (typeof window.saveState !== 'function') return;
    const originalSaveState = window.saveState;
    window.__PACUS_SERVER_AUTHORITY_V1 = true;
    window.saveState = function(state, options = {}) {
      const result = originalSaveState.call(this, state, options);
      if (!options?.remote) void syncState(state);
      return result;
    };
  }

  function start() {
    install();
    if (bootstrapped) return;
    bootstrapped = true;
    setTimeout(install, 100);
    setTimeout(install, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
