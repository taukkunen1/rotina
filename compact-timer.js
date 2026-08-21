(function(){
  'use strict';
  const root=document.getElementById('compactTimer');
  if(!root) return;
  const display=document.getElementById('compactTimerDisplay');
  const hours=document.getElementById('timerHours');
  const minutes=document.getElementById('timerMinutes');
  const start=document.getElementById('timerStart');
  const reset=document.getElementById('timerReset');
  const minus=document.getElementById('timerMinus');
  const plus=document.getElementById('timerPlus');
  let remaining=0, interval=null, running=false;
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function getInputSeconds(){return clamp(Number(hours.value)||0,0,23)*3600+clamp(Number(minutes.value)||0,0,59)*60;}
  function syncInputs(seconds){const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60);hours.value=h;minutes.value=m;}
  function render(){const h=Math.floor(remaining/3600),m=Math.floor((remaining%3600)/60),s=remaining%60;display.textContent=(h>0?String(h).padStart(2,'0')+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');root.classList.toggle('is-running',running);root.classList.toggle('is-finished',remaining===0&&!running);start.textContent=running?'Ⅱ':'▶';start.title=running?'Pausar':'Iniciar';}
  function stop(){if(interval){clearInterval(interval);interval=null;}running=false;render();}
  function tick(){if(remaining<=0){stop();return;}remaining--;if(remaining<=0){stop();try{navigator.vibrate&&navigator.vibrate([120,70,120]);}catch(e){}return;}render();}
  function begin(){if(remaining<=0){remaining=getInputSeconds();if(remaining<=0){remaining=5*60;syncInputs(remaining);}}running=true;render();interval=setInterval(tick,1000);}
  start.addEventListener('click',function(){running?stop():begin();});
  reset.addEventListener('click',function(){stop();remaining=getInputSeconds();render();});
  function adjust(delta){const base=running?remaining:getInputSeconds();remaining=clamp(base+delta,0,23*3600+59*60);syncInputs(remaining);render();}
  minus.addEventListener('click',()=>adjust(-60));plus.addEventListener('click',()=>adjust(60));
  [hours,minutes].forEach(input=>input.addEventListener('change',function(){hours.value=clamp(Number(hours.value)||0,0,23);minutes.value=clamp(Number(minutes.value)||0,0,59);if(!running){remaining=getInputSeconds();render();}}));
  remaining=getInputSeconds();render();
})();
