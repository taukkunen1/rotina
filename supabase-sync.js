(() => {
  'use strict';

  let syncing = false;

  async function doSupabasePush() {
    if (syncing || !window.RotinaStorage) return;
    syncing = true;
    try {
      const result = await window.RotinaStorage.saveRemote(
        window.CONFIG || {},
        window.state || {},
        Number(window.state?.driveRevision || 0)
      );
      if (window.state) {
        window.state.driveRevision = Number(result.revision || window.state.driveRevision || 0);
        window.state.driveLastSyncISO = typeof todayISO === 'function' ? todayISO() : new Date().toISOString().slice(0,10);
        window.state.driveConflictCount = 0;
      }
    } catch (error) {
      if (error?.result?.conflict && error.result.data) {
        window.state = typeof mergeRemoteData === 'function'
          ? mergeRemoteData(error.result.data).state
          : window.state;
        if (typeof render === 'function') render();
      }
      console.warn('Sincronização Supabase:', error);
    } finally {
      syncing = false;
    }
  }

  async function pullFromSupabase() {
    if (!window.RotinaStorage) return;
    if (typeof suppressAutoPush !== 'undefined') suppressAutoPush = true;
    try {
      const remote = await window.RotinaStorage.getRemote();
      if (!remote) return;
      const localRevision = Number(window.state?.driveRevision || 0);
      if (Number(remote.revision || 0) !== localRevision || JSON.stringify(remote.config) !== JSON.stringify(window.CONFIG || {})) {
        if (typeof mergeRemoteData === 'function') {
          const merged = mergeRemoteData(remote);
          window.CONFIG = merged.config;
          window.state = merged.state;
          window.state.driveRevision = Number(remote.revision || 0);
          window.state.driveLastSyncISO = typeof todayISO === 'function' ? todayISO() : new Date().toISOString().slice(0,10);
          if (typeof saveConfig === 'function') saveConfig(window.CONFIG);
          if (typeof saveState === 'function') saveState(window.state, { remote: true });
          if (typeof render === 'function') render();
        }
      }
    } catch (error) {
      console.warn('Leitura do Supabase:', error);
    } finally {
      if (typeof suppressAutoPush !== 'undefined') suppressAutoPush = false;
    }
  }

  // Sobrescreve os pontos de entrada globais usados pelo motor antigo.
  window.doAutoPush = doSupabasePush;
  window.pullAndMergeFromDrive = pullFromSupabase;

  // Cancela o intervalo legado do Google Drive e inicia o equivalente no Supabase.
  if (typeof periodicSyncHandle !== 'undefined' && periodicSyncHandle) {
    clearInterval(periodicSyncHandle);
    periodicSyncHandle = null;
  }

  setTimeout(async () => {
    await pullFromSupabase();
    if (typeof periodicSyncHandle !== 'undefined' && !periodicSyncHandle) {
      periodicSyncHandle = setInterval(pullFromSupabase, 5 * 60 * 1000);
    }
  }, 0);
})();
