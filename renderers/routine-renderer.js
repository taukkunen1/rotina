(() => {
  'use strict';

  const PERIOD_ORDER = ['manha', 'tarde', 'noite'];

  function escapeHtml(value){
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function progressMessage(applicableLength, doneCount){
    const remaining = applicableLength - doneCount;
    const pct = applicableLength ? Math.round(100 * doneCount / applicableLength) : 0;
    if(applicableLength === 0) return { pct, remaining, text:'nada marcado ainda' };
    if(pct === 100) return { pct, remaining, text:'tudo certo por aqui! ✅' };
    if(remaining === 1) return { pct, remaining, text:'falta só 1! 🔥' };
    return { pct, remaining, text:`${doneCount}/${applicableLength} feitas` };
  }

  function nextPreview(periodKey, period, periodsObj, applicableLength, pct, taskIcon){
    if(pct !== 100 || applicableLength === 0) return '';
    const idx = PERIOD_ORDER.indexOf(periodKey);
    const nextKey = idx >= 0 && idx < PERIOD_ORDER.length - 1 ? PERIOD_ORDER[idx + 1] : null;
    if(nextKey && periodsObj[nextKey]){
      const nextPeriod = periodsObj[nextKey];
      const firstTask = nextPeriod.tasks && nextPeriod.tasks[0];
      const first = firstTask ? ` — começando com ${taskIcon(firstTask.txt)} ${escapeHtml(firstTask.txt)}` : '';
      return `<div class="next-period-preview">➡️ A seguir: <b>${escapeHtml(nextPeriod.label)}</b>${first}</div>`;
    }
    if(!nextKey) return '<div class="next-period-preview">🎉 Terminou tudo por hoje!</div>';
    return '';
  }

  function taskClassName({ status, suggested }){
    return 'task'
      + (status === 'done' ? ' done' : '')
      + (status === 'na' ? ' na' : '')
      + (status === 'x' ? ' notdone' : '')
      + (status === 'help' ? ' helped' : '')
      + (suggested ? ' suggested' : '');
  }

  function taskMarkup({ task, periodKey, index, total, status, suggested, lightDay, icon }){
    const tierBadge = { essencial:'🔴', responsabilidade:'🟡', extra:'🟢' };
    const tierTitle = {
      essencial:'Essencial — precisa acontecer, mas você escolhe quando/ordem/ajuda',
      responsabilidade:'Responsabilidade — esperado, gera pontos',
      extra:'Extra — opcional, bônus maior'
    };
    const safeTask = escapeHtml(task.txt);
    const safeSub = task.sub ? `<span class="sub">${escapeHtml(task.sub)}</span>` : '';
    const tier = task.tier ? `<span class="task-tier" title="${tierTitle[task.tier] || ''}">${tierBadge[task.tier] || ''}</span>` : '';
    return `<li class="${taskClassName({ status, suggested })}" data-task-id="${escapeHtml(task.id)}">
      <span class="task-reorder">
        <button type="button" class="mini-reorder-btn" data-dir="up" data-period="${escapeHtml(periodKey)}" data-task="${escapeHtml(task.id)}" ${index===0?'disabled':''} title="Mover pra cima">▲</button>
        <button type="button" class="mini-reorder-btn" data-dir="down" data-period="${escapeHtml(periodKey)}" data-task="${escapeHtml(task.id)}" ${index===total-1?'disabled':''} title="Mover pra baixo">▼</button>
      </span>
      <span class="mark-group" data-id="${escapeHtml(task.id)}">
        <button type="button" class="mark-btn mark-done ${status==='done'?'active':''}" data-status="done" title="Feito">✓</button>
        <button type="button" class="mark-btn mark-help ${status==='help'?'active':''}" data-status="help" title="Pedi ajuda / fizemos junto">🤝</button>
        <button type="button" class="mark-btn mark-na ${status==='na'?'active':''}" data-status="na" title="Não precisou realizar hoje">–</button>
        <button type="button" class="mark-btn mark-x ${status==='x'?'active':''}" data-status="x" title="Não realizado" ${lightDay?'data-light-day="true"':''}>✕</button>
      </span>
      <span class="task-main"><span class="task-icon">${icon}</span><span class="task-txt">${safeTask}</span>${tier}${safeSub}</span>
      <span class="task-pts">${Number(task.pts)||0} PP</span>
    </li>`;
  }

  function periodMarkup({ periodKey, period, periodsObj, checkedToday, orderedTasks, isCountedDone, isLightDay, taskIcon }){
    const applicable = period.tasks.filter(task => checkedToday[task.id] !== 'na');
    const doneCount = applicable.filter(task => isCountedDone(checkedToday[task.id])).length;
    const progress = progressMessage(applicable.length, doneCount);
    const preview = nextPreview(periodKey, period, periodsObj, applicable.length, progress.pct, taskIcon);
    const nextSuggestedId = orderedTasks.find(task => !task.external && !checkedToday[task.id])?.id;
    const tasks = orderedTasks.map((task, index) => taskMarkup({
      task,
      periodKey,
      index,
      total: orderedTasks.length,
      status: checkedToday[task.id],
      suggested: task.id === nextSuggestedId,
      lightDay: isLightDay,
      icon: taskIcon(task.txt)
    })).join('');
    return `<div class="period ${escapeHtml(periodKey)}" data-period="${escapeHtml(periodKey)}">
      <div class="period-head"><div><div class="period-title">${escapeHtml(period.label)}</div><div class="period-time">${escapeHtml(period.time)}</div></div><span class="progress-txt">${progress.text}</span></div>
      <ul class="tasks">${tasks}</ul>
      <div class="progress-bar"><div style="width:${progress.pct}%"></div></div>
      ${preview}
    </div>`;
  }

  window.PacusRoutineRenderer = {
    PERIOD_ORDER,
    escapeHtml,
    progressMessage,
    nextPreview,
    taskClassName,
    taskMarkup,
    periodMarkup
  };
})();
