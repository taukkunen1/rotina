(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const storage = window.RotinaStorage;
  let data = { config: {}, state: {}, revision: 0, serverUpdatedAt: null };

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function setStatus(text) { $('history-status').textContent = text; }
  function localData() {
    return { config: storage.readJSON(storage.CONFIG_KEY, {}), state: storage.readJSON(storage.STATE_KEY, {}), revision: 0, serverUpdatedAt: null };
  }
  async function loadRemote() {
    try {
      const response = await fetch(storage.DATA_ENDPOINT, { cache: 'no-store' });
      const remote = await response.json();
      if (!remote || remote.ok === false) throw new Error('Resposta inválida');
      data = {
        config: remote.config || {},
        state: remote.state || {},
        revision: remote.revision || 0,
        serverUpdatedAt: remote.serverUpdatedAt || null
      };
      storage.writeJSON(storage.CONFIG_KEY, data.config);
      storage.writeJSON(storage.STATE_KEY, data.state);
      setStatus('Sincronizado');
    } catch (error) {
      data = localData();
      setStatus('Modo local: servidor indisponível');
    }
  }
  function entries() {
    return Object.entries(data.state?.history || {}).sort((a, b) => b[0].localeCompare(a[0]));
  }
  function formatDate(date) {
    const [year, month, day] = String(date).split('-');
    return year && month && day ? `${day}/${month}/${year}` : String(date);
  }
  function render() {
    const items = entries();
    $('history-summary').textContent = `${items.length} dia(s) registrado(s)${data.revision ? ` · revisão ${data.revision}` : ''}`;
    if (!items.length) {
      $('history-list').innerHTML = '<p class="history-empty">Nenhum histórico disponível.</p>';
      return;
    }
    $('history-list').innerHTML = `<div class="history-list-full">${items.map(([date, item]) => {
      const done = Number(item.done || 0);
      const total = Number(item.total || 0);
      const points = Number(item.pointsEarnedThatDay ?? 0);
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;
      const status = item.perfect ? 'Dia perfeito' : `${percent}% concluído`;
      return `<article class="history-row">
        <div class="history-date"><strong>${esc(formatDate(date))}</strong><span>${esc(status)}</span></div>
        <div class="history-stat"><strong>${done}/${total}</strong><span>Tarefas</span></div>
        <div class="history-stat"><strong>${points}</strong><span>Pontos</span></div>
      </article>`;
    }).join('')}</div>`;
  }
  async function refresh() {
    setStatus('Atualizando…');
    await loadRemote();
    render();
  }
  async function start() {
    $('history-refresh').addEventListener('click', refresh);
    await refresh();
  }
  document.addEventListener('DOMContentLoaded', start);
})();
