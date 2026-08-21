(() => {
  'use strict';
  const TODAY = () => { const d=new Date(), p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; };

  // Missões que podem ser feitas em casa. A missão não deve depender de haver escola
  // ou compromisso externo no dia, evitando registros artificiais de sucesso.
  const MISSIONS=[
    {key:'roupa',icon:'👕',text:'Separar a roupa que vai usar.'},
    {key:'material',icon:'📚',text:'Organizar o próprio material.'},
    {key:'espaco',icon:'🧹',text:'Arrumar o próprio espaço.'},
    {key:'lanche',icon:'🍎',text:'Preparar um lanche simples e seguro.'},
    {key:'checklist',icon:'🧼',text:'Seguir sozinho o checklist de uma rotina.'},
    {key:'pendencia',icon:'🧩',text:'Tentar resolver uma pequena pendência antes de pedir ajuda.'}
  ];
  const LEVELS=['Pequeno desafio','Algo que dá um friozinho','Um passo fora do confortável','Desafio corajoso','Grande passo'];
  const missionForDay=iso=>MISSIONS[(Number(iso.replaceAll('-',''))||0)%MISSIONS.length];

  function ensureState(){
    if(typeof state==='undefined') return null;
    if(!state.autonomy||typeof state.autonomy!=='object') state.autonomy={};
    const today=TODAY();
    const expected=missionForDay(today);
    if(state.autonomy.date!==today){
      const level=Number(state.autonomy?.courage?.level)||1;
      state.autonomy={date:today,courage:{level,practiced:false},mission:{key:expected.key,status:null}};
    }
    state.autonomy.courage ||= {level:1,practiced:false};
    state.autonomy.mission ||= {key:expected.key,status:null};

    // Se a missão antiga deixou de existir, substitui pela missão válida do dia
    // e limpa qualquer resultado que tenha sido registrado para a tarefa errada.
    if(!MISSIONS.some(m=>m.key===state.autonomy.mission.key)){
      state.autonomy.mission={key:expected.key,status:null};
    }

    state.autonomy.courage.level=Math.min(5,Math.max(1,Number(state.autonomy.courage.level)||1));
    return state.autonomy;
  }

  function persist(){
    try{
      if(typeof saveState==='function') saveState(state);
      else if(typeof STORAGE_STATE_KEY!=='undefined') localStorage.setItem(STORAGE_STATE_KEY,JSON.stringify(state));
    }catch(e){ console.warn('Autonomy save failed',e); }
  }

  function pulse(el,kind='success'){
    if(!el) return;
    el.classList.remove('autonomy-pop','autonomy-pop-help');
    void el.offsetWidth;
    el.classList.add(kind==='help'?'autonomy-pop-help':'autonomy-pop');
  }

  function mountAutonomy(){
    let host=document.getElementById('autonomy-tools');
    if(!host){
      const content=document.querySelector('.content');
      if(!content) return;
      host=document.createElement('section');
      host.id='autonomy-tools';
      const weekly=document.getElementById('weeklyReviewSection');
      const weeklyDetails=weekly?.closest('details');
      if(weeklyDetails) weeklyDetails.insertAdjacentElement('afterend',host);
      else content.appendChild(host);
    }
    host.innerHTML=`
      <div class="autonomy-heading"><span>🌱</span><span>Autonomia e coragem</span></div>
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
    host.onclick=event=>{
      const button=event.target.closest('button[data-autonomy-action]');
      if(!button) return;
      const autonomy=ensureState();
      if(!autonomy) return;
      const action=button.dataset.autonomyAction;
      let kind='success';
      if(action==='practice') autonomy.courage.practiced=!autonomy.courage.practiced;
      if(action==='advance') autonomy.courage.level=Math.min(5,autonomy.courage.level+1);
      if(action==='independent') autonomy.mission.status='independent';
      if(action==='help'){ autonomy.mission.status='help'; kind='help'; }
      if(action==='skip') autonomy.mission.status='not-needed';
      persist();
      pulse(button,kind);
      renderAutonomy(true,action);
    };
    renderAutonomy(false);
  }

  function renderAutonomy(animate=false,action=''){
    const autonomy=ensureState(), c=document.getElementById('courage-card'), m=document.getElementById('mission-card');
    if(!autonomy||!c||!m) return;
    const level=autonomy.courage.level;
    c.innerHTML=`
      <div class="autonomy-card-head"><h3>🦁 Escada da Coragem</h3><span class="autonomy-level">${level}/5</span></div>
      <p class="autonomy-level-name">${LEVELS[level-1]}</p>
      <div class="autonomy-steps" aria-label="Nível ${level} de 5">${[1,2,3,4,5].map(n=>`<span class="autonomy-step ${n<=level?'active':''} ${animate&&action==='advance'&&n===level?'new-step':''}"><i>${n}</i></span>`).join('')}</div>
      <p class="autonomy-copy">${autonomy.courage.practiced?'Hoje você praticou. Coragem também é tentar.':'Escolha um pequeno desafio e pratique hoje.'}</p>
      <div class="autonomy-actions">
        <button class="autonomy-btn primary ${autonomy.courage.practiced?'selected':''}" data-autonomy-action="practice">${autonomy.courage.practiced?'✓ Pratiquei hoje':'Pratiquei hoje'}</button>
        ${level<5?'<button class="autonomy-btn" data-autonomy-action="advance">Avançar degrau</button>':''}
      </div>`;
    const mission=MISSIONS.find(x=>x.key===autonomy.mission.key)||missionForDay(TODAY());
    const missionStatus={
      independent:'✓ Conseguiu sozinho hoje.',
      help:'🤝 Pediu ajuda quando precisou.',
      'not-needed':'— Não precisou ser feita hoje.'
    }[autonomy.mission.status]||'';
    m.innerHTML=`
      <div class="autonomy-card-head"><h3>🦅 Missão Independente</h3><span class="mission-icon">${mission.icon}</span></div>
      <p class="autonomy-copy mission-text">${mission.text}</p>
      <div class="autonomy-actions">
        <button class="autonomy-btn primary ${autonomy.mission.status==='independent'?'selected':''}" data-autonomy-action="independent">✓ Consegui sozinho</button>
        <button class="autonomy-btn help ${autonomy.mission.status==='help'?'selected':''}" data-autonomy-action="help">🤝 Precisei de ajuda</button>
        <button class="autonomy-btn ${autonomy.mission.status==='not-needed'?'selected':''}" data-autonomy-action="skip">Não precisei hoje</button>
      </div>
      <div class="autonomy-status ${autonomy.mission.status||''}">${missionStatus}</div>`;
    if(animate){
      if(action==='advance'||action==='practice') c.classList.add('autonomy-card-bump');
      else m.classList.add('autonomy-card-bump');
      setTimeout(()=>document.querySelectorAll('.autonomy-card-bump').forEach(x=>x.classList.remove('autonomy-card-bump')),450);
    }
  }

  function start(){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(document.querySelector('.content')&&typeof state!=='undefined'){ clearInterval(timer); mountAutonomy(); }
      if(tries>100) clearInterval(timer);
    },100);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();