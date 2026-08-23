(() => {
  'use strict';

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
      await loadScript('domain/routine-state.js?v=20260823-2');
      await loadScript('controllers/task-controller.js?v=20260823-1');
      await loadScript('renderers/routine-renderer.js?v=20260823-1');
    }catch(error){ console.warn('PACUS modules unavailable; keeping legacy runtime.', error); }
  }

  function installDomainAdapters(){
    const task = window.PacusTaskDomain;
    const routine = window.PacusRoutineDomain;
    if(task){
      window.isCountedDone = task.isCountedDone;
      window.notDonePenalty = task.notDonePenalty;
      window.taskNotDonePenalty = task.taskNotDonePenalty;
      window.taskHelpPoints = task.taskHelpPoints;
      window.getEffectiveTaskOrder = function(periodKey, tasks){ return task.getEffectiveOrder(tasks, state && state.customTaskOrder && state.customTaskOrder[periodKey]); };
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
      const stateDomain = window.PacusRoutineState;
      if(stateDomain && typeof DEFAULT_CONFIG !== 'undefined' && typeof CONFIG !== 'undefined') CONFIG = stateDomain.normalizeConfig(CONFIG, DEFAULT_CONFIG);
      if(stateDomain && typeof state !== 'undefined' && state && typeof state === 'object') state = stateDomain.normalizeRuntimeState(state, typeof todayISO === 'function' ? todayISO() : new Date().toISOString().slice(0,10));
    }catch(error){ console.error('PACUS normalize failed', error); }
  }

  function repairConfig(){
    if(typeof CONFIG === 'undefined' || typeof DEFAULT_CONFIG === 'undefined') return false;
    const before = JSON.stringify(CONFIG);
    normalize();
    const changed = before !== JSON.stringify(CONFIG);
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