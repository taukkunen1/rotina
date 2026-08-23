(function(){
  'use strict';

  const SECONDARY = ['mark-help','mark-na','mark-x'];
  const HIDDEN_FUNCTIONS = [
    'renderHair',
    'renderInvisibleWinsCard',
    'renderWeeklyReview',
    'renderRewards',
    'renderFamilyGameNightAnnouncement',
    'renderWeeklyNewsAnnouncement',
    'renderAchievementMural'
  ];

  HIDDEN_FUNCTIONS.forEach(function(name){
    try { if (typeof window[name] === 'function') window[name] = function(){}; } catch(e) {}
  });

  /* Confetti and decorative bursts consume attention without improving task completion. */
  try { window.fireConfetti = function(){}; } catch(e) {}

  function scrubVisibleHectorReferences(root){
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(function(textNode){
      const value = textNode.nodeValue || '';
      if (/hector/i.test(value)) textNode.nodeValue = value.replace(/hector/gi, 'rotina');
    });
    root && root.querySelectorAll && root.querySelectorAll('[title],[aria-label]').forEach(function(el){
      ['title','aria-label'].forEach(function(attr){
        const value = el.getAttribute(attr);
        if(value && /hector/i.test(value)) el.setAttribute(attr, value.replace(/hector/gi,'rotina'));
      });
    });
  }

  function compactTaskActions(){
    document.querySelectorAll('.task .mark-group').forEach(function(group){
      if(group.querySelector('.task-secondary-actions')) return;
      const secondary = Array.from(group.children).filter(function(el){
        return SECONDARY.some(function(cls){ return el.classList.contains(cls); });
      });
      if(!secondary.length) return;

      const details = document.createElement('details');
      details.className = 'task-secondary-actions';
      details.setAttribute('aria-label','Outras opções');
      const summary = document.createElement('summary');
      summary.textContent = 'mais';
      summary.title = 'Outras opções para esta tarefa';
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
        if(btn.getAttribute('aria-label') !== entry[1]) btn.setAttribute('aria-label',entry[1]);
      });
    });
    document.querySelectorAll('.task-secondary-actions summary').forEach(function(s){
      if(s.getAttribute('role') !== 'button') s.setAttribute('role','button');
      if(s.getAttribute('tabindex') !== '0') s.setAttribute('tabindex','0');
    });
  }

  function compactSecondaryPeriods(){
    const periods = document.querySelectorAll('.period');
    periods.forEach(function(period, index){
      if(index === 0 || period.dataset.uxDisclosure === '1') return;
      const head = period.querySelector(':scope > .period-head');
      const list = period.querySelector(':scope > .tasks');
      if(!head || !list) return;

      const details = document.createElement('details');
      details.className = 'period-disclosure';
      details.open = index === 1;
      const summary = document.createElement('summary');
      const title = head.querySelector('h2');
      const label = title ? title.textContent : 'Período';
      summary.innerHTML = '<span>' + label + '</span><span class="ux-disclosure-hint">ver tarefas</span>';
      details.appendChild(summary);

      const body = document.createElement('div');
      body.className = 'period-disclosure-body';
      Array.from(period.children).forEach(function(child){
        if(child === head || child === list) return;
        body.appendChild(child);
      });
      details.appendChild(body);
      details.appendChild(list);
      period.replaceChildren(details);
      period.dataset.uxDisclosure = '1';
    });
  }

  let scheduled = false;
  function applyUX(){
    scheduled = false;
    compactTaskActions();
    improveLabels();
    compactSecondaryPeriods();
    scrubVisibleHectorReferences(document.body);
    document.querySelectorAll('#legacyRuntimeMounts').forEach(function(el){
      if(el.getAttribute('aria-hidden') !== 'true') el.setAttribute('aria-hidden','true');
    });
  }

  function scheduleApply(){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(applyUX);
  }

  applyUX();
  const observer = new MutationObserver(scheduleApply);
  observer.observe(document.body,{childList:true,subtree:true});
  document.documentElement.classList.add('ux-2026');
})();
