(function(){
  'use strict';
  const topbar=document.querySelector('.topbar-right');
  if(!topbar||document.getElementById('compactTimer')) return;
  const root=document.createElement('div');
  root.className='compact-timer';root.id='compactTimer';root.setAttribute('aria-label','Cronômetro ajustável');
  root.innerHTML='<span class="timer-readout" id="compactTimerDisplay">05:00</span><div class="timer-controls"><button class="timer-btn primary" id="timerStart" type="button" title="Iniciar">▶</button><button class="timer-btn" id="timerReset" type="button" title="Reiniciar">↺</button></div><div class="timer-set"><button class="timer-btn" id="timerMinus" type="button" title="Menos 1 minuto">−</button><label><input id="timerHours" type="number" min="0" max="23" value="0" aria-label="Horas">h</label><span class="timer-set-sep">:</span><label><input id="timerMinutes" type="number" min="0" max="59" value="5" aria-label="Minutos">m</label><button class="timer-btn" id="timerPlus" type="button" title="Mais 1 minuto">+</button></div>';
  topbar.insertBefore(root,topbar.firstChild);
  const display=document.getElementById('compactTimerDisplay'),hours=document.getElementById('timerHours'),minutes=document.getElementById('timerMinutes'),start=document.getElementById('timerStart'),reset=document.getElementById('timerReset'),minus=document.getElementById('timerMinus'),plus=document.getElementById('timerPlus');
  let remaining=300,interval=null,running=false;
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function getInputSeconds(){return clamp(Number(hours.value)||0,0,23)*3600+clamp(Number(minutes.value)||0,0,59)*60;}
  function syncInputs(seconds){hours.value=Math.floor(seconds/3600);minutes.value=Math.floor((seconds%3600)/60);}
  function render(){const h=Math.floor(remaining/3600),m=Math.floor((remaining%3600)/60),s=remaining%60;display.textContent=(h>0?String(h).padStart(2,'0')+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');root.classList.toggle('is-running',running);root.classList.toggle('is-finished',remaining===0&&!running);start.textContent=running?'Ⅱ':'▶';start.title=running?'Pausar':'Iniciar';}
  function stop(){if(interval){clearInterval(interval);interval=null;}running=false;render();}
  function tick(){if(remaining<=0){stop();return;}remaining--;if(remaining<=0){stop();try{navigator.vibrate&&navigator.vibrate([120,70,120]);}catch(e){}return;}render();}
  function begin(){if(remaining<=0){remaining=getInputSeconds();if(remaining<=0){remaining=300;syncInputs(remaining);}}running=true;render();interval=setInterval(tick,1000);}
  start.addEventListener('click',()=>running?stop():begin());
  reset.addEventListener('click',()=>{stop();remaining=getInputSeconds();render();});
  function adjust(delta){const base=running?remaining:getInputSeconds();remaining=clamp(base+delta,0,23*3600+59*60);syncInputs(remaining);render();}
  minus.addEventListener('click',()=>adjust(-60));plus.addEventListener('click',()=>adjust(60));
  [hours,minutes].forEach(input=>input.addEventListener('change',()=>{hours.value=clamp(Number(hours.value)||0,0,23);minutes.value=clamp(Number(minutes.value)||0,0,59);if(!running){remaining=getInputSeconds();render();}}));
  render();
})();
