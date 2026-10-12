import { test, expect, type Page } from '@playwright/test';
import { readFileSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { Control, Product, Screen, UpdateEntry } from '../src/types';

const read = <T>(file: string): T => JSON.parse(readFileSync(path.resolve(file), 'utf8'));
const products = ['chatgpt', 'claude'].map(id => read<Product>(`products/${id}/product.json`));
const productFolderCount = readdirSync(path.resolve('products'), { withFileTypes: true })
  .filter(folder => folder.isDirectory() && !folder.name.startsWith('.')).length;
const product = (id: string) => products.find(p => p.id === id)!;
const pageErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
});
test.afterEach(({ page }) => {
  expect(pageErrors.get(page) || [], 'Manual browsing must not throw a browser runtime error').toEqual([]);
});
const findControl = (p: Product, id: string): { screen: Screen; control: Control } => {
  for (const screen of p.screens) {
    const control = screen.controls.find(c => c.id === id);
    if (control) return { screen, control };
  }
  throw new Error(`Missing journey control ${p.id}/${id}`);
};
const hash = (p: Product, screen: string, control?: string) =>
  `#/products/${p.id}/guide/${screen}${control ? `?control=${control}` : ''}`;

async function openProduct(page: Page, p: Product) {
  await page.goto('/');
  await page.locator('.manual-book').filter({ has: page.getByRole('heading', { name: `${p.name} ${p.plan}`, exact: true }) }).click();
  await expect(page).toHaveURL(new RegExp(`/products/${p.id}/guide/${p.initialScreen}$`));
  await expect(page.locator('.product-heading h1')).toHaveText(p.name);
}

async function activate(page: Page, p: Product, id: string) {
  const { screen, control } = findControl(p, id);
  await page.getByTestId(`control-${id}`).click();
  const target = control.action.kind === 'navigate'
    ? control.action.target!
    : control.action.kind === 'back'
      ? control.action.target || screen.parentId || p.initialScreen
      : new URL(page.url()).hash.split('?')[0].split('/').at(-1)!;
  await expect(page).toHaveURL(new RegExp(`/products/${p.id}/guide/${target}\\?control=${id}$`));
  await expect(page.getByRole('complementary', { name: '操作说明' }).getByRole('heading', { name: control.label, exact: true })).toBeVisible();
  await expect(page.locator('.guide-purpose')).toHaveText(control.guide.purpose);
  const targetScreen = p.screens.find(s => s.id === target)!;
  await expect(page.locator('.screen-heading h2')).toHaveText(targetScreen.title);
}

async function screenshot(page: Page, name: string) {
  mkdirSync(path.resolve('output/qa'), { recursive: true });
  await page.screenshot({ path: path.resolve(`output/qa/${name}.png`), fullPage: true });
}

test('library opens both manuals and displays evidence-aware explanations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '选择一本说明书' })).toBeVisible();
  await expect(page.locator('.manual-book')).toHaveCount(productFolderCount);
  await screenshot(page, 'library-desktop');
  for (const p of products) {
    await openProduct(page, p);
    await activate(page, p, `${p.id}-home-new`);
    await expect(page.getByRole('complementary', { name: '操作说明' })).toContainText('来源与核验');
    await expect(page.locator('.guide-evidence a').first()).toHaveAttribute('href', /^https:\/\//);
    await expect(page.locator('.learning-meter')).toContainText('已探索');
    await screenshot(page, `${p.id}-guide-desktop`);
  }
});

test('ChatGPT project journey opens nested creation, sources and instructions', async ({ page }) => {
  const p = product('chatgpt');
  await openProduct(page, p);
  for (const id of ['home-projects', 'projects-create', 'project-create-submit', 'project-sources', 'source-upload']) {
    await activate(page, p, `chatgpt-${id}`);
  }
  await expect(page.getByRole('status')).toContainText('演示');
  await page.getByRole('button', { name: '返回上一层界面', exact: true }).click();
  await activate(page, p, 'chatgpt-project-instructions');
  await activate(page, p, 'chatgpt-instructions-save');
  await expect(page.getByRole('status')).toBeVisible();
});

test('ChatGPT nested privacy settings preserve browser history and deep links', async ({ page }) => {
  const p = product('chatgpt');
  await openProduct(page, p);
  for (const id of ['home-settings', 'settings-personalization', 'personal-chat-memory', 'chat-memory-sources']) {
    await activate(page, p, `chatgpt-${id}`);
  }
  const deepLink = page.url();
  await page.reload();
  await expect(page.locator('.guide-control-name h2')).toHaveText(findControl(p, 'chatgpt-chat-memory-sources').control.label);
  await page.goBack();
  await expect(page).toHaveURL(new RegExp('chat-memory\\?control=chatgpt-personal-chat-memory$'));
  await page.goForward();
  await expect(page).toHaveURL(deepLink);
  await page.getByRole('button', { name: '返回上一层界面', exact: true }).click();
  await expect(page).toHaveURL(new RegExp('/personalization$'));
});

test('Claude project journey reaches knowledge, instructions and memory settings', async ({ page }) => {
  const p = product('claude');
  await openProduct(page, p);
  for (const id of ['home-projects', 'projects-open', 'project-knowledge', 'project-knowledge-add']) {
    await activate(page, p, `claude-${id}`);
  }
  await page.getByRole('button', { name: '返回上一层界面', exact: true }).click();
  await activate(page, p, 'claude-project-instructions');
  await activate(page, p, 'claude-project-instructions-save');
  await page.getByRole('button', { name: '返回上一层界面', exact: true }).click();
  await activate(page, p, 'claude-project-memory');
  await activate(page, p, 'claude-settings-memory-topics');
});

test('Claude Windows settings reach browser cookie-import demo and Escape dismisses it', async ({ page }) => {
  const p = product('claude');
  await openProduct(page, p);
  for (const id of ['home-profile', 'settings-general-desktop', 'settings-desktop-browser', 'browser-import']) {
    await activate(page, p, `claude-${id}`);
  }
  await expect(page.locator('.dialog-caption')).toContainText('按 Esc 返回');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(new RegExp('/built-in-browser$'));
  await expect(page.locator('.dialog-caption')).toHaveCount(0);
  await activate(page, p, 'claude-browser-import');
  await activate(page, p, 'claude-browser-import-firefox');
  await expect(page.getByRole('status')).toContainText('没有读取');
});

test('both coding modes reach nested review or permission screens', async ({ page }) => {
  const journeys = [
    ['chatgpt', ['home-switcher', 'switch-codex', 'codex-review', 'review-changes', 'diff-comment']],
    ['claude', ['home-code', 'code-start-start', 'code-session-browser', 'browser-permission-once']],
  ] as const;
  for (const [id, controls] of journeys) {
    const p = product(id);
    await openProduct(page, p);
    for (const suffix of controls) await activate(page, p, `${id}-${suffix}`);
    await expect(page.getByRole('status')).toBeVisible();
  }
});

test('Ctrl K search discovers a nested feature and Escape clears the results', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  const search = page.getByRole('textbox', { name: '搜索按钮和功能' });
  await expect(search).toBeFocused();
  await search.fill('Import cookies');
  const p = product('claude');
  const owner = findControl(p, 'claude-browser-import');
  await page.getByRole('region', { name: '搜索结果' }).getByRole('button', { name: `${owner.control.label} Claude / ${owner.screen.title}` }).click();
  await expect(page).toHaveURL(new RegExp('/claude/guide/built-in-browser\\?control=claude-browser-import$'));
  await expect(page.locator('.guide-control-name h2')).toHaveText(owner.control.label);
  await search.fill('Memory');
  await expect(page.getByRole('region', { name: '搜索结果' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(search).toHaveValue('');
  await expect(page.getByRole('region', { name: '搜索结果' })).toHaveCount(0);
});

for (const p of products) {
  test(`${p.name} guided tour crosses screens and can be closed`, async ({ page }) => {
    await openProduct(page, p);
    const itinerary = p.tours[0];
    await page.getByRole('combobox', { name: '选择分步引导' }).selectOption(itinerary.id);
    for (let i = 0; i < 4; i++) {
      const owner = findControl(p, itinerary.controlIds[i]);
      await expect(page.locator('.driver-popover-title')).toHaveText(owner.control.label);
      await expect(page).toHaveURL(new RegExp(`/guide/${owner.screen.id}\\?control=${owner.control.id}$`));
      await page.getByRole('button', { name: '下一步', exact: true }).click();
    }
    await expect(page.locator('.driver-popover-title')).toHaveText(findControl(p, itinerary.controlIds[4]).control.label);
    await page.getByRole('button', { name: '关闭引导', exact: true }).click();
    await expect(page.locator('.driver-popover')).toHaveCount(0);
    await expect(page.locator('.driver-overlay')).toHaveCount(0);
    await page.getByRole('button', { name: '页面目录', exact: false }).click();
    await expect(page.getByRole('region', { name: '页面目录' })).toBeVisible();
  });

  test(`${p.name} news links to feature instructions and persists read state`, async ({ page }) => {
    const update = read<UpdateEntry[]>(`products/${p.id}/updates.json`).find(u => u.controlIds.length)!;
    await page.goto(`/#/products/${p.id}/updates`);
    const article = page.locator('.update-item').filter({ has: page.getByRole('link', { name: update.title, exact: true }) });
    await article.getByRole('button', { name: '标为已读', exact: true }).click();
    await expect(article.getByRole('button', { name: '已读', exact: true })).toBeVisible();
    await page.reload();
    await expect(article.getByRole('button', { name: '已读', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '未读', exact: true }).click();
    await expect(article).toHaveCount(0);
    await page.getByRole('button', { name: '全部更新', exact: true }).click();
    const owner = findControl(p, update.controlIds[0]);
    await article.locator('.related-controls').getByRole('button', { name: owner.control.label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/guide/${owner.screen.id}\\?control=${owner.control.id}$`));
    await expect(page.locator('.guide-control-name h2')).toHaveText(owner.control.label);
    await page.reload();
    await expect(page.locator('.guide-control-name h2')).toHaveText(owner.control.label);
    await expect(page.locator('.learning-meter')).toContainText(/已探索\s+1\s*\//);
  });
}

test('toggle and demo messages work locally without a paid AI request', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', request => {
    if (['fetch', 'xhr', 'websocket'].includes(request.resourceType()) && !request.url().startsWith('http://127.0.0.1:5173')) externalRequests.push(request.url());
  });
  for (const p of products) {
    const suffix = p.id === 'chatgpt' ? 'chat-memory-enable' : 'settings-memory-toggle';
    const owner = findControl(p, `${p.id}-${suffix}`);
    await page.goto(`/${hash(p, owner.screen.id)}`);
    const toggle = page.getByTestId(`control-${owner.control.id}`);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await activate(page, p, owner.control.id);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await page.goto(`/${hash(p, p.id === 'chatgpt' ? 'chat' : 'conversation')}`);
    await page.getByRole('textbox', { name: '模拟消息' }).fill('请帮我整理今天的学习计划。');
    await page.getByRole('textbox', { name: '模拟消息' }).press('Enter');
    await expect(page.locator('.demo-user')).toHaveText('请帮我整理今天的学习计划。');
    await expect(page.locator('.demo-response')).toContainText('模拟回复');
    await expect(page.getByRole('textbox', { name: '模拟消息' })).toHaveValue('');
    await expect(page.getByRole('status')).toContainText('已演示发送');
  }
  expect(externalRequests).toEqual([]);
});

test('390px layout has no page overflow and product drawer remains usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const assertNoOverflow = async () => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  };
  await assertNoOverflow();
  await screenshot(page, 'library-mobile');
  await page.getByRole('button', { name: '打开产品目录' }).click();
  await expect(page.getByRole('navigation', { name: '产品目录' })).toBeVisible();
  await page.getByRole('navigation', { name: '产品目录' }).getByRole('button', { name: `Claude ${product('claude').plan}`, exact: true }).click();
  await expect(page.locator('.product-heading h1')).toHaveText('Claude');
  await expect(page.getByRole('button', { name: '关闭产品目录' })).toHaveCount(0);
  await activate(page, product('claude'), 'claude-home-new');
  await assertNoOverflow();
  await screenshot(page, 'claude-guide-mobile');
  await page.getByRole('button', { name: '打开产品目录' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '关闭产品目录' })).toHaveCount(0);
});
