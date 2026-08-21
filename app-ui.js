(() => {
  'use strict';

  const REMOVED_LABELS = [
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

  function removeNode(node){
    if(node && node.parentNode) node.parentNode.removeChild(node);
  }

  function removeLegacyMainUi(){
    REMOVED_LABELS.forEach(label => removeNode(sectionByText(label)));
    removeNode(document.getElementById('driveSyncSection'));
    removeNode(document.querySelector('.content > footer'));
    removeNode(document.getElementById('dayOverlay'));
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
    moveTimerCompact();
    addAdultsLink();
    removeLegacyMainUi();
  }

  function start(){
    // Espera a inicialização do aplicativo terminar antes de remover os
    // contêineres legados que ainda eram consultados durante o bootstrap.
    setTimeout(apply, 0);
    setTimeout(apply, 300);
    setTimeout(apply, 1000);
  }

  window.RotinaUI={start};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
