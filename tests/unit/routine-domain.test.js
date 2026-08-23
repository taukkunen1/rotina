const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('routine-domain.js', 'utf8'), context);
const D = context.window.RoutineDomain;

test('normaliza estados inválidos para pending', () => {
  assert.equal(D.normalizeStatus('done'), 'done');
  assert.equal(D.normalizeStatus('wat'), 'pending');
});

test('calcula pontos sem conceder pontos para helped por padrão', () => {
  assert.equal(D.pointsFor({ pts: 3 }, 'done'), 3);
  assert.equal(D.pointsFor({ pts: 3 }, 'helped'), 0);
  assert.equal(D.pointsFor({ pts: 3, helpPoints: 1 }, 'helped'), 1);
  assert.equal(D.pointsFor({ pts: 3 }, 'not_done'), 0);
});

test('total é determinístico e não depende da UI', () => {
  const tasks = [{id:'a',pts:2},{id:'b',pts:4},{id:'c',pts:1}];
  assert.equal(D.totalPoints(tasks, {a:'done',b:'not_done',c:'done'}), 3);
});

test('virada de dia usa data de calendário e não horário UTC do navegador', () => {
  assert.equal(D.isDayExpired('2026-08-22', new Date('2026-08-23T02:30:00Z'), 'America/Sao_Paulo'), true);
  assert.equal(D.isDayExpired('2026-08-23', new Date('2026-08-23T02:30:00Z'), 'America/Sao_Paulo'), false);
});

test('nextDay atravessa mês e ano sem mutação externa', () => {
  assert.equal(D.nextDay('2026-12-31'), '2027-01-01');
});
