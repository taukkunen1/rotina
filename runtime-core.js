(() => {
  'use strict';
  function clone(value){ return JSON.parse(JSON.stringify(value)); }

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const existing = document.querySelector(`script[data-pacus-domain="${src}"]`);
      if(existing) return resolve();
      const script = document.createElement('script');
      script.src = src; script.async = false; script.dataset.pacusDomain = src;
      script.onload = resolve; script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function loadDomains(){
    try{
      await loadScript('domain/task-domain.js?v=20260823-1');
      await loadScript('domain/routine-domain.js?v=20260823-1');
    }catch(error){ console.warn('PACUS domain modules unavailable; keeping legacy runtime.', error); }
  }

  function installDomainAdapters(){
    const task = window.PacusTaskDomain;
    const routine = window.PacusRoutineDomain;
    if(task){
      window.isCountedDone = task.isCountedDone;
      window.notDonePenalty = task.notDonePenalty;
      window.taskNotDonePenalty = task.taskNotDonePenalty;
      window.taskHelpPoints = task.taskHelpPoints;
      window.getEffectiveTaskOrder = function(periodKey, tasks){
        return task.getEffectiveOrder(tasks, state && state.customTaskOrder && state.customTaskOrder[periodKey]);
      };
    }
    if(routine){
      window.isWeekendISO = routine.isWeekendISO;
      window.weekdayKeyFor = routine.weekdayKeyFor;
      window.getPeriodsFor = function(dateISO){ return routine.periodsFor(CONFIG, dateISO || todayISO()); };
      window.allTasks = function(dateISO){ return routine.flattenTasks(window.getPeriodsFor(dateISO || todayISO())); };
    }
  }

  function normalize(){
    try{
      if(typeof DEFAULT_CONFIG !== 'undefined' && typeof CONFIG !== 'undefined'){
        if(!CONFIG || typeof CONFIG !== 'object') CONFIG = clone(DEFAULT_CONFIG);
        if(!CONFIG.pet || typeof CONFIG.pet !== 'object') CONFIG.pet = clone(DEFAULT_CONFIG.pet);
        if(!Array.isArray(CONFIG.pet.stages) || CONFIG.pet.stages.length < 24) CONFIG.pet.stages = clone(DEFAULT_CONFIG.pet.stages);
        if(!CONFIG.pet.name) CONFIG.pet.name = DEFAULT_CONFIG.pet.name;
        if(!CONFIG.pet.growthStartDate) CONFIG.pet.growthStartDate = DEFAULT_CONFIG.pet.growthStartDate;
        if(!CONFIG.pet.growthEndDate) CONFIG.pet.growthEndDate = DEFAULT_CONFIG.pet.growthEndDate;
        if(!CONFIG.periods || typeof CONFIG.periods !== 'object') CONFIG.periods = clone(DEFAULT_CONFIG.periods);
        ['manha','tarde','noite'].forEach(key => { if(!CONFIG.periods[key] || !Array.isArray(CONFIG.periods[key].tasks) || !CONFIG.periods[key].tasks.length) CONFIG.periods[key] = clone(DEFAULT_CONFIG.periods[key]); });
        if(!Array.isArray(CONFIG.badHabits)) CONFIG.badHabits = [];
        if(!Array.isArray(CONFIG.rewards)) CONFIG.rewards = clone(DEFAULT_CONFIG.rewards);
        if(!Array.isArray(CONFIG.schedule)) CONFIG.schedule = clone(DEFAULT_CONFIG.schedule);
        if(!Array.isArray(CONFIG.scheduleExceptions)) CONFIG.scheduleExceptions = clone(DEFAULT_CONFIG.scheduleExceptions);
        if(CONFIG.screenDailyLimitHours == null) CONFIG.screenDailyLimitHours = DEFAULT_CONFIG.screenDailyLimitHours;
        if(CONFIG.perfectDayBonusMinutes == null) CONFIG.perfectDayBonusMinutes = DEFAULT_CONFIG.perfectDayBonusMinutes;
        if(!CONFIG.historyStartDate) CONFIG.historyStartDate = DEFAULT_CONFIG.historyStartDate;
      }
      if(typeof state !== 'undefined' && state && typeof state === 'object'){
        if(!state.checkedToday || typeof state.checkedToday !== 'object') state.checkedToday = {};
        if(!state.history || typeof state.history !== 'object') state.history = {};
        if(!Array.isArray(state.log)) state.log = [];
        if(!state.hairByDate || typeof state.hairByDate !== 'object') state.hairByDate = {};
        if(!state.customTaskOrder || typeof state.customTaskOrder !== 'object') state.customTaskOrder = {};
        if(!Array.isArray(state.petCompletedDays)) state.petCompletedDays = [];
        if(!Array.isArray(state.petPerfectBonusDays)) state.petPerfectBonusDays = [];
        if(!Number.isFinite(Number(state.totalPoints))) state.totalPoints = 0;
        if(!state.gameTimer || typeof state.gameTimer !== 'object') state.gameTimer = {date:todayISO(),usedSeconds:0,runningSince:null,bonusSeconds:0,redemptions:{}};
        if(!Number.isFinite(Number(state.gameTimer.usedSeconds))) state.gameTimer.usedSeconds = 0;
        if(!Number.isFinite(Number(state.gameTimer.bonusSeconds))) state.gameTimer.bonusSeconds = 0;
        if(state.gameTimer.runningSince !== null && !Number.isFinite(Number(state.gameTimer.runningSince))) state.gameTimer.runningSince = null;
        if(!state.gameTimer.redemptions || typeof state.gameTimer.redemptions !== 'object') state.gameTimer.redemptions = {};
      }
    }catch(error){ console.error('PACUS normalize failed', error); }
  }

  function repairConfig(){
    if(typeof CONFIG === 'undefined' || typeof DEFAULT_CONFIG === 'undefined') return false;
    let changed = false, defaults = DEFAULT_CONFIG;
    if(!CONFIG.pet || typeof CONFIG.pet !== 'object'){ CONFIG.pet = clone(defaults.pet); changed = true; }
    else { if(!CONFIG.pet.name){ CONFIG.pet.name=defaults.pet.name; changed=true; } if(!CONFIG.pet.growthStartDate){ CONFIG.pet.growthStartDate=defaults.pet.growthStartDate; changed=true; } if(!CONFIG.pet.growthEndDate){ CONFIG.pet.growthEndDate=defaults.pet.growthEndDate; changed=true; } if(!Array.isArray(CONFIG.pet.stages)||CONFIG.pet.stages.length<2){ CONFIG.pet.stages=clone(defaults.pet.stages); changed=true; } }
    if(!CONFIG.periods || typeof CONFIG.periods !== 'object'){ CONFIG.periods=clone(defaults.periods); changed=true; }
    ['manha','tarde','noite'].forEach(key=>{ if(!CONFIG.periods[key] || !Array.isArray(CONFIG.periods[key].tasks)){ CONFIG.periods[key]=clone(defaults.periods[key]); changed=true; } });
    if(!Array.isArray(CONFIG.badHabits)){ CONFIG.badHabits=[]; changed=true; }
    if(!Array.isArray(CONFIG.rewards)){ CONFIG.rewards=clone(defaults.rewards); changed=true; }
    if(!Array.isArray(CONFIG.schedule)){ CONFIG.schedule=clone(defaults.schedule); changed=true; }
    if(!Array.isArray(CONFIG.scheduleExceptions)){ CONFIG.scheduleExceptions=clone(defaults.scheduleExceptions); changed=true; }
    if(CONFIG.screenDailyLimitHours == null){ CONFIG.screenDailyLimitHours=defaults.screenDailyLimitHours; changed=true; }
    if(CONFIG.perfectDayBonusMinutes == null){ CONFIG.perfectDayBonusMinutes=defaults.perfectDayBonusMinutes; changed=true; }
    if(!CONFIG.historyStartDate){ CONFIG.historyStartDate=defaults.historyStartDate; changed=true; }
    if(changed && typeof saveConfig === 'function') try{ saveConfig(CONFIG); }catch(error){ console.warn('PACUS config repair save failed', error); }
    return changed;
  }

  function clearCrashBannerIfHealthy(){ const periods=document.getElementById('periods'); if(periods && periods.children.length>0){ document.getElementById('appCrashBanner')?.remove(); const fatal=document.getElementById('__fatalReloadBtn'); if(fatal?.parentElement) fatal.parentElement.remove(); return true; } return false; }
  function recover(){ try{ if(typeof CONFIG==='undefined'||typeof state==='undefined'||typeof render!=='function') return; normalize(); repairConfig(); if(!clearCrashBannerIfHealthy()){ try{ render(); }catch(error){ console.error('PACUS runtime recovery:',error); } clearCrashBannerIfHealthy(); } }catch(error){ console.error('PACUS runtime recovery failed:',error); } }
  function install(){ normalize(); if(typeof window.render==='function'&&!window.__pacusGuardV4){ const original=window.render; window.__pacusGuardV4=true; window.render=function(){ normalize(); return original.apply(this,arguments); }; } try{ if(typeof saveState==='function') saveState(state); }catch(error){} try{ if(typeof saveConfig==='function') saveConfig(CONFIG); }catch(error){} try{ if(typeof render==='function') render(); }catch(error){ console.error('PACUS guarded render failed:',error); } }
  async function start(){ await loadDomains(); installDomainAdapters(); repairConfig(); recover(); install(); }
  function boot(){ start(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else setTimeout(boot,0);
  setTimeout(recover,1000);
})();
