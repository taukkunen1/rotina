const DATA_FILE = 'rotina-backup.json';
const BACKUP_PREFIX = 'rotina-backup-';
const MAX_DAILY_BACKUPS = 30;
const TIMEZONE = 'America/Sao_Paulo';

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function findDataFile() {
  const current = DriveApp.getFilesByName(DATA_FILE);
  if (current.hasNext()) return current.next();

  const files = DriveApp.getFiles();
  const legacyPattern = /^rotina-(?!.*\d{4}-\d{2}-\d{2}\.json$).*backup\.json$/;
  while (files.hasNext()) {
    const file = files.next();
    if (legacyPattern.test(file.getName())) {
      file.setName(DATA_FILE);
      return file;
    }
  }
  return DriveApp.createFile(DATA_FILE, '{}', MimeType.PLAIN_TEXT);
}

function readJson(file) {
  try { return JSON.parse(file.getBlob().getDataAsString() || '{}'); }
  catch (err) { return {}; }
}

function isoDate(date) {
  return Utilities.formatDate(date || new Date(), TIMEZONE, 'yyyy-MM-dd');
}

function isoDateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

function localHourMinute() {
  return Utilities.formatDate(new Date(), TIMEZONE, 'HH:mm');
}

function doGet() {
  const file = findDataFile();
  const data = readJson(file);
  return jsonResponse({
    ok: true,
    revision: Number(data.revision || (data.state && data.state.driveRevision) || 0),
    config: data.config || {},
    state: data.state || {},
    serverUpdatedAt: data.serverUpdatedAt || null
  });
}

function doPost(e) {
  let incoming;
  try { incoming = JSON.parse((e.postData && e.postData.contents) || '{}'); }
  catch (err) { return jsonResponse({ ok:false, error:'invalid_json' }); }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const file = findDataFile();
    const current = readJson(file);
    const currentRevision = Number(current.revision || (current.state && current.state.driveRevision) || 0);
    const baseRevision = Number(incoming.baseRevision || 0);

    if (currentRevision > 0 && baseRevision !== currentRevision) {
      return jsonResponse({ ok:false, conflict:true, revision:currentRevision, data:current });
    }

    const nextRevision = currentRevision + 1;
    incoming.revision = nextRevision;
    incoming.serverUpdatedAt = new Date().toISOString();
    incoming.baseRevision = currentRevision;
    if (!incoming.state) incoming.state = {};
    incoming.state.driveRevision = nextRevision;

    file.setContent(JSON.stringify(incoming, null, 2));
    createDailyBackup(incoming);
    pruneDailyBackups();
    return jsonResponse({ ok:true, revision:nextRevision, serverUpdatedAt:incoming.serverUpdatedAt });
  } catch (err) {
    if (String(err && err.message || err).indexOf('Lock') !== -1) {
      return jsonResponse({ ok:false, error:'lock_timeout' });
    }
    return jsonResponse({ ok:false, error:'server_error' });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function setupDailyCloseTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'checkDailyClose')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('checkDailyClose').timeBased().everyMinutes(1).create();
}

function removeDailyCloseTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'checkDailyClose')
    .forEach(t => ScriptApp.deleteTrigger(t));
}

function checkDailyClose() {
  const hm = localHourMinute();
  if (hm >= '23:59') return closeRoutineDay(isoDate(new Date()));
  if (hm <= '00:10') return closeRoutineDay(isoDateOffset(-1));
}

function tasksForDate(config, dateISO) {
  if (!config) return [];
  const d = new Date(dateISO + 'T12:00:00');
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  const source = weekend && config.periodsWeekend ? config.periodsWeekend : config.periods;
  if (!source) return [];
  const result = [];
  ['manha','tarde','noite'].forEach(period => {
    const tasks = Array.isArray(source[period] && source[period].tasks) ? source[period].tasks : [];
    tasks.forEach(task => { if (task && task.id) result.push(task); });
  });
  return result;
}

function taskPoints(tasks) {
  return tasks.reduce((sum, task) => sum + Number(task && task.pts || 0), 0);
}

function closeRoutineDay(dateISO) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const file = findDataFile();
    const data = readJson(file);
    const state = data.state || {};
    const config = data.config || {};
    state.history = state.history || {};
    state.autoClosedDates = state.autoClosedDates || {};
    if (state.autoClosedDates[dateISO]) return;

    const tasks = tasksForDate(config, dateISO);
    const previous = state.history[dateISO] || {};
    const checkedToday = state.checkedToday || {};
    const checkedTasks = tasks.filter(task => checkedToday[task.id] === true);

    const total = tasks.length || Number(previous.total || 0);
    const previousDone = Number(previous.done || 0);
    const done = checkedTasks.length > 0 ? checkedTasks.length : Math.min(previousDone, total);
    const pointsEarnedThatDay = checkedTasks.length > 0
      ? taskPoints(checkedTasks)
      : Number(previous.pointsEarnedThatDay || 0);
    const perfect = total > 0 && done === total;

    state.history[dateISO] = Object.assign({}, previous, {
      done: done,
      total: total,
      pointsEarnedThatDay: pointsEarnedThatDay,
      perfect: perfect,
      screenMinutes: perfect ? Number(config.perfectDayBonusMinutes || 30) : Number(previous.screenMinutes || 0),
      autoClosedAt: new Date().toISOString()
    });

    state.autoClosedDates[dateISO] = true;
    state.lastAutoClosedDate = dateISO;
    const currentRevision = Number(data.revision || state.driveRevision || 0);
    const nextRevision = currentRevision + 1;
    data.state = state;
    data.revision = nextRevision;
    data.baseRevision = currentRevision;
    data.serverUpdatedAt = new Date().toISOString();
    state.driveRevision = nextRevision;

    file.setContent(JSON.stringify(data, null, 2));
    createDailyBackup(data);
    pruneDailyBackups();
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

// Executar uma vez para corrigir registros legados que foram fechados
// indevidamente como 1/1 apesar de representarem um dia perfeito completo.
function repairLegacyHistory() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const file = findDataFile();
    const data = readJson(file);
    const state = data.state || {};
    const config = data.config || {};
    const history = state.history || {};
    let changed = false;

    Object.keys(history).forEach(dateISO => {
      const item = history[dateISO] || {};
      const done = Number(item.done || 0);
      const total = Number(item.total || 0);
      if (!item.perfect || done !== 1 || total !== 1) return;

      const tasks = tasksForDate(config, dateISO);
      if (!tasks.length) return;
      item.done = tasks.length;
      item.total = tasks.length;
      item.pointsEarnedThatDay = taskPoints(tasks);
      item.perfect = true;
      item.legacyHistoryNormalizedAt = new Date().toISOString();
      history[dateISO] = item;
      changed = true;
    });

    if (!changed) return { ok:true, changed:false };

    state.history = history;
    data.state = state;
    const currentRevision = Number(data.revision || state.driveRevision || 0);
    const nextRevision = currentRevision + 1;
    data.revision = nextRevision;
    data.baseRevision = currentRevision;
    data.serverUpdatedAt = new Date().toISOString();
    state.driveRevision = nextRevision;
    file.setContent(JSON.stringify(data, null, 2));
    createDailyBackup(data);
    pruneDailyBackups();
    return { ok:true, changed:true, revision:nextRevision };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function createDailyBackup(data) {
  const date = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');
  const name = BACKUP_PREFIX + date + '.json';
  const backups = DriveApp.getFilesByName(name);
  if (!backups.hasNext()) {
    DriveApp.createFile(name, JSON.stringify(data, null, 2), MimeType.PLAIN_TEXT);
  }
}

function pruneDailyBackups() {
  const allBackups = [];
  const files = DriveApp.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    if (/^rotina-backup-\d{4}-\d{2}-\d{2}\.json$/.test(file.getName())) allBackups.push(file);
  }
  allBackups.sort((a,b) => b.getDateCreated().getTime() - a.getDateCreated().getTime());
  for (let i = MAX_DAILY_BACKUPS; i < allBackups.length; i++) allBackups[i].setTrashed(true);
}
