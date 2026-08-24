(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const storage = window.RotinaStorage;
  let data = { config: {}, state: {}, revision: 0, serverUpdatedAt: null };
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function setStatus(text) { $('adult-status').textContent = text; }
  async function loadRemote() { try { data = await storage.getRemote(); setStatus('Sincronizado com o servidor'); } catch (error) { data = { config: {}, state: {}, revision: 0, serverUpdatedAt: null }; setStatus('Servidor indisponível'); } }
  function historyEntries() { return Object.entries(data.state?.history || {}).sort((a,b) => b[0].localeCompare(a[0])); }
  function renderToday() { const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date()); const item = (data.state?.history || {})[today]; if (!item) { $('adult-today').innerHTML = '<p>Nenhum registro fechado para hoje.</p>'; return; } const done = Number(item.done || 0), total = Number(item.total || 0); $('adult-today').innerHTML = `<div class="adult-metric"><strong>${done}/${total}</strong><span>Tarefas concluídas</span></div><div class="adult-metric"><strong>${esc(item.pointsEarnedThatDay ?? 0)}</strong><span>Pontos</span></div><div class="adult-metric"><strong>${item.perfect ? 'Sim' : 'Não'}</strong><span>Dia perfeito</span></div>`; }
  function renderSync() { $('sync-info').textContent = `Revisão: ${data.revision || 0}\nAtualizado: ${data.serverUpdatedAt || 'não informado'}\nHistórico: ${historyEntries().length} dia(s)`; }
  function render() { renderToday(); renderSync(); }
  function repairEditorConfig() { const cfg = data.config && typeof data.config === 'object' ? data.config : {}; if (!cfg.periods || typeof cfg.periods !== 'object') cfg.periods = {}; const defaults = { manha:{label:'Manhã',time:'8:00 – 12:00'}, tarde:{label:'Tarde',time:'12:00 – 18:00'}, noite:{label:'Noite',time:'18:00 – 22:00'} }; Object.keys(defaults).forEach(k => { if (!cfg.periods[k] || !Array.isArray(cfg.periods[k].tasks)) cfg.periods[k] = { ...defaults[k], tasks:[] }; if (!cfg.periods[k].label) cfg.periods[k].label=defaults[k].label; if (!cfg.periods[k].time) cfg.periods[k].time=defaults[k].time; }); if (cfg.periodsWeekend) Object.keys(defaults).forEach(k => { if (!cfg.periodsWeekend[k] || !Array.isArray(cfg.periodsWeekend[k].tasks)) cfg.periodsWeekend[k] = { ...cfg.periods[k] }; }); if (!Array.isArray(cfg.badHabits)) cfg.badHabits=[]; if (!Array.isArray(cfg.rewards)) cfg.rewards=[]; if (!Array.isArray(cfg.schedule)) cfg.schedule=[]; if (!Array.isArray(cfg.scheduleExceptions)) cfg.scheduleExceptions=[]; if (cfg.editorPin == null) cfg.editorPin=''; if (cfg.screenDailyLimitHours == null) cfg.screenDailyLimitHours=2; data.config=cfg; }
  function wireEditorEntry() { document.querySelectorAll('a[href*="adultEdit=1"]').forEach(link => link.addEventListener('click', () => { repairEditorConfig(); storage.writeJSON(storage.CONFIG_KEY, data.config); })); }
  function exportBackup() { const snapshot={config:data.config,state:data.state,revision:data.revision,serverUpdatedAt:data.serverUpdatedAt,exportedAt:new Date().toISOString()}; const blob=new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='rotina-backup.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); }
  async function importBackup(file) { const imported=JSON.parse(await file.text()); if(!imported||typeof imported!=='object'||!imported.state) throw new Error('Backup inválido'); setStatus('Enviando backup para o servidor…'); const result=await storage.replaceRemote(imported); data={config:imported.config||{},state:imported.state||{},revision:Number(result.revision||0),serverUpdatedAt:result.serverUpdatedAt||null}; storage.writeJSON(storage.CONFIG_KEY,data.config); storage.writeJSON(storage.STATE_KEY,data.state); render(); setStatus('Backup restaurado no servidor'); }
  async function start() {
    const user = await window.PacusAuth.requireAdult();
    if (!user) return;
    setStatus(`Acesso adulto: ${user.email || 'sessão ativa'}`);
    $('adult-logout').addEventListener('click', () => window.PacusAuth.signOut());
    $('export-backup').addEventListener('click', exportBackup);
    $('import-backup').addEventListener('change', async e => { if(!e.target.files?.[0]) return; try { await importBackup(e.target.files[0]); } catch(err) { console.error(err); setStatus('Erro ao restaurar backup no servidor'); } e.target.value=''; });
    $('refresh-remote').addEventListener('click', async()=>{setStatus('Atualizando…');await loadRemote();render();});
    wireEditorEntry(); await loadRemote(); repairEditorConfig(); render();
  }
  document.addEventListener('DOMContentLoaded', start);
})();