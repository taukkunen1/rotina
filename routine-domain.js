/* Pure routine-domain helpers. No DOM, storage or network access. */
(function(root){
  'use strict';
  function normalizeStatus(value){
    return ['done','helped','not_done','pending'].includes(value) ? value : 'pending';
  }
  function pointsFor(task, status){
    const pts = Number(task && task.pts) || 0;
    if(status === 'done') return pts;
    if(status === 'helped') return task && task.helpPoints != null ? Number(task.helpPoints) : 0;
    return 0;
  }
  function totalPoints(tasks, completions){
    return (tasks || []).reduce((sum, task) => sum + pointsFor(task, normalizeStatus((completions || {})[task.id])), 0);
  }
  function isDayExpired(day, now, timezone){
    const current = new Intl.DateTimeFormat('en-CA', { timeZone: timezone || 'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit' }).format(now || new Date());
    return String(day) < current;
  }
  function nextDay(day){
    const d = new Date(day + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0,10);
  }
  root.RoutineDomain = Object.freeze({ normalizeStatus, pointsFor, totalPoints, isDayExpired, nextDay });
})(window);
