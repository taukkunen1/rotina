const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeConfig, normalizeRuntimeState } = require('../../domain/routine-state.js');

const defaults = { pet:{name:'Pacus',growthStartDate:'2026-01-01',growthEndDate:'2026-12-31',stages:[1,2]}, periods:{manha:{tasks:[]},tarde:{tasks:[]},noite:{tasks:[]}}, badHabits:[], rewards:[{id:'r1'}], schedule:[], scheduleExceptions:[], screenDailyLimitHours:2, perfectDayBonusMinutes:30, historyStartDate:'2026-01-01' };

test('normalizes incomplete config without mutating defaults', () => {
  const result = normalizeConfig({pet:{name:''},periods:{}}, defaults);
  assert.equal(result.pet.name, 'Pacus');
  assert.deepEqual(result.periods.manha.tasks, []);
  assert.equal(result.screenDailyLimitHours, 2);
  assert.deepEqual(defaults.rewards, [{id:'r1'}]);
});

test('normalizes runtime state and timer invariants', () => {
  const result = normalizeRuntimeState({totalPoints:'bad',gameTimer:{usedSeconds:'x',bonusSeconds:null,runningSince:'bad'}}, '2026-08-23');
  assert.equal(result.totalPoints, 0);
  assert.equal(result.gameTimer.date, '2026-08-23');
  assert.equal(result.gameTimer.usedSeconds, 0);
  assert.equal(result.gameTimer.bonusSeconds, 0);
  assert.equal(result.gameTimer.runningSince, null);
  assert.deepEqual(result.gameTimer.redemptions, {});
});
