const test = require('node:test');
const assert = require('node:assert/strict');
const domain = require('../../domain/task-domain.js');

test('done e help contam como conclusão', () => {
  assert.equal(domain.isCountedDone('done'), true);
  assert.equal(domain.isCountedDone('help'), true);
  assert.equal(domain.isCountedDone('x'), false);
  assert.equal(domain.isCountedDone('na'), false);
});

test('penalidade normal arredonda para cima e para número par', () => {
  assert.equal(domain.notDonePenalty(1), 2);
  assert.equal(domain.notDonePenalty(2), 2);
  assert.equal(domain.notDonePenalty(3), 2);
  assert.equal(domain.notDonePenalty(5), 4);
});

test('tarefas com fullPenalty perdem todos os pontos', () => {
  assert.equal(domain.taskNotDonePenalty({ pts: 7, fullPenalty:true }), 7);
  assert.equal(domain.taskNotDonePenalty({ pts: 7 }), 4);
});

test('pedir ajuda gera pelo menos um ponto e arredonda para cima', () => {
  assert.equal(domain.taskHelpPoints({ pts: 1 }), 1);
  assert.equal(domain.taskHelpPoints({ pts: 3 }), 2);
  assert.equal(domain.taskHelpPoints({ pts: 4 }), 2);
});

test('transição de estado remove efeito anterior antes de aplicar o novo', () => {
  const task = { pts: 5 };
  assert.deepEqual(domain.transition('done', 'help', task), { nextStatus:'help', delta:-2, action:'help' });
  assert.deepEqual(domain.transition('help', 'done', task), { nextStatus:'done', delta:2, action:'done' });
  assert.deepEqual(domain.transition('x', 'done', task), { nextStatus:'done', delta:9, action:'done' });
});

test('clicar no mesmo estado limpa a tarefa', () => {
  assert.deepEqual(domain.transition('done', 'done', { pts:4 }), { nextStatus:null, delta:-4, action:'cleared' });
});

test('dia leve não aplica penalidade para x', () => {
  assert.deepEqual(domain.transition(null, 'x', { pts:6 }, { lightDay:true }), { nextStatus:'x', delta:0, action:'x' });
});

test('ordem personalizada preserva tarefas novas no final', () => {
  const tasks = [{id:'a'},{id:'b'},{id:'c'}];
  assert.deepEqual(domain.getEffectiveOrder(tasks, ['b','missing','a']).map(t => t.id), ['b','a','c']);
});

test('resumo ignora n/a e considera help como concluída', () => {
  const tasks = [{id:'a'},{id:'b'},{id:'c'}];
  assert.deepEqual(domain.completionSummary(tasks, {a:'done',b:'help',c:'na'}), { total:2, done:2, remaining:0, perfect:true });
});
