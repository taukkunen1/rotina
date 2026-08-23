const test = require('node:test');
const assert = require('node:assert/strict');
const domain = require('../../domain/task-domain.js');
const { createTaskController } = require('../../controllers/task-controller.js');

test('task controller persists done transition and renders', async () => {
  const state = { points:0, checkedToday:{} };
  const calls = [];
  let renders = 0;
  const controller = createTaskController({
    domain,
    getState: () => state,
    getTask: id => id === 'a' ? { id:'a', pts:4 } : null,
    persist: async payload => calls.push(payload),
    render: () => renders++
  });
  const result = await controller.setStatus('a', 'done');
  assert.equal(result.nextStatus, 'done');
  assert.equal(state.checkedToday.a, 'done');
  assert.equal(state.points, 4);
  assert.equal(calls.length, 1);
  assert.equal(renders, 1);
});

test('task controller clears repeated status without negative points', async () => {
  const state = { points:4, checkedToday:{ a:'done' } };
  const controller = createTaskController({ domain, getState:()=>state, getTask:()=>({ id:'a', pts:4 }) });
  const result = await controller.setStatus('a', 'done');
  assert.equal(result.nextStatus, null);
  assert.equal(state.checkedToday.a, undefined);
  assert.equal(state.points, 0);
});

test('task controller rejects unknown tasks', async () => {
  const controller = createTaskController({ domain, getTask:()=>null });
  await assert.rejects(() => controller.setStatus('missing','done'), /task_not_found/);
});
