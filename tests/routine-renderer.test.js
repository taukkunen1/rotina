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
  const html = R.taskMarkup({
    task:{ id:'x', txt:'<img>', sub:'"quoted"', pts:2, tier:'extra' },
    periodKey:'manha', index:0, total:1, status:undefined, suggested:false, lightDay:false, icon:'⭐'
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
