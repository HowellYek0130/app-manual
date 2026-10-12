import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, rename, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseSource, parseDate, normalizeText, reconcileSource, recordSourceError, assertSafeUrl } from '../scripts/tracking-core.mjs';
import { validateBundle, validateProject, discoverProductFolders } from '../scripts/validate.mjs';
import { fetchSource, trackProducts, persistGenerated } from '../scripts/track.mjs';

const source = { id: 'releases', title: 'Release notes', url: 'https://example.com/releases', kind: 'release-notes' };
const articleSource = { id: 'settings', title: 'Settings', url: 'https://example.com/settings', kind: 'article' };
const now = '2026-10-12T01:17:00.000Z';
const later = '2026-10-12T13:17:00.000Z';
const releaseBody = (description = 'Projects can now organize your files and conversations in a dedicated space.') => `<html><title>Release notes</title><nav><a>Navigation timestamp ${Math.random()}</a></nav><main><h1>Release notes</h1><h2>October 10, 2026</h2><h3>Projects update</h3><p>${description}</p><h2>October 8, 2026</h2><p>Search conversations from the sidebar and navigate to matching chat messages.</p></main><footer>Dynamic footer</footer></html>`;
const articleBody = '<html><h1>Settings guide</h1><article><p>Open Settings from your account menu. Configure the application appearance, notifications, privacy and profile options. Review each option before saving your changes.</p></article></html>';
const emptyTracking = () => ({ sources: {}, reviewControlIds: [] });
function fixture(id = 'sample') {
  const guide = { purpose: '用途', steps: ['进入设置'], outcome: '设置打开', conditions: '个人套餐', troubleshooting: '重新打开', sourceIds: ['releases', 'settings'], evidence: 'documented', verifiedAt: '2026-10-12', keywords: ['projects'] };
  const product = { id, name: 'Sample', plan: 'Plus', platform: 'Windows', versionLabel: 'Documented 2026-10-12', accent: '#123456', intro: 'Sample product', initialScreen: 'home', screens: [{ id: 'home', title: 'Home', section: 'Chat', layout: 'chat', description: 'Chat', controls: [{ id: 'open-projects', label: 'Projects', action: { kind: 'navigate', target: 'settings' }, guide }] }, { id: 'settings', title: 'Settings', section: 'Settings', layout: 'settings', description: 'Settings', parentId: 'home', controls: [{ id: 'back', label: 'Back', action: { kind: 'back' }, guide: { ...guide, keywords: ['settings'] } }] }], tours: [{ id: 'start', title: 'Start', description: 'Visit settings', controlIds: ['open-projects', 'back'] }], differences: [{ title: 'Settings changed', before: 'Old menu', now: 'New menu', sourceIds: ['settings'] }] };
  return { product, sources: [source, articleSource], updates: [], tracking: emptyTracking() };
}

test('normalization and dated heading extraction ignore navigation churn', () => {
  assert.equal(normalizeText(' A\u200B  B\nC '), 'A B C');
  const first = parseSource(source, releaseBody());
  const second = parseSource(source, releaseBody());
  assert.equal(first.hash, second.hash);
  assert.equal(first.entries.length, 2);
  assert.equal(first.entries[0].publishedAt, '2026-10-10');
  assert.match(first.entries[0].title, /Projects/);
  assert.equal(first.entries[1].matchText.includes('Projects'), false);
});

test('date parser never guesses relative dates and rejects impossible dates', () => {
  assert.equal(parseDate('Updated today'), null);
  assert.equal(parseDate('February 30, 2026'), null);
  assert.equal(parseDate('12 October 2026'), '2026-10-12');
  assert.equal(parseDate('Oct 7, 2026'), '2026-10-07');
  assert.equal(parseDate('Sep 28, 2026'), '2026-09-28');
  assert.equal(parseDate('28 Sept. 2026'), '2026-09-28');
  assert.equal(parseDate('Feb 30, 2026'), null);
  assert.equal(parseDate('Mon, 12 Oct 2026 01:17:00 GMT'), '2026-10-12');
});

test('release notes retain prose surrounding inline links and detect edits there', () => {
  const first = parseSource(source, releaseBody('Projects support <a href="/files">shared files</a> in a dedicated space.'));
  const second = parseSource(source, releaseBody('Projects support <a href="/files">shared files</a> in a newly expanded dedicated space.'));
  assert.match(first.entries[0].matchText, /Projects support shared files in a dedicated space/);
  assert.notEqual(first.entries[0].hash, second.entries[0].hash);
});

test('official h1/h3 date layouts exclude feedback and month navigation from revision hashes', () => {
  const openaiBody = `<main><h1>Release notes</h1><h1>October 9, 2026</h1><h2>Composer predictions</h2><p>Review a suggested message before sending it from the composer.</p><h1>October 7, 2026</h1><h2>A new model</h2><p>The model picker provides the choices available to your plan.</p><button>Helpful? 100</button><div class="article-feedback">Feedback count 10</div><header>Visitor 123</header></main>`;
  const openaiFirst = parseSource(source, openaiBody);
  const openaiSecond = parseSource(source, openaiBody.replace('100', '101').replace('count 10', 'count 11').replace('Visitor 123', 'Visitor 124'));
  assert.equal(openaiFirst.entries.length, 2);
  assert.equal(openaiFirst.hash, openaiSecond.hash);
  const claudeBody = '<article><h2>October 2026</h2><h3>October 7, 2026</h3><p><strong>A new model</strong></p><p>Choose an available model before starting your conversation.</p><h2>September 2026</h2><h3>September 28, 2026</h3><p><strong>Projects update</strong></p><p>Organize files and conversations in a project workspace.</p></article>';
  const claudeFirst = parseSource(source, claudeBody);
  const claudeSecond = parseSource(source, claudeBody.replace('<h2>September 2026</h2>', ''));
  assert.equal(claudeFirst.entries.length, 2);
  assert.match(claudeFirst.entries[0].title, /A new model/);
  assert.equal(claudeFirst.hash, claudeSecond.hash);
});

test('first successful baseline records hashes without adding historical news or stale guides', () => {
  const { product } = fixture();
  const result = reconcileSource({ product, source, parsed: parseSource(source, releaseBody()), tracking: emptyTracking(), updates: [], detectedAt: now });
  assert.deepEqual(result.tracking.reviewControlIds, []);
  assert.deepEqual(result.updates, []);
  assert.equal(result.addedCount, 0);
  assert.equal(result.tracking.sources.releases.entries.length, 2);
  assert.equal(JSON.stringify(result.tracking).includes('dedicated space'), false);
  assert.equal(JSON.stringify(result.tracking).includes('matchText'), false);
});

test('baseline preserves curated news and existing review work after initial source failures', () => {
  const { product } = fixture();
  const curated = { id: 'curated-release', sourceId: 'releases', title: 'A curated release', url: source.url, publishedAt: '2026-10-10', detectedAt: now, type: 'baseline', controlIds: ['open-projects'], interpretation: 'reviewed', summaryZh: '经过整理的功能说明。' };
  const failed = recordSourceError({ ...emptyTracking(), reviewControlIds: ['back'] }, 'releases', new Error('HTTP 503'), now);
  const result = reconcileSource({ product, source, parsed: parseSource(source, releaseBody()), tracking: failed, updates: [curated], detectedAt: later });
  assert.equal(result.baseline, true);
  assert.equal(result.addedCount, 0);
  assert.deepEqual(result.updates, [curated]);
  assert.deepEqual(result.tracking.reviewControlIds, ['back']);
});

test('Learn changelog time cards preserve distinct same-day releases and detect title/body edits', () => {
  const card = (id, title, body) => `<li id="${id}"><div><time>2026-10-08</time><h3>${title}<button aria-label="Copy link">Copy</button></h3></div><article><p>${body}</p></article></li>`;
  const body = `<main><h1>Changelog</h1><h2>October 2026</h2><ul>${card('release-a', 'Projects update', 'Projects can organize your files and conversations with shared instructions in a dedicated workspace.')}${card('release-b', 'Composer update', 'The composer lets you review a suggested message before sending it to a new conversation.')}</ul></main>`;
  const parsed = parseSource(source, body);
  assert.equal(parsed.entries.length, 2);
  assert.equal(new Set(parsed.entries.map(item => item.id)).size, 2);
  assert.ok(parsed.entries.every(item => item.publishedAt === '2026-10-08'));
  const { product } = fixture();
  const baseline = reconcileSource({ product, source, parsed, tracking: emptyTracking(), updates: [], detectedAt: now });
  assert.deepEqual(baseline.updates, []);
  const revised = parseSource(source, body.replace('Projects update', 'Improved Projects').replace('shared instructions', 'updated shared instructions'));
  assert.deepEqual(revised.entries.map(item => item.id).sort(), parsed.entries.map(item => item.id).sort());
  const changed = reconcileSource({ product, source, parsed: revised, ...baseline, detectedAt: later });
  assert.equal(changed.addedCount, 1);
  assert.equal(changed.updates[0].type, 'edited');
  assert.equal(changed.updates[0].publishedAt, '2026-10-08');
  assert.deepEqual(changed.updates[0].controlIds, ['open-projects']);
});

test('repeated runs deduplicate; edits to an old dated heading retain publication date', () => {
  const { product } = fixture();
  const baseline = reconcileSource({ product, source, parsed: parseSource(source, releaseBody()), tracking: emptyTracking(), updates: [], detectedAt: now });
  const repeated = reconcileSource({ product, source, parsed: parseSource(source, releaseBody()), ...baseline, detectedAt: later });
  assert.equal(repeated.addedCount, 0);
  assert.equal(repeated.updates.length, 0);
  const edited = reconcileSource({ product, source, parsed: parseSource(source, releaseBody('Projects have expanded access to shared instructions and file organization.')), ...repeated, detectedAt: later });
  const update = edited.updates.find((item) => item.type === 'edited');
  assert.equal(update.publishedAt, '2026-10-10');
  assert.equal(update.detectedAt, later);
  assert.deepEqual(update.controlIds, ['open-projects']);
  assert.deepEqual(edited.tracking.reviewControlIds, ['open-projects']);
  const final = reconcileSource({ product, source, parsed: parseSource(source, releaseBody('Projects have expanded access to shared instructions and file organization.')), ...edited, detectedAt: later });
  assert.equal(final.addedCount, 0);
});

test('new unrelated news enters pending queue without false matching', () => {
  const { product } = fixture();
  const baseline = reconcileSource({ product, source, parsed: parseSource(source, releaseBody()), tracking: emptyTracking(), updates: [], detectedAt: now });
  const body = releaseBody().replace('<h1>Release notes</h1>', '<h1>Release notes</h1><h2>October 12, 2026</h2><h3>A new capability</h3><p>A completely different capability is now available on the personal subscription.</p>');
  const result = reconcileSource({ product, source, parsed: parseSource(source, body), ...baseline, detectedAt: later });
  const update = result.updates.find((item) => item.type === 'new');
  assert.deepEqual(update.controlIds, []);
  assert.equal(update.interpretation, 'pending');
});

test('article changes mark every dependent guide, while incidental HTML changes do not', () => {
  const { product } = fixture();
  const first = parseSource(articleSource, articleBody);
  const second = parseSource(articleSource, articleBody.replace('<article>', '<article class="v2">').replace('</article>', '<button>Helpful?</button></article>'));
  assert.equal(first.hash, second.hash);
  const baseline = reconcileSource({ product, source: articleSource, parsed: first, tracking: emptyTracking(), updates: [], detectedAt: now });
  const result = reconcileSource({ product, source: articleSource, parsed: parseSource(articleSource, articleBody.replace('appearance', 'appearance and language')), ...baseline, detectedAt: later });
  assert.deepEqual(result.tracking.reviewControlIds, ['back', 'open-projects']);
});

test('blocked, missing selector, empty or malformed sources never become deletion snapshots', () => {
  for (const body of ['', '<html><title>Just a moment...</title></html>', '<main><p>Empty</p></main>', '<main><h2>October 12, 2026</h2></main>']) assert.throws(() => parseSource(source, body));
  assert.throws(() => parseSource({ ...articleSource, selector: '.missing' }, articleBody), /selector/);
  assert.throws(() => parseSource({ ...source, kind: 'rss' }, '<rss><channel><item>'), /malformed/);
  const tracking = { sources: { releases: { hash: 'a'.repeat(64), entries: [], status: 'ok', lastAttemptAt: now, lastSuccessAt: now } }, reviewControlIds: ['open-projects'] };
  const failure = recordSourceError(tracking, 'releases', new Error('HTTP 503'), later);
  assert.equal(failure.sources.releases.hash, tracking.sources.releases.hash);
  assert.equal(failure.sources.releases.lastSuccessAt, now);
  assert.equal(failure.sources.releases.lastAttemptAt, later);
  assert.deepEqual(failure.reviewControlIds, ['open-projects']);
  assert.equal(tracking.sources.releases.status, 'ok');
});

test('abnormal shrink is rejected, ordinary archiving retains old entries and uses current count', () => {
  const { product } = fixture();
  const completeBody = `<main>${Array.from({ length: 10 }, (_, index) => `<h2>October ${index + 1}, 2026</h2><p>Projects announcement ${index} has meaningful details about how to use the feature.</p>`).join('')}</main>`;
  const baseline = reconcileSource({ product, source, parsed: parseSource(source, completeBody), tracking: emptyTracking(), updates: [], detectedAt: now });
  const oneBody = '<main><h2>October 10, 2026</h2><p>Projects announcement 9 has meaningful details about how to use the feature.</p></main>';
  assert.throws(() => reconcileSource({ product, source, parsed: parseSource(source, oneBody), ...baseline, detectedAt: later }), /shrank/);
  const archivedBody = `<main>${Array.from({ length: 5 }, (_, index) => `<h2>October ${index + 6}, 2026</h2><p>Projects announcement ${index + 5} has meaningful details about how to use the feature.</p>`).join('')}</main>`;
  const archived = reconcileSource({ product, source, parsed: parseSource(source, archivedBody), ...baseline, detectedAt: later });
  assert.equal(archived.tracking.sources.releases.entries.length, 10);
  assert.equal(archived.tracking.sources.releases.lastEntryCount, 5);
  assert.equal(archived.addedCount, 0);
});

test('RSS and Atom parse dates/links, deduplicate stable GUIDs and filter keywords', () => {
  const rss = '<rss version="2.0"><channel><title>News</title><item><guid>one</guid><title>Claude adds projects</title><link>https://example.com/one</link><pubDate>Mon, 12 Oct 2026 01:17:00 GMT</pubDate><description>Organize conversations</description></item><item><guid>one</guid><title>Claude adds projects</title><link>https://example.com/one</link><pubDate>Mon, 12 Oct 2026 01:17:00 GMT</pubDate><description>Organize conversations</description></item><item><guid>two</guid><title>Other product news</title><link>https://example.com/two</link></item></channel></rss>';
  const parsed = parseSource({ ...source, kind: 'rss', keywords: ['claude'] }, rss);
  assert.equal(parsed.entries.length, 1);
  assert.equal(parsed.entries[0].publishedAt, '2026-10-12');
  const atom = '<feed xmlns="http://www.w3.org/2005/Atom"><title>News</title><entry><id>one</id><title>New feature</title><link href="https://example.com/one"/><published>2026-10-12T01:17:00Z</published><summary>Feature details</summary></entry></feed>';
  assert.equal(parseSource({ ...source, kind: 'rss' }, atom).entries[0].url, 'https://example.com/one');
  const emptyFilter = parseSource({ ...source, kind: 'rss', keywords: ['unmatched'] }, rss);
  assert.deepEqual(emptyFilter.entries, []);
});

test('announcement links are keyword-filtered and reject navigation/external links', () => {
  const body = '<main><h1>News</h1><article><a href="/news/claude"><h2>Claude adds new work tools</h2></a><time datetime="2026-10-12">October 12, 2026</time></article><article><a href="/news/research"><h2>A research update from the lab</h2></a></article><a href="https://other.example.com/story">An external news story</a><a href="/privacy">Read the Claude privacy policy</a><header><a href="/help"><h2>Learn how Claude works</h2></a></header></main>';
  const parsed = parseSource({ ...source, kind: 'announcements', keywords: ['claude'] }, body);
  assert.equal(parsed.entries.length, 1);
  assert.equal(parsed.entries[0].url, 'https://example.com/news/claude');
  assert.equal(parsed.entries[0].publishedAt, '2026-10-12');
});

test('announcement cards keep their own title, date, keywords and revision within a page-wide article', () => {
  const body = '<main><article><h1>Newsroom</h1><a href="/news/claude"><h4>Claude adds new work tools</h4><time>Oct 7, 2026</time><p>Claude can organize your work into projects and tasks.</p></a><a href="/news/research"><h4>A new research initiative</h4><time>Sep 28, 2026</time><p>A separate initiative about scientific collaboration.</p></a><ul><li><a href="/news/cowork"><span class="PublicationList__category">Product</span><time>Sep 16, 2026</time><span class="PublicationList__title">Cowork comes to every conversation</span></a></li></ul><a href="/privacy">Read the Claude privacy policy</a></article></main>';
  const announcementSource = { ...source, kind: 'announcements', selector: 'main', keywords: ['Claude', 'Cowork'] };
  const parsed = parseSource(announcementSource, body);
  assert.equal(parsed.entries.length, 2);
  assert.deepEqual(parsed.entries.map(item => item.title).sort(), ['Claude adds new work tools', 'Cowork comes to every conversation']);
  assert.deepEqual(parsed.entries.map(item => item.publishedAt).sort(), ['2026-09-16', '2026-10-07']);
  const unrelatedEdit = parseSource(announcementSource, body.replace('scientific collaboration', 'expanded scientific collaboration'));
  assert.equal(unrelatedEdit.hash, parsed.hash);
  const revision = parseSource(announcementSource, body.replace('projects and tasks', 'projects and recurring tasks'));
  assert.equal(revision.entries.filter((item, index) => item.hash !== parsed.entries[index].hash).length, 1);
});

test('validation rejects broken control, tour, source and tracking references', () => {
  const bundle = fixture();
  assert.deepEqual(validateBundle(bundle, 'sample'), []);
  bundle.product.screens[0].controls[0].action.target = 'missing';
  bundle.product.screens[0].controls[0].guide.sourceIds = ['missing-source'];
  bundle.product.tours[0].controlIds.push('missing-control');
  bundle.tracking.reviewControlIds.push('missing-control');
  const errors = validateBundle(bundle, 'sample');
  assert.ok(errors.some((error) => error.includes('target')));
  assert.ok(errors.some((error) => error.includes('missing-source')));
  assert.ok(errors.some((error) => error.includes('tour')));
  assert.ok(errors.some((error) => error.includes('tracking.reviewControlIds')));
});

test('reviewed updates require a Chinese interpretation before publishing', () => {
  const bundle = fixture();
  bundle.updates.push({ id: 'reviewed-update', sourceId: 'releases', title: 'Projects update', url: source.url, publishedAt: '2026-10-10', detectedAt: now, type: 'new', controlIds: ['open-projects'], interpretation: 'reviewed' });
  assert.ok(validateBundle(bundle, 'sample').some((error) => error.includes('Reviewed update.summaryZh')));
  bundle.updates[0].summaryZh = '现在可以按项目整理文件和对话。';
  assert.deepEqual(validateBundle(bundle, 'sample'), []);
});

test('fetch retries errors and verifies redirect targets before making a request', async () => {
  let requests = 0;
  const content = await fetchSource(source.url, { attempts: 2, retryDelayMs: 1, fetchImpl: async () => { requests++; return requests === 1 ? new Response('', { status: 503 }) : new Response('Good content', { headers: { 'content-type': 'text/html' } }); } });
  assert.equal(content, 'Good content');
  assert.equal(requests, 2);
  requests = 0;
  await assert.rejects(fetchSource(source.url, { attempts: 1, fetchImpl: async () => { requests++; return new Response('', { status: 302, headers: { location: 'http://127.0.0.1/admin' } }); } }), /HTTPS/);
  assert.equal(requests, 1);
  for (const url of ['file:///tmp/page', 'http://example.com', 'https://127.0.0.1', 'https://localhost', 'https://10.0.0.1', 'https://user:pass@example.com', 'https://example.com:8080']) assert.throws(() => assertSafeUrl(url));
});

test('atomic persistence retries transient locks without altering the old file and cleans up failures', async () => {
  const temporaryParent = path.resolve('.cache', 'tracking-tests');
  await mkdir(temporaryParent, { recursive: true });
  const root = await mkdtemp(path.join(temporaryParent, 'persistence-test-'));
  const filename = path.join(root, 'snapshot.json');
  try {
    const original = '{"lastGood":true}\n';
    await writeFile(filename, original);
    let calls = 0;
    const waits = [];
    await persistGenerated([{ filename, data: { updated: true } }], {
      renameImpl: async (temporary, destination) => {
        calls++;
        if (calls <= 3) {
          assert.equal(await readFile(destination, 'utf8'), original);
          throw Object.assign(new Error('Transient file lock'), { code: ['EPERM', 'EACCES', 'EBUSY'][calls - 1] });
        }
        await rename(temporary, destination);
      },
      delayImpl: async (milliseconds) => { waits.push(milliseconds); },
    });
    assert.equal(calls, 4);
    assert.equal(waits.length, 3);
    assert.deepEqual(JSON.parse(await readFile(filename, 'utf8')), { updated: true });
    assert.deepEqual(await readdir(root), ['snapshot.json']);
    const updated = await readFile(filename, 'utf8');
    calls = 0;
    await assert.rejects(persistGenerated([{ filename, data: { shouldNotReplace: true } }], {
      renameAttempts: 3,
      renameImpl: async () => { calls++; throw Object.assign(new Error('Persistent file lock'), { code: 'EPERM' }); },
      delayImpl: async () => {},
    }), /Persistent file lock/);
    assert.equal(calls, 3);
    assert.equal(await readFile(filename, 'utf8'), updated);
    assert.deepEqual(await readdir(root), ['snapshot.json']);
    calls = 0;
    await assert.rejects(persistGenerated([{ filename, data: {} }], {
      renameImpl: async () => { calls++; throw Object.assign(new Error('Invalid rename'), { code: 'EINVAL' }); },
      delayImpl: async () => { assert.fail('Permanent errors must not be retried'); },
    }), /Invalid rename/);
    assert.equal(calls, 1);
    assert.equal(await readFile(filename, 'utf8'), updated);
    assert.deepEqual(await readdir(root), ['snapshot.json']);
  } finally {
    assert.ok(path.resolve(root).startsWith(temporaryParent + path.sep));
    await rm(root, { recursive: true, force: true });
  }
});

test('new folders are discovered automatically, dry-run does not write, failures preserve persisted last-good data', async () => {
  const temporaryParent = path.resolve('.cache', 'tracking-tests');
  await mkdir(temporaryParent, { recursive: true });
  const root = await mkdtemp(path.join(temporaryParent, 'app-manual-test-'));
  const parserUrl = pathToFileURL(path.resolve('scripts/tracking-core.mjs')).href;
  try {
    for (const id of ['first', 'new-product']) {
      const directory = path.join(root, 'products', id);
      await mkdir(directory, { recursive: true });
      const bundle = fixture(id);
      for (const filename of ['product', 'sources', 'updates', 'tracking']) await writeFile(path.join(directory, `${filename}.json`), JSON.stringify(bundle[filename]));
      await writeFile(path.join(directory, 'collector.mjs'), `export { parseSource } from ${JSON.stringify(parserUrl)};`);
    }
    assert.deepEqual((await discoverProductFolders(root)).map((item) => item.id), ['first', 'new-product']);
    assert.deepEqual((await validateProject(root)).errors, []);
    const trackingFile = path.join(root, 'products', 'first', 'tracking.json');
    const before = await readFile(trackingFile, 'utf8');
    const fetchImpl = async (url) => new Response(url.endsWith('releases') ? releaseBody() : articleBody, { headers: { 'content-type': 'text/html' } });
    const dry = await trackProducts({ root, dryRun: true, fetchImpl, now, logger: () => {} });
    assert.equal(dry.results.length, 4);
    assert.equal(await readFile(trackingFile, 'utf8'), before);
    await trackProducts({ root, productId: 'first', fetchImpl, now, logger: () => {} });
    const good = JSON.parse(await readFile(trackingFile, 'utf8'));
    await trackProducts({ root, productId: 'first', fetchImpl: async () => { throw new Error('Connection unavailable'); }, now: later, fetchOptions: { attempts: 1 }, logger: () => {} });
    const failed = JSON.parse(await readFile(trackingFile, 'utf8'));
    assert.equal(failed.sources.releases.status, 'error');
    assert.equal(failed.sources.releases.hash, good.sources.releases.hash);
    assert.deepEqual(failed.sources.releases.entries, good.sources.releases.entries);
    assert.equal(failed.sources.releases.lastSuccessAt, now);
    assert.equal(failed.sources.releases.lastAttemptAt, later);
    await assert.rejects(trackProducts({ root, productId: '../escape', logger: () => {} }), /Unknown product/);
  } finally {
    assert.ok(path.resolve(root).startsWith(temporaryParent + path.sep));
    await rm(root, { recursive: true, force: true });
  }
});
