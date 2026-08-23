const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('task-state.js','utf8'), context);
const T = context.window.TaskState;

test('transition is immutable and validates status', () => {
  const original = { a: 'done' };
  const next = T.transition(original, 'b', 'helped');
  assert.deepEqual(original, { a:'done' });
  assert.deepEqual(next, { a:'done', b:'helped' });
  assert.equal(T.transition(next, 'b', 'nonsense').b, undefined);
});

test('terminal states are explicit', () => {
  assert.equal(T.isTerminal('done'), true);
  assert.equal(T.isTerminal('helped'), true);
  assert.equal(T.isTerminal('not_done'), true);
  assert.equal(T.isTerminal('pending'), false);
});

test('status counts normalize corrupted persisted data', () => {
  assert.deepEqual(T.countByStatus({a:'done',b:'helped',c:'bad'}), {done:1,helped:1,not_done:0,pending:1});
});
