const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('renderers/routine-renderer.js', 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(source, context);
const R = context.window.PacusRoutineRenderer;

test('progress messages preserve routine states', () => {
  assert.deepEqual(R.progressMessage(0, 0), { pct:0, remaining:0, text:'nada marcado ainda' });
  assert.deepEqual(R.progressMessage(3, 3), { pct:100, remaining:0, text:'tudo certo por aqui! ✅' });
  assert.deepEqual(R.progressMessage(3, 2), { pct:67, remaining:1, text:'falta só 1! 🔥' });
  assert.deepEqual(R.progressMessage(4, 1), { pct:25, remaining:3, text:'1/4 feitas' });
});

test('task classes map statuses without leaking state decisions', () => {
  assert.equal(R.taskClassName({ status:'done', suggested:true }), 'task done suggested');
  assert.equal(R.taskClassName({ status:'help', suggested:false }), 'task helped');
  assert.equal(R.taskClassName({ status:'x', suggested:false }), 'task notdone');
  assert.equal(R.taskClassName({ status:undefined, suggested:false }), 'task');
});

test('renderer escapes task content', () => {
  const html = R.legacyTaskMarkup({
    task:{ id:'x', txt:'<img>', sub:'"quoted"', pts:2, tier:'extra' },
    periodKey:'manha', index:0, total:1, status:undefined, suggested:false, lightDay:false,
    taskIcon:()=> '⭐', taskHelpPoints:()=>1, taskNotDonePenalty:()=>2
  });
  assert.match(html, /&lt;img&gt;/);
  assert.doesNotMatch(html, /<img>/);
  assert.match(html, /&quot;quoted&quot;/);
});

test('next preview points to next period and final completion', () => {
  const periods = {
    manha:{ label:'Manhã', tasks:[] },
    tarde:{ label:'Tarde', tasks:[{ txt:'Almoçar' }] },
    noite:{ label:'Noite', tasks:[] }
  };
  assert.match(R.nextPreview('manha', periods.manha, periods, 1, 100, ()=>'🍽️'), /A seguir: <b>Tarde<\/b>/);
  assert.match(R.nextPreview('noite', periods.noite, periods, 1, 100, ()=>'⭐'), /Terminou tudo por hoje/);
  assert.equal(R.nextPreview('manha', periods.manha, periods, 1, 50, ()=>'⭐'), '');
});

test('period markup preserves legacy controls, progress and point labels', () => {
  const periods = {
    manha:{ label:'Manhã', time:'08:00 – 12:00', tasks:[
      { id:'a', txt:'Escovar', pts:2, tier:'essencial' },
      { id:'b', txt:'Ler', pts:3, tier:'extra' }
    ]},
    tarde:{ label:'Tarde', time:'12:00 – 18:00', tasks:[] },
    noite:{ label:'Noite', time:'18:00 – 22:00', tasks:[] }
  };
  const html = R.periodMarkup({
    periodKey:'manha', period:periods.manha, periodsObj:periods,
    checkedToday:{ a:'done', b:'help' }, orderedTasks:periods.manha.tasks,
    isCountedDone:s=>s==='done'||s==='help', isLightDay:false,
    taskIcon:()=> '⭐', taskHelpPoints:()=>2, taskNotDonePenalty:()=>3
  });
  assert.match(html, /timeRemaining_manha/);
  assert.match(html, /mark-done active/);
  assert.match(html, /mark-help active/);
  assert.match(html, /\+2<\/span>/);
  assert.match(html, /2\/2 feitas|tudo certo por aqui/);
});

test('renderPeriods delegates all periods and returns generated markup', () => {
  const periods = {
    manha:{ label:'Manhã', time:'08:00 – 12:00', tasks:[{ id:'a', txt:'A', pts:1 }] },
    tarde:{ label:'Tarde', time:'12:00 – 18:00', tasks:[{ id:'b', txt:'B', pts:1 }] },
    noite:{ label:'Noite', time:'18:00 – 22:00', tasks:[{ id:'c', txt:'C', pts:1 }] }
  };
  const periodsEl = { innerHTML:'' };
  const markup = R.renderPeriods({
    periodsEl, periodsObj:periods, checkedToday:{}, getEffectiveTaskOrder:(_, tasks)=>tasks,
    isCountedDone:()=>false, isLightDay:false, taskIcon:()=> '⭐', taskHelpPoints:()=>1, taskNotDonePenalty:()=>1
  });
  assert.equal(periodsEl.innerHTML, markup);
  assert.equal((markup.match(/class="period /g)||[]).length, 3);
});
