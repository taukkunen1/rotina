(function(){
  'use strict';

  const SECONDARY = ['mark-help', 'mark-na', 'mark-x'];
  const HIDDEN_SELECTORS = [
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

  function scrubVisibleHectorReferences(root){
    const scope = root || document.body;
    if(!scope) return;
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(textNode => {
      const value = textNode.nodeValue || '';
      if(/hector/i.test(value)) textNode.nodeValue = value.replace(/hector/gi, 'rotina');
    });
  }

  function compactTaskActions(){
    document.querySelectorAll('.task .mark-group').forEach(group => {
      if(group.querySelector('.task-secondary-actions')) return;
      const secondary = Array.from(group.children).filter(el => SECONDARY.some(cls => el.classList.contains(cls)));
      if(!secondary.length) return;

      const details = document.createElement('details');
      details.className = 'task-secondary-actions';
      const summary = document.createElement('summary');
      summary.textContent = 'mais';
      summary.setAttribute('aria-label', 'Outras opções para esta tarefa');
      details.appendChild(summary);
      secondary.forEach(el => details.appendChild(el));
      group.appendChild(details);
    });
  }

  function improveLabels(){
    const labels = {
      '.mark-done': 'Marcar como concluída',
      '.mark-help': 'Pedir ajuda ou fazer junto',
      '.mark-na': 'Marcar como não aplicável hoje',
      '.mark-x': 'Marcar como não realizado'
    };

    Object.entries(labels).forEach(([selector, label]) => {
      document.querySelectorAll(selector).forEach(button => {
        button.setAttribute('aria-label', label);
        button.setAttribute('type', 'button');
      });
    });
  }

  function parsePeriodTime(text){
    if(!text) return null;
    const parts = text.split(/[–-]/).map(value => value.trim());
    if(parts.length < 2) return null;

    const parseTime = value => {
      const match = value.match(/^(\d{1,2}):(\d{2})/);
      return match ? Number(match[1]) * 60 + Number(match[2]) : null;
    };

    const start = parseTime(parts[0]);
    const end = parseTime(parts[parts.length - 1]);
    return start == null || end == null ? null : {start, end};
  }

  function getPreferredPeriodIndex(periods){
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const ranges = periods.map(period => parsePeriodTime(
      period.dataset.periodTime || period.querySelector('.time')?.textContent || ''
    ));
    const current = ranges.findIndex(range => range && minutes >= range.start && minutes <= range.end);
    if(current >= 0) return current;
    const upcoming = ranges.findIndex(range => range && minutes < range.start);
    return upcoming >= 0 ? upcoming : Math.max(0, periods.length - 1);
  }

  function compactPeriods(){
    const periods = Array.from(document.querySelectorAll('.period'));
    if(!periods.length) return;

    const preferredIndex = getPreferredPeriodIndex(periods);
    periods.forEach((period, index) => {
      if(period.dataset.uxDisclosure === '1') return;

      const head = period.querySelector(':scope > .period-head');
      const list = period.querySelector(':scope > .tasks');
      if(!head || !list) return;

      const details = document.createElement('details');
      details.className = 'period-disclosure';
      details.open = index === preferredIndex;

      const summary = document.createElement('summary');
      const titleElement = head.querySelector('h2');
      const label = titleElement ? titleElement.textContent : 'Período';
      const labelSpan = document.createElement('span');
      labelSpan.textContent = label;
      const hintSpan = document.createElement('span');
      hintSpan.className = 'ux-disclosure-hint';
      hintSpan.textContent = 'ver tarefas';
      summary.append(labelSpan, hintSpan);
      details.appendChild(summary);

      const body = document.createElement('div');
      body.className = 'period-disclosure-body';
      Array.from(period.children).forEach(child => {
        if(child !== head && child !== list) body.appendChild(child);
      });
      if(body.childNodes.length) details.appendChild(body);

      details.appendChild(list);
      period.replaceChildren(details);
      period.dataset.uxDisclosure = '1';
    });
  }

  function hideDecorativeUI(){
    HIDDEN_SELECTORS.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.hidden = true;
        el.setAttribute('aria-hidden', 'true');
      });
    });
  }

  function stopDecorativeEffects(){
    try { window.fireConfetti = function(){}; } catch(error) {}
    document.documentElement.classList.add('ux-2026');
  }

  let scheduled = false;
  function apply(){
    scheduled = false;
    compactTaskActions();
    improveLabels();
    compactPeriods();
    hideDecorativeUI();
    scrubVisibleHectorReferences();
    document.querySelectorAll('#legacyRuntimeMounts').forEach(el => el.setAttribute('aria-hidden', 'true'));
    stopDecorativeEffects();
  }

  function schedule(){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(apply);
  }

  function observe(){
    if(document.body) {
      new MutationObserver(schedule).observe(document.body, {childList:true, subtree:true});
    }
  }

  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      apply();
      observe();
    }, {once:true});
  } else {
    apply();
    observe();
  }
})();
