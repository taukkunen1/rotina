(() => {
  'use strict';

  function loadStyles(){
    if(document.querySelector('link[data-rotina-ui]')) return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='ui.css';
    link.dataset.rotinaUi='1';
    document.head.appendChild(link);
  }

  function sectionByText(text){
    return [...document.querySelectorAll('details,section,div')].find(el => {
      const summary=el.querySelector(':scope > summary');
      return summary && summary.textContent.trim().toLowerCase().includes(text.toLowerCase());
    }) || null;
  }

  function removeSection(label){
    const el=sectionByText(label);
    if(el) el.remove();
  }

  function moveTimerCompact(){
    if(document.getElementById('compact-game-timer')) return;
    const timer=document.querySelector('.game-timer');
    const top=document.querySelector('.topbar-right');
    if(!timer||!top) return;
    const box=document.createElement('div');
    box.id='compact-game-timer';
    box.setAttribute('aria-label','Timer');
    timer.parentNode.insertBefore(box,timer);
    box.appendChild(timer);
    top.appendChild(box);
  }

  function removeMainDistractions(){
    ['Timers','Vi algo legal','Mural de Conquistas do Pacus'].forEach(removeSection);
    document.querySelectorAll('[id*="positiveBehavior" i],[id*="achievementMural" i]').forEach(el => {
      const container=el.closest('details,section,div');
      if(container) container.remove();
    });
  }

  function hideAdultOnlyOnMain(){
    ['Histórico de hoje','Histórico dos dias'].forEach(label => {
      const el=sectionByText(label);
      if(el) el.style.display='none';
    });
    const drive=document.getElementById('driveSyncSection');
    if(drive) drive.style.display='none';
    const footer=document.querySelector('.content > footer');
    if(footer) footer.style.display='none';
  }

  function addAdultsLink(){
    if(document.getElementById('adults-page-link')) return;
    const target=document.querySelector('.topbar-right') || document.querySelector('header') || document.body;
    const link=document.createElement('a');
    link.id='adults-page-link';
    link.href='adultos.html';
    link.textContent='🔒 Adultos';
    link.setAttribute('aria-label','Abrir painel dos adultos');
    target.appendChild(link);
  }

  function start(){
    loadStyles();
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(document.querySelector('.content')){
        clearInterval(timer);
        removeMainDistractions();
        moveTimerCompact();
        hideAdultOnlyOnMain();
        addAdultsLink();
      }
      if(tries>100) clearInterval(timer);
    },100);
  }

  window.RotinaUI={start};
})();
