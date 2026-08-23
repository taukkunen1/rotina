(function(root, factory){
  const api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  if(root) root.PacusRoutineDomain = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  'use strict';

  const WEEKDAY_KEYS = ['dom','seg','ter','qua','qui','sex','sab'];

  function weekdayKeyFor(dateISO){
    const day = new Date(`${dateISO}T00:00:00`).getDay();
    return WEEKDAY_KEYS[day];
  }

  function isWeekendISO(dateISO){
    const day = new Date(`${dateISO}T00:00:00`).getDay();
    return day === 0 || day === 6;
  }

  function clone(value){ return JSON.parse(JSON.stringify(value)); }

  function periodsFor(config, dateISO){
    const cfg = config || {};
    const base = cfg.periodsWeekend && isWeekendISO(dateISO) ? cfg.periodsWeekend : cfg.periods || {};
    const merged = clone(base);
    const weekday = weekdayKeyFor(dateISO);

    (cfg.schedule || [])
      .filter(item => Array.isArray(item.days) && item.days.includes(weekday))
      .forEach(item => inject(merged, item, 'sched_'));

    (cfg.scheduleExceptions || [])
      .filter(item => item.date === dateISO)
      .forEach(item => inject(merged, item, 'exc_'));

    return merged;
  }

  function inject(periods, item, prefix){
    const key = item.period && periods[item.period] ? item.period : 'tarde';
    if(!periods[key]) return;
    if(!Array.isArray(periods[key].tasks)) periods[key].tasks = [];
    periods[key].tasks.push({
      id: `${prefix}${item.id}`,
      txt: item.label,
      sub: item.start && item.end ? `${item.start}–${item.end}` : '',
      pts: item.pts != null ? item.pts : 3,
      tier: 'responsabilidade'
    });
  }

  function flattenTasks(periods){
    return ['manha','tarde','noite'].flatMap(key => periods && periods[key] && Array.isArray(periods[key].tasks) ? periods[key].tasks : []);
  }

  return Object.freeze({ weekdayKeyFor, isWeekendISO, periodsFor, flattenTasks });
});
