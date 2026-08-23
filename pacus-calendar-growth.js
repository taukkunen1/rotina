(() => {
  'use strict';

  /* Crescimento do Pacus é exclusivamente temporal neste ciclo:
     começa em 09/08/2026 e chega a 100% em 31/08/2026.
     Tarefas, pontos e histórico continuam sendo registrados normalmente,
     mas não aceleram nem atrasam o tamanho do Pacus. */

  function isoDayDiff(fromISO, toISO){
    const a = new Date(fromISO + 'T00:00:00');
    const b = new Date(toISO + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }

  function calendarPetData(){
    const startISO = (CONFIG.pet && CONFIG.pet.growthStartDate) || '2026-08-09';
    const endISO = (CONFIG.pet && CONFIG.pet.growthEndDate) || '2026-08-31';
    const currentISO = todayISO();
    const totalIntervals = Math.max(1, isoDayDiff(startISO, endISO));
    const elapsed = Math.max(0, Math.min(totalIntervals, isoDayDiff(startISO, currentISO)));
    const maxStage = CONFIG.pet.stages.length - 1;
    const stageFloat = Math.max(0, Math.min(maxStage, (elapsed / totalIntervals) * maxStage));
    const stage = Math.floor(stageFloat + 1e-9);
    const progressPct = Math.round((elapsed / totalIntervals) * 100);
    return { startISO, endISO, currentISO, totalIntervals, elapsed, maxStage, stageFloat, stage, progressPct };
  }

  window.computePetStage = function(){
    const d = calendarPetData();
    return {
      stage: d.stage,
      stageFloat: d.stageFloat,
      unitsCompleted: d.stageFloat,
      totalUnits: d.maxStage,
      maxStage: d.maxStage,
      daysEquivalent: d.stageFloat,
      cycleDays: d.maxStage,
      todayPerfect: isDayPerfect(todayISO()),
      canGrowToday: false,
      completedDays: []
    };
  };

  window.getMilestoneDates = function(){
    const d = calendarPetData();
    const milestones = [[0,'Ovo'],[5,'Rachando'],[9,'Eclosão'],[14,'Bebê'],[19,'Jovem'],[23,'Adulto']];
    return milestones.map(([unit,label]) => {
      const ratio = unit / d.maxStage;
      const offset = Math.round(ratio * d.totalIntervals);
      const date = new Date(d.startISO + 'T00:00:00');
      date.setDate(date.getDate() + offset);
      const iso = date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0');
      return { label, day: unit, date: iso, reached: d.stageFloat >= unit };
    });
  };

  window.renderPet = function(){
    const el = document.getElementById('petSection');
    if(!el) return;
    const d = calendarPetData();
    const stageInfo = CONFIG.pet.stages[d.stage] || CONFIG.pet.stages[0];
    const milestones = [[0,'Ovo'],[5,'Rachando'],[9,'Eclosão'],[14,'Bebê'],[19,'Jovem'],[23,'Adulto']];

    const milestoneHtml = milestones.map(([unit,label]) => {
      const ratio = unit / d.maxStage;
      const offset = Math.round(ratio * d.totalIntervals);
      const date = new Date(d.startISO + 'T00:00:00');
      date.setDate(date.getDate() + offset);
      const iso = date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0');
      const active = d.stageFloat >= unit;
      const current = d.stage >= unit && (d.stage === unit || (d.stage > unit && unit === 23));
      return `<span class="pet-milestone ${active?'active':''} ${current?'current':''}">${label} <small>${formatDateBR(iso)}</small></span>`;
    }).join('');

    const next = milestones.find(([unit]) => unit > d.stageFloat);
    let caption;
    if(d.progressPct >= 100){
      caption = `Pacus adulto! <b>Crescimento concluído em 31/08.</b> 🎉`;
    } else if(next){
      const ratio = next[0] / d.maxStage;
      const offset = Math.round(ratio * d.totalIntervals);
      const nextDate = new Date(d.startISO + 'T00:00:00');
      nextDate.setDate(nextDate.getDate() + offset);
      const daysLeft = Math.max(0, Math.ceil((nextDate - new Date(d.currentISO + 'T00:00:00')) / 86400000));
      caption = daysLeft === 0
        ? `Hoje o Pacus chega à fase <b>${next[1]}</b>.`
        : `Faltam <b>${daysLeft} ${daysLeft===1?'dia':'dias'}</b> para virar <b>${next[1]}</b>.`;
    } else {
      caption = `Quase lá! O Pacus termina de crescer em <b>31/08</b>.`;
    }

    const previousProgress = Number(el.dataset.pacusProgress || 0);
    const grewNow = d.stageFloat > previousProgress;
    el.dataset.pacusProgress = String(d.stageFloat);

    el.innerHTML = `
      <div class="pet-mascot-wrap" id="pacusInteractive" title="Toque no Pacus!">
        ${buildPetVisual(d.stageFloat)}
        <span class="pet-accessory">🌿</span>
        <span class="pet-reaction-bubble" id="petReactionBubble"></span>
      </div>
      <div id="pacusDialogue"></div>
      <div class="pet-name">${CONFIG.pet.name}</div>
      <div class="pet-stage-label">${stageInfo.label} · ${d.elapsed}/${d.totalIntervals} dias decorridos · adulto em 31/08</div>
      <div class="pet-day-progress">
        <div class="pet-day-progress-head"><span>Progresso do Pacus</span><b>${d.progressPct}%</b></div>
        <div class="pet-day-track" aria-label="${d.elapsed} de ${d.totalIntervals} dias decorridos"><div class="pet-day-fill" style="width:${d.progressPct}%"></div></div>
      </div>
      <div class="pet-milestones">${milestoneHtml}</div>
      <div class="pet-caption">${caption}</div>
      <div id="petEvolvedBanner"></div>
      <div class="streak-strip">${buildStreakStrip()}</div>`;

    renderMiniPacus(d.stageFloat);
    wirePacusInteraction();
    renderPacusDialogue();
    startPacusDialogueTicking();

    if(grewNow){
      const mascot = el.querySelector('.pet-mascot');
      if(mascot){
        mascot.classList.remove('pet-growth-burst');
        void mascot.offsetWidth;
        mascot.classList.add('pet-growth-burst');
      }
    }

    if(d.stage > (Number(state.lastSeenPetStage) || 0)){
      state.lastSeenPetStage = d.stage;
      saveState(state);
    }
  };
})();
