/* Pure daily-cycle rules. No DOM, storage or network access. */
(function(root){
  'use strict';
  const TZ = 'America/Sao_Paulo';

  function calendarDay(now, timezone){
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || TZ, year:'numeric', month:'2-digit', day:'2-digit'
    }).formatToParts(now || new Date());
    const map = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
    return `${map.year}-${map.month}-${map.day}`;
  }

  function needsRollover(stateDay, now, timezone){
    if(!stateDay) return true;
    return stateDay !== calendarDay(now, timezone);
  }

  function buildFreshDailyState(day, previous){
    return {
      day,
      checkedToday: {},
      totalPoints: 0,
      dailyPoints: 0,
      timers: {},
      autonomy: {},
      history: previous && previous.history ? previous.history : {}
    };
  }

  root.DailyCycle = Object.freeze({ calendarDay, needsRollover, buildFreshDailyState });
})(window);
