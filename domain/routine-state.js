(function(root, factory){
  const api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  if(root) root.PacusRoutineState = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  'use strict';

  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function ensureObject(value, fallback){ return value && typeof value === 'object' && !Array.isArray(value) ? value : clone(fallback); }
  function normalizeConfig(config, defaults){
    const next = ensureObject(config, defaults);
    next.pet = ensureObject(next.pet, defaults.pet);
    ['name','growthStartDate','growthEndDate'].forEach(key => { if(!next.pet[key]) next.pet[key] = defaults.pet[key]; });
    if(!Array.isArray(next.pet.stages) || next.pet.stages.length < 2) next.pet.stages = clone(defaults.pet.stages);
    next.periods = ensureObject(next.periods, defaults.periods);
    ['manha','tarde','noite'].forEach(key => { if(!next.periods[key] || !Array.isArray(next.periods[key].tasks)) next.periods[key] = clone(defaults.periods[key]); });
    ['badHabits','rewards','schedule','scheduleExceptions'].forEach(key => { if(!Array.isArray(next[key])) next[key] = clone(defaults[key] || []); });
    if(next.screenDailyLimitHours == null) next.screenDailyLimitHours = defaults.screenDailyLimitHours;
    if(next.perfectDayBonusMinutes == null) next.perfectDayBonusMinutes = defaults.perfectDayBonusMinutes;
    if(!next.historyStartDate) next.historyStartDate = defaults.historyStartDate;
    return next;
  }

  function normalizeRuntimeState(runtime, today){
    const next = ensureObject(runtime, {});
    ['checkedToday','history','hairByDate','customTaskOrder'].forEach(key => { if(!next[key] || typeof next[key] !== 'object' || Array.isArray(next[key])) next[key] = {}; });
    ['log','petCompletedDays','petPerfectBonusDays'].forEach(key => { if(!Array.isArray(next[key])) next[key] = []; });
    if(!Number.isFinite(Number(next.totalPoints))) next.totalPoints = 0;
    next.gameTimer = ensureObject(next.gameTimer, {date:today,usedSeconds:0,runningSince:null,bonusSeconds:0,redemptions:{}});
    if(!next.gameTimer.date) next.gameTimer.date = today;
    if(!Number.isFinite(Number(next.gameTimer.usedSeconds))) next.gameTimer.usedSeconds = 0;
    if(next.gameTimer.bonusSeconds == null || !Number.isFinite(Number(next.gameTimer.bonusSeconds))) next.gameTimer.bonusSeconds = 0;
    if(next.gameTimer.runningSince !== null && !Number.isFinite(Number(next.gameTimer.runningSince))) next.gameTimer.runningSince = null;
    if(!next.gameTimer.redemptions || typeof next.gameTimer.redemptions !== 'object') next.gameTimer.redemptions = {};
    return next;
  }

  return Object.freeze({ normalizeConfig, normalizeRuntimeState });
});
