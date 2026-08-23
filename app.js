
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

/* Persistência remota: Supabase via RotinaStorage. */

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

/* Sincronização automática legada removida. O RotinaStorage agora usa Supabase. */
function scheduleAutoPush(){}

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

window.addEventListener('error', function(e){
  // se alguma coisa quebrar depois (fora dos try/catch de cima), ainda
  // assim avisa em vez de deixar a tela pela metade sem explicação
  if(!document.getElementById('__fatalReloadBtn')) showFatalErrorBanner(e.error);
});
