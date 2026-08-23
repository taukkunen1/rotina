(() => {
  'use strict';
  const FACTS=[
    'O axolote consegue regenerar partes do corpo.',
    'Axolotes são anfíbios e passam a maior parte da vida na água.',
    'As brânquias externas ajudam o axolote a respirar dentro da água.',
    'Axolotes costumam ficar mais ativos quando há menos luz.',
    'O axolote mantém uma aparência juvenil mesmo quando adulto.',
    'As brânquias do axolote podem se movimentar suavemente na água.',
    'Na natureza, o axolote é nativo de Xochimilco, no México.',
    'Axolotes procuram abrigo e águas com pouca correnteza.',
    'Um axolote pode passar bastante tempo descansando sem nadar.',
    'Axolotes usam principalmente o olfato para localizar alimento.',
    'O corpo alongado e a cauda ajudam o axolote a nadar.',
    'O axolote é um exemplo famoso de regeneração entre os vertebrados.'
  ];
  const SPOTS=[
    {x:12,y:68,name:'entre as plantas'}, {x:27,y:62,name:'perto das pedras'},
    {x:46,y:72,name:'sobre a areia'}, {x:64,y:57,name:'perto do abrigo'},
    {x:82,y:69,name:'atrás das plantas'}, {x:72,y:42,name:'na água calma'},
    {x:34,y:45,name:'explorando devagar'}
  ];
  const START=new Date('2026-08-09T00:00:00').getTime();
  const END=new Date('2026-08-31T23:59:59').getTime();
  let moveTimer=null,factTimer=null,observedSection=null,observer=null,currentSpot=null;

  function todayKey(){const d=new Date(),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;}
  function factIndexForToday(){return Math.abs(Math.floor(new Date(todayKey()+'T00:00:00').getTime()/86400000))%FACTS.length;}
  function growth(){return Math.max(0,Math.min(1,(Date.now()-START)/(END-START)));}
  function stage(){const p=growth();return p<.2?'egg':p<.45?'hatchling':p<.7?'baby':p<.9?'young':'adult';}
  function ensureHabitat(){
    const section=document.getElementById('petSection'); if(!section)return null;
    let habitat=section.querySelector('.pacus-habitat');
    if(!habitat){
      habitat=document.createElement('div'); habitat.className='pacus-habitat'; habitat.setAttribute('aria-label','Habitat do Pacus');
      habitat.innerHTML=`<div class="habitat-water"></div><div class="habitat-surface"></div><div class="habitat-sand"></div><div class="habitat-plants plant-left"></div><div class="habitat-plants plant-mid"></div><div class="habitat-plants plant-right"></div><div class="habitat-rock rock-one"></div><div class="habitat-rock rock-two"></div><div class="pacus-creature" role="img" aria-label="Pacus, o axolote"></div><div class="pacus-shelter shelter-left"><span></span></div><div class="pacus-shelter shelter-right"><span></span></div><div class="pacus-fact" aria-live="polite"></div>`;
      section.appendChild(habitat);
    }
    habitat.dataset.stage=stage(); habitat.style.setProperty('--growth',growth()); return habitat;
  }
  function showFact(h){const f=h&&h.querySelector('.pacus-fact');if(!f)return;f.textContent=`💡 Curiosidade: ${FACTS[factIndexForToday()]}`;f.classList.add('visible');setTimeout(()=>f.classList.remove('visible'),8500);}
  function nextSpot(){let choices=SPOTS.filter(s=>s!==currentSpot);const spot=choices[Math.floor(Math.random()*choices.length)];currentSpot=spot;return spot;}
  function movePacus(h){
    if(!h||!h.isConnected)return;const c=h.querySelector('.pacus-creature');if(!c)return;
    const spot=nextSpot(); c.style.left=`${spot.x}%`;c.style.top=`${spot.y}%`;c.classList.toggle('facing-left',spot.x>50);
    c.classList.toggle('partially-hidden',Math.random()<.28);c.classList.add('pacus-moving');
  }
  function scheduleMove(){
    clearTimeout(moveTimer);
    const delay=30000+Math.floor(Math.random()*35000); // 30–65 s parado/explorando
    moveTimer=setTimeout(()=>{movePacus(ensureHabitat());scheduleMove();},delay);
  }
  function startMovement(h){clearTimeout(moveTimer);movePacus(h);scheduleMove();}
  function startFacts(h){clearInterval(factTimer);setTimeout(()=>showFact(h),7000);factTimer=setInterval(()=>showFact(ensureHabitat()),24*60*60*1000);}
  function attachObserver(){const s=document.getElementById('petSection');if(!s||s===observedSection)return;if(observer)observer.disconnect();observedSection=s;observer=new MutationObserver(()=>{if(!s.querySelector('.pacus-habitat')){currentSpot=null;const h=ensureHabitat();movePacus(h);}});observer.observe(s,{childList:true});}
  function start(){const h=ensureHabitat();if(!h)return setTimeout(start,300);attachObserver();startMovement(h);startFacts(h);}
  function loadCalendarGrowth(){if(document.getElementById('pacusCalendarGrowthScript'))return;const s=document.createElement('script');s.id='pacusCalendarGrowthScript';s.src='pacus-calendar-growth.js?v=20260823-2';s.onload=()=>{if(typeof window.renderPet==='function')window.renderPet();requestAnimationFrame(start);};document.head.appendChild(s);}
  loadCalendarGrowth();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();