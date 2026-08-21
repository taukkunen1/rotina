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

  const LEVELS = [
    'Pequeno desafio',
    'Algo que dá um friozinho',
    'Um passo fora do confortável',
    'Desafio corajoso',
    'Grande passo'
  ];

  function missionForDay(iso){
    const n = Number(iso.replaceAll('-', '')) || 0;
    return MISSIONS[n % MISSIONS.length];
  }

  function ensureState(){
    if (typeof state === 'undefined') return null;
    if (!state.autonomy || typeof state.autonomy !== 'object') state.autonomy = {};
    const today = TODAY();
    if (state.autonomy.date !== today){
      state.autonomy = {
        date: today,
        courage: { level: Number(state.autonomy?.courage?.level) || 1, practiced: false },
        mission: { key: missionForDay(today).key, status: null }
      };
    }
    state.autonomy.courage ||= { level:1, practiced:false };
    state.autonomy.mission ||= { key:missionForDay(today).key, status:null };
    state.autonomy.courage.level = Math.min(5, Math.max(1, Number(state.autonomy.courage.level)||1));
    return state.autonomy;
  }

  function persist(){
    try{
      if (typeof saveState === 'function') saveState(state);
      else if (typeof STORAGE_STATE_KEY !== 'undefined') localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(state));
    }catch(err){ console.warn('Autonomy save failed', err); }
  }

  function addStyles(){
    if (document.getElementById('clean-dashboard-style')) return;
    const style = document.createElement('style');
    style.id = 'clean-dashboard-style';
    style.textContent = `
      /* Hierarquia visual: poucas cores chamativas e apenas para informação útil. */
      .content > #customTimersSection,
      .content > .block-collapsible:has(#customTimersSection),
      .content > .block-collapsible:has(#positiveBehaviors),
      .content > .block-collapsible:has(#achievementMuralSection){display:none !important;}

      .topbar h1{color:var(--chalk) !important;text-shadow:none !important;}
      .topbar{background:rgba(19,32,25,.97) !important;}
      .pacus-total .num{color:var(--green) !important;}
      .icon-btn.primary{color:var(--chalk) !important;border-color:var(--line) !important;}
      .icon-btn.primary:hover{background:rgba(255,255,255,.06) !important;}
      .weekend-indicator,.light-day-banner{color:var(--chalk-dim) !important;background:rgba(255,255,255,.025) !important;border-color:var(--line) !important;}
      .focus-step .focus-label{color:var(--yellow) !important;}

      #autonomy-tools{margin:16px 0 4px;padding:14px 0 0;border-top:1px dashed var(--line);}
      .autonomy-heading{text-align:center;font-family:"Segoe Print","Bradley Hand",cursive;color:var(--chalk);font-size:1.05rem;margin:0 0 10px;}
      .autonomy-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
      .autonomy-card{background:rgba(255,255,255,.025);border:1px solid var(--line);border-radius:12px;padding:14px;text-align:center;}
      .autonomy-card h3{margin:0 0 7px;font-family:"Segoe Print","Bradley Hand",cursive;font-weight:normal;font-size:1.05rem;color:var(--chalk);}
      .autonomy-card p{margin:5px 0;color:var(--chalk-dim);font-size:.8rem;line-height:1.45;}
      .autonomy-steps{display:flex;gap:5px;justify-content:center;margin:10px 0;}
      .autonomy-step{width:26px;height:8px;border-radius:99px;background:rgba(255,255,255,.09);border:1px solid var(--line);}
      .autonomy-step.active{background:var(--green);border-color:var(--green);}
      .autonomy-actions{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:10px;}
      .autonomy-btn{font:inherit;font-size:.78rem;padding:8px 11px;border-radius:8px;cursor:pointer;border:1px solid var(--line);background:rgba(255,255,255,.04);color:var(--chalk);}
      .autonomy-btn.primary{background:rgba(95,216,117,.12);border-color:rgba(95,216,117,.55);color:var(--green);}
      .autonomy-btn.help{background:rgba(255,255,255,.04);border-color:var(--line);color:var(--chalk-dim);}
      .autonomy-status{min-height:18px;margin-top:8px;font-size:.75rem;color:var(--green);}
      .mission-icon{font-size:1.5rem;display:block;margin-bottom:3px;}

      #adult-tools{margin-top:18px;padding-top:16px;border-top:1px dashed var(--line);}
      #adult-tools h3{margin:0 0 10px;font-size:1rem;color:var(--chalk);}
      #adult-tools .adult-tools-group{margin-top:14px;padding:12px;border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.02);}
      #adult-tools footer{margin:0;text-align:center;color:var(--chalk-dim);font-size:.72rem;}
      #adult-tools #driveSyncSection{margin:0;}
      #adult-tools details{margin:0;border-top:0;padding-top:0;}
      @media(max-width:650px){.autonomy-grid{grid-template-columns:1fr;}}
    `;
    document.head.appendChild(style);
  }

  function moveToAdultPanel(){
    const overlay = document.getElementById('overlay');
    if (!overlay || document.getElementById('adult-tools')) return;

    const editor = overlay.querySelector('.editor');
    const anchor = editor?.querySelector('.editor-footer');
    if (!editor || !anchor) return;

    const tools = document.createElement('section');
    tools.id = 'adult-tools';
    tools.innerHTML = '<h3>🔧 Administração</h3>';

    const history = document.querySelector('.content details:has(#logList)');
    if (history){
      const group = document.createElement('div');
      group.className = 'adult-tools-group';
      history.querySelector('summary').textContent = '📝 Histórico de hoje';
      group.appendChild(history);
      tools.appendChild(group);
    }

    const drive = document.getElementById('driveSyncSection');
    if (drive){
      const group = document.createElement('div');
      group.className = 'adult-tools-group';
      group.appendChild(drive);
      tools.appendChild(group);
    }

    const footer = document.querySelector('.content > footer');
    if (footer){
      const group = document.createElement('div');
      group.className = 'adult-tools-group';
      group.appendChild(footer);
      tools.appendChild(group);
    }

    editor.insertBefore(tools, anchor);
  }

  function removeDistractions(){
    const selectors = [
      '.content > .block-collapsible:has(#customTimersSection)',
      '.content > .block-collapsible:has(#positiveBehaviors)',
      '.content > .block-collapsible:has(#achievementMuralSection)'
    ];
    selectors.forEach(selector => document.querySelector(selector)?.remove());
  }

  function mount(){
    if (document.getElementById('autonomy-tools')) return;
    const host = document.querySelector('.content');
    if (!host) return;

    addStyles();
    removeDistractions();
    moveToAdultPanel();

    const section = document.createElement('section');
    section.id = 'autonomy-tools';
    section.innerHTML = `
      <div class="autonomy-heading">🌱 Autonomia e coragem</div>
      <div class="autonomy-grid">
        <article class="autonomy-card" id="courage-card"></article>
        <article class="autonomy-card" id="mission-card"></article>
      </div>`;
    host.appendChild(section);

    section.addEventListener('click', event => {
      const button = event.target.closest('button[data-autonomy-action]');
      if (!button) return;
      const autonomy = ensureState();
      if (!autonomy) return;
      const action = button.dataset.autonomyAction;
      if (action === 'practice') autonomy.courage.practiced = !autonomy.courage.practiced;
      if (action === 'advance') autonomy.courage.level = Math.min(5, autonomy.courage.level + 1);
      if (action === 'independent') autonomy.mission.status = 'independent';
      if (action === 'help') autonomy.mission.status = 'help';
      persist();
      render();
    });

    render();
  }

  function render(){
    const autonomy = ensureState();
    if (!autonomy) return;
    const courage = document.getElementById('courage-card');
    const missionCard = document.getElementById('mission-card');
    if (!courage || !missionCard) return;

    const level = autonomy.courage.level;
    courage.innerHTML = `
      <h3>🦁 Escada da Coragem</h3>
      <p>${LEVELS[level-1]}</p>
      <div class="autonomy-steps" aria-label="Degrau ${level} de 5">${[1,2,3,4,5].map(n => `<span class="autonomy-step ${n<=level?'active':''}"></span>`).join('')}</div>
      <p>${autonomy.courage.practiced ? 'Hoje você praticou. Coragem também é tentar.' : 'Escolha um pequeno desafio e pratique hoje.'}</p>
      <div class="autonomy-actions">
        <button class="autonomy-btn primary" data-autonomy-action="practice">${autonomy.courage.practiced ? '✓ Pratiquei hoje' : 'Pratiquei hoje'}</button>
        ${level < 5 ? '<button class="autonomy-btn" data-autonomy-action="advance">Avançar degrau</button>' : ''}
      </div>`;

    const mission = MISSIONS.find(m => m.key === autonomy.mission.key) || missionForDay(TODAY());
    const statusText = autonomy.mission.status === 'independent' ? '✓ Conseguiu sozinho hoje.' : autonomy.mission.status === 'help' ? '🤝 Pediu ajuda quando precisou.' : '';
    missionCard.innerHTML = `
      <h3>🦅 Missão Independente</h3>
      <span class="mission-icon">${mission.icon}</span>
      <p>${mission.text}</p>
      <div class="autonomy-actions">
        <button class="autonomy-btn primary" data-autonomy-action="independent">✓ Consegui sozinho</button>
        <button class="autonomy-btn help" data-autonomy-action="help">🤝 Precisei de ajuda</button>
      </div>
      <div class="autonomy-status">${statusText}</div>`;
  }

  function start(){
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (document.querySelector('.content') && typeof state !== 'undefined'){
        clearInterval(timer);
        mount();
      }
      if (tries > 80) clearInterval(timer);
    }, 100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
