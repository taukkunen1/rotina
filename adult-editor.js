(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const storage = window.RotinaStorage;
  let model = { config: {}, state: {}, revision: 0, serverUpdatedAt: null };
  let currentPeriod = 'manha';

  const defaults = {
    manha: { label: 'Manhã', time: '8:00 – 12:00', tasks: [] },
    tarde: { label: 'Tarde', time: '12:00 – 18:00', tasks: [] },
    noite: { label: 'Noite', time: '18:00 – 22:00', tasks: [] }
  };

  function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function ensureConfig() {
    const c = model.config && typeof model.config === 'object' ? model.config : {};
    c.periods = c.periods && typeof c.periods === 'object' ? c.periods : {};
    Object.entries(defaults).forEach(([key, value]) => {
      if (!c.periods[key] || typeof c.periods[key] !== 'object') c.periods[key] = structuredClone(value);
      if (!Array.isArray(c.periods[key].tasks)) c.periods[key].tasks = [];
      c.periods[key].label ||= value.label;
      c.periods[key].time ||= value.time;
    });
    if (!Array.isArray(c.badHabits)) c.badHabits = [];
    if (!Array.isArray(c.rewards)) c.rewards = [];
    if (!Array.isArray(c.schedule)) c.schedule = [];
    if (!Array.isArray(c.scheduleExceptions)) c.scheduleExceptions = [];
    c.screenDailyLimitHours = Number.isFinite(Number(c.screenDailyLimitHours)) ? Number(c.screenDailyLimitHours) : 2;
    c.pacus = c.pacus && typeof c.pacus === 'object' ? c.pacus : {};
    c.pacus.name ||= 'Pacus';
    c.pacus.species ||= 'Axolote';
    c.pacus.environment ||= { width: 100, height: 100, depth: 100 };
    c.pacus.behavior ||= { swimSpeed: 1, hideDuration: 4, hidePause: 2, explorationFrequency: 30 };
    model.config = c;
  }

  function setStatus(text) { $('editor-status').textContent = text; }
  function periodTasks(key = currentPeriod) { return model.config.periods[key].tasks; }

  function renderTaskEditor() {
    const p = model.config.periods[currentPeriod];
    $('period-title').textContent = `${p.label} · ${p.time}`;
    const host = $('task-list');
    if (!p.tasks.length) { host.innerHTML = '<div class="editor-empty">Nenhuma tarefa nesta seção.</div>'; return; }
    host.innerHTML = p.tasks.map((task, index) => `<div class="editor-task" data-index="${index}">
      <span aria-hidden="true">☰</span>
      <div class="editor-task-main"><div class="editor-task-title">${esc(task.title || 'Sem título')}</div><div class="editor-task-sub">${esc(task.subtitle || '')} · ${Number(task.points || 0)} pontos · ${task.active === false ? 'inativa' : 'ativa'}</div></div>
      <div class="editor-task-actions"><button type="button" data-action="up">↑</button><button type="button" data-action="down">↓</button><button type="button" data-action="edit">Editar</button><button type="button" data-action="delete" class="danger">Excluir</button></div>
    </div>`).join('');
  }

  function editTask(index) {
    const tasks = periodTasks();
    const old = tasks[index] || { title: '', subtitle: '', points: 0, active: true };
    const title = prompt('Título da tarefa:', old.title || '');
    if (title === null) return;
    const subtitle = prompt('Detalhe menor (opcional):', old.subtitle || '');
    if (subtitle === null) return;
    const pointsRaw = prompt('Pontos:', String(old.points ?? 0));
    if (pointsRaw === null) return;
    const points = Math.max(0, Math.round(Number(pointsRaw) || 0));
    tasks[index] = { ...old, title: title.trim() || 'Nova tarefa', subtitle: subtitle.trim(), points, active: old.active !== false };
    renderTaskEditor();
    setStatus('Alteração local. Clique em Salvar alterações para publicar.');
  }

  function addTask() {
    periodTasks().push({ title: 'Nova tarefa', subtitle: '', points: 0, active: true });
    const index = periodTasks().length - 1;
    renderTaskEditor();
    editTask(index);
  }

  function renderSettings() {
    const c = model.config;
    $('screen-limit').value = c.screenDailyLimitHours;
    $('period-label').value = c.periods[currentPeriod].label;
    $('period-time').value = c.periods[currentPeriod].time;
  }

  function renderPacus() {
    const p = model.config.pacus;
    $('pacus-name').value = p.name || 'Pacus';
    $('pacus-species').value = p.species || 'Axolote';
    $('pacus-width').value = Number(p.environment?.width ?? 100);
    $('pacus-height').value = Number(p.environment?.height ?? 100);
    $('pacus-depth').value = Number(p.environment?.depth ?? 100);
    $('pacus-swim').value = Number(p.behavior?.swimSpeed ?? 1);
    $('pacus-hide').value = Number(p.behavior?.hideDuration ?? 4);
    $('pacus-pause').value = Number(p.behavior?.hidePause ?? 2);
    $('pacus-explore').value = Number(p.behavior?.explorationFrequency ?? 30);
  }

  function renderAll() { ensureConfig(); renderTaskEditor(); renderSettings(); renderPacus(); }

  async function load() {
    setStatus('Carregando configuração…');
    model = await storage.getRemote();
    ensureConfig();
    renderAll();
    setStatus(`Servidor sincronizado · revisão ${model.revision || 0}`);
  }

  async function save() {
    ensureConfig();
    setStatus('Publicando alterações…');
    try {
      const result = await storage.saveRemote({ ...model, config: model.config });
      model.revision = Number(result.revision || model.revision || 0);
      model.serverUpdatedAt = result.serverUpdatedAt || new Date().toISOString();
      setStatus(`Alterações salvas no servidor · revisão ${model.revision}`);
    } catch (error) {
      console.error(error);
      setStatus(`Não foi possível salvar: ${error.message || 'erro desconhecido'}`);
    }
  }

  function bind() {
    document.querySelectorAll('[data-pane]').forEach(btn => btn.addEventListener('click', () => {
      document.querySelectorAll('[data-pane]').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.editor-pane').forEach(p => p.classList.toggle('active', p.id === `pane-${btn.dataset.pane}`));
    }));
    document.querySelectorAll('[data-period]').forEach(btn => btn.addEventListener('click', () => {
      currentPeriod = btn.dataset.period;
      document.querySelectorAll('[data-period]').forEach(b => b.classList.toggle('active', b === btn));
      renderTaskEditor(); renderSettings();
    }));
    $('add-task').addEventListener('click', addTask);
    $('save-editor').addEventListener('click', save);
    $('reload-editor').addEventListener('click', load);
    $('task-list').addEventListener('click', e => {
      const button = e.target.closest('button[data-action]'); if (!button) return;
      const row = button.closest('.editor-task'); const index = Number(row.dataset.index); const tasks = periodTasks(); const action = button.dataset.action;
      if (action === 'edit') editTask(index);
      if (action === 'delete' && confirm('Excluir esta tarefa?')) { tasks.splice(index, 1); renderTaskEditor(); }
      if (action === 'up' && index > 0) { [tasks[index-1], tasks[index]] = [tasks[index], tasks[index-1]]; renderTaskEditor(); }
      if (action === 'down' && index < tasks.length - 1) { [tasks[index+1], tasks[index]] = [tasks[index], tasks[index+1]]; renderTaskEditor(); }
      setStatus('Alteração local. Clique em Salvar alterações para publicar.');
    });
    $('period-label').addEventListener('input', e => { model.config.periods[currentPeriod].label = e.target.value; renderTaskEditor(); });
    $('period-time').addEventListener('input', e => { model.config.periods[currentPeriod].time = e.target.value; renderTaskEditor(); });
    $('screen-limit').addEventListener('input', e => { model.config.screenDailyLimitHours = Math.max(0, Number(e.target.value) || 0); });
    ['name','species'].forEach(k => $(`pacus-${k}`).addEventListener('input', e => { model.config.pacus[k] = e.target.value; }));
    ['width','height','depth'].forEach(k => $(`pacus-${k}`).addEventListener('input', e => { model.config.pacus.environment[k] = Math.max(1, Number(e.target.value) || 1); }));
    [['swim','swimSpeed'],['hide','hideDuration'],['pause','hidePause'],['explore','explorationFrequency']].forEach(([id,key]) => $(`pacus-${id}`).addEventListener('input', e => { model.config.pacus.behavior[key] = Math.max(0, Number(e.target.value) || 0); }));
  }

  async function start() {
    const user = await window.PacusAuth.requireAdult();
    if (!user) return;
    bind();
    await load();
  }
  document.addEventListener('DOMContentLoaded', start, { once: true });
})();
