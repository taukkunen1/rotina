(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const storage = window.RotinaStorage;
  let data = { config: {}, state: {}, revision: 0, serverUpdatedAt: null };

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function setStatus(text) { $('adult-status').textContent = text; }
  function localData() {
    return { config: storage.readJSON(storage.CONFIG_KEY, {}), state: storage.readJSON(storage.STATE_KEY, {}), revision: 0, serverUpdatedAt: null };
  }
  async function loadRemote() {
    try {
      const response = await fetch(storage.DATA_ENDPOINT, { cache: 'no-store' });
      const remote = await response.json();
      if (!remote || remote.ok === false) throw new Error('Resposta inválida');
      data = { config: remote.config || {}, state: remote.state || {}, revision: remote.revision || 0, serverUpdatedAt: remote.serverUpdatedAt || null };
      storage.writeJSON(storage.CONFIG_KEY, data.config);
      storage.writeJSON(storage.STATE_KEY, data.state);
      setStatus('Sincronizado');
    } catch (error) {
      data = localData();
      setStatus('Modo local: servidor indisponível');
    }
  }
  function historyEntries() {
    return Object.entries(data.state?.history || {}).sort((a,b) => b[0].localeCompare(a[0]));
  }
  function renderToday() {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
    const item = (data.state?.history || {})[today];
    if (!item) { $('adult-today').innerHTML = '<p>Nenhum registro fechado para hoje.</p>'; return; }
    const done = Number(item.done || 0), total = Number(item.total || 0);
    $('adult-today').innerHTML = `<div class="adult-metric"><strong>${done}/${total}</strong><span>Tarefas concluídas</span></div><div class="adult-metric"><strong>${esc(item.pointsEarnedThatDay ?? 0)}</strong><span>Pontos</span></div><div class="adult-metric"><strong>${item.perfect ? 'Sim' : 'Não'}</strong><span>Dia perfeito</span></div>`;
  }
  function renderSync() {
    $('sync-info').textContent = `Revisão: ${data.revision || 'local'}\nAtualizado: ${data.serverUpdatedAt || 'não informado'}\nHistórico: ${historyEntries().length} dia(s)`;
  }
  function render() { renderToday(); renderSync(); }
  function exportBackup() {
    const blob = new Blob([JSON.stringify({ config: data.config, state: data.state, revision: data.revision, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'rotina-backup.json'; a.click(); URL.revokeObjectURL(url);
  }
  async function importBackup(file) {
    const text = await file.text();
    const imported = JSON.parse(text);
    if (!imported || typeof imported !== 'object' || !imported.state) throw new Error('Backup inválido');
    data = { config: imported.config || {}, state: imported.state || {}, revision: imported.revision || 0, serverUpdatedAt: imported.serverUpdatedAt || null };
    storage.writeJSON(storage.CONFIG_KEY, data.config); storage.writeJSON(storage.STATE_KEY, data.state);
    render(); setStatus('Backup importado localmente');
  }
  async function start() {
    $('export-backup').addEventListener('click', exportBackup);
    $('import-backup').addEventListener('change', async e => { if (!e.target.files?.[0]) return; try { await importBackup(e.target.files[0]); } catch (err) { setStatus('Erro ao importar backup'); } e.target.value=''; });
    $('refresh-remote').addEventListener('click', async () => { setStatus('Atualizando…'); await loadRemote(); render(); });
    await loadRemote(); render();
  }
  document.addEventListener('DOMContentLoaded', start);
})();
