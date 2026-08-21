(() => {
  'use strict';

  function loadScript(src, marker, onload){
    const normalized=src.replace(/^\.\//,'');
    if(document.querySelector(`script[${marker}], script[src$="${normalized}"]`)) return;
    const script=document.createElement('script');
    script.src=src;
    script.defer=true;
    script.setAttribute(marker,'1');
    if(onload) script.onload=onload;
    script.onerror=()=>console.warn(`Failed to load ${src}`);
    document.head.appendChild(script);
  }

  function start(){
    if(window.RotinaUI) window.RotinaUI.start();
    else loadScript('app-ui.js','data-rotina-ui',()=>window.RotinaUI?.start());
    loadScript('autonomy.js','data-rotina-autonomy');
  }

  window.RotinaApp=Object.freeze({start});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
