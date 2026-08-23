(function(root, factory){
  const api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  if(root) root.PacusTaskDomain = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  'use strict';

  const COUNTED_DONE = new Set(['done', 'help']);

  function isCountedDone(status){ return COUNTED_DONE.has(status); }

  function notDonePenalty(points){
    let half = Math.ceil(Number(points) / 2);
    if(half % 2 !== 0) half += 1;
    return Math.max(0, half);
  }

  function taskNotDonePenalty(task){
    return task && task.fullPenalty ? Number(task.pts) || 0 : notDonePenalty(task && task.pts);
  }

  function taskHelpPoints(task){
    return Math.max(1, Math.ceil((Number(task && task.pts) || 0) / 2));
  }

  function getEffectiveOrder(tasks, customOrder){
    const source = Array.isArray(tasks) ? tasks : [];
    if(!Array.isArray(customOrder) || customOrder.length === 0) return [...source];
    const byId = new Map(source.map(task => [task.id, task]));
    const ordered = customOrder.map(id => byId.get(id)).filter(Boolean);
    const missing = source.filter(task => !customOrder.includes(task.id));
    return [...ordered, ...missing];
  }

  function transition(currentStatus, clickedStatus, task, options){
    const lightDay = !!(options && options.lightDay);
    const current = currentStatus || null;
    const clicked = clickedStatus || null;
    const points = Number(task && task.pts) || 0;
    let delta = 0;

    if(current === 'done') delta -= points;
    else if(current === 'help') delta -= Math.floor(points / 2);
    else if(current === 'x' && !lightDay) delta += taskNotDonePenalty(task);

    if(current === clicked){
      return { nextStatus:null, delta, action:'cleared' };
    }

    if(clicked === 'done') delta += points;
    else if(clicked === 'help') delta += taskHelpPoints(task);
    else if(clicked === 'x' && !lightDay) delta -= taskNotDonePenalty(task);

    return { nextStatus:clicked, delta, action:clicked || 'cleared' };
  }

  function completionSummary(tasks, checkedToday){
    const source = Array.isArray(tasks) ? tasks : [];
    const checked = checkedToday || {};
    const applicable = source.filter(task => checked[task.id] !== 'na');
    const done = applicable.filter(task => isCountedDone(checked[task.id])).length;
    return {
      total: applicable.length,
      done,
      remaining: Math.max(0, applicable.length - done),
      perfect: applicable.length > 0 && done === applicable.length
    };
  }

  return Object.freeze({
    isCountedDone,
    notDonePenalty,
    taskNotDonePenalty,
    taskHelpPoints,
    getEffectiveOrder,
    transition,
    completionSummary
  });
});
