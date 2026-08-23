(() => {
  'use strict';

  const storage = window.RotinaStorage;
  if (!storage || !storage.completeTask || !storage.getRuntimeState) return;

  const synced = new Map();
  let bootstrapped = false;
  let refreshTimer = null;

  function completionMap(runtime) {
    const map = Object.create(null);
    for (const completion of runtime?.completions || []) {
      const id = String(completion.task_id || completion.taskId || '');
      if (!id) continue;
      map[id] = completion.status;
    }
    return map;
  }

  // The server is the only calendar authority. This function projects its state
  // into the legacy UI state without calculating points or dates locally.
  function applyRuntime(state, runtime) {
    if (!state || !runtime) return state;
    state.lastDate = runtime.date;
    state.checkedToday = completionMap(runtime);
    state.totalPoints = Number(runtime.balance || 0);
    state.history = runtime.history || {};
    state.dailyRun = runtime.dailyRun || null;
    return state;
  }

  async function refreshFromServer(state, save) {
    const runtime = await storage.rolloverCurrentDay();
    applyRuntime(state, runtime);
    if (save) save(state, { remote: true, serverAuthority: true });
    return runtime;
  }

  async function syncState(state, save) {
    if (!state || !state.checkedToday) return;
    // Establish today's server cycle before replaying any UI mutation.
    await refreshFromServer(state, null);
    const entries = Object.entries(state.checkedToday || {});
    for (const [taskId, status] of entries) {
      if (!['done','help','failed','skipped'].includes(status)) continue;
      const key = `${taskId}:${status}`;
      if (synced.has(key)) continue;
      try {
        const result = await storage.completeTask(taskId, status);
        synced.set(key, true);
        applyRuntime(state, result);
      } catch (error) {
        console.warn('[Pacus] server task mutation failed:', error);
      }
    }
    // Always finish with a fresh authoritative read, including duplicate calls.
    try { await refreshFromServer(state, save); } catch (error) { console.warn('[Pacus] server refresh failed:', error); }
  }

  function install() {
    if (window.__PACUS_SERVER_AUTHORITY_V2) return;
    if (typeof window.saveState !== 'function') return;
    const originalSaveState = window.saveState;
    window.__PACUS_SERVER_AUTHORITY_V2 = true;
    window.saveState = function(state, options = {}) {
      const result = originalSaveState.call(this, state, options);
      if (!options?.remote && !options?.serverAuthority) void syncState(state, originalSaveState);
      return result;
    };

    // On boot and periodically afterwards, server date wins over browser date.
    void refreshFromServer(window.STATE || window.state || null, originalSaveState).catch(error => console.warn('[Pacus] initial server cycle failed:', error));
    refreshTimer = setInterval(() => {
      const candidate = window.STATE || window.state || null;
      void refreshFromServer(candidate, originalSaveState).catch(error => console.warn('[Pacus] cycle refresh failed:', error));
    }, 60 * 1000);
    window.addEventListener('beforeunload', () => { if (refreshTimer) clearInterval(refreshTimer); }, { once: true });
  }

  function start() {
    if (bootstrapped) return;
    bootstrapped = true;
    install();
    setTimeout(install, 100);
    setTimeout(install, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();