const { test, expect } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

async function blockRemoteData(page){
  await page.route('https://script.google.com/**', route => route.abort());
}

async function expectNoHorizontalOverflow(page){
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow, 'página deve caber na largura da viewport').toBe(false);
}

test.describe('rotina do dia', () => {
  test.beforeEach(async ({ page }) => {
    await blockRemoteData(page);
    await page.goto('/index.html');
    await expect(page.locator('#periods')).toBeVisible();
  });

  test('renderiza uma rotina utilizável sem overflow', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Rotina do Pacus/i })).toBeVisible();
    await expect(page.locator('.period')).toHaveCount(3);
    await expectNoHorizontalOverflow(page);
  });

  test('controles de tarefa têm nome acessível e podem receber foco', async ({ page }) => {
    const done = page.locator('.mark-done').first();
    await expect(done).toBeVisible();
    await expect(done).toHaveAttribute('aria-label', /Marcar como concluída/i);
    await done.focus();
    await expect(done).toBeFocused();
  });

  test('concluir uma tarefa altera o estado visual', async ({ page }) => {
    const done = page.locator('.mark-done').first();
    const task = done.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " task ")]').first();
    await done.click();
    await expect(task).toHaveClass(/done|completed|checked/);
  });

  test('não há violações axe graves ou críticas na home', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
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
