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

  function moveNamedToAdult(label, tools){
    const el=sectionByText(label);
    if(!el||el.closest('#adult-tools')) return;
    const group=document.createElement('div');
    group.className='adult-tools-group';
    group.appendChild(el);
    tools.appendChild(group);
  }

  function moveToolsToAdult(){
    const overlay=document.getElementById('overlay');
    if(!overlay||document.getElementById('adult-tools')) return false;
    const editor=overlay.querySelector('.editor');
    const anchor=editor?.querySelector('.editor-footer');
    if(!editor||!anchor) return false;

    const tools=document.createElement('section');
    tools.id='adult-tools';
    tools.innerHTML='<h3>🔒 Painel dos adultos</h3>';
    moveNamedToAdult('Histórico de hoje',tools);
    moveNamedToAdult('Histórico dos dias',tools);

    const drive=document.getElementById('driveSyncSection');
    if(drive){
      const group=document.createElement('div');
      group.className='adult-tools-group';
      group.appendChild(drive);
      tools.appendChild(group);
    }

    const footer=document.querySelector('.content > footer');
    if(footer){
      const group=document.createElement('div');
      group.className='adult-tools-group';
      group.appendChild(footer);
      tools.appendChild(group);
    }

    editor.insertBefore(tools,anchor);
    return true;
  }

  function hideAdultOnlyOnMain(){
    ['Histórico de hoje','Histórico dos dias'].forEach(label => {
      const el=sectionByText(label);
      if(el&&!el.closest('#adult-tools')) el.style.display='none';
    });
    const drive=document.getElementById('driveSyncSection');
    if(drive&&!drive.closest('#adult-tools')) drive.style.display='none';
    const footer=document.querySelector('.content > footer');
    if(footer&&!footer.closest('#adult-tools')) footer.style.display='none';
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
        const adultTimer=setInterval(()=>{
          if(moveToolsToAdult()||tries>100) clearInterval(adultTimer);
        },250);
      }
      if(tries>100) clearInterval(timer);
    },100);
  }

  window.RotinaUI={start};
})();
