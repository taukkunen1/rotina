const DATA_FILE = 'rotina-hector-backup.json';
const BACKUP_PREFIX = 'rotina-hector-backup-';
const MAX_DAILY_BACKUPS = 30;
const TIMEZONE = 'America/Sao_Paulo';

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function findDataFile() {
  const files = DriveApp.getFilesByName(DATA_FILE);
  return files.hasNext()
    ? files.next()
    : DriveApp.createFile(DATA_FILE, '{}', MimeType.PLAIN_TEXT);
}

function readJson(file) {
  try {
    return JSON.parse(file.getBlob().getDataAsString() || '{}');
  } catch (err) {
    return {};
  }
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

// API contract: every GET returns JSON state. The web UI is served separately.
function doGet() {
  const files = DriveApp.getFilesByName(DATA_FILE);
  if (!files.hasNext()) return jsonResponse({ ok: false, error: 'not_found' });

  const data = readJson(files.next());
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
  try {
    incoming = JSON.parse((e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return jsonResponse({ ok: false, error: 'invalid_json' });
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const file = findDataFile();
    const current = readJson(file);
    const currentRevision = Number(current.revision || (current.state && current.state.driveRevision) || 0);
    const baseRevision = Number(incoming.baseRevision || 0);

    if (currentRevision > 0 && baseRevision !== currentRevision) {
      return jsonResponse({ ok: false, conflict: true, revision: currentRevision, data: current });
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

    return jsonResponse({ ok: true, revision: nextRevision, serverUpdatedAt: incoming.serverUpdatedAt });
  } catch (err) {
    if (String(err && err.message || err).indexOf('Lock') !== -1) return jsonResponse({ ok: false, error: 'lock_timeout' });
    return jsonResponse({ ok: false, error: 'server_error' });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/* ===================== FECHAMENTO AUTOMÁTICO DIÁRIO =====================
 * Execute setupDailyCloseTrigger() UMA vez manualmente no Apps Script.
 * Depois disso, o gatilho verifica o horário a cada minuto. Ao chegar em
 * 23:59, o servidor fecha o dia mesmo sem navegador aberto.
 */
function setupDailyCloseTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'checkDailyClose')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('checkDailyClose')
    .timeBased()
    .everyMinutes(1)
    .create();
}

function removeDailyCloseTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'checkDailyClose')
    .forEach(t => ScriptApp.deleteTrigger(t));
}

function checkDailyClose() {
  const now = new Date();
  const hm = localHourMinute();

  // Fechamento normal às 23:59. Se o Apps Script atrasar e passar para
  // os primeiros minutos do dia seguinte, faz recuperação do dia anterior.
  if (hm >= '23:59') {
    closeRoutineDay(isoDate(now), true);
    return;
  }
  if (hm <= '00:10') {
    closeRoutineDay(isoDateOffset(-1), false);
  }
}

function tasksForDate(config, dateISO) {
  if (!config) return [];
  const d = new Date(dateISO + 'T12:00:00');
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  const source = weekend && config.periodsWeekend ? config.periodsWeekend : config.periods;
  if (!source) return [];

  const result = [];
  ['manha', 'tarde', 'noite'].forEach(period => {
    const tasks = Array.isArray(source[period] && source[period].tasks)
      ? source[period].tasks
      : [];
    tasks.forEach(task => {
      if (task && task.id) result.push(task);
    });
  });
  return result;
}

function closeRoutineDay(dateISO, markCheckedToday) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const file = findDataFile();
    const data = readJson(file);
    const state = data.state || {};
    const config = data.config || {};
    state.history = state.history || {};
    state.autoClosedDates = state.autoClosedDates || {};

    // Idempotência: múltiplas execuções não alteram o mesmo dia novamente.
    if (state.autoClosedDates[dateISO]) return;

    const tasks = tasksForDate(config, dateISO);
    const previous = state.history[dateISO] || {};
    const total = tasks.length || Number(previous.total || 0);
    const pointsEarnedThatDay = tasks.length
      ? tasks.reduce((sum, task) => sum + Number(task.pts || 0), 0)
      : Number(previous.pointsEarnedThatDay || 0);

    state.history[dateISO] = Object.assign({}, previous, {
      done: total,
      total: total,
      pointsEarnedThatDay: pointsEarnedThatDay,
      perfect: total > 0,
      screenMinutes: total > 0 ? Number(config.perfectDayBonusMinutes || 30) : Number(previous.screenMinutes || 0),
      autoClosedAt: new Date().toISOString()
    });

    // Às 23:59, também espelha as tarefas concluídas no estado atual.
    if (markCheckedToday && tasks.length) {
      state.checkedToday = state.checkedToday || {};
      tasks.forEach(task => { state.checkedToday[task.id] = true; });
    }

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
    if (/^rotina-hector-backup-\d{4}-\d{2}-\d{2}[.]json$/.test(file.getName())) allBackups.push(file);
  }
  allBackups.sort((a, b) => b.getDateCreated().getTime() - a.getDateCreated().getTime());
  for (let i = MAX_DAILY_BACKUPS; i < allBackups.length; i++) allBackups[i].setTrashed(true);
}
