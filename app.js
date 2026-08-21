
/* Rede de segurança: se QUALQUER coisa der erro em qualquer parte do
   código abaixo (cache antigo, extensão do navegador, timing estranho),
   isso mostra um aviso claro com botão de recarregar — em vez de
   deixar a tela parcialmente em branco sem nenhuma explicação. */
window.addEventListener('error', function(e){
  if(document.getElementById('appCrashBanner')) return;
  var banner = document.createElement('div');
  banner.id = 'appCrashBanner';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#ff6b6b;color:#2a1414;padding:14px 16px;text-align:center;font-family:sans-serif;font-size:.95rem;box-shadow:0 2px 10px rgba(0,0,0,.4);';
  banner.innerHTML = '⚠️ Algo não carregou direito. <button id="appCrashReloadBtn" style="margin-left:8px;background:#2a1414;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-weight:bold;cursor:pointer;">Recarregar</button>';
  document.body.appendChild(banner);
  document.getElementById('appCrashReloadBtn').addEventListener('click', function(){
    location.reload();
  });
});

/* DEFAULT_CONFIG só vale na primeira abertura; depois é tudo editável
   pela tela e fica salvo no navegador. */
const DEFAULT_CONFIG = {
  periods: {
    manha: {
      label: "Manhã", time: "8:20 – 12:00",
      tasks: [
        { id:"m1", txt:"Arrumar a cama", pts:1, sub:"até às 12h", tier:"responsabilidade" },
        { id:"m4", txt:"Lavar o rosto", pts:1, sub:"até às 12h", tier:"essencial" },
        { id:"m3", txt:"Escovar os dentes", pts:1, sub:"até às 12h", tier:"essencial" },
        { id:"m5", txt:"Duolingo", sub:"5 lições", pts:3, tier:"extra" },
        { id:"m8", txt:"Arrumar a mochila", pts:1, sub:"até às 12h", tier:"essencial" },
        { id:"t_djf7hbb", txt:"Levar Lixo", pts:2, sub:"até às 12h", tier:"responsabilidade" },
        { id:"m2", txt:"Beber 1 copo de água", pts:1, sub:"até às 12h", tier:"essencial" },
      ]
    },
    tarde: {
      label: "Tarde", time: "12:00 – 18:00",
      tasks: [
        { id:"t2", txt:"Almoçar", pts:1, sub:"até às 18h", external:true, tier:"essencial" },
        { id:"t3", txt:"Escovar os dentes", pts:1, sub:"até às 18h", tier:"essencial" },
        { id:"t5", txt:"Arrumar a mochila", pts:1, sub:"até às 18h", tier:"essencial" },
        { id:"m7", txt:"Vestir o uniforme", pts:1, sub:"até às 18h", tier:"essencial" },
        { id:"t4", txt:"Ir para a escola", pts:3, sub:"até às 18h", external:true, tier:"essencial" },
        { id:"t1", txt:"Beber 1 copo de água", pts:1, sub:"até às 18h", tier:"essencial" },
      ]
    },
    noite: {
      label: "Noite", time: "18:00 – 22:00",
      tasks: [
        { id:"n5_cartas", txt:"Guardar as cartas de bafo", pts:1, fullPenalty:true, sub:"na caixinha delas", tier:"responsabilidade" },
        { id:"n5_carrinhos", txt:"Guardar os carrinhos", pts:1, fullPenalty:true, sub:"na caixa/prateleira", tier:"responsabilidade" },
        { id:"n5_bolinhas", txt:"Guardar as bolinhas de gude", pts:1, fullPenalty:true, sub:"no potinho", tier:"responsabilidade" },
        { id:"n5_caixas", txt:"Guardar as caixas", pts:1, fullPenalty:true, sub:"no lugar certo ou no lixo", tier:"responsabilidade" },
        { id:"n5_sala", txt:"Deixar a sala livre do chão", pts:2, fullPenalty:true, sub:"conferência final — nada espalhado", tier:"responsabilidade" },
        { id:"n1", txt:"Jantar", pts:1, sub:"até às 22h", external:true, tier:"essencial" },
        { id:"n4", txt:"Tomar banho", sub:"levar a roupa suja pro cesto + pegar a toalha + abrir janela banheiro (até às 22h)", pts:2, tier:"essencial" },
        { id:"n6", txt:"Escovar os dentes", pts:1, sub:"até às 22h", tier:"essencial" },
        { id:"n7", txt:"Momento Criativo", pts:3, sub:"Desenhar, montar Lego, pintar... (30–40 min)", tier:"extra" },
        { id:"t_ci3brlt", txt:"Ler Livro", pts:2, sub:"3 capítulo do livro de casa (até às 22h)", tier:"extra" },
        { id:"n2", txt:"Beber 1 copo de água", pts:1, sub:"até às 22h", tier:"essencial" },
      ]
    },
  },
  // rotina de fim de semana: fica null (desativada) até os pais ativarem
  // no editor — quando ativada, é editada separadamente da de dia de escola
  periodsWeekend: null,
  // PIN opcional pra travar o botão "Editar tudo" — vazio = sem trava
  editorPin: "",
  badHabits: [],
  rewards: [
    { id:"r1", txt:"1 hora de tela", cost:100, grantsHours:1, maxPerDay:2 },
    { id:"r2", txt:"Hot Wheels (brinquedo)", cost:500 },
    { id:"r3", txt:"Passeio Especial (você escolhe)", cost:650 },
  ],
  screenDailyLimitHours: 2, // usado pelo timer de jogo diário abaixo
  perfectDayBonusMinutes: 30,
  historyStartDate: "2026-08-09",

  // compromissos fixos da semana — aparecem direto como tarefas do dia
  // (no período certo), não como uma lista separada. "period" é onde a
  // tarefa aparece: manha, tarde ou noite. "Escola" já existe como tarefa
  // fixa lá em cima, então não repetimos ela aqui.
  schedule: [
    { id:"sc1", label:"Inglês", days:["ter","qui"], start:"09:00", end:"10:00", period:"manha", pts:3 },
    { id:"sc3", label:"Escoteiros", days:["sab"], start:"13:00", end:"17:30", period:"tarde", pts:3 },
    { id:"sc4", label:"Jogos em Família", days:["qui"], start:"21:00", end:"23:00", period:"noite", pts:3 },
  ],

  // exceções pontuais: um compromisso só naquele dia específico, sem mexer
  // na regra recorrente (ex: Inglês de reposição numa sexta).
  scheduleExceptions: [
    { id:"exc1", date:"2026-08-14", label:"Inglês (exceção)", period:"manha", pts:5, start:"09:00", end:"10:00" },
  ],

  // Pacus, o axolote: começa em 09/08 e cresce um passo a cada dia
  // em que todas as tarefas aplicáveis são concluídas. O ciclo termina
  // em 31/08. São 23 dias de crescimento, contando 09/08 e 31/08.
  // O Pacus nunca regride por dias já concluídos.
  pet: {
    name: "Pacus",
    growthStartDate: "2026-08-09",
    growthEndDate: "2026-08-31",
    stages: [
      { key:"ovo", label:"Ovo intacto" },
      { key:"ovo1", label:"Primeira rachadura" },
      { key:"ovo2", label:"Rachadura inicial" },
      { key:"ovo3", label:"Rachando" },
      { key:"ovo4", label:"Mais rachaduras" },
      { key:"ovo5", label:"Casca cedendo" },
      { key:"ovo6", label:"Quase abrindo" },
      { key:"ovo7", label:"Casca bem rachada" },
      { key:"ovo8", label:"Pronto para nascer" },
      { key:"hatch1", label:"Começando a eclodir" },
      { key:"hatch2", label:"Cabeça aparecendo" },
      { key:"hatch3", label:"Saindo da casca" },
      { key:"hatch4", label:"Recém-nascido" },
      { key:"hatch5", label:"Primeiros movimentos" },
      { key:"baby1", label:"Bebê Pacus" },
      { key:"baby2", label:"Bebê crescendo" },
      { key:"baby3", label:"Filhote" },
      { key:"baby4", label:"Filhote forte" },
      { key:"baby5", label:"Jovem" },
      { key:"young1", label:"Jovem crescendo" },
      { key:"young2", label:"Quase adulto" },
      { key:"young3", label:"Quase pronto" },
      { key:"young4", label:"Última fase" },
      { key:"adulto", label:"Pacus adulto" },
    ],
  }};

const STORAGE_CONFIG_KEY = "hector_rotina_config_v3";
const STORAGE_STATE_KEY  = "hector_rotina_state_v3";
const APP_VERSION = "2026.08.11-pacus-v4";

/* Sincronização com Google Drive via Apps Script — guarda os dados
   (não o código, que fica no GitHub Pages). Setup: script.google.com →
   novo projeto → cole o código do botão "ver código do Apps Script" →
   Implantar → App da Web, executar como eu, acesso qualquer pessoa →
   cole a URL /exec abaixo. */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz0RETrtzuA3pwdXu3qB2PN611q3PRY0Tw8CUyF7AyashsCKTm3yZ93s7iGtDe8m35p/exec";
// ?data=1 pede só os dados (backup); sem parâmetro, serve o app.
const DATA_ENDPOINT = APPS_SCRIPT_URL + "?data=1";

function uid(prefix){ return prefix + "_" + Math.random().toString(36).slice(2,9); }

// mapeia palavra-chave da tarefa pra um emoji (pista visual de leitura rápida)
const ICON_RULES = [
  [/cama/i, "🛏️"], [/água/i, "💧"], [/dente/i, "🦷"], [/rosto|banho/i, "🧼"],
  [/duolingo|inglês|idioma/i, "🗣️"], [/ler|livro|capítulo/i, "📖"],
  [/uniforme|vestir/i, "👕"], [/mochila/i, "🎒"], [/almoç/i, "🍽️"],
  [/escola/i, "🏫"], [/jantar/i, "🍲"], [/bagunça|arrumar/i, "🧹"],
  [/toalha|cesto|roupa/i, "🧺"], [/tela|jogo|vídeo/i, "📺"],
  [/dever|tarefa|estud/i, "✏️"], [/dormir|soneca/i, "😴"],
];
function taskIcon(txt){
  for(const [re, icon] of ICON_RULES){ if(re.test(txt)) return icon; }
  return "⭐";
}

function isWeekendISO(dateISO){
  const day = new Date(dateISO+"T00:00:00").getDay();
  return day === 0 || day === 6;
}

const WEEKDAY_KEYS = ['dom','seg','ter','qua','qui','sex','sab'];
const WEEKDAY_LABELS = {dom:'Domingo', seg:'Segunda', ter:'Terça', qua:'Quarta', qui:'Quinta', sex:'Sexta', sab:'Sábado'};

function weekdayKeyFor(dateISO){
  return WEEKDAY_KEYS[new Date(dateISO+"T00:00:00").getDay()];
}

function getPeriodsFor(dateISO){
  const base = (CONFIG.periodsWeekend && isWeekendISO(dateISO)) ? CONFIG.periodsWeekend : CONFIG.periods;
  const weekday = weekdayKeyFor(dateISO);
  const todaysSchedule = (CONFIG.schedule || []).filter(s => s.days && s.days.includes(weekday));
  const todaysExceptions = (CONFIG.scheduleExceptions || []).filter(s => s.date === dateISO);
  if(todaysSchedule.length === 0 && todaysExceptions.length === 0) return base;

  // clona pra não mexer no CONFIG original, e injeta os compromissos fixos
  // (e exceções pontuais) de hoje como tarefas de verdade no período certo
  const merged = JSON.parse(JSON.stringify(base));
  todaysSchedule.forEach(s=>{
    const periodKey = s.period && merged[s.period] ? s.period : 'tarde';
    merged[periodKey].tasks.push({
      id: 'sched_' + s.id,
      txt: s.label,
      sub: `${s.start}–${s.end}`,
      pts: s.pts != null ? s.pts : 3,
      tier: 'responsabilidade',
    });
  });
  todaysExceptions.forEach(s=>{
    const periodKey = s.period && merged[s.period] ? s.period : 'tarde';
    merged[periodKey].tasks.push({
      id: 'exc_' + s.id,
      txt: s.label,
      sub: `${s.start}–${s.end}`,
      pts: s.pts != null ? s.pts : 3,
      tier: 'responsabilidade',
    });
  });
  return merged;
}

function allTasks(dateISO){
  const periods = getPeriodsFor(dateISO || todayISO());
  return [
    ...periods.manha.tasks,
    ...periods.tarde.tasks,
    ...periods.noite.tasks,
  ];
}

// Regra 4: pedir ajuda / dividir a tarefa também conta como cumprida —
// não é uma falha, é um jeito válido de fazer.
function isCountedDone(status){
  return status === 'done' || status === 'help';
}

// Reordenação pessoal (autonomia > pontos, segundo os estudos), por
// período, aplicada por cima da ordem sugerida — sem mexer na config.
function getEffectiveTaskOrder(periodKey, tasks){
  if(!state.customTaskOrder) state.customTaskOrder = {};
  const customOrder = state.customTaskOrder[periodKey];
  if(!customOrder || !customOrder.length) return tasks;
  const byId = new Map(tasks.map(t=>[t.id, t]));
  const ordered = customOrder.map(id=>byId.get(id)).filter(Boolean);
  const missing = tasks.filter(t=>!customOrder.includes(t.id));
  return [...ordered, ...missing];
}

// Lista achatada de tarefas ainda pendentes hoje, na ordem (por período,
// respeitando a ordem pessoal) — usada no card "Agora / Próximo / Depois".
function pendingTasksFlat(){
  const order = ['manha','tarde','noite'];
  const periodsObj = getPeriodsFor(todayISO());
  let list = [];
  order.forEach(key=>{
    const tasks = getEffectiveTaskOrder(key, periodsObj[key].tasks);
    tasks.forEach(t=>{
      if(!state.checkedToday[t.id]) list.push(t);
    });
  });
  return list;
}

// ☁️ Dia leve — sábado vem sem cobrança de pontuação, só um lembrete
// pra descansar sem culpa.
function isLightDay(dateISO){
  return weekdayKeyFor(dateISO || todayISO()) === 'sab';
}
function renderLightDayBanner(){
  const el = document.getElementById('lightDayBanner');
  if(!el) return;
  el.innerHTML = isLightDay(todayISO())
    ? `<div class="light-day-banner">☁️ Dia leve — hoje é pra descansar também, sem pressão de pontuação.</div>`
    : '';
}

// Agora → Próximo → Depois — em vez de jogar a lista toda de uma vez,
// mostra só os 3 próximos passos, de um jeito mais leve de encarar o dia.
function renderFocusCard(){
  const el = document.getElementById('focusCard');
  if(!el) return;
  const pending = pendingTasksFlat().filter(t => !t.external);
  if(pending.length === 0){ el.innerHTML = ''; return; }
  const [now, next, later] = pending;
  el.innerHTML = `
    <div class="focus-card">
      <div class="focus-step"><span class="focus-label">Agora</span><span class="focus-task">${taskIcon(now.txt)} ${now.txt}</span></div>
      ${next ? `<div class="focus-step dim"><span class="focus-label">Próximo</span><span class="focus-task">${taskIcon(next.txt)} ${next.txt}</span></div>` : ''}
      ${later ? `<div class="focus-step dim"><span class="focus-label">Depois</span><span class="focus-task">${taskIcon(later.txt)} ${later.txt}</span></div>` : ''}
    </div>
  `;
}

// 🌱 Recomeçar daqui — se teve alguma tarefa não feita hoje, oferece um
// jeito de virar a página sem apagar o histórico: só acalma o visual
// pro resto do dia, e oferece uma missãozinha fácil pra quebrar o ciclo
// "errei → já perdi o dia → desisto".
const RECOVERY_MISSIONS = [
  'Guardar 5 brinquedos',
  'Beber um copo de água',
  'Escovar os dentes',
  'Começar o dever por 5 minutinhos',
];
function renderFreshStartArea(){
  const el = document.getElementById('freshStartArea');
  if(!el) return;
  const hasNotDoneToday = Object.values(state.checkedToday).includes('x');
  const freshStartActive = state.freshStartActiveDate === todayISO();

  if(!hasNotDoneToday || freshStartActive){
    if(freshStartActive && !(state.recoveryMissionDone && state.recoveryMissionDone.date === todayISO())){
      renderRecoveryMission(el);
    } else {
      el.innerHTML = '';
    }
    return;
  }

  el.innerHTML = `
    <div class="fresh-start-card">
      <div class="fresh-start-msg">Tudo bem. Vamos começar de onde você está agora.</div>
      <button class="fresh-start-btn" id="freshStartBtn">🌱 Recomeçar daqui</button>
    </div>
  `;
  document.getElementById('freshStartBtn').addEventListener('click', ()=>{
    state.freshStartActiveDate = todayISO();
    saveState(state);
    render();
  });
}
function renderRecoveryMission(el){
  const seed = todayISO().split('-').reduce((s,n)=>s+Number(n),0);
  const mission = RECOVERY_MISSIONS[seed % RECOVERY_MISSIONS.length];
  el.innerHTML = `
    <div class="recovery-mission-card">
      <div class="recovery-mission-title">⭐ Missão de recuperação</div>
      <div class="recovery-mission-text">${mission}</div>
      <button class="recovery-mission-btn" id="recoveryMissionBtn">concluí! 🎉</button>
    </div>
  `;
  document.getElementById('recoveryMissionBtn').addEventListener('click', (evt)=>{
    const delta = addPoints(1);
    addLog(`⭐ +1 · Missão de recuperação: ${mission}`);
    state.recoveryMissionDone = { date: todayISO(), mission };
    saveState(state);
    bumpTotal(delta, evt.currentTarget);
    fireConfetti(evt.currentTarget, 16);
    render();
  });
}

// 🌟 Vitórias invisíveis — mostra o que já foi conquistado hoje, mesmo
// que o dia não tenha sido perfeito.
function renderInvisibleWinsCard(){
  const el = document.getElementById('invisibleWinsCard');
  if(!el) return;
  const tasks = allTasks(todayISO());
  const doneTasks = tasks.filter(t => isCountedDone(state.checkedToday[t.id]));
  const hasNotDone = Object.values(state.checkedToday).includes('x');
  const recovered = state.freshStartActiveDate === todayISO();

  if(doneTasks.length === 0){ el.innerHTML = ''; return; }

  const items = doneTasks.slice(0, 6).map(t => `<li>${taskIcon(t.txt)} ${t.txt}</li>`);
  if(hasNotDone && recovered) items.push('<li>🌱 Voltou depois de um momento difícil</li>');

  el.innerHTML = `
    <div class="wins-card">
      <div class="wins-title">🌟 Coisas que você conseguiu hoje</div>
      <ul class="wins-list">${items.join('')}</ul>
    </div>
  `;
}

function moveTaskInOrder(periodKey, tasks, taskId, direction){
  const current = getEffectiveTaskOrder(periodKey, tasks).map(t=>t.id);
  const idx = current.indexOf(taskId);
  const swapWith = direction === 'up' ? idx-1 : idx+1;
  if(idx < 0 || swapWith < 0 || swapWith >= current.length) return;
  [current[idx], current[swapWith]] = [current[swapWith], current[idx]];
  if(!state.customTaskOrder) state.customTaskOrder = {};
  state.customTaskOrder[periodKey] = current;
  saveState(state);
}

function stripLegacyHairTask(cfg){
  // "Cabelo Lavado" virou tarefa duplicada por engano em algum momento —
  // o controle de cabelo já tem sua própria seção dedicada (🧴 Lavar o
  // cabelo), então removemos essa tarefa específica se ela aparecer.
  if(cfg && cfg.periods && cfg.periods.noite && Array.isArray(cfg.periods.noite.tasks)){
    cfg.periods.noite.tasks = cfg.periods.noite.tasks.filter(t => t.id !== 't_gzba4xs');
  }
  if(cfg && cfg.periodsWeekend && cfg.periodsWeekend.noite && Array.isArray(cfg.periodsWeekend.noite.tasks)){
    cfg.periodsWeekend.noite.tasks = cfg.periodsWeekend.noite.tasks.filter(t => t.id !== 't_gzba4xs');
  }
  // senha do site: recurso removido — limpa de qualquer config que já
  // tinha isso salvo, pra garantir que ninguém peça senha nunca mais.
  if(cfg && cfg.sitePin !== undefined) delete cfg.sitePin;
  return fixScreenTimeCostV1(applyEconomyRebalanceV1(moveUniformToTardeV1(applyTaskTiersV1(splitBagunçaV1(addOutingRewardV1(fixFamilyGameNightV4(fixFamilyGameNightV3(fixFamilyGameNightV2(addFamilyGameNightV1(markExternalTasksV1(addCreativeTaskV1(applyTaskOrderV1(applyPointRebalanceV2(applyPointRebalanceV1(cfg)))))))))))))));
}

// Reforça pontos de tarefas mais chatas — roda uma vez só, não desfaz
// ajuste manual dos pais.
const POINT_REBALANCE_V1 = {
  m1:2, m3:2, m8:2, t_djf7hbb:4,
  t3:2, t5:2,
  n4:4, n5:3, n6:2, t_ci3brlt:4,
};
function applyPointRebalanceV1(cfg){
  if(!cfg || cfg.pointRebalanceV1Applied) return cfg;
  ['periods','periodsWeekend'].forEach(key=>{
    const p = cfg[key];
    if(!p) return;
    ['manha','tarde','noite'].forEach(period=>{
      if(p[period] && Array.isArray(p[period].tasks)){
        p[period].tasks.forEach(t=>{
          if(POINT_REBALANCE_V1[t.id] !== undefined) t.pts = POINT_REBALANCE_V1[t.id];
        });
      }
    });
  });
  cfg.pointRebalanceV1Applied = true;
  return cfg;
}

// Tarefa mais chata: 7 pontos, penalidade CHEIA se não fizer (não a metade).
function applyPointRebalanceV2(cfg){
  if(!cfg || cfg.pointRebalanceV2Applied) return cfg;
  ['periods','periodsWeekend'].forEach(key=>{
    const p = cfg[key];
    if(p && p.noite && Array.isArray(p.noite.tasks)){
      p.noite.tasks.forEach(t=>{
        if(t.id === 'n5'){ t.pts = 7; t.fullPenalty = true; }
      });
    }
  });
  cfg.pointRebalanceV2Applied = true;
  return cfg;
}

// Ordem por ciência comportamental: tarefa chata primeiro (eat the frog),
// higiene em sequência, foco cognitivo com mente descansada, sair por
// último, água fácil fechando o bloco (efeito do final).
const TASK_ORDER_V1 = {
  manha: ["m1","m4","m3","m5","m8","t_djf7hbb","m2"],
  tarde: ["t2","t3","t5","m7","t4","t1"],
  noite: ["n5_cartas","n5_carrinhos","n5_bolinhas","n5_caixas","n5_sala","n1","n4","n6","n7","t_ci3brlt","n2"],
};
function applyTaskOrderV1(cfg){
  if(!cfg || cfg.taskOrderV1Applied) return cfg;
  ['periods','periodsWeekend'].forEach(key=>{
    const p = cfg[key];
    if(!p) return;
    ['manha','tarde','noite'].forEach(period=>{
      if(p[period] && Array.isArray(p[period].tasks)){
        const order = TASK_ORDER_V1[period];
        const tasks = p[period].tasks;
        const known = order.map(id => tasks.find(t=>t.id===id)).filter(Boolean);
        const extra = tasks.filter(t => !order.includes(t.id));
        p[period].tasks = [...known, ...extra];
      }
    });
  });
  cfg.taskOrderV1Applied = true;
  return cfg;
}

// "Momento Criativo" — insere entre "Escovar os dentes" e "Ler Livro"
// pra quem já sincronizou. Roda uma vez.
function addCreativeTaskV1(cfg){
  if(!cfg || cfg.creativeTaskV1Applied) return cfg;
  ['periods','periodsWeekend'].forEach(key=>{
    const p = cfg[key];
    if(p && p.noite && Array.isArray(p.noite.tasks)){
      const tasks = p.noite.tasks;
      if(!tasks.some(t=>t.id === 'n7')){
        const newTask = { id:"n7", txt:"Momento Criativo", pts:5, sub:"Desenhar, montar Lego, pintar... (30–40 min)" };
        const idx = tasks.findIndex(t=>t.id === 'n6');
        if(idx >= 0) tasks.splice(idx+1, 0, newTask);
        else tasks.push(newTask);
      }
    }
  });
  cfg.creativeTaskV1Applied = true;
  return cfg;
}

// Tarefas fora do controle dele (refeições, escola) — soltas, sem entrar
// no encadeamento de "próxima sugerida".
const EXTERNAL_TASK_IDS = ["t2","t4","n1"];
function markExternalTasksV1(cfg){
  if(!cfg || cfg.externalTasksV1Applied) return cfg;
  ['periods','periodsWeekend'].forEach(key=>{
    const p = cfg[key];
    if(!p) return;
    ['manha','tarde','noite'].forEach(period=>{
      if(p[period] && Array.isArray(p[period].tasks)){
        p[period].tasks.forEach(t=>{
          if(EXTERNAL_TASK_IDS.includes(t.id)) t.external = true;
        });
      }
    });
  });
  cfg.externalTasksV1Applied = true;
  return cfg;
}

// Jogos em Família — toda quinta à noite.
function addFamilyGameNightV1(cfg){
  if(!cfg || cfg.familyGameNightV1Applied) return cfg;
  if(!Array.isArray(cfg.schedule)) cfg.schedule = [];
  if(!cfg.schedule.some(s=>s.id === 'sc4')){
    cfg.schedule.push({ id:"sc4", label:"Jogos em Família", days:["qui"], start:"16:00", end:"17:30", period:"tarde", pts:5 });
  }
  cfg.familyGameNightV1Applied = true;
  return cfg;
}

// Correção: era pra ser de TARDE, não de noite — ajusta quem já tinha
// recebido a versão antiga (noite, 19h-20h30).
function fixFamilyGameNightV2(cfg){
  if(!cfg || cfg.familyGameNightV2Applied) return cfg;
  if(Array.isArray(cfg.schedule)){
    const item = cfg.schedule.find(s=>s.id === 'sc4');
    if(item){
      item.label = "Jogos em Família";
      item.period = "tarde";
      item.start = "16:00";
      item.end = "17:30";
    }
  }
  cfg.familyGameNightV2Applied = true;
  return cfg;
}

// Nome mais simples — "Tarde de..." era redundante já que o bloco em si
// já se chama Tarde.
function fixFamilyGameNightV3(cfg){
  if(!cfg || cfg.familyGameNightV3Applied) return cfg;
  if(Array.isArray(cfg.schedule)){
    const item = cfg.schedule.find(s=>s.id === 'sc4');
    if(item) item.label = "Jogos em Família";
  }
  cfg.familyGameNightV3Applied = true;
  return cfg;
}

// Correção final: é de NOITE mesmo, das 21h às 23h de quinta.
function fixFamilyGameNightV4(cfg){
  if(!cfg || cfg.familyGameNightV4Applied) return cfg;
  if(Array.isArray(cfg.schedule)){
    const item = cfg.schedule.find(s=>s.id === 'sc4');
    if(item){
      item.period = "noite";
      item.start = "21:00";
      item.end = "23:00";
    }
  }
  cfg.familyGameNightV4Applied = true;
  return cfg;
}

// Recompensa: Passeio Especial (ele escolhe).
function addOutingRewardV1(cfg){
  if(!cfg || cfg.outingRewardV1Applied) return cfg;
  if(!Array.isArray(cfg.rewards)) cfg.rewards = [];
  if(!cfg.rewards.some(r=>r.id === 'r3')){
    cfg.rewards.push({ id:"r3", txt:"Passeio Especial (você escolhe)", cost:500 });
  }
  cfg.outingRewardV1Applied = true;
  return cfg;
}

// "Arrumar a bagunça" era vaga — quebrada em 5 tarefas pequenas e
// concretas (começo/fim claros): cartas, carrinhos, bolinhas, caixas,
// e conferência final da sala.
function splitBagunçaV1(cfg){
  if(!cfg || cfg.splitBagunçaV1Applied) return cfg;
  const newTasks = [
    { id:"n5_cartas", txt:"Guardar as cartas de bafo", pts:1, fullPenalty:true, sub:"na caixinha delas" },
    { id:"n5_carrinhos", txt:"Guardar os carrinhos", pts:1, fullPenalty:true, sub:"na caixa/prateleira" },
    { id:"n5_bolinhas", txt:"Guardar as bolinhas de gude", pts:1, fullPenalty:true, sub:"no potinho" },
    { id:"n5_caixas", txt:"Guardar as caixas", pts:1, fullPenalty:true, sub:"no lugar certo ou no lixo" },
    { id:"n5_sala", txt:"Deixar a sala livre do chão", pts:3, fullPenalty:true, sub:"conferência final — nada espalhado" },
  ];
  ['periods','periodsWeekend'].forEach(key=>{
    const p = cfg[key];
    if(p && p.noite && Array.isArray(p.noite.tasks)){
      const idx = p.noite.tasks.findIndex(t=>t.id === 'n5');
      if(idx >= 0){
        p.noite.tasks.splice(idx, 1, ...newTasks);
      } else if(!p.noite.tasks.some(t=>t.id === 'n5_sala')){
        p.noite.tasks.unshift(...newTasks);
      }
    }
  });
  cfg.splitBagunçaV1Applied = true;
  return cfg;
}

// Classificação em 4 níveis: 🔴 essencial (precisa acontecer, mas ele
// escolhe quando/ordem/ajuda), 🟡 responsabilidade (esperado, gera
// pontos normal), 🟢 extra (opcional, bônus maior). 🌟 iniciativa já é
// coberta pelo "Vi algo legal!" — não precisa de tarefa fixa.
const TASK_TIERS = {
  m1:"responsabilidade", m4:"essencial", m3:"essencial", m7:"essencial",
  m5:"extra", m8:"essencial", t_djf7hbb:"responsabilidade", m2:"essencial",
  t2:"essencial", t3:"essencial", t5:"essencial", t4:"essencial", t1:"essencial",
  n5_cartas:"responsabilidade", n5_carrinhos:"responsabilidade", n5_bolinhas:"responsabilidade",
  n5_caixas:"responsabilidade", n5_sala:"responsabilidade",
  n1:"essencial", n4:"essencial", n6:"essencial", n7:"extra", t_ci3brlt:"extra", n2:"essencial",
};
function applyTaskTiersV1(cfg){
  if(!cfg || cfg.taskTiersV1Applied) return cfg;
  ['periods','periodsWeekend'].forEach(key=>{
    const p = cfg[key];
    if(!p) return;
    ['manha','tarde','noite'].forEach(period=>{
      if(p[period] && Array.isArray(p[period].tasks)){
        p[period].tasks.forEach(t=>{
          if(TASK_TIERS[t.id]) t.tier = TASK_TIERS[t.id];
          else if(!t.tier) t.tier = 'responsabilidade'; // compromissos fixos (Inglês, Escoteiros, Jogos)
        });
      }
    });
  });
  cfg.taskTiersV1Applied = true;
  return cfg;
}

// "Vestir o uniforme" muda de Manhã pra Tarde — escola dele é à tarde,
// faz mais sentido vestir mais perto da hora de sair.
function moveUniformToTardeV1(cfg){
  if(!cfg || cfg.moveUniformToTardeV1Applied) return cfg;
  ['periods','periodsWeekend'].forEach(key=>{
    const p = cfg[key];
    if(!p || !p.manha || !p.tarde) return;
    const idx = p.manha.tasks.findIndex(t=>t.id === 'm7');
    if(idx >= 0){
      const [task] = p.manha.tasks.splice(idx, 1);
      task.sub = "até às 18h";
      if(!p.tarde.tasks.some(t=>t.id === 'm7')){
        const beforeSchool = p.tarde.tasks.findIndex(t=>t.id === 't4');
        if(beforeSchool >= 0) p.tarde.tasks.splice(beforeSchool, 0, task);
        else p.tarde.tasks.push(task);
      }
    }
  });
  cfg.moveUniformToTardeV1Applied = true;
  return cfg;
}

// Recalibra a economia inteira pra um mês perfeito valer ~1000 Pacus
// Points (~R$60), não ~1900 (~R$114) como estava. Reduz os pontos das
// tarefas proporcionalmente (mantendo o peso relativo entre elas) e
// ajusta o preço das recompensas: Hot Wheels = R$30 (2 por mês cabem no
// teto), tempo de tela e passeio em valores compatíveis.
const TASK_POINTS_V2 = {
  m1:1, m4:1, m3:1, m5:3, m8:1, t_djf7hbb:2, m2:1,
  t2:1, t3:1, t5:1, m7:1, t4:3, t1:1,
  n5_cartas:1, n5_carrinhos:1, n5_bolinhas:1, n5_caixas:1, n5_sala:2,
  n1:1, n4:2, n6:1, n7:3, t_ci3brlt:2, n2:1,
};
const REWARD_COSTS_V2 = { r1:50, r2:500, r3:650 };
const SCHEDULE_POINTS_V2 = { sc1:3, sc3:3, sc4:3 };
function applyEconomyRebalanceV1(cfg){
  if(!cfg || cfg.economyRebalanceV1Applied) return cfg;
  ['periods','periodsWeekend'].forEach(key=>{
    const p = cfg[key];
    if(!p) return;
    ['manha','tarde','noite'].forEach(period=>{
      if(p[period] && Array.isArray(p[period].tasks)){
        p[period].tasks.forEach(t=>{
          if(TASK_POINTS_V2[t.id] !== undefined) t.pts = TASK_POINTS_V2[t.id];
        });
      }
    });
  });
  if(Array.isArray(cfg.rewards)){
    cfg.rewards.forEach(r=>{
      if(REWARD_COSTS_V2[r.id] !== undefined) r.cost = REWARD_COSTS_V2[r.id];
    });
  }
  if(Array.isArray(cfg.schedule)){
    cfg.schedule.forEach(s=>{
      if(SCHEDULE_POINTS_V2[s.id] !== undefined) s.pts = SCHEDULE_POINTS_V2[s.id];
    });
  }
  cfg.economyRebalanceV1Applied = true;
  return cfg;
}

// Correção: tempo de tela estava barato demais em 50 — sobe pra 100.
// Hot Wheels continua 500 no CONFIG (preço "de verdade"), mas fica 300
// pra ele até a primeira compra, calculado na hora (effectiveRewardCost).
function fixScreenTimeCostV1(cfg){
  if(!cfg || cfg.fixScreenTimeCostV1Applied) return cfg;
  if(Array.isArray(cfg.rewards)){
    const r1 = cfg.rewards.find(r=>r.id === 'r1');
    if(r1) r1.cost = 100;
  }
  cfg.fixScreenTimeCostV1Applied = true;
  return cfg;
}

function loadConfig(){
  try{
    const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
    if(raw) return stripLegacyHairTask(JSON.parse(raw));
  }catch(e){}
  return stripLegacyHairTask(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
}
function saveConfig(cfg){
  try{ localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(cfg)); }catch(e){}
  scheduleAutoPush();
}

let TEST_DATE_OVERRIDE = null; // string ISO "yyyy-mm-dd" ou null (usa a data real do sistema)
// IMPORTANTE: o modo de teste nunca fica salvo entre aberturas do arquivo —
// toda vez que a página abre, começa sempre na data real do sistema.
try{ localStorage.removeItem('hector_rotina_testdate_v1'); }catch(e){}

function todayISO(){
  if(TEST_DATE_OVERRIDE) return TEST_DATE_OVERRIDE;
  const d = new Date();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return d.getFullYear()+"-"+m+"-"+day;
}
function setTestDate(iso){
  TEST_DATE_OVERRIDE = iso; // só em memória — some sozinho ao recarregar a página
}
function formatDateBR(iso){
  const [,m,d] = iso.split("-");
  return d+"/"+m;
}

// Extrai hora/minuto do horário final do período ("8:20 – 12:00").
function periodEndTime(periodTimeStr){
  const parts = periodTimeStr.split(/[–-]/).map(s=>s.trim());
  const endStr = parts[parts.length-1];
  const [h, m] = endStr.split(':').map(Number);
  if(isNaN(h)) return null;
  return { hour: h, minute: m||0 };
}
function periodStartTime(periodTimeStr){
  const parts = periodTimeStr.split(/[–-]/).map(s=>s.trim());
  const [h, m] = parts[0].split(':').map(Number);
  if(isNaN(h)) return null;
  return { hour: h, minute: m||0 };
}

// Tempo restante até o fim do período, com base no relógio real.
function formatTimeRemaining(periodTimeStr){
  const start = periodStartTime(periodTimeStr);
  const end = periodEndTime(periodTimeStr);
  if(!start || !end) return null;
  const now = new Date();
  const startDate = new Date(now); startDate.setHours(start.hour, start.minute, 0, 0);
  const endDate = new Date(now); endDate.setHours(end.hour, end.minute, 0, 0);
  if(now < startDate){
    return { text: `começa às ${String(start.hour).padStart(2,'0')}:${String(start.minute).padStart(2,'0')}`, urgency: 'none' };
  }
  if(now > endDate){
    return { text: `período encerrado`, urgency: 'over' };
  }
  const diffMin = Math.max(0, Math.round((endDate - now)/60000));
  const h = Math.floor(diffMin/60);
  const m = diffMin%60;
  const text = h > 0 ? `⏳ faltam ${h}h ${String(m).padStart(2,'0')}min` : `⏳ faltam ${m}min`;
  const urgency = diffMin <= 30 ? 'high' : diffMin <= 60 ? 'medium' : 'low';
  return { text, urgency };
}

let timeRemainingTickHandle = null;
function updateTimeRemainingDisplays(){
  document.querySelectorAll('.period').forEach(div=>{
    const el = div.querySelector('.time-remaining');
    const periodTime = div.dataset.periodTime;
    if(!el || !periodTime) return;
    const info = formatTimeRemaining(periodTime);
    if(!info){ el.textContent = ''; el.className = 'time-remaining'; return; }
    el.textContent = info.text;
    el.className = 'time-remaining urgency-' + info.urgency;
  });
}
function startTimeRemainingTicking(){
  if(timeRemainingTickHandle) return;
  timeRemainingTickHandle = setInterval(updateTimeRemainingDisplays, 30000);
}

function loadState(){
  let raw = null;

  try{
    raw = localStorage.getItem(STORAGE_STATE_KEY);
  }catch(e){
    console.warn('Não foi possível acessar o localStorage:', e);
  }

  let state = null;

  try{
    state = raw ? JSON.parse(raw) : null;
  }catch(e){
    console.warn('Dados locais corrompidos ou incompatíveis:', e);

    // Remove apenas o estado problemático
    try{
      localStorage.removeItem(STORAGE_STATE_KEY);
    }catch(err){}
    
    state = null;
  }

  if(!state){
    state = {
      totalPoints:120,
      checkedToday:{},
      lastDate:todayISO(),
      log:[],
      history:{},
      lastSeenPetStage:0,
      petCompletedDays:[],
      petLastCompletionISO:null,
      revision:0,
      driveRevision:0,
      driveLastSyncISO:null,
      driveConflictCount:0,
      lastBackupISO:null,
      backupReminderDismissedFor:null,
      driveFileId:null,
      hairByDate:{}
    };
  }

  return reconcileState(state);
}

function applyHistoryCorrection_v2(state){
  // Correção pontual, aplicada só UMA VEZ (por causa da flag abaixo) —
  // depois disso nunca mais mexe sozinha nesses dias, pra não apagar
  // edições feitas manualmente depois. Cobre 09/08 a 12/08: todos os
  // dias foram completos; dia 12 teve -10 Pacus Points por causa de uma
  // briga na escola; saldo final confirmado até 12/08: 170 Pacus Points.
  if(state.historyCorrectionV2Applied) return;

  const hairByDay = {
    "2026-08-09": "not-washed",
    "2026-08-10": "washed",
    "2026-08-11": "not-washed",
    "2026-08-12": "washed",
  };
  const pointsPenaltyByDay = {
    "2026-08-12": 10, // brigou na escola
  };

  if(!state.history) state.history = {};
  if(!state.hairByDate) state.hairByDate = {};
  if(!Array.isArray(state.petCompletedDays)) state.petCompletedDays = [];

  Object.keys(hairByDay).forEach(iso => {
    const tasks = allTasks(iso);
    const total = tasks.length;
    const rawPoints = tasks.reduce((sum, task) => sum + (Number(task.pts) || 0), 0);
    const penalty = pointsPenaltyByDay[iso] || 0;
    const netPoints = Math.max(0, rawPoints - penalty);

    state.history[iso] = {
      done: total,
      total: total,
      pointsEarnedThatDay: netPoints,
      perfect: true,
      screenMinutes: CONFIG.perfectDayBonusMinutes || 30,
      periodsCompleted: 3,
      hair: hairByDay[iso],
    };
    state.hairByDate[iso] = hairByDay[iso];

    if(!state.petCompletedDays.includes(iso)) state.petCompletedDays.push(iso);
    if(!Array.isArray(state.petPerfectBonusDays)) state.petPerfectBonusDays = [];
    if(!state.petPerfectBonusDays.includes(iso)) state.petPerfectBonusDays.push(iso);
  });

  state.petCompletedDays.sort();
  state.petLastCompletionISO = state.petCompletedDays.length
    ? state.petCompletedDays[state.petCompletedDays.length - 1]
    : null;

  // saldo confirmado até 12/08 — hoje (13/08) ainda não foi jogado
  state.totalPoints = 170;

  state.historyCorrectionV2Applied = true;
}

// Correção 13-14/08: tudo feito exceto "Arrumar a bagunça" (penalidade
// cheia). Mesmo sem ser perfeito, conta pro crescimento do Pacus. Roda
// uma vez.
function applyHistoryCorrection_v3(state){
  if(state.historyCorrectionV3Applied) return;

  const days = ["2026-08-13", "2026-08-14"];
  if(!state.history) state.history = {};
  if(!Array.isArray(state.petCompletedDays)) state.petCompletedDays = [];

  let totalDelta = 0;
  days.forEach(iso=>{
    const tasks = allTasks(iso);
    const total = tasks.length;
    const bagunca = tasks.find(t=>t.id === 'n5');
    const penalty = bagunca ? (bagunca.fullPenalty ? bagunca.pts : Math.ceil(bagunca.pts/2)) : 0;
    const rawPoints = tasks.reduce((sum, t) => sum + (Number(t.pts) || 0), 0);
    // pontos de todas as tarefas MENOS os pontos da bagunça (não feita) MENOS a penalidade dela
    const pointsEarnedThatDay = Math.max(0, (rawPoints - (bagunca ? bagunca.pts : 0)) - penalty);
    const done = bagunca ? total - 1 : total;

    const oldPoints = (state.history[iso] && state.history[iso].pointsEarnedThatDay) || 0;
    totalDelta += pointsEarnedThatDay - oldPoints;

    const hair = (state.history[iso] && state.history[iso].hair) || (state.hairByDate && state.hairByDate[iso]) || null;

    state.history[iso] = {
      done,
      total,
      pointsEarnedThatDay,
      perfect: false, // "Arrumar a bagunça" ficou de fora
      screenMinutes: 0,
      periodsCompleted: 2, // manhã e tarde completos; noite não (faltou a bagunça)
      hair,
    };

    // crescimento do Pacus não exige dia perfeito — só engajamento real
    if(!state.petCompletedDays.includes(iso)) state.petCompletedDays.push(iso);
  });

  state.petCompletedDays.sort();
  state.petLastCompletionISO = state.petCompletedDays.length
    ? state.petCompletedDays[state.petCompletedDays.length - 1]
    : null;

  state.totalPoints = Math.max(0, (Number(state.totalPoints)||0) + totalDelta);
  state.historyCorrectionV3Applied = true;
}

function seedKnownPerfectDays(state){
  applyHistoryCorrection_v2(state);
  applyHistoryCorrection_v3(state);
}

function reconcileState(state){
  if(state.driveFileId === undefined) state.driveFileId = null;
  if(state.driveLastSyncISO === undefined) state.driveLastSyncISO = null;
  if(state.lastSeenPetStage === undefined) state.lastSeenPetStage = 0;
  if(!Array.isArray(state.petCompletedDays)) state.petCompletedDays = [];
  if(!Array.isArray(state.petPerfectBonusDays)) state.petPerfectBonusDays = [];
  if(state.petLastCompletionISO === undefined) state.petLastCompletionISO = null;
  if(typeof state.revision !== 'number') state.revision = 0;
  if(typeof state.driveRevision !== 'number') state.driveRevision = 0;
  if(typeof state.driveConflictCount !== 'number') state.driveConflictCount = 0;
  if(state.lastBackupISO === undefined) state.lastBackupISO = null;
  if(state.backupReminderDismissedFor === undefined) state.backupReminderDismissedFor = null;
  if(!state.checkedToday) state.checkedToday = {};
  if(!state.log) state.log = [];
  if(!state.history) state.history = {};
  if(!state.hairByDate || typeof state.hairByDate !== "object") state.hairByDate = {};
  if(!state.customTaskOrder || typeof state.customTaskOrder !== "object") state.customTaskOrder = {};
  if(!state.familyAnnouncementResetV1Applied){
    state.familyGameNightAnnouncementSeen = false;
    state.familyAnnouncementResetV1Applied = true;
  }
  if(!state.familyAnnouncementResetV2Applied){
    state.familyGameNightAnnouncementSeen = false;
    state.familyAnnouncementResetV2Applied = true;
  }
  if(!state.familyAnnouncementResetV3Applied){
    state.familyGameNightAnnouncementSeen = false;
    state.familyAnnouncementResetV3Applied = true;
  }
  if(!state.familyAnnouncementResetV4Applied){
    state.familyGameNightAnnouncementSeen = false;
    state.familyAnnouncementResetV4Applied = true;
  }
  if(!state.dismissAllAnnouncementsV1Applied){
    state.familyGameNightAnnouncementSeen = true;
    state.weeklyNewsSeen = true;
    state.dismissAllAnnouncementsV1Applied = true;
  }
  if(!state.waldaBetBonusApplied){
    state.totalPoints = Math.max(0, Math.min(1000, (Number(state.totalPoints)||0) + 5));
    if(!state.log) state.log = [];
    state.log.unshift('🏆 +5 · acertou a aposta com a Walda (pessoa autêntica)');
    state.waldaBetBonusApplied = true;
  }
  if(!state.celebrationReplayV1Applied){
    state.lastSeenPetStage = 0;
    state.celebrationReplayV1Applied = true;
  }
  if(!state.perfectBonusBackfillV1Applied){
    if(!Array.isArray(state.petPerfectBonusDays)) state.petPerfectBonusDays = [];
    Object.keys(state.history || {}).forEach(iso=>{
      if(state.history[iso] && state.history[iso].perfect && !state.petPerfectBonusDays.includes(iso)){
        state.petPerfectBonusDays.push(iso);
      }
    });
    state.petPerfectBonusDays.sort();
    state.perfectBonusBackfillV1Applied = true;
  }
  if(!state.hairCorrectionAug1718Applied){
    if(!state.hairByDate) state.hairByDate = {};
    state.hairByDate["2026-08-17"] = "not-washed";
    state.hairByDate["2026-08-18"] = "washed";
    if(state.history["2026-08-17"]) state.history["2026-08-17"].hair = "not-washed";
    if(state.history["2026-08-18"]) state.history["2026-08-18"].hair = "washed";
    state.hairCorrectionAug1718Applied = true;
  }
  if(!state.backfillGapDaysV1Applied){
    ["2026-08-17","2026-08-18"].forEach(iso=>{
      if(!state.history[iso] || !state.history[iso].total){
        const tasks = allTasks(iso);
        state.history[iso] = {
          done:0, total:tasks.length, pointsEarnedThatDay:0, perfect:false,
          screenMinutes:0, periodsCompleted:0,
          hair: (state.hairByDate && state.hairByDate[iso]) || null,
        };
      }
    });
    // 19/08 tinha registro, mas com total 0 (bug do mesmo tipo) — recalcula certo
    if(state.history["2026-08-19"] && !state.history["2026-08-19"].total){
      const tasks19 = allTasks("2026-08-19");
      state.history["2026-08-19"].total = tasks19.length;
    }
    state.backfillGapDaysV1Applied = true;
  }
  if(!state.gameTimer || typeof state.gameTimer !== "object"){
    state.gameTimer = { date: todayISO(), usedSeconds: 0, runningSince: null, bonusSeconds: 0, redemptions: {} };
  }
  if(state.gameTimer.bonusSeconds === undefined) state.gameTimer.bonusSeconds = 0;
  if(!state.gameTimer.redemptions || typeof state.gameTimer.redemptions !== "object") state.gameTimer.redemptions = {};
  if(!Array.isArray(state.customTimers) || state.customTimers.length !== 2){
    state.customTimers = [
      { id:"ct1", label:"Timer 1", totalSeconds:300, remainingSeconds:300, runningSince:null, finished:false },
      { id:"ct2", label:"Timer 2", totalSeconds:300, remainingSeconds:300, runningSince:null, finished:false },
    ];
  }
  state.customTimers.forEach(t=>{
    if(t.totalSeconds === undefined) t.totalSeconds = 300;
    if(t.remainingSeconds === undefined) t.remainingSeconds = t.totalSeconds;
    if(t.runningSince === undefined) t.runningSince = null;
    if(t.finished === undefined) t.finished = false;
  });
  if(state.historyCorrectionV2Applied === undefined) state.historyCorrectionV2Applied = false;

  seedKnownPerfectDays(state);

  if(!state.manualAdjustAug21Applied){
    state.totalPoints = 461;
    // 57% do ciclo de 23 dias = 13 dias — usa a marca d'água (nunca deixa
    // o progresso ficar abaixo disso, e nunca sobrescreve dados reais).
    state.petMaxDaysEquivalentEverSeen = Math.max(Number(state.petMaxDaysEquivalentEverSeen)||0, 13);
    state.manualAdjustAug21Applied = true;
  }
  if(!state.growthMatchCalendarDayV1Applied){
    // Correção pedida: crescimento alinhado ao dia do calendário — 9/08
    // é o dia 0, hoje (21/08) é o dia 12 do ciclo de 23. Esse é um ajuste
    // intencional dos pais, então força o valor (não é regressão real).
    state.petMaxDaysEquivalentEverSeen = 12;
    state.growthMatchCalendarDayV1Applied = true;
  }

  // limpeza: remove qualquer registro de histórico com data no futuro (só pode
  // ter vindo de uma sessão anterior de teste de data) — evita que isso
  // inflacione o crescimento do Pacus ou bagunce as tabelas depois
  let cleaned = false;
  if(!TEST_DATE_OVERRIDE){
    const realToday = todayISO();
    Object.keys(state.history).forEach(iso=>{
      if(iso > realToday){ delete state.history[iso]; cleaned = true; }
    });
    if(state.lastDate > realToday){ state.lastDate = realToday; cleaned = true; }
  }

  if(state.lastDate !== todayISO()){
    // fecha o dia anterior no histórico antes de zerar o checklist
    closeOutDay(state, state.lastDate);

    // se ficou mais de um dia sem abrir o app, os dias pulados no meio
    // nunca tinham registro nenhum — agora registramos como "app não
    // aberto" (sem tarefa marcada), não como um dia que falhou.
    if(state.lastDate){
      let cursor = new Date(state.lastDate+"T00:00:00");
      cursor.setDate(cursor.getDate()+1);
      const todayDate = new Date(todayISO()+"T00:00:00");
      while(cursor < todayDate){
        const iso = cursor.getFullYear()+"-"+String(cursor.getMonth()+1).padStart(2,'0')+"-"+String(cursor.getDate()).padStart(2,'0');
        if(!state.history[iso]){
          const skippedTasks = allTasks(iso);
          state.history[iso] = { done:0, total:skippedTasks.length, pointsEarnedThatDay:0, perfect:false, screenMinutes:0, periodsCompleted:0, hair:null };
        }
        cursor.setDate(cursor.getDate()+1);
      }
    }

    state.checkedToday = {};
    state.log = [];
    state.lastDate = todayISO();
    // zera o tempo de jogo usado — é uma cota que renova todo dia
    state.gameTimer = { date: todayISO(), usedSeconds: 0, runningSince: null, bonusSeconds: 0, redemptions: {} };
    saveState(state);
  } else if(cleaned){
    saveState(state);
  }
  return state;
}

function periodsCompletedFrom(checkedMap, dateISO){
  let count = 0;
  Object.values(getPeriodsFor(dateISO || todayISO())).forEach(period=>{
    const applicable = period.tasks.filter(t=>checkedMap[t.id] !== 'na');
    if(applicable.length>0 && applicable.every(t=>checkedMap[t.id]==='done')) count++;
  });
  return count;
}

// Regra 1: tempo de tela só desbloqueia com as missões ESSENCIAIS feitas
// (não a lista inteira da Manhã — extras como Duolingo não travam o jogo).
function isManhaComplete(dateISO){
  const periods = getPeriodsFor(dateISO || todayISO());
  const essential = periods.manha.tasks.filter(t=>t.tier === 'essencial' && state.checkedToday[t.id] !== 'na');
  return essential.length > 0 && essential.every(t=>isCountedDone(state.checkedToday[t.id]));
}

function registerPetDayCompletion(dateISO){
  const startISO = CONFIG.pet.growthStartDate || CONFIG.historyStartDate || "2026-08-09";
  const endISO = CONFIG.pet.growthEndDate || "2026-08-31";
  if(dateISO < startISO || dateISO > endISO) return false;
  if(!Array.isArray(state.petCompletedDays)) state.petCompletedDays = [];
  if(state.petCompletedDays.includes(dateISO)) return false;
  state.petCompletedDays.push(dateISO);
  state.petCompletedDays.sort();
  state.petLastCompletionISO = dateISO;
  return true;
}

// Dia 100% perfeito dá um empurrãozinho A MAIS no crescimento do Pacus,
// além do dia normal que ele já ganha por ter feito alguma coisa.
function registerPetPerfectBonus(dateISO){
  const startISO = CONFIG.pet.growthStartDate || CONFIG.historyStartDate || "2026-08-09";
  const endISO = CONFIG.pet.growthEndDate || "2026-08-31";
  if(dateISO < startISO || dateISO > endISO) return false;
  if(!Array.isArray(state.petPerfectBonusDays)) state.petPerfectBonusDays = [];
  if(state.petPerfectBonusDays.includes(dateISO)) return false;
  state.petPerfectBonusDays.push(dateISO);
  state.petPerfectBonusDays.sort();
  return true;
}

function isDayPerfect(dateISO){
  if(dateISO === todayISO()){
    const tasks = allTasks(dateISO);
    const applicable = tasks.filter(t=>state.checkedToday[t.id] !== 'na');
    return applicable.length > 0 && applicable.every(t=>isCountedDone(state.checkedToday[t.id]));
  }
  return !!(state.history[dateISO] && state.history[dateISO].perfect);
}

// Crescimento não exige dia perfeito, só engajamento real. isDayPerfect
// continua controlando o bônus de tela e o selo "dia perfeito".
function hasDayProgress(dateISO){
  if(dateISO === todayISO()){
    const tasks = allTasks(dateISO);
    const applicable = tasks.filter(t=>state.checkedToday[t.id] !== 'na');
    return applicable.some(t=>isCountedDone(state.checkedToday[t.id]));
  }
  const entry = state.history[dateISO];
  return !!(entry && entry.done > 0);
}

function syncPetCompletionFromDay(dateISO){
  let grew = false;
  if(hasDayProgress(dateISO)) grew = registerPetDayCompletion(dateISO) || grew;
  if(isDayPerfect(dateISO)) grew = registerPetPerfectBonus(dateISO) || grew;
  return grew;
}

function closeOutDay(state, dateISO){
  if(!dateISO) return;
  const tasks = allTasks(dateISO);
  const applicable = tasks.filter(t=>state.checkedToday[t.id] !== 'na');
  const total = applicable.length;
  const done = applicable.filter(t=>isCountedDone(state.checkedToday[t.id])).length;
  const pointsEarnedThatDay = tasks.reduce((s,t)=>{
    const st = state.checkedToday[t.id];
    if(st === 'done') return s + t.pts;
    if(st === 'help') return s + taskHelpPoints(t);
    return s;
  }, 0);
  const perfect = total > 0 && done === total;
  if(done > 0) registerPetDayCompletion(dateISO);
  if(perfect) registerPetPerfectBonus(dateISO);
  const screenMinutes = perfect ? (CONFIG.perfectDayBonusMinutes || 30) : 0;
  const periodsCompleted = periodsCompletedFrom(state.checkedToday, dateISO);
  state.history[dateISO] = { done, total, pointsEarnedThatDay, perfect, screenMinutes, periodsCompleted, hair: state.hairByDate?.[dateISO] || null };
}

function saveState(state, options={}){
  if(!options.remote){
    state.revision = (Number(state.revision)||0) + 1;
    state.updatedAt = new Date().toISOString();
  }
  try{ localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(state)); }catch(e){}
  scheduleAutoPush();
}

/* ---------- sincronização automática com o Google Drive ----------
   Sempre que o arquivo abre, ele tenta buscar a versão mais nova salva
   no Drive (via Apps Script) e usa ela — assim, não importa em qual
   aparelho vocês abrirem, todos mostram a mesma coisa. Sempre que algo
   muda aqui, ele também manda a atualização pro Drive sozinho, na hora
   (sem precisar clicar em nada). Se estiver offline, o arquivo continua
   funcionando normal com os dados salvos localmente.
   IMPORTANTE: essas variáveis precisam existir ANTES de carregar
   CONFIG/state, porque o carregamento pode precisar salvar de volta
   (limpezas, correções automáticas) e isso já chama scheduleAutoPush.
   E a sincronização fica SUSPENSA durante esse carregamento inicial —
   nesse momento ainda nem todo o resto do código rodou, então tentar
   sincronizar/renderizar tão cedo pode travar. Ela é reativada logo
   depois, uma vez que CONFIG e state já estão prontos. */
let suppressAutoPush = true;
let pushInFlight = false;
let pushPending = false;

let CONFIG = loadConfig();
let state = loadState();

suppressAutoPush = false;

function scheduleAutoPush(){
  if(!APPS_SCRIPT_URL || suppressAutoPush) return;
  if(pushInFlight){ pushPending = true; return; }
  doAutoPush();
}

async function doAutoPush(){
  if(!APPS_SCRIPT_URL) return;
  pushInFlight = true;
  try{
    const payload = {
      appVersion: APP_VERSION,
      config: CONFIG,
      state: state,
      baseRevision: Number(state.driveRevision)||0,
      clientRevision: Number(state.revision)||0,
      clientUpdatedAt: state.updatedAt || new Date().toISOString(),
      exportedAt: new Date().toISOString()
    };
    const res = await fetch(DATA_ENDPOINT, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify(payload)
    });
    const result = await res.json();
    if(result.ok){
      state.driveRevision = Number(result.revision)||state.driveRevision;
      state.driveLastSyncISO = todayISO();
      state.driveConflictCount = 0;
      try{ localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(state)); }catch(e){}
        } else if(result.conflict && result.data){
      state.driveConflictCount = (Number(state.driveConflictCount)||0)+1;
      const server = result.data;
      const merged = mergeRemoteData(server);
      CONFIG = merged.config;
      state = merged.state;
      state.driveRevision = Number(result.revision)||Number(server.state?.driveRevision)||0;
      state.driveLastSyncISO = todayISO();
      saveState(state);
      saveConfig(CONFIG);
      render();
    }
  }catch(err){
    } finally {
    pushInFlight = false;
    if(pushPending){
      pushPending = false;
      doAutoPush();
    }
  }
}

function isValidPeriodsConfig(cfg){
  try{
    const p = cfg && cfg.periods;
    return !!(
      p &&
      p.manha && Array.isArray(p.manha.tasks) && p.manha.tasks.length > 0 &&
      p.tarde && Array.isArray(p.tarde.tasks) && p.tarde.tasks.length > 0 &&
      p.noite && Array.isArray(p.noite.tasks) && p.noite.tasks.length > 0
    );
  }catch(e){
    return false;
  }
}

function sanitizeRemoteConfig(remoteConfig){
  if(!isValidPeriodsConfig(remoteConfig)) return null;
  const safe = JSON.parse(JSON.stringify(remoteConfig));
  if(!safe.periodsWeekend) safe.periodsWeekend = null;
  if(!Array.isArray(safe.badHabits)) safe.badHabits = [];
  if(!Array.isArray(safe.rewards)) safe.rewards = [];
  if(!Array.isArray(safe.schedule)) safe.schedule = [];
  if(!Array.isArray(safe.scheduleExceptions)) safe.scheduleExceptions = [];
  if(!safe.pet || !Array.isArray(safe.pet.stages) || safe.pet.stages.length < 2) {
    safe.pet = JSON.parse(JSON.stringify(DEFAULT_CONFIG.pet));
  }
  return stripLegacyHairTask(safe);
}

function mergeRemoteData(remote){
  const remoteState = remote.state || {};
  const localState = state || {};
  const merged = JSON.parse(JSON.stringify(remoteState));
  // Mescla o histórico dia a dia: se um dia existe só de um lado, ele
  // SEMPRE fica (não é conflito de verdade, só falta de sincronização).
  // Só usa data/hora pra decidir quando os DOIS lados têm um registro
  // diferente pro mesmo dia.
  merged.history = {...(remoteState.history||{})};
  Object.entries(localState.history||{}).forEach(([iso,entry])=>{
    const remoteEntry = merged.history[iso];
    if(!remoteEntry){
      merged.history[iso] = entry;
      return;
    }
    if(JSON.stringify(entry) !== JSON.stringify(remoteEntry)){
      const localUpdated = entry.updatedAt || localState.updatedAt || '';
      const remoteUpdated = remoteEntry.updatedAt || remoteState.updatedAt || '';
      if(localUpdated >= remoteUpdated) merged.history[iso] = entry;
    }
  });
  merged.petCompletedDays = [...new Set([...(remoteState.petCompletedDays||[]), ...(localState.petCompletedDays||[])])].sort();
  merged.petPerfectBonusDays = [...new Set([...(remoteState.petPerfectBonusDays||[]), ...(localState.petPerfectBonusDays||[])])].sort();
  merged.petMaxDaysEquivalentEverSeen = Math.max(Number(remoteState.petMaxDaysEquivalentEverSeen)||0, Number(localState.petMaxDaysEquivalentEverSeen)||0);
  merged.historyCorrectionV2Applied = !!(remoteState.historyCorrectionV2Applied || localState.historyCorrectionV2Applied);
  merged.hairByDate = {...(remoteState.hairByDate||{}), ...(localState.hairByDate||{})};
  merged.totalPoints = Math.max(Number(remoteState.totalPoints)||0, Number(localState.totalPoints)||0);
  merged.lastSeenPetStage = Math.max(Number(remoteState.lastSeenPetStage)||0, Number(localState.lastSeenPetStage)||0);
  merged.log = [...(localState.log||[]), ...(remoteState.log||[])].slice(0,30);
  merged.revision = Math.max(Number(localState.revision)||0, Number(remoteState.revision)||0)+1;
  merged.updatedAt = new Date().toISOString();
  const remoteConfig = sanitizeRemoteConfig(remote.config);
  const localConfigValid = isValidPeriodsConfig(CONFIG);
  const useRemoteConfig = remoteConfig && (!localConfigValid || localState.updatedAt < (remoteState.updatedAt||''));
  return {
    config: useRemoteConfig ? remoteConfig : (localConfigValid ? CONFIG : JSON.parse(JSON.stringify(DEFAULT_CONFIG))),
    state: merged
  };
}

// Busca e mescla os dados do Drive — usada tanto ao abrir o app quanto
// na sincronização periódica de segurança (a cada 5 min). SEMPRE mescla
// (nunca substitui de uma vez): mesmo quando o Drive parece "mais novo",
// os dados locais podem ter progresso que o Drive ainda não tem (ex:
// uma aba antiga sincronizando antes). mergeRemoteData usa união/máximo
// em tudo que é progresso acumulado, então nunca perde o que já foi
// conquistado.
async function pullAndMergeFromDrive(){
  if(!APPS_SCRIPT_URL) return;
  suppressAutoPush = true;
  try{
    const res = await fetch(DATA_ENDPOINT, {method:'GET', cache:'no-store'});
    if(res.ok){
      const backup = await res.json();
      if(backup && backup.config && backup.state){
        const remoteRevision = Number(backup.revision || backup.state.driveRevision)||0;
        const localRevision = Number(state.driveRevision)||0;
        if(remoteRevision !== localRevision || JSON.stringify(backup.config) !== JSON.stringify(CONFIG)){
          const merged = mergeRemoteData(backup);
          CONFIG = merged.config;
          state = merged.state;
          state.driveRevision = Math.max(remoteRevision, localRevision);
          state.driveLastSyncISO = todayISO();
          saveConfig(CONFIG);
          saveState(state);
          render();
        }
      }
    }
  }catch(err){
    }
  suppressAutoPush = false;
}
async function autoPullOnStartup(){
  await pullAndMergeFromDrive();
}

// Sincronização periódica de segurança: além do envio instantâneo a
// cada clique, busca e mescla o Drive de novo a cada 5 minutos — pega
// qualquer atualização feita em outro aparelho/aba que não tenha
// chegado na hora, sem depender só do clique.
let periodicSyncHandle = null;
function startPeriodicSync(){
  if(periodicSyncHandle) return;
  periodicSyncHandle = setInterval(pullAndMergeFromDrive, 5*60*1000);
}

function addLog(text, isParentAction){
  const time = new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
  state.log.unshift({ text: time+" — "+text, parent: !!isParentAction });
  state.log = state.log.slice(0, 30);
}
function bumpTotal(delta, anchorEl){
  const el = document.getElementById('totalPoints');
  el.textContent = state.totalPoints;
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');

  if(delta){
    const deltaEl = document.getElementById('pointsDelta');
    if(deltaEl){
      const rect = (anchorEl || el).getBoundingClientRect();
      deltaEl.style.left = (rect.left + rect.width/2) + 'px';
      deltaEl.style.top = (rect.top - 6) + 'px';
      deltaEl.classList.remove('show-up','show-down');
      void deltaEl.offsetWidth;
      deltaEl.textContent = (delta>0?'+':'−') + Math.abs(delta);
      deltaEl.classList.add(delta>0?'show-up':'show-down');
    }
  }
}

// 1 Pacus Point ≈ R$0,06 (dentro da faixa combinada de R$0,05–0,08) — o
// saldo nunca passa de 1000 pontos, equivalente a uns R$60 no máximo.
const MAX_POINTS = 1000;
const POINT_VALUE_BRL = 0.06;

function addPoints(delta){
  const before = state.totalPoints;
  state.totalPoints = Math.max(0, Math.min(MAX_POINTS, state.totalPoints + delta));
  return state.totalPoints - before;
}

// "✕ não realizado": perde metade dos pontos, arredondado pra cima e
// sempre par.
function notDonePenalty(pts){
  let half = Math.ceil(pts/2);
  if(half % 2 !== 0) half += 1;
  return half;
}

// Algumas tarefas (marcadas com fullPenalty:true) perdem o valor CHEIO em
// vez de metade — reforço maior pras tarefas mais chatas/resistidas.
function taskNotDonePenalty(task){
  return task.fullPenalty ? task.pts : notDonePenalty(task.pts);
}

// Regra 4: pedir ajuda ou dividir a tarefa continua valendo — metade dos
// pontos, arredondado pra cima (pedir ajuda direito é uma habilidade,
// não uma falha).
function taskHelpPoints(task){
  return Math.max(1, Math.ceil(task.pts/2));
}

/* ===================== TIMER DE TEMPO DE JOGO (diário) ===================== */
let gameTimerTickHandle = null;

function gameTimerDailyLimitSeconds(){
  const base = Math.round((CONFIG.screenDailyLimitHours || 2) * 3600);
  const bonus = Math.round((state.gameTimer.bonusSeconds || 0));
  return Math.max(0, base + bonus);
}

function addGameTimerBonusHours(hours){
  if(!state.gameTimer.bonusSeconds) state.gameTimer.bonusSeconds = 0;
  state.gameTimer.bonusSeconds += Math.round(hours * 3600);
}

function gameTimerSecondsUsedNow(){
  const gt = state.gameTimer;
  const running = gt.runningSince ? (Date.now() - gt.runningSince)/1000 : 0;
  return gt.usedSeconds + running;
}

function gameTimerIsRunning(){
  return !!state.gameTimer.runningSince;
}

function startGameTimer(){
  if(gameTimerIsRunning()) return;
  if(!isManhaComplete()) return;
  state.gameTimer.runningSince = Date.now();
  addLog('🎮 começou a jogar');
  saveState(state);
  renderGameTimer();
  startGameTimerTicking();
}

function stopGameTimer(){
  if(!gameTimerIsRunning()) return;
  const elapsed = (Date.now() - state.gameTimer.runningSince)/1000;
  state.gameTimer.usedSeconds += elapsed;
  state.gameTimer.runningSince = null;
  addLog('⏸️ parou de jogar');
  saveState(state);
  renderGameTimer();
  stopGameTimerTicking();
}

// enquanto está rodando, "descarrega" o tempo periodicamente pro estado
// salvo — assim não perde o progresso se a página fechar sem clicar em parar
function flushGameTimer(){
  if(!gameTimerIsRunning()) return;
  const elapsed = (Date.now() - state.gameTimer.runningSince)/1000;
  state.gameTimer.usedSeconds += elapsed;
  state.gameTimer.runningSince = Date.now();
  saveState(state);
}

function formatMinSec(totalSeconds){
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s/3600);
  const m = Math.floor((s%3600)/60);
  if(h > 0) return `${h}h ${String(m).padStart(2,'0')}min`;
  return `${m} min`;
}

function startGameTimerTicking(){
  if(gameTimerTickHandle) return;
  let flushCounter = 0;
  gameTimerTickHandle = setInterval(()=>{
    updateGameTimerDisplay();
    flushCounter++;
    if(flushCounter >= 20){ // ~20s, descarrega pro estado salvo
      flushCounter = 0;
      flushGameTimer();
    }
  }, 1000);
}
function stopGameTimerTicking(){
  if(gameTimerTickHandle){ clearInterval(gameTimerTickHandle); gameTimerTickHandle = null; }
}

function updateGameTimerDisplay(){
  const usedEl = document.getElementById('gameTimerUsed');
  const barEl = document.getElementById('gameTimerBarFill');
  if(!usedEl || !barEl) return;
  const limit = gameTimerDailyLimitSeconds();
  const used = gameTimerSecondsUsedNow();
  const remaining = limit - used;
  const pct = limit > 0 ? Math.min(100, Math.round((used/limit)*100)) : 100;
  usedEl.innerHTML = remaining > 0
    ? `<b>${formatMinSec(remaining)}</b> restantes hoje`
    : `<b>tempo de hoje acabou</b>`;
  barEl.style.width = pct + '%';
  barEl.classList.toggle('over-limit', used >= limit);
}

function renderGameTimer(){
  const el = document.getElementById('gameTimerSection');
  if(!el) return;
  const running = gameTimerIsRunning();
  const limit = gameTimerDailyLimitSeconds();
  const used = gameTimerSecondsUsedNow();
  const remaining = limit - used;
  const pct = limit > 0 ? Math.min(100, Math.round((used/limit)*100)) : 100;
  const manhaOk = isManhaComplete();
  const locked = !manhaOk && !running;

  el.innerHTML = `
    <div class="game-timer">
      <h3>🎮 Tempo de Jogo</h3>
      <div class="hint">Cota de ${CONFIG.screenDailyLimitHours || 2}h por dia.</div>
      ${locked ? `<div class="game-timer-locked">🔒 Termine as tarefas da Manhã pra desbloquear</div>` : ''}
      <div class="game-timer-used" id="gameTimerUsed">${remaining > 0 ? `<b>${formatMinSec(remaining)}</b> restantes hoje` : `<b>tempo de hoje acabou</b>`}</div>
      <div class="game-timer-track"><div class="game-timer-fill ${used>=limit?'over-limit':''}" id="gameTimerBarFill" style="width:${pct}%"></div></div>
      <button class="game-timer-btn ${running?'running':''}" id="gameTimerToggleBtn" ${locked?'disabled':''}>
        ${running ? '⏸️ Parar de jogar' : '▶️ Começar a jogar'}
      </button>
      ${adultUnlocked ? `<button class="icon-btn" id="gameTimerAdjustBtn" style="margin-top:8px;" title="Ajuste manual do tempo de hoje">⚙️ ajustar tempo de hoje</button>` : ''}
    </div>
  `;
  document.getElementById('gameTimerToggleBtn').addEventListener('click', ()=>{
    if(gameTimerIsRunning()) stopGameTimer(); else startGameTimer();
  });

  const adjustBtn = document.getElementById('gameTimerAdjustBtn');
  if(adjustBtn){
    adjustBtn.addEventListener('click', ()=>{
      const currentRemainingMin = Math.round(remaining/60);
      const raw = prompt('Quantos minutos você quer que sobrem hoje?', String(Math.max(0, currentRemainingMin)));
      if(raw === null) return;
      const targetMin = parseInt(raw, 10);
      if(isNaN(targetMin) || targetMin < 0) return;
      const deltaSeconds = (targetMin*60) - remaining;
      addGameTimerBonusHours(deltaSeconds/3600);
      addLog(`⚙️ tempo de hoje ajustado pra ${targetMin} min restantes`, true);
      saveState(state);
      renderGameTimer();
    });
  }

  if(running) startGameTimerTicking(); else stopGameTimerTicking();
}

/* ===================== TIMERS AVULSOS (tempo livre pra qualquer coisa) ===================== */
let customTimerTickHandle = null;

function findCustomTimer(id){
  return state.customTimers.find(t=>t.id===id);
}

function customTimerRemainingNow(t){
  if(!t.runningSince) return t.remainingSeconds;
  const elapsed = (Date.now() - t.runningSince)/1000;
  return Math.max(0, t.remainingSeconds - elapsed);
}

function setCustomTimerMinutes(id, minutes){
  const t = findCustomTimer(id);
  if(!t || t.runningSince) return; // não dá pra mudar enquanto está rodando
  const secs = Math.max(0, Math.round(minutes*60));
  t.totalSeconds = secs;
  t.remainingSeconds = secs;
  t.finished = false;
  saveState(state);
}

function startCustomTimer(id){
  const t = findCustomTimer(id);
  if(!t || t.runningSince || t.remainingSeconds <= 0) return;
  t.runningSince = Date.now();
  t.finished = false;
  saveState(state);
  startCustomTimerTicking();
}

function pauseCustomTimer(id){
  const t = findCustomTimer(id);
  if(!t || !t.runningSince) return;
  t.remainingSeconds = customTimerRemainingNow(t);
  t.runningSince = null;
  saveState(state);
}

function resetCustomTimer(id){
  const t = findCustomTimer(id);
  if(!t) return;
  t.remainingSeconds = t.totalSeconds;
  t.runningSince = null;
  t.finished = false;
  saveState(state);
}

function playBeep(){
  try{
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return;
    const ctx = new Ctx();
    [0, 220, 440].forEach(delay=>{
      setTimeout(()=>{
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.value = 0.15;
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      }, delay);
    });
  }catch(e){ /* som é só um extra, sem problema se falhar */ }
}

function anyCustomTimerRunning(){
  return state.customTimers.some(t=>t.runningSince);
}

function startCustomTimerTicking(){
  if(customTimerTickHandle) return;
  customTimerTickHandle = setInterval(()=>{
    let needsFullRender = false;
    state.customTimers.forEach(t=>{
      if(!t.runningSince) return;
      const remaining = customTimerRemainingNow(t);
      if(remaining <= 0 && !t.finished){
        t.remainingSeconds = 0;
        t.runningSince = null;
        t.finished = true;
        playBeep();
        needsFullRender = true;
      }
    });
    if(needsFullRender){ saveState(state); renderCustomTimers(); }
    else updateCustomTimerDisplays();
    if(!anyCustomTimerRunning()) stopCustomTimerTicking();
  }, 1000);
}
function stopCustomTimerTicking(){
  if(customTimerTickHandle){ clearInterval(customTimerTickHandle); customTimerTickHandle = null; }
}

function updateCustomTimerDisplays(){
  state.customTimers.forEach(t=>{
    const el = document.getElementById('customTimerDisplay_'+t.id);
    if(el) el.textContent = formatHMS(customTimerRemainingNow(t));
  });
}

function formatHMS(totalSeconds){
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s/3600);
  const m = Math.floor((s%3600)/60);
  const sec = s%60;
  if(h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function renderCustomTimers(){
  const el = document.getElementById('customTimersSection');
  if(!el) return;

  const cardsHtml = state.customTimers.map(t=>{
    const running = !!t.runningSince;
    const remaining = customTimerRemainingNow(t);
    const totalMin = Math.round(t.totalSeconds/60);
    return `
      <div class="custom-timer ${t.finished?'finished':''}">
        <input type="text" class="custom-timer-label" id="customTimerLabel_${t.id}" value="${escapeAttr(t.label)}" maxlength="20">
        <div class="custom-timer-display" id="customTimerDisplay_${t.id}">${formatHMS(remaining)}</div>
        <div class="custom-timer-setrow">
          <input type="number" min="0" step="1" id="customTimerMin_${t.id}" value="${totalMin}" ${running?'disabled':''}>
          <span>min</span>
          <button class="custom-timer-btn secondary" id="customTimerSetBtn_${t.id}" ${running?'disabled':''}>definir</button>
        </div>
        <div class="custom-timer-btns">
          <button class="custom-timer-btn" id="customTimerStartBtn_${t.id}" ${(running||remaining<=0)?'disabled':''}>▶️ Iniciar</button>
          <button class="custom-timer-btn secondary" id="customTimerPauseBtn_${t.id}" ${running?'':'disabled'}>⏸️ Pausar</button>
          <button class="custom-timer-btn secondary" id="customTimerResetBtn_${t.id}">↺ Reiniciar</button>
        </div>
      </div>
    `;
  }).join('');

  el.innerHTML = `
    <div class="custom-timers-wrap">
      <div class="custom-timers">${cardsHtml}</div>
    </div>
  `;

  state.customTimers.forEach(t=>{
    document.getElementById('customTimerLabel_'+t.id).addEventListener('change', e=>{
      t.label = e.target.value.trim() || t.label;
      saveState(state);
    });
    document.getElementById('customTimerSetBtn_'+t.id).addEventListener('click', ()=>{
      const val = parseFloat(document.getElementById('customTimerMin_'+t.id).value);
      setCustomTimerMinutes(t.id, isNaN(val) ? 0 : val);
    });
    document.getElementById('customTimerStartBtn_'+t.id).addEventListener('click', ()=> startCustomTimer(t.id));
    document.getElementById('customTimerPauseBtn_'+t.id).addEventListener('click', ()=> pauseCustomTimer(t.id));
    document.getElementById('customTimerResetBtn_'+t.id).addEventListener('click', ()=> resetCustomTimer(t.id));
  });

  if(anyCustomTimerRunning()) startCustomTimerTicking(); else stopCustomTimerTicking();
}

/* ---------------- render principal ---------------- */
/* ===================== PACUS, O AXOLOTE ===================== */
function getPetCycle(){
  const startISO = CONFIG.pet.growthStartDate || CONFIG.historyStartDate || "2026-08-09";
  const endISO = CONFIG.pet.growthEndDate || "2026-08-31";
  const start = new Date(startISO+"T00:00:00");
  const end = new Date(endISO+"T00:00:00");
  const totalDays = Math.max(1, Math.round((end-start)/86400000)+1);
  return { startISO, endISO, start, end, totalDays };
}

function computePetStage(){
  const cycle = getPetCycle();
  const maxStage = CONFIG.pet.stages.length - 1;
  const completed = new Set(Array.isArray(state.petCompletedDays) ? state.petCompletedDays : []);
  const perfectBonus = new Set(Array.isArray(state.petPerfectBonusDays) ? state.petPerfectBonusDays : []);
  const validDays = [];
  let bonusDays = 0;
  for(let i=0;i<cycle.totalDays;i++){
    const d = new Date(cycle.start);
    d.setDate(d.getDate()+i);
    const iso = d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,'0')+"-"+String(d.getDate()).padStart(2,'0');
    if(completed.has(iso)) validDays.push(iso);
    if(perfectBonus.has(iso)) bonusDays++;
  }
  const rawCompletedDays = Math.min(cycle.totalDays, validDays.length + bonusDays);

  // trava de segurança: o progresso do Pacus nunca pode andar pra trás na
  // tela, mesmo que uma sincronização ou uma aba antiga em cache recalcule
  // um valor menor por engano — sempre usamos o maior já visto.
  const previousHWM = Number(state.petMaxDaysEquivalentEverSeen) || 0;
  if(rawCompletedDays > previousHWM){
    state.petMaxDaysEquivalentEverSeen = rawCompletedDays;
    try{ localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(state)); }catch(e){}
  }
  const completedDays = Math.max(rawCompletedDays, Number(state.petMaxDaysEquivalentEverSeen) || 0);

  const stageFloat = Math.min(maxStage, completedDays);
  const stage = Math.min(maxStage, completedDays);
  const todayHasProgress = hasDayProgress(todayISO());
  const canGrowToday = todayISO() >= cycle.startISO && todayISO() <= cycle.endISO && todayHasProgress && !completed.has(todayISO());
  return {
    stage, stageFloat, unitsCompleted:completedDays, totalUnits:cycle.totalDays,
    maxStage, daysEquivalent:completedDays, cycleDays:cycle.totalDays,
    todayPerfect:todayHasProgress, canGrowToday, completedDays:validDays
  };
}

function svgAttrs(){
  return 'viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Evolução do Pacus"';
}

function buildEggSVG(progress){
  const p = Math.max(0, Math.min(1, progress));
  const wobble = Math.sin(p*Math.PI*3)*1.4;
  const gid = uid('egg');
  const cracks = [
    ["M94 80 L106 96 L98 109 L112 125 L103 142", 0.12],
    ["M80 96 L92 108 L84 122 L96 136", 0.32],
    ["M124 90 L113 105 L126 117 L116 132 L123 147", 0.52],
    ["M76 124 L89 131 L82 147", 0.72],
    ["M132 119 L122 128 L134 141", 0.88]
  ];
  const crackSvg = cracks.map(([d,start],i)=>{
    const opacity = p < start ? 0 : Math.min(1,(p-start)/0.16);
    return `<path d="${d}" class="egg-crack" stroke="#c9506f" stroke-width="${2+i*.25}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`;
  }).join('');
  const shellBreak = p > .78 ? `<path d="M62 118 Q100 ${142+p*10} 158 118" stroke="#c9506f" stroke-width="2.4" fill="none" opacity="${(p-.78)/.22}"/>` : '';
  // silhueta do filhote crescendo por dentro, visível através da casca
  const embryoOpacity = Math.max(0, p-0.3)*0.55;
  const embryoScale = 0.5 + p*0.5;
  return `<svg class="pet-mascot pet-egg" ${svgAttrs()}>
    <defs>
      <radialGradient id="${gid}-shell" cx="36%" cy="30%" r="78%">
        <stop offset="0%" stop-color="#fffaf1"/>
        <stop offset="55%" stop-color="#f9ecd9"/>
        <stop offset="100%" stop-color="#eed7bd"/>
      </radialGradient>
    </defs>
    <g class="pacus-idle">
      <g transform="rotate(${wobble} 110 130)">
        <ellipse cx="110" cy="130" rx="48" ry="60" fill="url(#${gid}-shell)" stroke="#e88aa8" stroke-width="3"/>
        <ellipse cx="93" cy="106" rx="12" ry="18" fill="#fff" opacity=".5"/>
        <g transform="translate(110 138) scale(${embryoScale.toFixed(2)}) translate(-110 -138)" opacity="${embryoOpacity.toFixed(2)}">
          <ellipse cx="110" cy="138" rx="26" ry="20" fill="#f6c7dc"/>
          <circle cx="110" cy="122" r="15" fill="#f6c7dc"/>
        </g>
        ${crackSvg}${shellBreak}
      </g>
    </g>
    <circle class="pacus-bubble" cx="72" cy="169" r="4" fill="#e8a3c0" opacity=".55"/>
    <circle class="pacus-bubble" cx="151" cy="165" r="3" fill="#e8a3c0" opacity=".45" style="animation-delay:1s;"/>
    <circle class="pacus-bubble" cx="118" cy="182" r="2.4" fill="#e8a3c0" opacity=".4" style="animation-delay:1.9s;"/>
  </svg>`;
}

function buildPacusSVG(stageFloat){
  const s = Math.max(0, Math.min(23, stageFloat));
  const hatch = Math.max(0, Math.min(1, (s-8)/6));
  const growth = Math.max(0, Math.min(1, (s-14)/9));
  const adult = Math.max(0, Math.min(1, (s-21)/2));
  const scale = 0.30 + hatch*0.22 + growth*0.42 + adult*0.06;
  const bodyW = 45 + growth*10 + adult*4;
  const bodyH = 30 + growth*5 + adult*3;
  const gillLen = 12 + growth*11 + adult*4;
  const faceY = 92 - hatch*7;
  const bodyY = 128 - hatch*5;
  const gid = uid('pacus');
  const shell = hatch < 1 ? `
    <path d="M62 151 Q45 158 54 174 Q70 184 85 170" fill="#f6ecd9" stroke="#e88aa8" stroke-width="2.5" opacity="${1-hatch*.55}"/>
    <path d="M158 151 Q175 158 166 174 Q150 184 135 170" fill="#f6ecd9" stroke="#e88aa8" stroke-width="2.5" opacity="${1-hatch*.55}"/>` : '';

  // guelras com dois filamentos cada, balançando devagar (efeito de água)
  const gillCount = 2 + Math.floor(Math.min(2,growth*2));
  let gills = '';
  for(let i=0;i<gillCount;i++){
    const y = faceY-6+i*8;
    const len = gillLen-(i*2);
    const delay = (i*0.18).toFixed(2);
    gills += `<g class="pacus-gill" style="animation-delay:${delay}s; transform-origin:${74-i*2}px ${y}px;">
      <path d="M${74-i*2} ${y} Q ${60-len*0.6} ${y-len*0.5} ${50-len/2} ${y-len*0.15}" stroke="#ef8fb3" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M${74-i*2} ${y} Q ${58-len*0.5} ${y+len*0.15} ${48-len/2} ${y+len*0.35}" stroke="#f3a7c6" stroke-width="2.3" fill="none" stroke-linecap="round"/>
    </g>
    <g class="pacus-gill" style="animation-delay:${delay}s; transform-origin:${146+i*2}px ${y}px;">
      <path d="M${146+i*2} ${y} Q ${160+len*0.6} ${y-len*0.5} ${170+len/2} ${y-len*0.15}" stroke="#ef8fb3" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M${146+i*2} ${y} Q ${162+len*0.5} ${y+len*0.15} ${172+len/2} ${y+len*0.35}" stroke="#f3a7c6" stroke-width="2.3" fill="none" stroke-linecap="round"/>
    </g>`;
  }

  // pernocas curtinhas, aparecem gradualmente a partir da eclosão
  const legOpacity = Math.min(1, hatch*1.0).toFixed(2);
  const legs = `
    <ellipse cx="${110-bodyW*0.72}" cy="${bodyY+bodyH*0.55}" rx="7" ry="5" fill="#eeaecb" opacity="${legOpacity}" transform="rotate(-20 ${110-bodyW*0.72} ${bodyY+bodyH*0.55})"/>
    <ellipse cx="${110+bodyW*0.72}" cy="${bodyY+bodyH*0.55}" rx="7" ry="5" fill="#eeaecb" opacity="${legOpacity}" transform="rotate(20 ${110+bodyW*0.72} ${bodyY+bodyH*0.55})"/>
    <ellipse cx="${110-bodyW*0.5}" cy="${bodyY+bodyH*0.92}" rx="7" ry="5" fill="#eeaecb" opacity="${legOpacity}" transform="rotate(-15 ${110-bodyW*0.5} ${bodyY+bodyH*0.92})"/>
    <ellipse cx="${110+bodyW*0.5}" cy="${bodyY+bodyH*0.92}" rx="7" ry="5" fill="#eeaecb" opacity="${legOpacity}" transform="rotate(15 ${110+bodyW*0.5} ${bodyY+bodyH*0.92})"/>
  `;

  const sparkle = adult > .8 ? `<text x="35" y="64" font-size="18">✨</text><text x="166" y="75" font-size="16">✨</text>` : '';

  return `<svg class="pet-mascot pet-hatch-crack" ${svgAttrs()}>
    <defs>
      <radialGradient id="${gid}-body" cx="42%" cy="34%" r="72%">
        <stop offset="0%" stop-color="#ffe3ef"/>
        <stop offset="60%" stop-color="#f6c7dc"/>
        <stop offset="100%" stop-color="#eeaecb"/>
      </radialGradient>
    </defs>
    ${shell}
    <g transform="translate(110 115) scale(${scale.toFixed(3)}) translate(-110 -115)">
      <g class="pacus-idle">
        ${sparkle}
        ${legs}
        <ellipse cx="110" cy="${bodyY+bodyH+4}" rx="${18+growth*9}" ry="${7+growth*3}" fill="url(#${gid}-body)"/>
        <ellipse cx="110" cy="${bodyY}" rx="${bodyW}" ry="${bodyH}" fill="url(#${gid}-body)"/>
        <ellipse cx="110" cy="${bodyY+8}" rx="${bodyW*.68}" ry="${bodyH*.52}" fill="#fff" opacity=".3"/>
        ${gills}
        <circle cx="110" cy="${faceY}" r="32" fill="url(#${gid}-body)"/>
        <g class="pacus-eye" style="transform-origin:97px ${faceY-4}px;"><circle cx="97" cy="${faceY-4}" r="4.5" fill="#3a2430"/><circle cx="98" cy="${faceY-5.5}" r="1.4" fill="#fff"/></g>
        <g class="pacus-eye" style="transform-origin:123px ${faceY-4}px; animation-delay:.08s;"><circle cx="123" cy="${faceY-4}" r="4.5" fill="#3a2430"/><circle cx="124" cy="${faceY-5.5}" r="1.4" fill="#fff"/></g>
        <path d="M96 ${faceY+12} Q110 ${faceY+18+growth*2} 124 ${faceY+12}" stroke="#b9607f" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <circle cx="89" cy="${faceY+8}" r="4" fill="#f3a7c6" opacity=".72"/><circle cx="131" cy="${faceY+8}" r="4" fill="#f3a7c6" opacity=".72"/>
      </g>
    </g>
  </svg>`;
}

function buildPetVisual(stageFloat){
  if(stageFloat < 9) return buildEggSVG(stageFloat/8);
  return buildPacusSVG(stageFloat);
}

// Miniatura fixa no canto — aparece quando a seção principal sai da
// tela. Toque rola de volta pro topo.
let miniPacusObserverStarted = false;
function renderMiniPacus(stageFloat){
  const el = document.getElementById('miniPacus');
  if(!el) return;
  el.innerHTML = buildPetVisual(stageFloat);
  startMiniPacusObserver();
}
function startMiniPacusObserver(){
  if(miniPacusObserverStarted) return;
  const target = document.getElementById('petSection');
  const mini = document.getElementById('miniPacus');
  if(!target || !mini || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      mini.classList.toggle('visible', !entry.isIntersecting);
    });
  }, { threshold: 0 });
  observer.observe(target);
  mini.addEventListener('click', ()=>{
    target.scrollIntoView({ behavior:'smooth', block:'center' });
  });
  miniPacusObserverStarted = true;
}

// Pra cada marco de evolução, descobre em que dia ele foi alcançado (com
// base na lista de dias completos, em ordem) — usado no mural de conquistas.
function getMilestoneDates(){
  const cycle = getPetCycle();
  const sorted = [...(state.petCompletedDays||[])]
    .filter(d => d >= cycle.startISO && d <= cycle.endISO)
    .sort();
  const milestones = [
    [0,'Ovo'], [5,'Rachando'], [9,'Eclosão'], [14,'Bebê'], [19,'Jovem'], [23,'Adulto']
  ];
  return milestones.map(([day,label])=>{
    if(day === 0) return { label, day, date: cycle.startISO, reached: true };
    const reached = sorted.length >= day;
    return { label, day, date: reached ? sorted[day-1] : null, reached };
  });
}

function renderAchievementMural(){
  const el = document.getElementById('achievementMuralSection');
  if(!el) return;
  const milestones = getMilestoneDates();
  const cardsHtml = milestones.map(m=>`
    <div class="mural-card ${m.reached?'reached':''}">
      <div class="mural-stage">${m.label}</div>
      <div class="mural-date">${m.reached ? formatDateBR(m.date) : '—'}</div>
    </div>
  `).join('');
  el.innerHTML = `
    <div class="achievement-mural">
      <div class="mural-grid">${cardsHtml}</div>
    </div>
  `;
}

// Toque no Pacus: gira em 3D e mostra uma reaçãozinha fofa — pura
// diversão, não mexe em pontos nem no formato/crescimento dele.
const PACUS_REACTIONS = ['💕','😊','🥰','✨','👋','🫧','😄','💗'];
function wirePacusInteraction(){
  const wrap = document.getElementById('pacusInteractive');
  if(!wrap) return;
  wrap.addEventListener('click', ()=>{
    wrap.classList.remove('spinning');
    void wrap.offsetWidth;
    wrap.classList.add('spinning');

    const bubble = document.getElementById('petReactionBubble');
    if(bubble){
      const pick = PACUS_REACTIONS[Math.floor(Math.random()*PACUS_REACTIONS.length)];
      bubble.textContent = pick;
      bubble.classList.remove('show');
      void bubble.offsetWidth;
      bubble.classList.add('show');
    }
    if(Math.random() < 0.25) fireConfetti(wrap, 10);
  });
}

// Fala noturna do Pacus — aparece sozinha quando a Noite começa,
// dispensável só por hoje.
const PACUS_NIGHT_MESSAGE = "Não esqueça de desenhar na lousa hoje! 🎨";
let pacusDialogueTickHandle = null;
function isEveningNow(){
  const start = periodStartTime(CONFIG.periods.noite.time);
  if(!start) return false;
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(start.hour, start.minute, 0, 0);
  return now >= startToday;
}
function renderPacusDialogue(){
  const el = document.getElementById('pacusDialogue');
  if(!el) return;
  const dismissedToday = state.pacusDialogueDismissedDate === todayISO();
  if(!isEveningNow() || dismissedToday){ el.innerHTML = ''; return; }
  el.innerHTML = `
    <div class="pacus-dialogue">
      <span class="pacus-dialogue-text">💬 ${PACUS_NIGHT_MESSAGE}</span>
      <button class="pacus-dialogue-close" id="pacusDialogueCloseBtn" title="Ok, entendi!">✕</button>
    </div>
  `;
  document.getElementById('pacusDialogueCloseBtn').addEventListener('click', ()=>{
    state.pacusDialogueDismissedDate = todayISO();
    saveState(state);
    renderPacusDialogue();
  });
}
function startPacusDialogueTicking(){
  if(pacusDialogueTickHandle) return;
  pacusDialogueTickHandle = setInterval(renderPacusDialogue, 30000);
}

function renderPet(){
  const el = document.getElementById('petSection');
  const data = computePetStage();
  const { stage, stageFloat, daysEquivalent, cycleDays, maxStage, canGrowToday } = data;
  const stageInfo = CONFIG.pet.stages[stage];
  const progressPct = Math.round((daysEquivalent/cycleDays)*100);

  renderMiniPacus(stageFloat);

  const milestones = [
    [0,'Ovo'], [5,'Rachando'], [9,'Eclosão'], [14,'Bebê'], [19,'Jovem'], [23,'Adulto']
  ];
  const milestoneHtml = milestones.map(([day,label])=>{
    const active = daysEquivalent >= day;
    const current = stage >= day && (stage === day || (stage > day && day === 23));
    return `<span class="pet-milestone ${active?'active':''} ${current?'current':''}">${label} <small>dia ${day}</small></span>`;
  }).join('');

  let caption;
  if(stage === maxStage){
    caption = `Pacus adulto! <b>Ciclo concluído em 31/08.</b> 🎉`;
  } else if(canGrowToday && isDayPerfect(todayISO())){
    caption = `<b>Dia perfeito!</b> O Pacus ganha um empurrãozinho <b>extra</b> de crescimento hoje! ✨`;
  } else if(canGrowToday){
    caption = `<b>Boa!</b> O Pacus vai evoluir mais um pouco hoje.`;
  } else if(daysEquivalent === 0){
    caption = `Complete um dia inteiro de tarefas pra começar a rachar o ovo.`;
  } else {
    const nextMilestone = milestones.find(([day]) => day > daysEquivalent);
    if(nextMilestone){
      const diasFaltando = nextMilestone[0] - daysEquivalent;
      caption = `Faltam <b>${diasFaltando} ${diasFaltando===1?'dia':'dias'}</b> para virar <b>${nextMilestone[1]}</b>.`;
    } else {
      caption = `Quase lá! O Pacus está quase adulto.`;
    }
  }

  const previousProgress = Number(el.dataset.pacusProgress ?? daysEquivalent);
  const grewNow = daysEquivalent > previousProgress;
  el.dataset.pacusProgress = String(daysEquivalent);

  el.innerHTML = `
    <div class="pet-mascot-wrap" id="pacusInteractive" title="Toque no Pacus!">
      ${buildPetVisual(stageFloat)}
      <span class="pet-accessory">🌿</span>
      <span class="pet-reaction-bubble" id="petReactionBubble"></span>
    </div>
    <div id="pacusDialogue"></div>
    <div class="pet-name">${CONFIG.pet.name}</div>
    <div class="pet-stage-label">${stageInfo.label} · ${daysEquivalent}/${cycleDays} dias completos · adulto em 31/08</div>
    <div class="pet-day-progress">
      <div class="pet-day-progress-head"><span>Progresso do Pacus</span><b>${progressPct}%</b></div>
      <div class="pet-day-track" aria-label="${daysEquivalent} de ${cycleDays} dias completos"><div class="pet-day-fill" style="width:${progressPct}%"></div></div>
    </div>
    <div class="pet-milestones">${milestoneHtml}</div>
    <div class="pet-caption">${caption}</div>
    <div id="petEvolvedBanner"></div>
    <div class="streak-strip">${buildStreakStrip()}</div>
  `;

  wirePacusInteraction();
  renderPacusDialogue();
  startPacusDialogueTicking();

  if(grewNow){
    const mascotEl = el.querySelector('.pet-mascot');
    if(mascotEl){
      mascotEl.classList.remove('pet-growth-burst');
      void mascotEl.offsetWidth;
      mascotEl.classList.add('pet-growth-burst');
      if(stage < 9){ mascotEl.classList.add('pet-hatch-crack'); }
    }
  }

  if(stage > state.lastSeenPetStage){
    document.getElementById('petEvolvedBanner').innerHTML = `<div class="pet-evolved-banner">Pacus avançou para <b>${stageInfo.label}</b>.</div>`;
    state.lastSeenPetStage = stage;
    saveState(state);
    showEvolutionCelebration(stageInfo, stage, maxStage);
  }
}

function showEvolutionCelebration(stageInfo, stage, maxStage){
  const overlay = document.getElementById('evolutionCelebration');
  const mascotEl = document.getElementById('celebrationMascot');
  mascotEl.innerHTML = buildPetVisual(stage);
  document.getElementById('celebrationStage').innerHTML =
    stage === maxStage
      ? `O Pacus chegou em <b>${stageInfo.label}</b> — crescimento completo! 🏆`
      : `O Pacus virou <b>${stageInfo.label}</b>!`;
  overlay.classList.add('open');

  // confete espalhado pela tela toda, não só perto do Pacus
  fireConfetti(null, 40);
  setTimeout(()=> fireConfetti({ getBoundingClientRect: ()=>({left:window.innerWidth*0.2, top:window.innerHeight*0.3, width:0, height:0}) }, 20), 200);
  setTimeout(()=> fireConfetti({ getBoundingClientRect: ()=>({left:window.innerWidth*0.8, top:window.innerHeight*0.3, width:0, height:0}) }, 20), 350);

  const autoClose = setTimeout(closeEvolutionCelebration, 4500);
  overlay.dataset.autoCloseId = autoClose;
}
function closeEvolutionCelebration(){
  const overlay = document.getElementById('evolutionCelebration');
  if(overlay.dataset.autoCloseId) clearTimeout(Number(overlay.dataset.autoCloseId));
  overlay.classList.remove('open');
}

function buildStreakStrip(){
  const days = [];
  for(let i=6; i>=0; i--){
    const d = new Date();
    d.setDate(d.getDate()-i);
    const iso = d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,'0')+"-"+String(d.getDate()).padStart(2,'0');
    days.push(iso);
  }
  const weekdayLetters = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  let progressDays = 0;
  const cells = days.map(iso=>{
    const isToday = iso === todayISO();
    const d = new Date(iso+"T00:00:00");
    const letter = weekdayLetters[d.getDay()];
    let entry = isToday ? liveTodayEntry() : state.history[iso];
    let cls = 'streak-cell none';
    if(entry && entry.total > 0){
      if(entry.perfect) cls = 'streak-cell perfect';
      else if(entry.done === entry.total - 1) cls = 'streak-cell almost';
      else if(entry.done > 0) cls = 'streak-cell partial';
      else cls = 'streak-cell none';
    }
    if(entry && entry.done > 0) progressDays++;
    if(isToday) cls += ' today';
    return `<span class="${cls}" title="${formatDateBR(iso)}"><span class="streak-letter">${letter}</span></span>`;
  }).join('');
  const summary = progressDays > 0
    ? `Você teve progresso em <b>${progressDays} dos últimos 7 dias</b>.`
    : `Todo começo é assim — o próximo dia é uma nova chance.`;
  return `<div class="streak-title">Últimos 7 dias</div><div class="streak-row">${cells}</div><div class="streak-summary">${summary}</div>`;
}

function liveTodayEntry(){
  const tasks = allTasks();
  const applicable = tasks.filter(t=>state.checkedToday[t.id] !== 'na');
  const total = applicable.length;
  const done = applicable.filter(t=>isCountedDone(state.checkedToday[t.id])).length;
  const perfect = total>0 && done===total;
  return { total, done, perfect };
}

function getHairStatus(dateISO){
  return state.hairByDate && state.hairByDate[dateISO] ? state.hairByDate[dateISO] : null;
}

function setHairStatus(status){
  const iso = todayISO();
  if(!state.hairByDate) state.hairByDate = {};
  state.hairByDate[iso] = status;
  if(!state.history) state.history = {};
  if(state.history[iso]) state.history[iso].hair = status;
  saveState(state);
  renderHair();
}

function renderHair(){
  const section = document.getElementById('hairSection');
  if(!section) return;
  const status = getHairStatus(todayISO());
  const washedBtn = document.getElementById('hairWashedBtn');
  const notWashedBtn = document.getElementById('hairNotWashedBtn');
  const statusEl = document.getElementById('hairStatus');
  washedBtn.classList.toggle('active-washed', status === 'washed');
  notWashedBtn.classList.toggle('active-notwashed', status === 'not-washed');
  statusEl.innerHTML = status === 'washed'
    ? 'Hoje: <b class="hair-history-washed">💧 cabelo lavado</b>'
    : status === 'not-washed'
      ? 'Hoje: <b class="hair-history-notwashed">○ não lavou</b>'
      : 'Hoje: ainda não registrado';
}

function render(){
  document.getElementById('totalPoints').textContent = state.totalPoints;

  renderPet();
  renderHair();
  renderGameTimer();

  const weekendEl = document.getElementById('weekendIndicator');
  if(weekendEl){
    weekendEl.innerHTML = (CONFIG.periodsWeekend && isWeekendISO(todayISO()))
      ? `<div class="weekend-indicator">🏖️ Hoje é rotina de fim de semana</div>`
      : '';
  }

  renderLightDayBanner();

  const periodsEl = document.getElementById('periods');
  periodsEl.innerHTML = '';
  const PERIOD_ORDER = ['manha','tarde','noite'];
  const periodsObj = getPeriodsFor(todayISO());

  Object.entries(periodsObj).forEach(([key, period])=>{
    const div = document.createElement('div');
    div.className = 'period ' + key;

    const applicable = period.tasks.filter(t=>state.checkedToday[t.id] !== 'na');
    const doneCount = applicable.filter(t=>isCountedDone(state.checkedToday[t.id])).length;
    const remaining = applicable.length - doneCount;
    const pct = applicable.length ? Math.round(100*doneCount/applicable.length) : 0;

    let progressMsg;
    if(applicable.length === 0){ progressMsg = 'nada marcado ainda'; }
    else if(pct === 100){ progressMsg = 'tudo certo por aqui! ✅'; }
    else if(remaining === 1){ progressMsg = 'falta só 1! 🔥'; }
    else { progressMsg = `${doneCount}/${applicable.length} feitas`; }

    // prévia da próxima etapa quando termina esse período — saber o que
    // vem a seguir ajuda a reduzir a sensação de surpresa na transição.
    let nextPreviewHtml = '';
    if(pct === 100 && applicable.length > 0){
      const idx = PERIOD_ORDER.indexOf(key);
      const nextKey = idx >= 0 && idx < PERIOD_ORDER.length-1 ? PERIOD_ORDER[idx+1] : null;
      if(nextKey && periodsObj[nextKey]){
        const nextPeriod = periodsObj[nextKey];
        const firstTask = nextPeriod.tasks[0];
        nextPreviewHtml = `<div class="next-period-preview">➡️ A seguir: <b>${nextPeriod.label}</b>${firstTask ? ` — começando com ${taskIcon(firstTask.txt)} ${firstTask.txt}` : ''}</div>`;
      } else if(!nextKey){
        nextPreviewHtml = `<div class="next-period-preview">🎉 Terminou tudo por hoje!</div>`;
      }
    }

    const ul = document.createElement('ul');
    ul.className = 'tasks';
    const orderedTasks = getEffectiveTaskOrder(key, period.tasks);
    const nextSuggestedId = orderedTasks.find(t => !t.external && !state.checkedToday[t.id])?.id;
    const tierBadge = { essencial:'🔴', responsabilidade:'🟡', extra:'🟢' };
    const tierTitle = { essencial:'Essencial — precisa acontecer, mas você escolhe quando/ordem/ajuda', responsabilidade:'Responsabilidade — esperado, gera pontos', extra:'Extra — opcional, bônus maior' };
    orderedTasks.forEach((task, idx)=>{
      const li = document.createElement('li');
      const status = state.checkedToday[task.id]; // 'done' | 'na' | 'x' | 'help' | undefined
      const isSuggested = task.id === nextSuggestedId;
      const lightDay = isLightDay(todayISO());
      li.className = 'task'
        + (status === 'done' ? ' done' : '')
        + (status === 'na' ? ' na' : '')
        + (status === 'x' ? ' notdone' : '')
        + (status === 'help' ? ' helped' : '')
        + (isSuggested ? ' suggested' : '');
      li.innerHTML = `
        <span class="task-reorder">
          <button type="button" class="mini-reorder-btn" data-dir="up" data-period="${key}" data-task="${task.id}" ${idx===0?'disabled':''} title="Mover pra cima">▲</button>
          <button type="button" class="mini-reorder-btn" data-dir="down" data-period="${key}" data-task="${task.id}" ${idx===orderedTasks.length-1?'disabled':''} title="Mover pra baixo">▼</button>
        </span>
        <span class="mark-group" data-id="${task.id}">
          <button type="button" class="mark-btn mark-done ${status==='done'?'active':''}" data-status="done" title="Feito">✓</button>
          <button type="button" class="mark-btn mark-help ${status==='help'?'active':''}" data-status="help" title="Pedi ajuda / fizemos junto">🤝</button>
          <button type="button" class="mark-btn mark-na ${status==='na'?'active':''}" data-status="na" title="Não precisou realizar hoje">–</button>
          <button type="button" class="mark-btn mark-x ${status==='x'?'active':''}" data-status="x" title="${lightDay ? 'Não feito (dia leve, sem perder ponto)' : 'Não feito, perde metade dos pontos'}">✕</button>
        </span>
        <span class="txt">${isSuggested ? '<span class="suggested-flag">👉</span>' : ''}${task.tier ? `<span class="tier-badge" title="${tierTitle[task.tier]||''}">${tierBadge[task.tier]||''}</span>` : ''}<span class="task-icon">${taskIcon(task.txt)}</span>${task.txt}${task.sub ? `<span class="sub">${task.sub}</span>` : ''}</span>
        <span class="pts">${status==='na' ? 'n/a' : status==='help' ? '+'+taskHelpPoints(task) : status==='x' ? (lightDay ? 'dia leve' : '−'+taskNotDonePenalty(task)) : '+'+task.pts}</span>
      `;
      ul.appendChild(li);
    });

    div.innerHTML = `
      <div class="period-head"><h2>${period.label}</h2><span class="time">${period.time}</span></div>
      <span class="time-remaining" id="timeRemaining_${key}"></span>
      <span class="progress-txt">${progressMsg}</span>
      <div class="progress-bar"><div style="width:${pct}%"></div></div>
      ${nextPreviewHtml}
    `;
    div.dataset.periodTime = period.time;
    div.appendChild(ul);
    periodsEl.appendChild(div);
  });

  renderFocusCard();
  renderFreshStartArea();
  renderInvisibleWinsCard();

  updateTimeRemainingDisplays();
  startTimeRemainingTicking();

  periodsEl.querySelectorAll('.mark-btn').forEach(btn=>{
    btn.addEventListener('click', onMarkClick);
  });

  periodsEl.querySelectorAll('.mini-reorder-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const periodKey = btn.getAttribute('data-period');
      const taskId = btn.getAttribute('data-task');
      const dir = btn.getAttribute('data-dir');
      const periodTasks = getPeriodsFor(todayISO())[periodKey].tasks;
      moveTaskInOrder(periodKey, periodTasks, taskId, dir);
      render();
    });
  });

  renderPositiveBehaviors();

  renderRewards();
  renderWeeklyReview();
  renderFamilyGameNightAnnouncement();
  renderWeeklyNewsAnnouncement();
}

function daysBetween(isoA, isoB){
  const a = new Date(isoA+"T00:00:00");
  const b = new Date(isoB+"T00:00:00");
  return Math.round((b-a)/86400000);
}

function shiftISODate(iso, deltaDays){
  const d = new Date(iso+"T00:00:00");
  d.setDate(d.getDate()+deltaDays);
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,'0')+"-"+String(d.getDate()).padStart(2,'0');
}

function goToTestDate(iso){
  setTestDate(iso);
  state = loadState();
  render();
}

let testPanelOpen = false;
// Painéis de "adulto" (Drive, editar dia, modo teste) ficam escondidos
// até desbloquear a "Área dos adultos" — reseta ao recarregar.
let adultUnlocked = false;

function renderTestModeBanner(){
  const el = document.getElementById('testModeBanner');
  if(!el) return;
  if(!TEST_DATE_OVERRIDE){ el.innerHTML=''; return; }
  el.innerHTML = `
    <div class="test-mode-banner">
      🧪 MODO TESTE ATIVO — data simulada: ${formatDateBR(TEST_DATE_OVERRIDE)}
      <button id="bannerRealDateBtn">voltar pra data real</button>
    </div>
  `;
  document.getElementById('bannerRealDateBtn').addEventListener('click', ()=>{
    setTestDate(null);
    state = loadState();
    render();
  });
}

function renderTestPanel(){
  const el = document.getElementById('testPanel');
  if(!el) return;
  if(!testPanelOpen){ el.style.display='none'; el.innerHTML=''; return; }
  el.style.display='block';

  const realToday = (()=>{
    const d = new Date();
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,'0')+"-"+String(d.getDate()).padStart(2,'0');
  })();
  const usingOverride = !!TEST_DATE_OVERRIDE;

  el.innerHTML = `
    <div class="test-panel">
      <h3>🧪 Modo de teste</h3>
      <div class="hint">Ferramentas só pra conferir se o crescimento do Pacus e o histórico estão funcionando. Não mexe nas tarefas de verdade — só simula dias.</div>
      <div class="test-date">Data simulada agora: <b>${formatDateBR(todayISO())}/${todayISO().split('-')[0]}</b>${usingOverride ? ' (modo teste ativo)' : ' (data real do sistema)'}</div>
      <div class="test-row">
        <button class="icon-btn" id="testCompleteDayBtn">✅ completar tudo hoje</button>
        <button class="icon-btn" id="testPrevDayBtn">◀ dia anterior</button>
        <button class="icon-btn" id="testNextDayBtn">dia seguinte ▶</button>
        <input type="date" id="testDatePicker" value="${todayISO()}">
        <button class="icon-btn" id="testGoDateBtn">ir pra essa data</button>
        <button class="icon-btn danger" id="testResetDateBtn">voltar pra data real</button>
      </div>
    </div>
  `;

  document.getElementById('testCompleteDayBtn').addEventListener('click', ()=>{
    allTasks().forEach(t=>{
      if(state.checkedToday[t.id] !== 'done'){
        addPoints(t.pts);
      }
      state.checkedToday[t.id] = 'done';
    });
    syncPetCompletionFromDay(todayISO());
    addLog('🧪 (teste) todas as tarefas de hoje marcadas como feitas', true);
    saveState(state);
    render();
  });

  document.getElementById('testPrevDayBtn').addEventListener('click', ()=>{
    goToTestDate(shiftISODate(todayISO(), -1));
  });
  document.getElementById('testNextDayBtn').addEventListener('click', ()=>{
    goToTestDate(shiftISODate(todayISO(), 1));
  });
  document.getElementById('testGoDateBtn').addEventListener('click', ()=>{
    const val = document.getElementById('testDatePicker').value;
    if(val) goToTestDate(val);
  });
  document.getElementById('testResetDateBtn').addEventListener('click', ()=>{
    goToTestDate(realToday);
    setTestDate(null);
    state = loadState();
    render();
  });
}

// Aviso pontual pra contar a novidade dos Jogos em Família — some pra
// sempre depois que ele der "combinado!" (fica guardado no estado).
function renderFamilyGameNightAnnouncement(){
  const el = document.getElementById('familyGameNightAnnouncement');
  if(!el) return;
  if(state.familyGameNightAnnouncementSeen){ el.innerHTML=''; return; }

  el.innerHTML = `
    <div class="family-announcement">
      <div class="title">🕹️ Novidade na família!</div>
      <div class="msg">A partir de agora, toda <b>quinta-feira à noite, das 21h às 23h</b>, é hora de <b>Jogos em Família</b>! 🎲🎉</div>
      <button class="dismiss-btn" id="familyGameNightDismissBtn">bora! 🤝</button>
    </div>
  `;
  document.getElementById('familyGameNightDismissBtn').addEventListener('click', ()=>{
    state.familyGameNightAnnouncementSeen = true;
    saveState(state);
    renderFamilyGameNightAnnouncement();
  });
}

// Notícia da semana — aviso único (some pra sempre depois de visto).
function renderWeeklyNewsAnnouncement(){
  const el = document.getElementById('weeklyNewsAnnouncement');
  if(!el) return;
  if(state.weeklyNewsSeen){ el.innerHTML=''; return; }

  el.innerHTML = `
    <div class="family-announcement">
      <div class="title">🏆 Notícia da semana!</div>
      <div class="msg">Você acertou a aposta com a Walda — respondeu certinho o que é ser uma <b>pessoa autêntica</b>! <b>+5 Pacus Points</b> de bônus! 🎉</div>
      <button class="dismiss-btn" id="weeklyNewsDismissBtn">demais! 🌟</button>
    </div>
  `;
  document.getElementById('weeklyNewsDismissBtn').addEventListener('click', ()=>{
    state.weeklyNewsSeen = true;
    saveState(state);
    renderWeeklyNewsAnnouncement();
  });
}

function renderBackupReminder(){
  const el = document.getElementById('backupReminder');
  if(!el) return;

  const today = todayISO();
  const daysSinceBackup = state.lastBackupISO ? daysBetween(state.lastBackupISO, today) : Infinity;
  const dismissed = state.backupReminderDismissedFor === today;

  const shouldShow = daysSinceBackup >= 7 && !dismissed;

  if(!shouldShow){ el.innerHTML=''; return; }

  const msg = state.lastBackupISO
    ? `Já faz ${daysSinceBackup} dias desde o último backup. Que tal exportar de novo?`
    : `Vocês ainda não fizeram nenhum backup. Vale exportar um agora pra não perder o progresso.`;

  el.innerHTML = `
    <div class="backup-reminder">
      <span>💾 ${msg}</span>
      <span>
        <button id="backupReminderExportBtn">exportar agora</button>
        <button class="dismiss" id="backupReminderDismissBtn">lembrar depois</button>
      </span>
    </div>
  `;
  document.getElementById('backupReminderExportBtn').addEventListener('click', ()=>{
    document.getElementById('exportBtn').click();
  });
  document.getElementById('backupReminderDismissBtn').addEventListener('click', ()=>{
    state.backupReminderDismissedFor = today;
    saveState(state);
    });
}

function renderWeeklyReview(){
  const el = document.getElementById('weeklyReviewSection');
  if(!el) return;

  const days = [];
  for(let i=6; i>=0; i--){
    const d = new Date();
    d.setDate(d.getDate()-i);
    days.push(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,'0')+"-"+String(d.getDate()).padStart(2,'0'));
  }

  let perfectDays = 0, totalPointsWeek = 0, totalScreenMin = 0;
  days.forEach(iso=>{
    const entry = iso === todayISO() ? liveTodayEntry() : state.history[iso];
    if(!entry) return;
    if(iso !== todayISO()){
      // dias fechados já têm pointsEarnedThatDay e screenMinutes calculados
      const full = state.history[iso];
      if(full){
        totalPointsWeek += full.pointsEarnedThatDay || 0;
        totalScreenMin += full.screenMinutes || 0;
      }
    }
    if(entry.total > 0 && entry.perfect) perfectDays++;
  });

  const rangeLabel = `${formatDateBR(days[0])} – ${formatDateBR(days[6])} (hoje)`;

  el.innerHTML = `
    <div class="weekly-review">
      <div class="wr-head">
        <span class="wr-range">${rangeLabel}</span>
      </div>
      <div class="wr-stats">
        <div class="wr-stat"><span class="wr-num">${perfectDays}/7</span><span class="wr-label">dias completos</span></div>
        <div class="wr-stat"><span class="wr-num">${totalPointsWeek}</span><span class="wr-label">Pacus Points ganhos</span></div>
        <div class="wr-stat"><span class="wr-num">${totalScreenMin}</span><span class="wr-label">min de tela ganhos</span></div>
      </div>
    </div>
  `;
}

// Escala de mensagens pro dia — em vez de "tudo ou nada" (perfeito ou
// nada), reconhece o esforço em vários níveis.
function dayQualityBadge(entry){
  if(!entry || !entry.total) return '';
  const pct = entry.done / entry.total;
  if(entry.perfect) return '<span class="badge-perfect">🎉 dia perfeito</span>';
  if(entry.total > 0 && entry.done === entry.total - 1) return '<span class="badge-almost">⭐ dia quase perfeito</span>';
  if(pct >= 0.6) return '<span class="badge-good">👍 dia muito bom</span>';
  if(pct >= 0.3) return '<span class="badge-progress">🌱 dia em progresso</span>';
  if(pct > 0) return '<span class="badge-started">💛 começou o dia</span>';
  return '';
}

function hairLabel(status){
  if(status === 'washed') return '<span class="hair-history-washed">💧 Lavou</span>';
  if(status === 'not-washed') return '<span class="hair-history-notwashed">○ Não lavou</span>';
  return '<span class="hair-history-unknown">— Não registrado</span>';
}

let historyShowAll = false;

function renderHistory(){
  const body = document.getElementById('historyBody');
  const start = CONFIG.historyStartDate || todayISO();
  const startDate = new Date(start+"T00:00:00");
  const today = new Date(todayISO()+"T00:00:00");

  const rows = [];
  for(let d = new Date(startDate); d <= today; d.setDate(d.getDate()+1)){
    const iso = d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,'0')+"-"+String(d.getDate()).padStart(2,'0');
    rows.push(iso);
  }

  const HISTORY_VISIBLE_DAYS = 30;
  const hiddenCount = Math.max(0, rows.length - HISTORY_VISIBLE_DAYS);
  const visibleRows = historyShowAll ? rows : rows.slice(-HISTORY_VISIBLE_DAYS);

  body.innerHTML = visibleRows.map(iso=>{
    const isToday = iso === todayISO();
    let entry;
    if(isToday){
      const tasks = allTasks();
      const applicable = tasks.filter(t=>state.checkedToday[t.id] !== 'na');
      const total = applicable.length;
      const done = applicable.filter(t=>isCountedDone(state.checkedToday[t.id])).length;
      const pointsEarnedThatDay = tasks.reduce((s,t)=>{
        const st = state.checkedToday[t.id];
        if(st === 'done') return s + t.pts;
        if(st === 'help') return s + taskHelpPoints(t);
        return s;
      }, 0);
      const perfect = total>0 && done===total;
      entry = { done, total, pointsEarnedThatDay, perfect, hair:getHairStatus(iso) };
    } else {
      entry = state.history[iso];
    }
    const hair = getHairStatus(iso) || (entry && entry.hair) || null;
    if(!entry){
      return `<tr${isToday?' class="today-row"':''}>
        <td>${formatDateBR(iso)}${isToday?' (hoje)':''}</td>
        <td>—</td>
        <td class="pts-cell">—</td>
        <td>${hairLabel(hair)}</td>
        <td>${(isToday||!adultUnlocked)?'':`<button class="icon-btn edit-day-btn" data-date="${iso}" title="Editar este dia">✏️</button>`}</td>
      </tr>`;
    }
    const perfectBadge = dayQualityBadge(entry);
    const editCell = (isToday||!adultUnlocked) ? '' : `<button class="icon-btn edit-day-btn" data-date="${iso}" title="Editar este dia">✏️</button>`;
    return `<tr${isToday?' class="today-row"':''}>
      <td>${formatDateBR(iso)}${isToday?' (hoje)':''}</td>
      <td>${entry.done}/${entry.total}${perfectBadge}</td>
      <td class="pts-cell">${entry.pointsEarnedThatDay}</td>
      <td>${hairLabel(hair)}</td>
      <td>${editCell}</td>
    </tr>`;
  }).join('');

  body.querySelectorAll('.edit-day-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> openDayEditor(btn.getAttribute('data-date')));
  });

  const toggleEl = document.getElementById('historyToggle');
  if(toggleEl){
    if(hiddenCount > 0){
      toggleEl.innerHTML = historyShowAll
        ? `<button class="icon-btn" id="historyToggleBtn">mostrar só os últimos ${HISTORY_VISIBLE_DAYS} dias</button>`
        : `<button class="icon-btn" id="historyToggleBtn">mostrar histórico completo (+${hiddenCount} dias)</button>`;
      document.getElementById('historyToggleBtn').addEventListener('click', ()=>{
        historyShowAll = !historyShowAll;
            });
    } else {
      toggleEl.innerHTML = '';
    }
  }
}

// Hot Wheels: fica em 300 pontos até a primeira compra — depois disso,
// passa a valer o preço "de verdade" (o do CONFIG, hoje 500).
function effectiveRewardCost(r){
  if(r.id === 'r2'){
    const everBought = (state.lifetimeRedemptions && state.lifetimeRedemptions[r.id]) || 0;
    if(everBought === 0) return 300;
  }
  return r.cost;
}

function renderRewards(){
  const rEl = document.getElementById('rewards');
  rEl.innerHTML = '';
  CONFIG.rewards.forEach(r=>{
    const cost = effectiveRewardCost(r);
    const canAfford = state.totalPoints >= cost;
    const redeemedToday = (state.gameTimer.redemptions && state.gameTimer.redemptions[r.id]) || 0;
    const atDailyLimit = r.maxPerDay != null && redeemedToday >= r.maxPerDay;
    const capNote = r.maxPerDay != null ? `<span class="cap-note">${redeemedToday}/${r.maxPerDay} hoje</span>` : '';
    const div = document.createElement('div');
    div.className = 'reward';
    div.innerHTML = `
      <div class="name">${r.txt}</div>
      <span class="cost">${cost} PP</span>
      ${capNote}
      <button ${(canAfford && !atDailyLimit) ? '' : 'disabled'}>${atDailyLimit ? 'Limite hoje' : 'Resgatar'}</button>
    `;
    div.querySelector('button').addEventListener('click', (evt)=>{
      if(state.totalPoints < cost) return;
      const redeemed = (state.gameTimer.redemptions && state.gameTimer.redemptions[r.id]) || 0;
      if(r.maxPerDay != null && redeemed >= r.maxPerDay) return;

      const delta = addPoints(-cost);
      addLog(`🎁 Resgatou: ${r.txt} (−${cost})`);
      if(r.grantsHours){
        addGameTimerBonusHours(r.grantsHours);
        addLog(`🎮 +${r.grantsHours}h de jogo hoje (bônus da recompensa)`);
      }
      if(!state.gameTimer.redemptions) state.gameTimer.redemptions = {};
      state.gameTimer.redemptions[r.id] = redeemed + 1;
      if(!state.lifetimeRedemptions) state.lifetimeRedemptions = {};
      state.lifetimeRedemptions[r.id] = (state.lifetimeRedemptions[r.id] || 0) + 1;

      saveState(state);
      bumpTotal(delta, evt.currentTarget);
      renderRewards();
          renderGameTimer();
    });
    rEl.appendChild(div);
  });

  const noteEl = document.getElementById('pointValueNote');
  if(noteEl){
    const brlValue = POINT_VALUE_BRL.toFixed(2).replace('.', ',');
    const maxBrl = Math.round(MAX_POINTS * POINT_VALUE_BRL);
    noteEl.textContent = `1 Pacus Point ≈ R$${brlValue} · máximo: ${MAX_POINTS} pontos (~R$${maxBrl})`;
  }
}

// Comportamentos positivos espontâneos — cada um já vem com um elogio
// específico (não genérico), pra reforçar exatamente o que ele fez bem.
const POSITIVE_BEHAVIORS = [
  { id:'helped', label:'Ajudou alguém', emoji:'🤝', praise:'Isso foi generosidade de verdade!' },
  { id:'kind', label:'Foi gentil', emoji:'❤️', praise:'Gentileza gera gentileza!' },
  { id:'persisted', label:'Não desistiu', emoji:'💪', praise:'Continuou tentando mesmo sendo difícil — isso é persistência!' },
  { id:'solved', label:'Resolveu um problema', emoji:'🧠', praise:'Pensou e resolveu sozinho — muito bem!' },
  { id:'initiative', label:'Teve iniciativa', emoji:'🚀', praise:'Não esperou pedirem — tomou a frente!' },
];

function renderPositiveBehaviors(){
  const el = document.getElementById('positiveBehaviors');
  if(!el) return;

  el.innerHTML = `
    <div class="behavior-grid">
      ${POSITIVE_BEHAVIORS.map(b => `
        <div class="behavior-card">
          <button type="button" class="behavior-btn" data-id="${b.id}">${b.emoji} ${b.label}</button>
          <div class="behavior-picker" id="behaviorPicker_${b.id}">
            <input type="text" class="behavior-note" id="behaviorNote_${b.id}" placeholder="detalhe (opcional)" maxlength="60">
            <div class="behavior-pts-row">
              <button type="button" class="behavior-pts-btn" data-pts="1">+1</button>
              <button type="button" class="behavior-pts-btn" data-pts="2">+2</button>
              <button type="button" class="behavior-pts-btn" data-pts="3">+3</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    ${CONFIG.badHabits.length ? `<div class="behavior-extra-title">outros</div><div class="behavior-extra" id="behaviorExtra"></div>` : ''}
  `;

  POSITIVE_BEHAVIORS.forEach(b=>{
    const btn = el.querySelector(`.behavior-btn[data-id="${b.id}"]`);
    const picker = document.getElementById(`behaviorPicker_${b.id}`);
    btn.addEventListener('click', ()=>{
      const isOpen = picker.classList.contains('open');
      el.querySelectorAll('.behavior-picker.open').forEach(p=>p.classList.remove('open'));
      if(!isOpen) picker.classList.add('open');
    });
    picker.querySelectorAll('.behavior-pts-btn').forEach(ptsBtn=>{
      ptsBtn.addEventListener('click', (evt)=>{
        const pts = parseInt(ptsBtn.getAttribute('data-pts'));
        const noteInput = document.getElementById(`behaviorNote_${b.id}`);
        const note = noteInput.value.trim();
        const delta = addPoints(pts);
        addLog(`${b.emoji} +${pts} Pacus — ${b.praise}${note ? ` (${note})` : ''}`);
        saveState(state);
        bumpTotal(delta, btn);
        fireConfetti(btn, 10);
        picker.classList.remove('open');
        noteInput.value = '';
            });
    });
  });

  // comportamentos extras que os pais adicionarem no editor, além dos 6 fixos
  const extraEl = document.getElementById('behaviorExtra');
  if(extraEl){
    CONFIG.badHabits.forEach(h=>{
      const isPositive = h.pts >= 0;
      const btn = document.createElement('button');
      btn.className = 'bad-btn' + (isPositive ? ' positive' : '');
      btn.innerHTML = `${h.txt}<span class="minus">${isPositive?'+':'−'}${Math.abs(h.pts)}</span>`;
      btn.addEventListener('click', ()=>{
        const delta = addPoints(h.pts);
        addLog(`${isPositive?'+':'−'}${Math.abs(h.pts)} · ${h.txt}`, true);
        saveState(state);
        bumpTotal(delta, btn);
            });
      extraEl.appendChild(btn);
    });
  }
}

function renderLog(){
  const logEl = document.getElementById('logList');
  // compatibilidade: entradas antigas eram só texto puro (sem marcação
  // de quem fez) — tratamos essas como ação dele, pra não sumir nada.
  const normalize = l => typeof l === 'string' ? { text:l, parent:false } : l;
  const entries = state.log.map(normalize);
  const visible = adultUnlocked ? entries : entries.filter(l => !l.parent);
  logEl.innerHTML = visible.length
    ? visible.map(l=>`<div>${l.text}</div>`).join('')
    : '<div>Nada ainda hoje — bora começar!</div>';
}

function fireConfetti(originEl, count){
  count = count || 14;
  const colors = ['#ffd93d','#ff7eb9','#4fc3f7','#ff9f43','#5fd875'];
  const rect = originEl && originEl.getBoundingClientRect
    ? originEl.getBoundingClientRect()
    : { left: window.innerWidth/2, top: window.innerHeight/2, width:0, height:0 };
  const originX = rect.left + rect.width/2;
  const originY = rect.top + rect.height/2;

  for(let i=0;i<count;i++){
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    const angle = Math.random()*Math.PI*2;
    const dist = 60 + Math.random()*90;
    piece.style.setProperty('--dx', (Math.cos(angle)*dist)+'px');
    piece.style.setProperty('--dy', (Math.sin(angle)*dist - 40)+'px');
    piece.style.setProperty('--rot', (Math.random()*360)+'deg');
    piece.style.left = originX+'px';
    piece.style.top = originY+'px';
    piece.style.background = colors[i % colors.length];
    document.body.appendChild(piece);
    setTimeout(()=>piece.remove(), 950);
  }
}

function onMarkClick(e){
  const btn = e.currentTarget;
  const id = btn.closest('.mark-group').getAttribute('data-id');
  const clickedStatus = btn.getAttribute('data-status'); // 'done', 'help', 'na', or 'x'
  const task = allTasks().find(t=>t.id===id);
  if(!task) return;

  const current = state.checkedToday[id]; // undefined | 'done' | 'help' | 'na' | 'x'
  let totalDelta = 0;
  const lightDay = isLightDay(todayISO());

  // desfazer o efeito do estado anterior nos pontos
  if(current === 'done') totalDelta += addPoints(-task.pts);
  else if(current === 'help') totalDelta += addPoints(-taskHelpPoints(task));
  else if(current === 'x' && !lightDay) totalDelta += addPoints(taskNotDonePenalty(task));

  if(current === clickedStatus){
    // clicou de novo no mesmo estado: volta pra pendente
    delete state.checkedToday[id];
    addLog(`(desmarcado) ${task.txt}`);
  } else {
    state.checkedToday[id] = clickedStatus;
    if(clickedStatus === 'done'){
      totalDelta += addPoints(task.pts);
      addLog(`+${task.pts} · ${task.txt}`);
      fireConfetti(btn);
      // salto pra Bebê na 1ª tarefa concluída de hoje (pedido pontual) —
      // depois disso o crescimento normal (1 dia = 1 unidade) já cobre o
      // resto do ciclo até 31/08 sem folga sobrando.
      const doneCountToday = Object.values(state.checkedToday).filter(s=>s==='done').length;
      if(doneCountToday === 1 && !state.bebeBoostAug21Applied){
        state.petMaxDaysEquivalentEverSeen = Math.max(Number(state.petMaxDaysEquivalentEverSeen)||0, 14);
        state.bebeBoostAug21Applied = true;
        addLog(`🎉 ${CONFIG.pet.name} deu um salto e virou Bebê!`);
      }
    } else if(clickedStatus === 'help'){
      const helpPts = taskHelpPoints(task);
      totalDelta += addPoints(helpPts);
      state.helpRequestsCount = (Number(state.helpRequestsCount)||0) + 1;
      addLog(`🤝 +${helpPts} · pediu ajuda em: ${task.txt} — isso é uma habilidade, não uma falha!`);
      fireConfetti(btn, 8);
    } else if(clickedStatus === 'na'){
      addLog(`n/a · ${task.txt}`);
    } else if(lightDay){
      addLog(`✕ não realizado · ${task.txt} (dia leve, sem perder ponto)`);
    } else {
      const penalty = taskNotDonePenalty(task);
      totalDelta += addPoints(-penalty);
      addLog(`✕ não realizado · ${task.txt} (−${penalty})`);
    }
  }

  const completedNow = syncPetCompletionFromDay(todayISO());
  if(completedNow){
    addLog(`🥚 ${CONFIG.pet.name} avançou: dia completo`);
  }
  saveState(state);
  bumpTotal(totalDelta, btn);
  render();
}

document.getElementById('hairWashedBtn').addEventListener('click', ()=> setHairStatus('washed'));
document.getElementById('hairNotWashedBtn').addEventListener('click', ()=> setHairStatus('not-washed'));

document.getElementById('addPointsBtn').addEventListener('click', ()=>{
  const raw = prompt('Quantos Pacus Points adicionar?', '5');
  if(raw === null) return;
  const amount = parseInt(raw, 10);
  if(!amount || amount === 0) return;
  const delta = addPoints(amount);
  addLog(`${amount>0?'+':''}${amount} · ajuste manual`, true);
  saveState(state);
  bumpTotal(delta);
  render();
});

document.getElementById('resetBtn').addEventListener('click', ()=>{
  if(!confirm('Isso apaga os Pacus Points, o histórico de hoje e o histórico de dias. Tem certeza?')) return;
  state = { totalPoints:0, checkedToday:{}, lastDate:todayISO(), log:[], history:{}, lastSeenPetStage:0, petCompletedDays:[], petLastCompletionISO:null, revision:0, driveRevision:0, driveConflictCount:0, lastBackupISO:null, backupReminderDismissedFor:null, driveFileId:null, driveLastSyncISO:null, hairByDate:{} };
  saveState(state);
  render();
});

/* ===================== EDITOR ===================== */
let draft = null; // cópia de trabalho do CONFIG enquanto o modal está aberto

function openEditor(){
  draft = JSON.parse(JSON.stringify(CONFIG));
  renderEditorPeriod('manha', 'editManha');
  renderEditorPeriod('tarde', 'editTarde');
  renderEditorPeriod('noite', 'editNoite');
  renderEditorBad();
  renderEditorRewards();

  const weekendToggle = document.getElementById('weekendToggle');
  const weekendBody = document.getElementById('weekendEditorBody');
  weekendToggle.checked = !!draft.periodsWeekend;
  weekendBody.style.display = draft.periodsWeekend ? 'block' : 'none';
  if(draft.periodsWeekend){
    renderEditorPeriod('manha', 'editManhaWeekend', draft.periodsWeekend);
    renderEditorPeriod('tarde', 'editTardeWeekend', draft.periodsWeekend);
    renderEditorPeriod('noite', 'editNoiteWeekend', draft.periodsWeekend);
  }
  weekendToggle.onchange = ()=>{
    if(weekendToggle.checked && !draft.periodsWeekend){
      // clona a rotina de dia de escola como ponto de partida
      draft.periodsWeekend = JSON.parse(JSON.stringify(draft.periods));
      // gera ids novos pra não colidir com os da rotina de semana
      Object.values(draft.periodsWeekend).forEach(period=>{
        period.tasks.forEach(t=>{ t.id = uid('we'); });
      });
      renderEditorPeriod('manha', 'editManhaWeekend', draft.periodsWeekend);
      renderEditorPeriod('tarde', 'editTardeWeekend', draft.periodsWeekend);
      renderEditorPeriod('noite', 'editNoiteWeekend', draft.periodsWeekend);
    }
    weekendBody.style.display = weekendToggle.checked ? 'block' : 'none';
    if(!weekendToggle.checked) draft.periodsWeekend = null;
  };

  document.getElementById('editorPinInput').value = draft.editorPin || '';
  document.getElementById('gameLimitInput').value = draft.screenDailyLimitHours ?? 2;
  if(!Array.isArray(draft.schedule)) draft.schedule = [];
  renderEditorSchedule();

  document.getElementById('overlay').classList.add('open');
}
function closeEditor(){
  document.getElementById('overlay').classList.remove('open');
  draft = null;
}

function renderEditorPeriod(key, elId, periodsObj){
  periodsObj = periodsObj || draft.periods;
  const el = document.getElementById(elId);
  el.innerHTML = '';
  const list = periodsObj[key].tasks;
  list.forEach((task, idx)=>{
    const row = document.createElement('div');
    row.className = 'edit-row edit-row-task';
    row.innerHTML = `
      <div class="edit-row-main">
        <span class="reorder-group">
          <button type="button" class="reorder-btn" data-dir="up" ${idx===0?'disabled':''} title="Mover pra cima">▲</button>
          <button type="button" class="reorder-btn" data-dir="down" ${idx===list.length-1?'disabled':''} title="Mover pra baixo">▼</button>
        </span>
        <input type="text" value="${escapeAttr(task.txt)}" data-field="txt" placeholder="nome da tarefa">
        ${stepperHTML('pts', task.pts)}
        <button class="del" title="remover">🗑</button>
      </div>
      <input type="text" class="sub-input" value="${escapeAttr(task.sub||'')}" data-field="sub" placeholder="descrição (opcional)">
    `;
    row.querySelector('[data-field=txt]').addEventListener('input', e=>{ task.txt = e.target.value; });
    wireStepper(row, task, 'pts');
    row.querySelector('[data-field=sub]').addEventListener('input', e=>{ task.sub = e.target.value; });
    row.querySelector('.del').addEventListener('click', ()=>{
      periodsObj[key].tasks = periodsObj[key].tasks.filter(t=>t!==task);
      renderEditorPeriod(key, elId, periodsObj);
    });
    row.querySelectorAll('.reorder-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const dir = btn.getAttribute('data-dir');
        const i = list.indexOf(task);
        const swapWith = dir === 'up' ? i-1 : i+1;
        if(swapWith < 0 || swapWith >= list.length) return;
        [list[i], list[swapWith]] = [list[swapWith], list[i]];
        renderEditorPeriod(key, elId, periodsObj);
      });
    });
    el.appendChild(row);
  });
}

function stepperHTML(field, value, allowNegative){
  return `<span class="stepper">
    <button type="button" class="step-btn" data-step="-1" title="menos">−</button>
    <input type="number" ${allowNegative?'':'min="0"'} value="${value}" data-field="${field}">
    <button type="button" class="step-btn" data-step="1" title="mais">+</button>
  </span>`;
}
function wireStepper(row, obj, field, allowNegative){
  const input = row.querySelector(`[data-field=${field}]`);
  input.addEventListener('input', e=>{
    const v = parseInt(e.target.value)||0;
    obj[field] = allowNegative ? v : Math.max(0, v);
  });
  row.querySelectorAll('.step-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const delta = parseInt(btn.getAttribute('data-step'));
      const next = (obj[field]||0) + delta;
      obj[field] = allowNegative ? next : Math.max(0, next);
      input.value = obj[field];
    });
  });
}

function renderEditorBad(){
  const el = document.getElementById('editBad');
  el.innerHTML = '';
  draft.badHabits.forEach(h=>{
    const row = document.createElement('div');
    row.className = 'edit-row';
    row.innerHTML = `
      <input type="text" value="${escapeAttr(h.txt)}" data-field="txt" placeholder="hábito (ex: brigou -10, ajudou +5)">
      ${stepperHTML('pts', h.pts, true)}
      <button class="del" title="remover">🗑</button>
    `;
    row.querySelector('[data-field=txt]').addEventListener('input', e=>{ h.txt = e.target.value; });
    wireStepper(row, h, 'pts', true);
    row.querySelector('.del').addEventListener('click', ()=>{
      draft.badHabits = draft.badHabits.filter(x=>x!==h);
      renderEditorBad();
    });
    el.appendChild(row);
  });
}

function renderEditorSchedule(){
  const el = document.getElementById('editSchedule');
  el.innerHTML = '';
  const dayOrder = ['seg','ter','qua','qui','sex','sab','dom'];
  const dayShort = {seg:'S',ter:'T',qua:'Q',qui:'Q',sex:'S',sab:'S',dom:'D'};
  const periodLabels = {manha:'Manhã', tarde:'Tarde', noite:'Noite'};
  draft.schedule.forEach(item=>{
    if(item.pts == null) item.pts = 3;
    if(!item.period) item.period = 'tarde';
    const row = document.createElement('div');
    row.className = 'edit-row-task';
    const dayChips = dayOrder.map(d=>
      `<button type="button" class="day-chip ${item.days.includes(d)?'active':''}" data-day="${d}" title="${WEEKDAY_LABELS[d]}">${dayShort[d]}</button>`
    ).join('');
    const periodOptions = Object.entries(periodLabels).map(([k,l])=>
      `<option value="${k}" ${item.period===k?'selected':''}>${l}</option>`
    ).join('');
    row.innerHTML = `
      <div class="edit-row-main">
        <input type="text" value="${escapeAttr(item.label)}" data-field="label" placeholder="nome (ex: Inglês)">
        <button class="del" title="remover">🗑</button>
      </div>
      <div class="day-chip-row">${dayChips}</div>
      <div class="edit-row-main">
        <input type="time" value="${item.start}" data-field="start" style="flex:1;">
        <span style="color:var(--chalk-dim); font-size:.8rem;">até</span>
        <input type="time" value="${item.end}" data-field="end" style="flex:1;">
      </div>
      <div class="edit-row-main">
        <select data-field="period" style="flex:1; background:rgba(255,255,255,.05); border:1px solid var(--line); color:var(--chalk); border-radius:6px; padding:6px; font-family:inherit; font-size:.8rem;">${periodOptions}</select>
        ${stepperHTML('pts', item.pts)}
      </div>
    `;
    row.querySelector('[data-field=label]').addEventListener('input', e=>{ item.label = e.target.value; });
    row.querySelector('[data-field=start]').addEventListener('input', e=>{ item.start = e.target.value; });
    row.querySelector('[data-field=end]').addEventListener('input', e=>{ item.end = e.target.value; });
    row.querySelector('[data-field=period]').addEventListener('change', e=>{ item.period = e.target.value; });
    wireStepper(row, item, 'pts');
    row.querySelectorAll('.day-chip').forEach(chip=>{
      chip.addEventListener('click', ()=>{
        const d = chip.getAttribute('data-day');
        if(item.days.includes(d)) item.days = item.days.filter(x=>x!==d);
        else item.days.push(d);
        chip.classList.toggle('active');
      });
    });
    row.querySelector('.del').addEventListener('click', ()=>{
      draft.schedule = draft.schedule.filter(x=>x!==item);
      renderEditorSchedule();
    });
    el.appendChild(row);
  });
}

function renderEditorRewards(){
  const el = document.getElementById('editRewards');
  el.innerHTML = '';
  draft.rewards.forEach(r=>{
    const row = document.createElement('div');
    row.className = 'edit-row';
    row.innerHTML = `
      <input type="text" value="${escapeAttr(r.txt)}" data-field="txt" placeholder="recompensa">
      ${stepperHTML('cost', r.cost)}
      <button class="del" title="remover">🗑</button>
    `;
    row.querySelector('[data-field=txt]').addEventListener('input', e=>{ r.txt = e.target.value; });
    wireStepper(row, r, 'cost');
    row.querySelector('.del').addEventListener('click', ()=>{
      draft.rewards = draft.rewards.filter(x=>x!==r);
      renderEditorRewards();
    });
    el.appendChild(row);
  });
}

function escapeAttr(s){
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
}

document.querySelectorAll('.add-row-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const kind = btn.getAttribute('data-add');
    const weekendMap = {manhaWeekend:'manha', tardeWeekend:'tarde', noiteWeekend:'noite'};
    const weekendElMap = {manhaWeekend:'editManhaWeekend', tardeWeekend:'editTardeWeekend', noiteWeekend:'editNoiteWeekend'};
    if(kind === 'manha' || kind === 'tarde' || kind === 'noite'){
      draft.periods[kind].tasks.push({ id: uid('t'), txt:'', pts:1, sub:'' });
      renderEditorPeriod(kind, {manha:'editManha', tarde:'editTarde', noite:'editNoite'}[kind]);
    } else if(weekendMap[kind]){
      const periodKey = weekendMap[kind];
      if(!draft.periodsWeekend) return;
      draft.periodsWeekend[periodKey].tasks.push({ id: uid('we'), txt:'', pts:1, sub:'' });
      renderEditorPeriod(periodKey, weekendElMap[kind], draft.periodsWeekend);
    } else if(kind === 'bad'){
      draft.badHabits.push({ id: uid('b'), txt:'', pts:1 });
      renderEditorBad();
    } else if(kind === 'reward'){
      draft.rewards.push({ id: uid('r'), txt:'', cost:10 });
      renderEditorRewards();
    } else if(kind === 'schedule'){
      draft.schedule.push({ id: uid('sc'), label:'', days:[], start:'09:00', end:'10:00', period:'tarde', pts:3 });
      renderEditorSchedule();
    }
  });
});

document.getElementById('celebrationCloseBtn').addEventListener('click', closeEvolutionCelebration);
document.getElementById('evolutionCelebration').addEventListener('click', e=>{
  if(e.target.id === 'evolutionCelebration') closeEvolutionCelebration();
});

/* ---------- pausa pra respirar (30s, sem pontos, só pra acalmar) ---------- */
let breathingTimeoutId = null;
function startBreathingExercise(){
  const overlay = document.getElementById('breathingOverlay');
  const circle = document.getElementById('breathingCircle');
  const label = document.getElementById('breathingLabel');
  overlay.classList.add('open');
  circle.classList.remove('breathing');
  void circle.offsetWidth;
  circle.classList.add('breathing');

  const phases = [
    { text:'Inspire...', duration:4000 },
    { text:'Segure...', duration:2000 },
    { text:'Expire...', duration:4000 },
  ];
  let cycle = 0;
  let phaseIdx = 0;

  function nextPhase(){
    if(cycle >= 3){
      label.textContent = 'Prontinho! 😊';
      circle.classList.remove('breathing');
      breathingTimeoutId = setTimeout(closeBreathingExercise, 1500);
      return;
    }
    label.textContent = phases[phaseIdx].text;
    breathingTimeoutId = setTimeout(()=>{
      phaseIdx++;
      if(phaseIdx >= phases.length){ phaseIdx = 0; cycle++; }
      nextPhase();
    }, phases[phaseIdx].duration);
  }
  nextPhase();
}
function closeBreathingExercise(){
  clearTimeout(breathingTimeoutId);
  document.getElementById('breathingOverlay').classList.remove('open');
  document.getElementById('breathingCircle').classList.remove('breathing');
}
document.getElementById('breathingBtn').addEventListener('click', startBreathingExercise);
document.getElementById('breathingCloseBtn').addEventListener('click', closeBreathingExercise);
document.getElementById('breathingOverlay').addEventListener('click', e=>{
  if(e.target.id === 'breathingOverlay') closeBreathingExercise();
});

document.getElementById('editBtn').addEventListener('click', ()=>{
  if(CONFIG.editorPin){
    const entered = prompt('Digite o PIN pra editar:');
    if(entered === null) return; // cancelou
    if(entered !== CONFIG.editorPin){
      alert('PIN incorreto.');
      return;
    }
  }
  adultUnlocked = true;
  openEditor();
  render();
});
document.getElementById('adultTestBtn').addEventListener('click', ()=>{
  closeEditor();
  testPanelOpen = !testPanelOpen;
});
document.getElementById('closeBtn').addEventListener('click', closeEditor);
document.getElementById('cancelBtn').addEventListener('click', closeEditor);
document.getElementById('overlay').addEventListener('click', e=>{
  if(e.target.id === 'overlay') closeEditor();
});

document.getElementById('saveBtn').addEventListener('click', ()=>{
  // limpa linhas vazias (sem nome) antes de salvar
  ['manha','tarde','noite'].forEach(k=>{
    draft.periods[k].tasks = draft.periods[k].tasks.filter(t=>t.txt.trim() !== '');
  });
  if(draft.periodsWeekend){
    ['manha','tarde','noite'].forEach(k=>{
      draft.periodsWeekend[k].tasks = draft.periodsWeekend[k].tasks.filter(t=>t.txt.trim() !== '');
    });
  }
  draft.badHabits = draft.badHabits.filter(h=>h.txt.trim() !== '');
  draft.rewards = draft.rewards.filter(r=>r.txt.trim() !== '');
  draft.schedule = (draft.schedule || []).filter(s=>s.label.trim() !== '' && s.days.length > 0);

  const pinVal = document.getElementById('editorPinInput').value.trim();
  draft.editorPin = pinVal;

  const gameLimitVal = parseFloat(document.getElementById('gameLimitInput').value);
  draft.screenDailyLimitHours = isNaN(gameLimitVal) || gameLimitVal < 0 ? 2 : gameLimitVal;

  CONFIG = draft;
  saveConfig(CONFIG);

  // remove do estado marcado de hoje qualquer tarefa que não existe mais
  // na rotina ativa de hoje (dia de escola ou fim de semana)
  const validIds = new Set(allTasks().map(t=>t.id));
  Object.keys(state.checkedToday).forEach(id=>{
    if(!validIds.has(id)) delete state.checkedToday[id];
  });
  saveState(state);

  closeEditor();
  render();
});

/* ===================== SINCRONIZAÇÃO COM GOOGLE DRIVE (via Apps Script) ===================== */

const APPS_SCRIPT_CODE = `function doGet(e) {
  if (e.parameter.data === '1') {
    var files = DriveApp.getFilesByName('rotina-hector-backup.json');
    if (files.hasNext()) {
      var file = files.next();
      var raw = file.getBlob().getDataAsString();
      try {
        var data = JSON.parse(raw);
        return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
      } catch(err) {}
    }
    return ContentService.createTextOutput(JSON.stringify({error:'not_found'})).setMimeType(ContentService.MimeType.JSON);
  }

  var appFiles = DriveApp.getFilesByName('rotina-hector.html');
  if (!appFiles.hasNext()) appFiles = DriveApp.getFilesByName('rotina-hector-app.html');
  if (appFiles.hasNext()) {
    return HtmlService.createHtmlOutput(appFiles.next().getBlob().getDataAsString())
      .setTitle('Rotina do Hector')
      .addMetaTag('viewport','width=device-width, initial-scale=1');
  }
  return HtmlService.createHtmlOutput('Ainda não encontrei o arquivo rotina-hector.html (nem o arquivo legado rotina-hector-app.html) no seu Drive.');
}

function doPost(e) {
  var incoming = JSON.parse(e.postData.contents || '{}');
  var files = DriveApp.getFilesByName('rotina-hector-backup.json');
  var file = files.hasNext() ? files.next() : DriveApp.createFile('rotina-hector-backup.json','{}',MimeType.PLAIN_TEXT);
  var current = {};
  try { current = JSON.parse(file.getBlob().getDataAsString() || '{}'); } catch(err) {}
  var currentRevision = Number(current.revision || (current.state && current.state.driveRevision) || 0);
  var baseRevision = Number(incoming.baseRevision || 0);

  if (currentRevision > 0 && baseRevision !== currentRevision) {
    return ContentService.createTextOutput(JSON.stringify({conflict:true, revision:currentRevision, data:current})).setMimeType(ContentService.MimeType.JSON);
  }

  var nextRevision = currentRevision + 1;
  incoming.revision = nextRevision;
  incoming.serverUpdatedAt = new Date().toISOString();
  if (incoming.state) incoming.state.driveRevision = nextRevision;
  file.setContent(JSON.stringify(incoming, null, 2));

  var backupDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Sao_Paulo', 'yyyy-MM-dd');
  var backupName = 'rotina-hector-backup-' + backupDate + '.json';
  var backups = DriveApp.getFilesByName(backupName);
  if (!backups.hasNext()) {
    DriveApp.createFile(backupName, JSON.stringify(incoming, null, 2), MimeType.PLAIN_TEXT);
  }

  var allBackups = [];
  var it = DriveApp.getFiles();
  while(it.hasNext()) {
    var f = it.next();
    if (/^rotina-hector-backup-\d{4}-\d{2}-\d{2}[.]json$/.test(f.getName())) allBackups.push(f);
  }
  allBackups.sort(function(a,b){ return b.getDateCreated().getTime() - a.getDateCreated().getTime(); });
  for (var i=30; i<allBackups.length; i++) allBackups[i].setTrashed(true);

  return ContentService.createTextOutput(JSON.stringify({ok:true, revision:nextRevision})).setMimeType(ContentService.MimeType.JSON);
}`;

function renderDriveSync(){
  const el = document.getElementById('driveSyncSection');
  if(!el) return;
  if(!adultUnlocked){ el.innerHTML=''; return; }

  const configured = !!APPS_SCRIPT_URL;

  let statusHtml, actionsHtml;

  if(!configured){
    statusHtml = `Ainda não configurado neste arquivo.`;
    actionsHtml = `
      <button class="icon-btn" id="driveSetupInfoBtn">como configurar</button>
      <button class="icon-btn" id="driveCopyCodeBtn">📋 ver código do Apps Script</button>
    `;
  } else {
    statusHtml = state.driveLastSyncISO
      ? `Sincronizado ✓ — ${formatDateBR(state.driveLastSyncISO)}${state.driveConflictCount ? ` · ${state.driveConflictCount} conflito(s) resolvido(s)` : ''}.`
      : `Sincronização automática ativa — aguardando primeira sincronização.`;
    actionsHtml = `
      <button class="icon-btn primary" id="driveSaveBtn">☁️⬆️ forçar salvar agora</button>
      <button class="icon-btn primary" id="driveLoadBtn">☁️⬇️ forçar carregar agora</button>
    `;
  }

  el.innerHTML = `
    <div class="drive-sync">
      <h3>☁️ Sincronizado com Google Drive</h3>
      <div class="hint">O Drive guarda os dados, o histórico e uma cópia diária. O app continua funcionando offline e sincroniza quando a conexão volta.</div>
      <div class="status">${statusHtml}</div>
      <div class="drive-sync-row">${actionsHtml}</div>
      <div id="driveSetupInfo" style="display:none;" class="drive-setup">
        <b>Passo a passo:</b>
        <ol>
          <li>Acesse <code>script.google.com</code> → "Novo projeto".</li>
          <li>Apague o código de exemplo e cole o código do Apps Script (botão "ver código" ao lado).</li>
          <li>Clique em "Implantar" → "Nova implantação".</li>
          <li>Tipo: "App da Web". Executar como: "Eu". Quem tem acesso: "Qualquer pessoa".</li>
          <li>Implante, autorize (é a sua própria conta), e copie a URL gerada (termina em <code>/exec</code>).</li>
          <li>Cole essa URL na constante <code>APPS_SCRIPT_URL</code> no início do arquivo HTML.</li>
          <li>No seu Google Drive, salve o arquivo do app com o nome exato <code>rotina-hector.html</code>.</li>
          <li>Em todos os aparelhos, abra e salve como favorito essa <b>mesma URL do Apps Script</b> (a que termina em <code>/exec</code>) — não o arquivo local. A partir daí, atualizar é só substituir o conteúdo do <code>rotina-hector.html</code> no Drive; todo aparelho já abre a versão nova sozinho.</li>
        </ol>
      </div>
      <textarea id="driveCodeBox" readonly style="display:none; width:100%; height:180px; margin-top:10px; background:rgba(0,0,0,.3); color:var(--chalk); border:1px solid var(--line); border-radius:8px; padding:10px; font-family:monospace; font-size:.72rem;"></textarea>
    </div>
  `;

  if(!configured){
    document.getElementById('driveSetupInfoBtn').addEventListener('click', ()=>{
      const info = document.getElementById('driveSetupInfo');
      info.style.display = info.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('driveCopyCodeBtn').addEventListener('click', ()=>{
      const box = document.getElementById('driveCodeBox');
      box.value = APPS_SCRIPT_CODE;
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
      if(box.style.display === 'block'){ box.focus(); box.select(); }
    });
    return;
  }

  document.getElementById('driveSaveBtn').addEventListener('click', driveSave);
  document.getElementById('driveLoadBtn').addEventListener('click', driveLoad);
}

async function driveSave(){
  try{
    const backup = { config: CONFIG, state: state, exportedAt: new Date().toISOString() };
    const res = await fetch(DATA_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // evita pré-checagem CORS
      body: JSON.stringify(backup),
    });
    if(!res.ok) throw new Error('Falha ao salvar');
    const data = await res.json();
    if(!data.ok) throw new Error(data.error || 'Falha ao salvar');

    state.driveLastSyncISO = todayISO();
    saveState(state);
      alert('Salvo no Google Drive!');
  }catch(err){
    alert('Não consegui salvar no Google Drive. Confira se a URL do Apps Script está certa e se a implantação está ativa.');
  }
}

async function driveLoad(){
  try{
    const res = await fetch(DATA_ENDPOINT, { method: 'GET' });
    if(!res.ok) throw new Error('Falha ao carregar');
    const backup = await res.json();
    if(backup.error === 'not_found'){ alert('Nenhum backup encontrado no Google Drive ainda.'); return; }

    if(!confirm('Isso vai substituir os dados atuais pelos que estão salvos no Google Drive. Continuar?')) return;

    if(backup.config){ CONFIG = backup.config; saveConfig(CONFIG); }
    if(backup.state){ state = backup.state; saveState(state); }

    render();
    alert('Dados carregados do Google Drive!');
  }catch(err){
    alert('Não consegui carregar do Google Drive. Confira se a URL do Apps Script está certa e se a implantação está ativa.');
  }
}

/* ===================== BACKUP LOCAL (exportar / importar) ===================== */
document.getElementById('exportBtn').addEventListener('click', ()=>{
  const backup = { config: CONFIG, state: state, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rotina-hector-backup-' + todayISO() + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  state.lastBackupISO = todayISO();
  state.backupReminderDismissedFor = null;
  saveState(state);
});

document.getElementById('importBtn').addEventListener('click', ()=>{
  document.getElementById('importFile').click();
});
document.getElementById('importFile').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const backup = JSON.parse(reader.result);
      if(!confirm('Isso vai substituir os dados atuais pelos do arquivo importado. Continuar?')) return;
      if(backup.config) { CONFIG = backup.config; saveConfig(CONFIG); }
      if(backup.state) { state = backup.state; saveState(state); }
      render();
    }catch(err){
      alert('Não consegui ler esse arquivo de backup.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

function showFatalErrorBanner(err){
  try{
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#ff6b6b;color:#2a1414;padding:14px 16px;font-family:sans-serif;font-size:.85rem;text-align:center;';
    div.innerHTML = `⚠️ O app encontrou um problema ao carregar e não conseguiu mostrar tudo.<br>
      <button id="__fatalReloadBtn" style="margin-top:8px;background:#2a1414;color:#fff;border:none;padding:7px 16px;border-radius:6px;font-weight:bold;cursor:pointer;">🔄 Recarregar a página</button>`;
    document.body.prepend(div);
    document.getElementById('__fatalReloadBtn').addEventListener('click', ()=>{
      location.reload(true);
    });
  }catch(e2){ /* nada mais a fazer se nem isso funcionar */ }
}

try{
  render();
}catch(err){
  showFatalErrorBanner(err);
}
try{
  autoPullOnStartup();
}catch(err){
  showFatalErrorBanner(err);
}
try{
  startPeriodicSync();
}catch(err){ /* sincronização periódica é só um extra, não crítica */ }

window.addEventListener('error', function(e){
  // se alguma coisa quebrar depois (fora dos try/catch de cima), ainda
  // assim avisa em vez de deixar a tela pela metade sem explicação
  if(!document.getElementById('__fatalReloadBtn')) showFatalErrorBanner(e.error);
});
