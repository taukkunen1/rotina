(() => {
  'use strict';

  function clone(v){ return JSON.parse(JSON.stringify(v)); }

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
        ['manha','tarde','noite'].forEach(k=>{
          if(!CONFIG.periods[k] || !Array.isArray(CONFIG.periods[k].tasks) || !CONFIG.periods[k].tasks.length) CONFIG.periods[k]=clone(DEFAULT_CONFIG.periods[k]);
        });
        if(!Array.isArray(CONFIG.badHabits)) CONFIG.badHabits=[];
        if(!Array.isArray(CONFIG.rewards)) CONFIG.rewards=clone(DEFAULT_CONFIG.rewards);
        if(!Array.isArray(CONFIG.schedule)) CONFIG.schedule=clone(DEFAULT_CONFIG.schedule);
        if(!Array.isArray(CONFIG.scheduleExceptions)) CONFIG.scheduleExceptions=clone(DEFAULT_CONFIG.scheduleExceptions);
        if(CONFIG.screenDailyLimitHours == null) CONFIG.screenDailyLimitHours=DEFAULT_CONFIG.screenDailyLimitHours;
        if(CONFIG.perfectDayBonusMinutes == null) CONFIG.perfectDayBonusMinutes=DEFAULT_CONFIG.perfectDayBonusMinutes;
      }

      if(typeof state !== 'undefined' && state && typeof state==='object'){
        if(!state.checkedToday || typeof state.checkedToday!=='object') state.checkedToday={};
        if(!state.history || typeof state.history!=='object') state.history={};
        if(!Array.isArray(state.log)) state.log=[];
        if(!state.hairByDate || typeof state.hairByDate!=='object') state.hairByDate={};
        if(!state.customTaskOrder || typeof state.customTaskOrder!=='object') state.customTaskOrder={};
        if(!Array.isArray(state.petCompletedDays)) state.petCompletedDays=[];
        if(!Array.isArray(state.petPerfectBonusDays)) state.petPerfectBonusDays=[];
        if(!Number.isFinite(Number(state.totalPoints))) state.totalPoints=0;
        if(!state.gameTimer || typeof state.gameTimer!=='object') state.gameTimer={date:todayISO(),usedSeconds:0,runningSince:null,bonusSeconds:0,redemptions:{}};
        if(!Number.isFinite(Number(state.gameTimer.usedSeconds))) state.gameTimer.usedSeconds=0;
        if(!Number.isFinite(Number(state.gameTimer.bonusSeconds))) state.gameTimer.bonusSeconds=0;
        if(state.gameTimer.runningSince!==null && !Number.isFinite(Number(state.gameTimer.runningSince))) state.gameTimer.runningSince=null;
        if(!state.gameTimer.redemptions || typeof state.gameTimer.redemptions!=='object') state.gameTimer.redemptions={};
        if(!Array.isArray(state.customTimers) || state.customTimers.length!==2) state.customTimers=[
          {id:'ct1',label:'Timer 1',totalSeconds:300,remainingSeconds:300,runningSince:null,finished:false},
          {id:'ct2',label:'Timer 2',totalSeconds:300,remainingSeconds:300,runningSince:null,finished:false}
        ];
      }
    }catch(e){ console.error('PACUS normalize failed',e); }
  }

  function install(){
    normalize();
    if(typeof window.render==='function' && !window.__pacusGuardV2){
      const original=window.render;
      window.__pacusGuardV2=true;
      window.render=function(){ normalize(); return original.apply(this,arguments); };
    }
    try{ if(typeof saveState==='function') saveState(state); }catch(e){}
    try{ if(typeof saveConfig==='function') saveConfig(CONFIG); }catch(e){}
    try{ if(typeof render==='function') render(); }catch(e){ console.error('PACUS guarded render failed',e); }
  }

  setTimeout(install, 0);
  setTimeout(install, 800);
})();
