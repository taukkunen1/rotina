(() => {
  'use strict';

  const LEGACY_LABELS = [
    'Timers',
    'Vi algo legal',
    'Mural de Conquistas do Pacus',
    'Histórico de hoje',
    'Histórico dos dias'
  ];

  function loadStyles(){
    if(document.querySelector('link[data-rotina-ui]')) return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='ui.css';
    link.dataset.rotinaUi='1';
    document.head.appendChild(link);
  }

  function sectionByText(text){
    return [...document.querySelectorAll('details')].find(el => {
      const summary=el.querySelector(':scope > summary');
      return summary && summary.textContent.trim().toLowerCase().includes(text.toLowerCase());
    }) || null;
  }

  function hideSection(label){
    const el=sectionByText(label);
    if(el){
      el.hidden=true;
      el.setAttribute('data-main-hidden','true');
    }
  }

  function hideMainDistractions(){
    LEGACY_LABELS.forEach(hideSection);
    const drive=document.getElementById('driveSyncSection');
    if(drive) drive.hidden=true;
    const footer=document.querySelector('.content > footer');
    if(footer) footer.hidden=true;
  }

  function moveTimerCompact(){
    if(document.getElementById('compact-game-timer')) return;
    const timer=document.querySelector('.game-timer');
    const top=document.querySelector('.topbar-right');
    if(!timer || !top) return;
    const box=document.createElement('div');
    box.id='compact-game-timer';
    box.setAttribute('aria-label','Timer');
    timer.parentNode.insertBefore(box,timer);
    box.appendChild(timer);
    top.appendChild(box);
  }

  function addAdultsLink(){
    if(document.getElementById('adults-page-link')) return;
    const target=document.querySelector('.topbar-right');
    if(!target) return;
    const link=document.createElement('a');
    link.id='adults-page-link';
    link.href='adultos.html';
    link.textContent='🔒 Adultos';
    link.setAttribute('aria-label','Abrir painel dos adultos');
    target.appendChild(link);
  }

  function apply(){
    loadStyles();
    hideMainDistractions();
    moveTimerCompact();
    addAdultsLink();
  }

  function start(){
    apply();
    const observer=new MutationObserver(apply);
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),5000);
  }

  window.RotinaUI={start};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
