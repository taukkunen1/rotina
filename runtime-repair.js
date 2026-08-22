(() => {
  'use strict';

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function repairConfig(){
    if(typeof CONFIG === 'undefined' || typeof DEFAULT_CONFIG === 'undefined') return false;

    let changed = false;
    const defaults = DEFAULT_CONFIG;

    // Configurações antigas podem existir no localStorage sem os campos
    // adicionados posteriormente. Completa apenas o que estiver faltando,
    // sem apagar nenhuma configuração feita pelos adultos.
    if(!CONFIG.pet || typeof CONFIG.pet !== 'object'){
      CONFIG.pet = clone(defaults.pet);
      changed = true;
    } else {
      if(!CONFIG.pet.name) { CONFIG.pet.name = defaults.pet.name; changed = true; }
      if(!CONFIG.pet.growthStartDate) { CONFIG.pet.growthStartDate = defaults.pet.growthStartDate; changed = true; }
      if(!CONFIG.pet.growthEndDate) { CONFIG.pet.growthEndDate = defaults.pet.growthEndDate; changed = true; }
      if(!Array.isArray(CONFIG.pet.stages) || CONFIG.pet.stages.length < 2){
        CONFIG.pet.stages = clone(defaults.pet.stages);
        changed = true;
      }
    }

    if(!CONFIG.periods || typeof CONFIG.periods !== 'object'){
      CONFIG.periods = clone(defaults.periods);
      changed = true;
    }
    ['manha','tarde','noite'].forEach(key => {
      if(!CONFIG.periods[key] || !Array.isArray(CONFIG.periods[key].tasks)){
        CONFIG.periods[key] = clone(defaults.periods[key]);
        changed = true;
      }
    });

    if(!Array.isArray(CONFIG.badHabits)){ CONFIG.badHabits = []; changed = true; }
    if(!Array.isArray(CONFIG.rewards)){ CONFIG.rewards = clone(defaults.rewards); changed = true; }
    if(!Array.isArray(CONFIG.schedule)){ CONFIG.schedule = clone(defaults.schedule); changed = true; }
    if(!Array.isArray(CONFIG.scheduleExceptions)){ CONFIG.scheduleExceptions = clone(defaults.scheduleExceptions); changed = true; }
    if(CONFIG.screenDailyLimitHours == null){ CONFIG.screenDailyLimitHours = defaults.screenDailyLimitHours; changed = true; }
    if(CONFIG.perfectDayBonusMinutes == null){ CONFIG.perfectDayBonusMinutes = defaults.perfectDayBonusMinutes; changed = true; }
    if(!CONFIG.historyStartDate){ CONFIG.historyStartDate = defaults.historyStartDate; changed = true; }

    if(changed && typeof saveConfig === 'function'){
      try{ saveConfig(CONFIG); }catch(e){ console.warn('PACUS: não foi possível salvar a configuração reparada.', e); }
    }
    return changed;
  }

  function clearCrashBannerIfHealthy(){
    const periods = document.getElementById('periods');
    if(periods && periods.children.length > 0){
      const old = document.getElementById('appCrashBanner');
      if(old) old.remove();
      const fatal = document.getElementById('__fatalReloadBtn');
      if(fatal && fatal.parentElement) fatal.parentElement.remove();
      return true;
    }
    return false;
  }

  function recover(){
    try{
      if(typeof CONFIG === 'undefined' || typeof state === 'undefined' || typeof render !== 'function') return;
      repairConfig();

      // O render inicial pode ter falhado antes de criar os períodos.
      // Uma segunda tentativa, depois da normalização, recupera a página
      // sem apagar dados locais nem reiniciar o histórico.
      if(!clearCrashBannerIfHealthy()){
        try{ render(); }catch(err){
          console.error('PACUS runtime repair:', err);
        }
        clearCrashBannerIfHealthy();
      }
    }catch(err){
      console.error('PACUS runtime repair failed:', err);
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', recover, {once:true});
  else setTimeout(recover, 0);
  setTimeout(recover, 500);
})();
