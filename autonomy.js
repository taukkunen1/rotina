(() => {
  'use strict';

  const TODAY = () => {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  };

  const MISSIONS = [
    { key:'mochila', icon:'🎒', text:'Preparar a mochila para o próximo compromisso.' },
    { key:'roupa', icon:'👕', text:'Separar a roupa que vai usar.' },
    { key:'material', icon:'📚', text:'Organizar o próprio material.' },
    { key:'espaco', icon:'🧹', text:'Arrumar o próprio espaço.' },
    { key:'lanche', icon:'🍎', text:'Preparar um lanche simples e seguro.' },
    { key:'checklist', icon:'🧼', text:'Seguir sozinho o checklist de uma rotina.' },
    { key:'pendencia', icon:'🧩', text:'Tentar resolver uma pequena pendência antes de pedir ajuda.' }
  ];

  const LEVELS = ['Pequeno desafio','Algo que dá um friozinho','Um passo fora do confortável','Desafio corajoso','Grande passo'];

  function missionForDay(iso){
    const n=Number(iso.replaceAll('-', ''))||0;
    return MISSIONS[n%MISSIONS.length];
  }

  function ensureState(){
    if(typeof state==='undefined') return null;
    if(!state.autonomy||typeof state.autonomy!=='object') state.autonomy={};
    const today=TODAY();
    if(state.autonomy.date!==today){
      const previousLevel=Number(state.autonomy?.courage?.level)||1;
      state.autonomy={date:today,courage:{level:previousLevel,practiced:false},mission:{key:missionForDay(today).key,status:null}};
    }
    state.autonomy.courage ||= {level:1,practiced:false};
    state.autonomy.mission ||= {key:missionForDay(today).key,status:null};
    state.autonomy.courage.level=Math.min(5,Math.max(1,Number(state.autonomy.courage.level)||1));
    return state.autonomy;
  }

  function persist(){
    try{
      if(typeof saveState==='function') saveState(state);
      else if(typeof STORAGE_STATE_KEY!=='undefined') localStorage.setItem(STORAGE_STATE_KEY,JSON.stringify(state));
    }catch(error){ console.warn('Autonomy save failed',error); }
  }

  function mountAutonomy(){
    if(document.getElementById('autonomy-tools')) return;
    const host=document.querySelector('.content');
    if(!host) return;

    const section=document.createElement('section');
    section.id='autonomy-tools';
    section.innerHTML=`
      <div class="autonomy-heading">🌱 Autonomia e coragem</div>
      <div class="autonomy-grid">
        <article class="autonomy-card" id="courage-card"></article>
        <article class="autonomy-card" id="mission-card"></article>
      </div>
      <article class="board-reminder" aria-label="Lembretes da lousa">
        <div class="board-reminder-title">🧑‍🎨 Lembretes da lousa</div>
        <p>🧩 <strong>Problema meu, solução minha:</strong> anote um pequeno problema de hoje e pense em opções antes de pedir que um adulto resolva.</p>
        <p>🙂 <strong>Como estou me sentindo?</strong> desenhe um rosto na lousa mostrando como você está hoje.</p>
        <div class="board-reminder-note">Sem pontos e sem cobrança automática. É uma prática diária na lousa.</div>
      </article>`;
    host.appendChild(section);

    section.addEventListener('click',event=>{
      const button=event.target.closest('button[data-autonomy-action]');
      if(!button) return;
      const autonomy=ensureState();
      if(!autonomy) return;
      const action=button.dataset.autonomyAction;
      if(action==='practice') autonomy.courage.practiced=!autonomy.courage.practiced;
      if(action==='advance') autonomy.courage.level=Math.min(5,autonomy.courage.level+1);
      if(action==='independent') autonomy.mission.status='independent';
      if(action==='help') autonomy.mission.status='help';
      persist();
      renderAutonomy();
    });

    renderAutonomy();
  }

  function renderAutonomy(){
    const autonomy=ensureState();
    const courageCard=document.getElementById('courage-card');
    const missionCard=document.getElementById('mission-card');
    if(!autonomy||!courageCard||!missionCard) return;

    const level=autonomy.courage.level;
    courageCard.innerHTML=`<h3>🦁 Escada da Coragem</h3><p>${LEVELS[level-1]}</p><div class="autonomy-steps">${[1,2,3,4,5].map(n=>`<span class="autonomy-step ${n<=level?'active':''}"></span>`).join('')}</div><p>${autonomy.courage.practiced?'Hoje você praticou. Coragem também é tentar.':'Escolha um pequeno desafio e pratique hoje.'}</p><div class="autonomy-actions"><button class="autonomy-btn primary" data-autonomy-action="practice">${autonomy.courage.practiced?'✓ Pratiquei hoje':'Pratiquei hoje'}</button>${level<5?'<button class="autonomy-btn" data-autonomy-action="advance">Avançar degrau</button>':''}</div>`;

    const mission=MISSIONS.find(item=>item.key===autonomy.mission.key)||missionForDay(TODAY());
    const status=autonomy.mission.status==='independent'?'✓ Conseguiu sozinho hoje.':autonomy.mission.status==='help'?'🤝 Pediu ajuda quando precisou.':'';
    missionCard.innerHTML=`<h3>🦅 Missão Independente</h3><span class="mission-icon">${mission.icon}</span><p>${mission.text}</p><div class="autonomy-actions"><button class="autonomy-btn primary" data-autonomy-action="independent">✓ Consegui sozinho</button><button class="autonomy-btn help" data-autonomy-action="help">🤝 Precisei de ajuda</button></div><div class="autonomy-status">${status}</div>`;
  }

  function start(){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(document.querySelector('.content')&&typeof state!=='undefined'){
        clearInterval(timer);
        mountAutonomy();
      }
      if(tries>100) clearInterval(timer);
    },100);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
