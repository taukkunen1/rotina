(() => {
  'use strict';
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PET = () => document.getElementById('petSection');
  const POSITIONS = [
    {x:10,y:8,scale:1}, {x:38,y:12,scale:.96}, {x:68,y:8,scale:1.02},
    {x:78,y:48,scale:.94}, {x:48,y:58,scale:1}, {x:18,y:48,scale:.98}
  ];
  let index=0, timer=null;

  function ensureHabitat(){
    const pet=PET();
    if(!pet || pet.querySelector('.pacus-habitat')) return;
    const habitat=document.createElement('div');
    habitat.className='pacus-habitat';
    habitat.innerHTML=`
      <div class="pacus-shelter pacus-shelter-rock" aria-hidden="true"><span></span></div>
      <div class="pacus-shelter pacus-shelter-leaf" aria-hidden="true"><span></span></div>`;
    pet.appendChild(habitat);
  }

  function findPacus(){
    const pet=PET();
    if(!pet) return null;
    return pet.querySelector('.pet-mascot') || pet.querySelector('[class*="pacus"]');
  }

  function move(){
    const pacus=findPacus();
    if(!pacus) return;
    index=(index+1)%POSITIONS.length;
    const p=POSITIONS[index];
    pacus.classList.remove('pacus-moving');
    void pacus.offsetWidth;
    pacus.style.setProperty('--pacus-x',`${p.x}%`);
    pacus.style.setProperty('--pacus-y',`${p.y}%`);
    pacus.style.setProperty('--pacus-scale',p.scale);
    pacus.classList.add('pacus-moving');
  }

  function start(){
    ensureHabitat();
    if(REDUCED) return;
    if(timer) clearInterval(timer);
    timer=setInterval(move, 18000);
  }

  function boot(){
    let tries=0;
    const wait=setInterval(()=>{
      tries++;
      if(PET()){
        clearInterval(wait);
        start();
      }
      if(tries>100) clearInterval(wait);
    },100);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
