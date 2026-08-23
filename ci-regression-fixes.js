/* Correções de regressão para persistência visual e acessibilidade.
   Mantém o runtime principal intacto e normaliza apenas o DOM após os módulos. */
(function(){
  'use strict';

  const DONE_KEY = '__rotina_done_overrides_v1';

  function taskFingerprint(task){
    if(!task) return '';
    return task.dataset.taskId || task.dataset.id || task.id ||
      task.querySelector('[data-task-id]')?.dataset.taskId ||
      task.textContent.trim().replace(/\s+/g, ' ').slice(0, 180);
  }

  function readDone(){
    try { return JSON.parse(localStorage.getItem(DONE_KEY) || '[]'); }
    catch (_) { return []; }
  }

  function writeDone(items){
    try { localStorage.setItem(DONE_KEY, JSON.stringify(Array.from(new Set(items)))); }
    catch (_) {}
  }

  function restoreDoneVisualState(){
    const done = new Set(readDone());
    if(!done.size) return;
    document.querySelectorAll('.task').forEach(task => {
      if(done.has(taskFingerprint(task))) task.classList.add('done');
    });
  }

  function normalizeAria(){
    document.querySelectorAll('div[aria-label]:not([role])').forEach(el => {
      el.setAttribute('role', 'group');
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
    const button = event.target.closest('.mark-done');
    if(!button) return;
    const task = button.closest('.task');
    const fingerprint = taskFingerprint(task);
    if(!fingerprint) return;
    const done = readDone();
    if(!done.includes(fingerprint)) {
      done.push(fingerprint);
      writeDone(done);
    }
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
