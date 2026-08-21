const DATA_FILE = 'rotina-hector-backup.json';
const BACKUP_PREFIX = 'rotina-hector-backup-';
const MAX_DAILY_BACKUPS = 30;

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
    const currentRevision = Number(
      current.revision ||
      (current.state && current.state.driveRevision) ||
      0
    );
    const baseRevision = Number(incoming.baseRevision || 0);

    if (currentRevision > 0 && baseRevision !== currentRevision) {
      return jsonResponse({
        ok: false,
        conflict: true,
        revision: currentRevision,
        data: current
      });
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

    return jsonResponse({
      ok: true,
      revision: nextRevision,
      serverUpdatedAt: incoming.serverUpdatedAt
    });
  } catch (err) {
    if (String(err && err.message || err).indexOf('Lock') !== -1) {
      return jsonResponse({ ok: false, error: 'lock_timeout' });
    }
    return jsonResponse({ ok: false, error: 'server_error' });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function createDailyBackup(data) {
  const timezone = Session.getScriptTimeZone() || 'America/Sao_Paulo';
  const date = Utilities.formatDate(new Date(), timezone, 'yyyy-MM-dd');
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
