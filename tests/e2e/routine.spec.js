const { test, expect } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

function routineConfig(){
  return {
    periods: {
      manha: { label:'Manhã', time:'08:20 – 12:00', tasks:[{ id:'11111111-1111-4111-8111-111111111111', txt:'Arrumar a cama', pts:1, tier:'responsabilidade' }] },
      tarde: { label:'Tarde', time:'12:00 – 18:00', tasks:[{ id:'22222222-2222-4222-8222-222222222222', txt:'Almoçar', pts:1, tier:'essencial' }] },
      noite: { label:'Noite', time:'18:00 – 22:00', tasks:[{ id:'33333333-3333-4333-8333-333333333333', txt:'Tomar banho', pts:2, tier:'essencial' }] },
    },
    periodsWeekend:null, rewards:[], schedule:[], scheduleExceptions:[],
    screenDailyLimitHours:2, perfectDayBonusMinutes:30,
    pet:{ name:'Pacus', stages:[] },
  };
}

async function mockSupabase(page){
  const config = routineConfig();
  const statuses = new Map();
  const runtime = () => ({
    date:'2026-08-23', balance:0,
    dailyRun:{ id:'run-test', date:'2026-08-23', status:'open', done_count:statuses.size, task_count:3, points_earned:0, perfect:false },
    completions:[...statuses.entries()].map(([task_id,status]) => ({task_id,status})),
    history:{}, uiState:{ gameTimer:{ usedSeconds:0, bonusSeconds:0, runningSince:null, redemptions:{} }, petCompletedDays:[], petPerfectBonusDays:[], lastSeenPetStage:0, petLastCompletionISO:null }
  });
  await page.route('https://aictkwkcyqjsakugiwra.supabase.co/rest/v1/rpc/**', async route => {
    const name = new URL(route.request().url()).pathname.split('/').pop();
    const body = route.request().postDataJSON() || {};
    if(name === 'get_routine_model') return route.fulfill({contentType:'application/json',body:JSON.stringify({config})});
    if(name === 'child_get_runtime_state') return route.fulfill({contentType:'application/json',body:JSON.stringify(runtime())});
    if(name === 'child_mark_task') {
      const status = body.p_status || 'pending';
      if(status === 'pending') statuses.delete(body.p_task_id); else statuses.set(body.p_task_id,status);
      return route.fulfill({contentType:'application/json',body:JSON.stringify({...runtime(),status,action:'updated',pointsAwarded:0})});
    }
    if(name === 'save_child_ui_state') return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true})});
    return route.fulfill({status:404,contentType:'application/json',body:JSON.stringify({message:`unexpected RPC ${name}`})});
  });
}

async function blockRemoteData(page){
  await mockSupabase(page);
  await page.route('https://script.google.com/**', route => route.abort());
}
async function expectNoHorizontalOverflow(page){
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow, 'página deve caber na largura da viewport').toBe(false);
}
async function waitForRoutine(page){
  await expect(page.locator('#periods')).toBeVisible();
  await expect(page.locator('.period')).toHaveCount(3);
}

test.describe('rotina do dia', () => {
  test.beforeEach(async ({ page }) => {
    await blockRemoteData(page);
    await page.goto('/index.html');
    await waitForRoutine(page);
  });

  test('renderiza uma rotina utilizável sem overflow', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Rotina do Pacus/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('todos os controles principais da primeira tarefa ficam visíveis', async ({ page }) => {
    const firstTask = page.locator('.task:visible').first();
    for (const selector of ['.mark-done', '.mark-help', '.mark-na', '.mark-x']) await expect(firstTask.locator(selector)).toBeVisible();
  });

  test('concluir uma tarefa altera o estado visual e sobrevive ao reload', async ({ page }) => {
    const done = page.locator('.mark-done:visible').first();
    const task = done.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " task ")]').first();
    const taskId = await task.locator('.mark-group').getAttribute('data-id');
    await done.click();
    await expect(task).toHaveClass(/done|completed|checked/);
    await page.reload();
    await waitForRoutine(page);
    const reloadedTask = page.locator(`.task:has(.mark-group[data-id="${taskId}"])`);
    await expect(reloadedTask).toHaveClass(/done|completed|checked/);
  });

  test('módulos de domínio são carregados e o runtime continua saudável', async ({ page }) => {
    await expect.poll(() => page.evaluate(() => Boolean(window.PacusTaskDomain && window.PacusRoutineDomain))).toBe(true);
    await expect(page.locator('#appCrashBanner')).toHaveCount(0);
    await expect(page.locator('#__fatalReloadBtn')).toHaveCount(0);
  });

  test('não há violações axe graves ou críticas na home', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
});

test.describe('responsividade', () => {
  test('não há overflow horizontal na home', async ({ page }) => { await blockRemoteData(page); await page.goto('/index.html'); await waitForRoutine(page); await expectNoHorizontalOverflow(page); });
  test('botões de tarefa possuem área de toque utilizável', async ({ page }) => { await blockRemoteData(page); await page.goto('/index.html'); await waitForRoutine(page); const button=page.locator('.mark-done:visible').first(); const box=await button.boundingBox(); expect(box).not.toBeNull(); expect(Math.min(box.width,box.height),'controle de toque não deve ser minúsculo').toBeGreaterThanOrEqual(32); });
});

test.describe('áreas administrativas', () => {
  for (const path of ['/adultos.html', '/historico.html']) test(`${path} carrega sem overflow e sem violações axe graves`, async ({ page }) => { await blockRemoteData(page); await page.goto(path); await expect(page.locator('main')).toBeVisible(); await expectNoHorizontalOverflow(page); const results=await new AxeBuilder({page}).analyze(); const serious=results.violations.filter(v=>['serious','critical'].includes(v.impact)); expect(serious,JSON.stringify(serious,null,2)).toEqual([]); });
});
