const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = { window: {}, Intl, Date };
vm.createContext(context);
vm.runInContext(fs.readFileSync('daily-cycle.js','utf8'), context);
const D = context.window.DailyCycle;

test('São Paulo calendar day does not follow UTC midnight', () => {
  assert.equal(D.calendarDay(new Date('2026-08-23T02:30:00Z')), '2026-08-22');
  assert.equal(D.calendarDay(new Date('2026-08-23T03:30:00Z')), '2026-08-23');
});

test('rollover only happens when calendar day changes', () => {
  assert.equal(D.needsRollover('2026-08-22', new Date('2026-08-23T02:30:00Z')), false);
  assert.equal(D.needsRollover('2026-08-22', new Date('2026-08-23T03:30:00Z')), true);
  assert.equal(D.needsRollover('', new Date()), true);
});

test('fresh daily state resets transient fields but preserves history reference', () => {
  const history = { '2026-08-22': { totalPoints: 8 } };
  const next = D.buildFreshDailyState('2026-08-23', { history });
  assert.equal(next.day, '2026-08-23');
  assert.deepEqual(next.checkedToday, {});
  assert.equal(next.totalPoints, 0);
  assert.deepEqual(next.history, history);
});
