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

  function missionForDay(iso){ const n = Number(iso.replaceAll('-', '')) || 0; return MISSIONS[n % MISSIONS.length]; }
  function ensureState(){
    if (typeof state === 'undefined') return null;
    if (!state.autonomy || typeof state.autonomy !== 'object') state.autonomy = {};
    const today = TODAY();
    if (state.autonomy.date !== today) state.autonomy = { date:today, courage:{level:Number(state.autonomy?.courage?.level)||1,practiced:false}, mission:{key:missionForDay(today).key,status:null} };
    state.autonomy.courage ||= {level:1,practiced:false};
    state.autonomy.mission ||= {key:missionForDay(today).key,status:null};
    state.autonomy.courage.level = Math.min(5, Math.max(1, Number(state.autonomy.courage.level)||1));
    return state.autonomy;
  }
  function persist(){ try { if (typeof saveState === 'function') saveState(state); else if (typeof STORAGE_STATE_KEY !== 'undefined') localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(state)); } catch(e){ console.warn('Autonomy save failed', e); } }

  function addStyle(){
    if (document.getElementById('screen-cleanup-style')) return;
    const s=document.createElement('style'); s.id='screen-cleanup-style'; s.textContent=`
      #autonomy-tools{margin:16px 0 4px;padding:14px 0 0;border-top:1px dashed var(--line)}
      .autonomy-heading{text-align:center;color:var(--chalk);font-size:1.05rem;margin:0 0 10px}
      .autonomy-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.autonomy-card{background:rgba(255,255,255,.025);border:1px solid var(--line);border-radius:12px;padding:14px;text-align:center}
      .autonomy-card h3{margin:0 0 7px;font-weight:normal;font-size:1.05rem;color:var(--chalk)}.autonomy-card p{margin:5px 0;color:var(--chalk-dim);font-size:.8rem;line-height:1.45}
      .autonomy-steps{display:flex;gap:5px;justify-content:center;margin:10px 0}.autonomy-step{width:26px;height:8px;border-radius:99px;background:rgba(255,255,255,.09);border:1px solid var(--line)}.autonomy-step.active{background:var(--green);border-color:var(--green)}
      .autonomy-actions{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:10px}.autonomy-btn{font:inherit;font-size:.78rem;padding:8px 11px;border-radius:8px;cursor:pointer;border:1px solid var(--line);background:rgba(255,255,255,.04);color:var(--chalk)}.autonomy-btn.primary{background:rgba(95,216,117,.12);border-color:rgba(95,216,117,.55);color:var(--green)}.autonomy-btn.help{color:var(--chalk-dim)}.autonomy-status{min-height:18px;margin-top:8px;font-size:.75rem;color:var(--green)}.mission-icon{font-size:1.5rem;display:block;margin-bottom:3px}
      #adult-tools{margin-top:18px;padding-top:16px;border-top:1px dashed var(--line)}#adult-tools h3{margin:0 0 10px;font-size:1rem;color:var(--chalk)}#adult-tools .adult-tools-group{margin-top:14px;padding:12px;border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.02)}
      #compact-game-timer{display:flex;align-items:center;gap:6px;margin-left:8px;font-size:.72rem;color:var(--chalk-dim)}#compact-game-timer .game-timer{margin:0;padding:4px 8px;border-radius:999px;background:rgba(255,255,255,.035);border:1px solid var(--line);display:flex;align-items:center;gap:6px}#compact-game-timer .game-timer h3,#compact-game-timer .hint,#compact-game-timer .game-timer-track{display:none}#compact-game-timer .game-timer-used{margin:0;font-size:.72rem;white-space:nowrap}#compact-game-timer .game-timer-btn{padding:5px 8px;font-size:.68rem;background:transparent;color:var(--chalk);border:1px solid var(--line)}#compact-game-timer .game-timer-locked{margin:0;padding:4px 7px;font-size:.68rem;background:transparent;border:0}
      @media(max-width:650px){.autonomy-grid{grid-template-columns:1fr}#compact-game-timer{display:none}}
    `; document.head.appendChild(s);
  }

  function sectionByText(text){
    return [...document.querySelectorAll('details,section,div')].find(el => {
      const summary=el.querySelector(':scope > summary');
      return summary && summary.textContent.trim().toLowerCase().includes(text.toLowerCase());
    }) || null;
  }
  function moveTimerCompact(){
    if (document.getElementById('compact-game-timer')) return;
    const timer=document.querySelector('.game-timer');
    const top=document.querySelector('.topbar-right');
    if(!timer||!top) return;
    const box=document.createElement('div'); box.id='compact-game-timer'; box.setAttribute('aria-label','Timer');
    timer.parentNode.insertBefore(box,timer); box.appendChild(timer); top.appendChild(box);
  }
  function removeMainDistractions(){
    const labels=['Timers','Vi algo legal','Mural de Conquistas do Pacus'];
    labels.forEach(label=>sectionByText(label)?.remove());
    document.querySelectorAll('[id*="positiveBehavior" i],[id*="achievementMural" i]').forEach(el=>el.closest('details,section,div')?.remove());
  }
  function moveNamedToAdult(label, tools){
    const el=sectionByText(label); if(!el||el.closest('#adult-tools')) return;
    const group=document.createElement('div'); group.className='adult-tools-group'; group.appendChild(el); tools.appendChild(group);
  }
  function moveToolsToAdult(){
    const overlay=document.getElementById('overlay'); if(!overlay||document.getElementById('adult-tools')) return false;
    const editor=overlay.querySelector('.editor'); const anchor=editor?.querySelector('.editor-footer'); if(!editor||!anchor) return false;
    const tools=document.createElement('section'); tools.id='adult-tools'; tools.innerHTML='<h3>🔒 Painel dos adultos</h3>';
    moveNamedToAdult('Histórico de hoje',tools);
    moveNamedToAdult('Histórico dos dias',tools);
    const drive=document.getElementById('driveSyncSection'); if(drive){const g=document.createElement('div');g.className='adult-tools-group';g.appendChild(drive);tools.appendChild(g)}
    const footer=document.querySelector('.content > footer'); if(footer){const g=document.createElement('div');g.className='adult-tools-group';g.appendChild(footer);tools.appendChild(g)}
    editor.insertBefore(tools,anchor); return true;
  }
  function keepAdultOnly(){
    const labels=['Histórico de hoje','Histórico dos dias'];
    labels.forEach(label=>{ const el=sectionByText(label); if(el && !el.closest('#adult-tools')) el.style.display='none'; });
    const drive=document.getElementById('driveSyncSection'); if(drive&&!drive.closest('#adult-tools')) drive.style.display='none';
    const footer=document.querySelector('.content > footer'); if(footer&&!footer.closest('#adult-tools')) footer.style.display='none';
  }

  function mountAutonomy(){
    if(document.getElementById('autonomy-tools')) return;
    const host=document.querySelector('.content'); if(!host) return;
    const section=document.createElement('section'); section.id='autonomy-tools'; section.innerHTML='<div class="autonomy-heading">🌱 Autonomia e coragem</div><div class="autonomy-grid"><article class="autonomy-card" id="courage-card"></article><article class="autonomy-card" id="mission-card"></article></div>';
    host.appendChild(section);
    section.addEventListener('click',e=>{const b=e.target.closest('button[data-autonomy-action]');if(!b)return;const a=ensureState();if(!a)return;const x=b.dataset.autonomyAction;if(x==='practice')a.courage.practiced=!a.courage.practiced;if(x==='advance')a.courage.level=Math.min(5,a.courage.level+1);if(x==='independent')a.mission.status='independent';if(x==='help')a.mission.status='help';persist();renderAutonomy()});
    renderAutonomy();
  }
  function renderAutonomy(){
    const a=ensureState(),c=document.getElementById('courage-card'),m=document.getElementById('mission-card'); if(!a||!c||!m)return;
    const level=a.courage.level;
    c.innerHTML=`<h3>🦁 Escada da Coragem</h3><p>${LEVELS[level-1]}</p><div class="autonomy-steps">${[1,2,3,4,5].map(n=>`<span class="autonomy-step ${n<=level?'active':''}"></span>`).join('')}</div><p>${a.courage.practiced?'Hoje você praticou. Coragem também é tentar.':'Escolha um pequeno desafio e pratique hoje.'}</p><div class="autonomy-actions"><button class="autonomy-btn primary" data-autonomy-action="practice">${a.courage.practiced?'✓ Pratiquei hoje':'Pratiquei hoje'}</button>${level<5?'<button class="autonomy-btn" data-autonomy-action="advance">Avançar degrau</button>':''}</div>`;
    const mission=MISSIONS.find(x=>x.key===a.mission.key)||missionForDay(TODAY()); const st=a.mission.status==='independent'?'✓ Conseguiu sozinho hoje.':a.mission.status==='help'?'🤝 Pediu ajuda quando precisou.':'';
    m.innerHTML=`<h3>🦅 Missão Independente</h3><span class="mission-icon">${mission.icon}</span><p>${mission.text}</p><div class="autonomy-actions"><button class="autonomy-btn primary" data-autonomy-action="independent">✓ Consegui sozinho</button><button class="autonomy-btn help" data-autonomy-action="help">🤝 Precisei de ajuda</button></div><div class="autonomy-status">${st}</div>`;
  }
  function start(){
    let tries=0; const t=setInterval(()=>{tries++; if(document.querySelector('.content')&&typeof state!=='undefined'){clearInterval(t);addStyle();removeMainDistractions();moveTimerCompact();keepAdultOnly();mountAutonomy(); const adultTimer=setInterval(()=>{if(moveToolsToAdult()||tries>100)clearInterval(adultTimer)},250)} if(tries>100)clearInterval(t)},100);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();