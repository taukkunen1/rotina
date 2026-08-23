(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const storage = window.RotinaStorage;
  let data = { config: {}, state: {}, revision: 0, serverUpdatedAt: null };

  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function setStatus(text) { $('history-status').textContent = text; }

  async function loadRemote() {
    data = await storage.getRemote();
    setStatus('Sincronizado com o servidor');
  }
  function entries() { return Object.entries(data.state?.history || {}).sort((a,b) => b[0].localeCompare(a[0])); }
  function formatDate(date) {
    const [year, month, day] = String(date).split('-');
    return year && month && day ? `${day}/${month}/${year}` : String(date);
  }
  function tasksForDate(dateISO) {
    const config = data.config || {};
    const date = new Date(`${dateISO}T12:00:00`);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const source = weekend && config.periodsWeekend ? config.periodsWeekend : config.periods;
    if (!source) return [];
    return ['manha', 'tarde', 'noite'].flatMap(period => {
      const tasks = source[period]?.tasks;
      return Array.isArray(tasks) ? tasks.filter(task => task && task.id) : [];
    });
  }
  function normalizeItem(date, item) {
    const rawDone = Number(item.done || 0), rawTotal = Number(item.total || 0);
    if (!(Boolean(item.perfect) && rawDone === 1 && rawTotal === 1)) return { ...item, done: rawDone, total: rawTotal, points: Number(item.pointsEarnedThatDay ?? 0) };
    const tasks = tasksForDate(date);
    if (!tasks.length) return { ...item, done: rawDone, total: rawTotal, points: Number(item.pointsEarnedThatDay ?? 0) };
    return { ...item, done: tasks.length, total: tasks.length, points: tasks.reduce((sum, task) => sum + Number(task.pts || 0), 0), normalized: true };
  }
  function render() {
    const items = entries();
    $('history-summary').textContent = `${items.length} dia(s) registrado(s)${data.revision ? ` · revisão ${data.revision}` : ''}`;
    if (!items.length) { $('history-list').innerHTML = '<p class="history-empty">Nenhum histórico disponível.</p>'; return; }
    $('history-list').innerHTML = `<div class="history-list-full">${items.map(([date, item]) => {
      const normalized = normalizeItem(date, item || {});
      const done = Number(normalized.done || 0), total = Number(normalized.total || 0), points = Number(normalized.points || 0);
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;
      const status = normalized.perfect ? 'Dia perfeito' : `${percent}% concluído`;
      return `<article class="history-row"><div class="history-date"><strong>${esc(formatDate(date))}</strong><span>${esc(status)}</span></div><div class="history-stat"><strong>${done}/${total}</strong><span>Tarefas</span></div><div class="history-stat"><strong>${points}</strong><span>Pontos</span></div></article>`;
    }).join('')}</div>`;
  }
  async function refresh() {
    setStatus('Atualizando…');
    try { await loadRemote(); render(); }
    catch (_) { setStatus('Servidor indisponível'); $('history-list').innerHTML = '<p class="history-empty">Não foi possível carregar o histórico.</p>'; }
  }
  async function start() {
    const user = await window.PacusAuth.requireAdult();
    if (!user) return;
    $('history-refresh').addEventListener('click', refresh);
    await refresh();
  }
  document.addEventListener('DOMContentLoaded', start);
})();
