const test = require('node:test');
const assert = require('node:assert/strict');
const domain = require('../../domain/routine-domain.js');

function config(){
  return {
    periods:{
      manha:{tasks:[{id:'m'}]},
      tarde:{tasks:[{id:'t'}]},
      noite:{tasks:[{id:'n'}]}
    },
    periodsWeekend:{
      manha:{tasks:[{id:'wm'}]},
      tarde:{tasks:[{id:'wt'}]},
      noite:{tasks:[{id:'wn'}]}
    },
    schedule:[{id:'eng',label:'Inglês',days:['seg'],start:'09:00',end:'10:00',period:'manha',pts:3}],
    scheduleExceptions:[{id:'extra',date:'2026-08-18',label:'Consulta',start:'15:00',end:'16:00',period:'tarde',pts:2}]
  };
}

test('identifica dias da semana em formato usado pela rotina', () => {
  assert.equal(domain.weekdayKeyFor('2026-08-17'), 'seg');
  assert.equal(domain.weekdayKeyFor('2026-08-23'), 'dom');
});

test('usa rotina de fim de semana apenas sábado e domingo', () => {
  assert.equal(domain.isWeekendISO('2026-08-22'), true);
  assert.equal(domain.isWeekendISO('2026-08-23'), true);
  assert.equal(domain.isWeekendISO('2026-08-17'), false);
});

test('injeta compromisso recorrente no período correto sem mutar a configuração', () => {
  const cfg = config();
  const result = domain.periodsFor(cfg, '2026-08-17');
  assert.deepEqual(result.manha.tasks.map(t => t.id), ['m','sched_eng']);
  assert.deepEqual(cfg.periods.manha.tasks.map(t => t.id), ['m']);
});

test('injeta exceção somente na data correspondente', () => {
  const cfg = config();
  const match = domain.periodsFor(cfg, '2026-08-18');
  const other = domain.periodsFor(cfg, '2026-08-19');
  assert.equal(match.tarde.tasks.some(t => t.id === 'exc_extra'), true);
  assert.equal(other.tarde.tasks.some(t => t.id === 'exc_extra'), false);
});

test('flattenTasks mantém ordem manhã, tarde e noite', () => {
  const periods = {manha:{tasks:[{id:'m'}]},tarde:{tasks:[{id:'t'}]},noite:{tasks:[{id:'n'}]}};
  assert.deepEqual(domain.flattenTasks(periods).map(t => t.id), ['m','t','n']);
});
