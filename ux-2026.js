(() => {
  'use strict';

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
    const parts = text.split(/[–-]/).map(s => s.trim());
    if(parts.length < 2) return null;
    const parse = value => {
      const match = value.match(/^(\d{1,2}):(\d{2})/);
      return match ? Number(match[1]) * 60 + Number(match[2]) : null;
    };
    const start = parse(parts[0]);
    const end = parse(parts[parts.length - 1]);
    if(start == null || end == null) return null;
    return { start, end };
  }

  function getPreferredPeriodIndex(periods){
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const ranges = periods.map(period => {
      const time = period.dataset.periodTime || period.querySelector('.period .time')?.textContent || '';
      return parsePeriodTime(time);
    });

    const current = ranges.findIndex(range => range && minutes >= range.start && minutes <= range.end);
    if(current >= 0) return current;

    const upcoming = ranges.findIndex(range => range && minutes < range.start);
    if(upcoming >= 0) return upcoming;
    return Math.max(0, periods.length - 1);
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
      const summary = document.createElement('summary');
      const title = head.querySelector('h2');
      const label = title ? title.textContent : 'Período';
      summary.innerHTML = '<span>' + label + '</span><span class="ux-disclosure-hint">ver tarefas</span>';
      details.open = index === preferredIndex;
      details.appendChild(summary);

      const body = document.createElement('div');
      body.className = 'period-disclosure-body';
      Array.from(period.children).forEach(child => {
        if(child !== head && child !== list) body.appendChild(child);
      });
      details.appendChild(body);
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
    hideDecorativeUI();
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
  observer.observe(document.body, {childList: true, subtree: true});
})();
