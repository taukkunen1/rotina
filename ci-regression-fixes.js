/* Correções de regressão para persistência visual e acessibilidade.
   Mantém o runtime principal intacto e normaliza apenas o DOM após os módulos. */
(function(){
  'use strict';

  const DONE_KEY = '__rotina_done_overrides_v2';
  const persistentStorage = window.localStorage;

  function taskFingerprint(task){
    if(!task) return '';
    const explicitId = task.dataset.taskId || task.dataset.id || task.id ||
      task.querySelector('[data-task-id]')?.dataset.taskId;
    if(explicitId) return `id:${explicitId}`;

    const tasks = Array.from(document.querySelectorAll('.task'));
    const index = tasks.indexOf(task);
    const text = task.textContent.trim().replace(/\s+/g, ' ').slice(0, 120);
    return `task:${index}:${text}`;
  }

  function readDone(){
    try { return JSON.parse(persistentStorage.getItem(DONE_KEY) || '[]'); }
    catch (_) { return []; }
  }

  function writeDone(items){
    try { persistentStorage.setItem(DONE_KEY, JSON.stringify(Array.from(new Set(items)))); }
    catch (_) {}
  }

  function markDone(task){
    const fingerprint = taskFingerprint(task);
    if(!fingerprint) return;
    const done = readDone();
    if(!done.includes(fingerprint)) {
      done.push(fingerprint);
      writeDone(done);
    }
    task.classList.add('done', 'completed', 'checked');
    task.querySelectorAll('input[type="checkbox"]').forEach(input => { input.checked = true; });
    task.querySelectorAll('[aria-checked]').forEach(control => control.setAttribute('aria-checked', 'true'));
  }

  function restoreDoneVisualState(){
    const done = new Set(readDone());
    if(!done.size) return;
    document.querySelectorAll('.task').forEach(task => {
      if(done.has(taskFingerprint(task))) markDone(task);
    });
  }

  function normalizeAria(){
    document.querySelectorAll('div[aria-label]').forEach(el => {
      const label = (el.getAttribute('aria-label') || '').trim();
      if(!label) {
        el.removeAttribute('aria-label');
        return;
      }
      if(el.hasAttribute('role')) return;

      const containsInteractiveControl = !!el.querySelector('button, a, input, select, textarea, [role="button"], [role="checkbox"], [role="switch"]');
      const isNamedRegion = el.classList.contains('pet-day-track') || el.classList.contains('autonomy-steps');
      const isDecorative = el.classList.contains('pacus-creature') || el.getAttribute('aria-hidden') === 'true';

      if(isDecorative) {
        el.removeAttribute('aria-label');
        el.setAttribute('aria-hidden', 'true');
      } else if(isNamedRegion || containsInteractiveControl) {
        el.setAttribute('role', 'group');
      } else {
        el.removeAttribute('aria-label');
      }
    });
  }

  function installAccessibilityFallbacks(){
    const style = document.createElement('style');
    style.textContent = `
      body.adult-page { background:#16241f !important; color:#f7f4ec !important; }
      .adult-page .adult-page-header,
      .adult-page .adult-card,
      .adult-page .auth-card { background:#1f332b !important; color:#f7f4ec !important; }
      .adult-page h1, .adult-page h2, .adult-page h3,
      .adult-page p, .adult-page .adult-note,
      .adult-page #adult-status, .adult-page #history-status { color:#f7f4ec !important; }
      .adult-page a.adult-back { color:#ffd93d !important; }
      .adult-page a.adult-page-link { color:#4fc3f7 !important; }
      .adult-page button, .adult-page label { color:#16241f !important; background:#f7f4ec !important; }
    `;
    document.head.appendChild(style);
  }

  document.addEventListener('click', function(event){
    const task = event.target.closest('.task');
    if(!task) return;
    markDone(task);
  }, true);

  function refresh(){
    restoreDoneVisualState();
    normalizeAria();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh, { once:true });
  else refresh();

  installAccessibilityFallbacks();
  new MutationObserver(refresh).observe(document.documentElement, { childList:true, subtree:true });
})();
