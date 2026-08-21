(() => {
  'use strict';
  const TODAY = () => { const d=new Date(), p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; };
  const LEVELS=['Pequeno desafio','Algo que dá um friozinho','Um passo fora do confortável','Desafio corajoso','Grande passo'];

  function ensureState(){
    if(typeof state==='undefined') return null;
    if(!state.autonomy||typeof state.autonomy!=='object') state.autonomy={};
    const today=TODAY();
    if(state.autonomy.date!==today){
      const level=Number(state.autonomy?.courage?.level)||1;
      state.autonomy={date:today,courage:{level,practiced:false}};
    }
    state.autonomy.courage ||= {level:1,practiced:false};
    state.autonomy.courage.level=Math.min(5,Math.max(1,Number(state.autonomy.courage.level)||1));
    return state.autonomy;
  }

  function persist(){
    try{
      if(typeof saveState==='function') saveState(state);
      else if(typeof STORAGE_STATE_KEY!=='undefined') localStorage.setItem(STORAGE_STATE_KEY,JSON.stringify(state));
    }catch(e){ console.warn('Autonomy save failed',e); }
  }

  function pulse(el){
    if(!el) return;
    el.classList.remove('autonomy-pop');
    void el.offsetWidth;
    el.classList.add('autonomy-pop');
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
      <article class="autonomy-card" id="courage-card"></article>
      <aside class="board-reminder" aria-label="Lembrete diário das atividades da lousa">
        <div class="board-reminder-head">
          <span class="board-reminder-bell">🔔</span>
          <div><div class="board-reminder-title">Lembrete da lousa</div><div class="board-reminder-subtitle">Antes de terminar o dia, lembre destas duas atividades.</div></div>
        </div>
        <div class="board-reminder-list">
          <div class="board-reminder-item"><span class="board-reminder-number">1</span><div><strong>Problema meu, solução minha</strong><span>Anote um pequeno problema e pense em opções antes de pedir que um adulto resolva.</span></div></div>
          <div class="board-reminder-item"><span class="board-reminder-number">2</span><div><strong>Como estou me sentindo?</strong><span>Desenhe na lousa um rosto mostrando como você está se sentindo hoje.</span></div></div>
        </div>
        <div class="board-reminder-note">📝 As duas atividades são feitas na lousa. Sem pontos e sem registro no site.</div>
      </aside>`;
    host.onclick=event=>{
      const button=event.target.closest('button[data-autonomy-action]');
      if(!button) return;
      const autonomy=ensureState();
      if(!autonomy) return;
      const action=button.dataset.autonomyAction;
      if(action==='practice') autonomy.courage.practiced=!autonomy.courage.practiced;
      if(action==='advance') autonomy.courage.level=Math.min(5,autonomy.courage.level+1);
      persist();
      pulse(button);
      renderAutonomy(true,action);
    };
    renderAutonomy(false);
  }

  function renderAutonomy(animate=false,action=''){
    const autonomy=ensureState(), c=document.getElementById('courage-card');
    if(!autonomy||!c) return;
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
    if(animate){
      c.classList.add('autonomy-card-bump');
      setTimeout(()=>c.classList.remove('autonomy-card-bump'),450);
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