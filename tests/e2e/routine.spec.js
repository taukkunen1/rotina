const { test, expect } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

async function blockRemoteData(page){
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
    const firstTask = page.locator('.task').first();
    for (const selector of ['.mark-done', '.mark-help', '.mark-na', '.mark-x']) {
      await expect(firstTask.locator(selector)).toBeVisible();
    }
  });

  test('concluir uma tarefa altera o estado visual e sobrevive ao reload', async ({ page }) => {
    const done = page.locator('.mark-done').first();
    const task = done.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " task ")]').first();
    await done.click();
    await expect(task).toHaveClass(/done|completed|checked/);
    await page.reload();
    await waitForRoutine(page);
    await expect(page.locator('.task').first()).toHaveClass(/done|completed|checked/);
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
  test('não há overflow horizontal na home', async ({ page }) => {
    await blockRemoteData(page);
    await page.goto('/index.html');
    await waitForRoutine(page);
    await expectNoHorizontalOverflow(page);
  });

  test('botões de tarefa possuem área de toque utilizável', async ({ page }) => {
    const button = page.locator('.mark-done').first();
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.min(box.width, box.height), 'controle de toque não deve ser minúsculo').toBeGreaterThanOrEqual(32);
  });
});

test.describe('áreas administrativas', () => {
  for (const path of ['/adultos.html', '/historico.html']) {
    test(`${path} carrega sem overflow e sem violações axe graves`, async ({ page }) => {
      await blockRemoteData(page);
      await page.goto(path);
      await expect(page.locator('main')).toBeVisible();
      await expectNoHorizontalOverflow(page);
      const results = await new AxeBuilder({ page }).analyze();
      const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact));
      expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
    });
  }
});
