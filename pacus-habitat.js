(() => {
  'use strict';

  const FACTS = [
    'O axolote consegue regenerar partes do corpo.',
    'Axolotes são anfíbios e passam a maior parte da vida na água.',
    'As brânquias externas ajudam o axolote a respirar dentro da água.',
    'Axolotes costumam ficar mais ativos quando há menos luz.',
    'O axolote tem uma aparência juvenil mesmo quando adulto.',
    'Axolotes podem respirar pela pele além de usar as brânquias.',
    'Na natureza, o axolote é nativo da região de Xochimilco, no México.',
    'Axolotes gostam de lugares com abrigo e pouca correnteza.',
    'Um axolote pode passar bastante tempo descansando sem precisar nadar continuamente.',
    'Os axolotes são carnívoros e usam o olfato para localizar alimento.',
    'As brânquias do axolote podem se movimentar suavemente na água.',
    'O axolote é um exemplo famoso de regeneração entre os vertebrados.'
  ];

  const SPOTS = [
    { x: 10, y: 58, name: 'entre as plantas' },
    { x: 29, y: 68, name: 'perto das pedras' },
    { x: 49, y: 54, name: 'no cantinho tranquilo' },
    { x: 69, y: 65, name: 'perto do abrigo' },
    { x: 86, y: 52, name: 'atrás das plantas' }
  ];

  const TODAY = () => {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
  };

  function ensureHabitat() {
    const section = document.getElementById('petSection');
    if (!section) return null;
    let habitat = section.querySelector('.pacus-habitat');
    if (!habitat) {
      habitat = document.createElement('div');
      habitat.className = 'pacus-habitat';
      habitat.setAttribute('aria-label', 'Ambiente do Pacus');
      habitat.innerHTML = `
        <div class="habitat-water" aria-hidden="true"></div>
        <div class="habitat-plants plant-left" aria-hidden="true"></div>
        <div class="habitat-plants plant-right" aria-hidden="true"></div>
        <div class="habitat-rock rock-one" aria-hidden="true"></div>
        <div class="habitat-rock rock-two" aria-hidden="true"></div>
        <div class="pacus-creature" aria-label="Pacus, o axolote"></div>
        <div class="pacus-shelter shelter-left" aria-hidden="true"><span></span></div>
        <div class="pacus-shelter shelter-right" aria-hidden="true"><span></span></div>
        <div class="pacus-fact" aria-live="polite"></div>`;
      section.appendChild(habitat);
    }
    return habitat;
  }

  function showFact(habitat) {
    const fact = habitat.querySelector('.pacus-fact');
    if (!fact) return;
    const key = `pacus-fact-${TODAY()}`;
    let index = Number(localStorage.getItem(key));
    if (!Number.isInteger(index)) {
      const day = Math.floor(new Date(TODAY() + 'T00:00:00').getTime() / 86400000);
      index = Math.abs(day) % FACTS.length;
      localStorage.setItem(key, String(index));
    }
    fact.textContent = `💡 Curiosidade: ${FACTS[index]}`;
    fact.classList.add('visible');
    setTimeout(() => fact.classList.remove('visible'), 8500);
  }

  function movePacus(habitat) {
    const creature = habitat.querySelector('.pacus-creature');
    if (!creature) return;
    const spot = SPOTS[Math.floor(Math.random() * SPOTS.length)];
    creature.style.setProperty('--pacus-x', `${spot.x}%`);
    creature.style.setProperty('--pacus-y', `${spot.y}%`);
    creature.classList.toggle('facing-left', spot.x > 55);
    creature.classList.remove('pacus-moving');
    void creature.offsetWidth;
    creature.classList.add('pacus-moving');
    if (Math.random() < 0.32) creature.classList.add('partially-hidden');
    else creature.classList.remove('partially-hidden');
  }

  function start() {
    const habitat = ensureHabitat();
    if (!habitat) return setTimeout(start, 300);
    setTimeout(() => showFact(habitat), 3500);
    setTimeout(() => movePacus(habitat), 1200);
    setInterval(() => movePacus(habitat), 30000);
    setInterval(() => showFact(habitat), 24 * 60 * 60 * 1000);
  }

  function loadCalendarGrowth(){
    if(document.getElementById('pacusCalendarGrowthScript')) return;
    const script = document.createElement('script');
    script.id = 'pacusCalendarGrowthScript';
    script.src = 'pacus-calendar-growth.js?v=20260823-1';
    script.onload = () => { if(typeof window.renderPet === 'function') window.renderPet(); };
    document.head.appendChild(script);
  }

  loadCalendarGrowth();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
