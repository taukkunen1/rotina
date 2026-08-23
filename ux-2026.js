(function(){
  'use strict';

  // Home cleanup: keep the child-facing screen focused on the routine itself.
  const DECORATIVE_SELECTORS = [
    '#breathingBtn',
    '#hairSection',
    '#invisibleWinsCard',
    '#weeklyNewsAnnouncement',
    '#familyGameNightAnnouncement',
    '#freshStartArea',
    '#achievementMuralSection',
    '.streak-strip',
    '.block-collapsible:has(#rewards)',
    '.block-collapsible:has(#weeklyReviewSection)',
    '.confetti-piece',
    '.points-delta',
    '.mini-pacus'
  ];

  const SECONDARY_ACTIONS = ['mark-help','mark-na','mark-x'];

  function compactTaskActions(){
    document.querySelectorAll('.task .mark-group').forEach(function(group){
      if(group.querySelector('.task-secondary-actions')) return;
      const secondary = Array.from(group.children).filter(function(el){
        return SECONDARY_ACTIONS.some(function(cls){ return el.classList.contains(cls); });
      });
      if(!secondary.length) return;

      const details = document.createElement('details');
      details.className = 'task-secondary-actions';
      const summary = document.createElement('summary');
      summary.textContent = 'mais';
      summary.setAttribute('aria-label','Outras opções');
      details.appendChild(summary);
      secondary.forEach(function(el){ details.appendChild(el); });
      group.appendChild(details);
    });
  }

  function improveLabels(){
    const labels = {
      '.mark-done':'Marcar como concluída',
      '.mark-help':'Pedir ajuda ou fazer junto',
      '.mark-na':'Marcar como não aplicável hoje',
      '.mark-x':'Marcar como não realizado'
    };
    Object.entries(labels).forEach(function(entry){
      document.querySelectorAll(entry[0]).forEach(function(btn){
        btn.setAttribute('aria-label', entry[1]);
      });
    });
  }

  function compactPeriods(){
    document.querySelectorAll('.period').forEach(function(period, index){
      if(period.dataset.uxDisclosure === '1') return;
      const head = period.querySelector(':scope > .period-head');
      const list = period.querySelector(':scope > .tasks');
      if(!head || !list) return;

      const details = document.createElement('details');
      details.className = 'period-disclosure';
      details.open = index === 0;

      const summary = document.createElement('summary');
      const title = head.querySelector('h2');
      summary.textContent = title ? title.textContent : 'Período';
      details.appendChild(summary);

      const body = document.createElement('div');
      body.className = 'period-disclosure-body';
      Array.from(period.children).forEach(function(child){
        if(child !== head && child !== list) body.appendChild(child);
      });
      details.appendChild(body);
      details.appendChild(list);
      period.replaceChildren(details);
      period.dataset.uxDisclosure = '1';
    });
  }

  function hideDecorativeUI(){
    DECORATIVE_SELECTORS.forEach(function(selector){
      document.querySelectorAll(selector).forEach(function(el){
        el.setAttribute('aria-hidden','true');
      });
    });
  }

  function stopDecorativeEffects(){
    try { window.fireConfetti = function(){}; } catch(e) {}
    document.documentElement.classList.add('ux-2026');
  }

  let scheduled = false;
  function apply(){
    scheduled = false;
    hideDecorativeUI();
    compactTaskActions();
    improveLabels();
    compactPeriods();
    stopDecorativeEffects();
  }

  function schedule(){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(apply);
  }

  apply();
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, {childList:true, subtree:true});
})();
