import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { assertSafeUrl } from './tracking-core.mjs';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const idPattern = /^[a-z0-9][a-z0-9._-]*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/;
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function validateBundle(bundle, folderId = bundle?.product?.id) {
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  const string = (value, label) => check(typeof value === 'string' && value.trim().length > 0, `${label} must be a nonempty string`);
  const id = (value, label) => check(typeof value === 'string' && idPattern.test(value), `${label} must be a stable lowercase ID`);
  const date = (value, label, nullable = false) => check((nullable && value === null) || (typeof value === 'string' && datePattern.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value.slice(0, 10)), `${label} must be an ISO date${nullable ? ' or null' : ''}`);
  const url = (value, label) => { try { assertSafeUrl(value); } catch { errors.push(`${label} must be a public HTTPS URL`); } };
  const array = (value, label) => { check(Array.isArray(value), `${label} must be an array`); return Array.isArray(value) ? value : []; };
  const product = isRecord(bundle?.product) ? bundle.product : {};
  check(isRecord(bundle?.product), 'product must be an object');
  id(product.id, 'product.id');
  check(product.id === folderId, `product.id must match folder ${folderId}`);
  for (const field of ['name', 'plan', 'platform', 'versionLabel', 'accent', 'intro', 'initialScreen']) string(product[field], `product.${field}`);
  const sources = array(bundle?.sources, 'sources');
  check(sources.length > 0 && sources.length <= 50, 'A product must have 1–50 sources');
  const sourceIds = new Set();
  for (const [index, source] of sources.entries()) {
    const label = `sources[${index}]`;
    if (!isRecord(source)) { errors.push(`${label} must be an object`); continue; }
    id(source.id, `${label}.id`);
    check(!sourceIds.has(source.id), `Duplicate source ID ${source.id}`); sourceIds.add(source.id);
    string(source.title, `${label}.title`); url(source.url, `${label}.url`);
    check(['article', 'release-notes', 'rss', 'announcements'].includes(source.kind), `${label}.kind is unsupported`);
    if (source.selector !== undefined) string(source.selector, `${label}.selector`);
    if (source.keywords !== undefined) array(source.keywords, `${label}.keywords`).forEach((item) => string(item, `${label}.keywords[]`));
  }
  const referenceIds = (value, allowed, label, requireOne = false) => {
    const items = array(value, label);
    if (requireOne) check(items.length > 0, `${label} must have at least one source`);
    check(new Set(items).size === items.length, `${label} contains duplicate IDs`);
    for (const item of items) { id(item, `${label}[]`); check(allowed.has(item), `${label} references unknown ID ${item}`); }
  };
  const screens = array(product.screens, 'product.screens');
  check(screens.length > 0, 'product.screens must not be empty');
  const screenIds = new Set();
  const controlIds = new Set();
  for (const screen of screens) {
    if (!isRecord(screen)) { errors.push('Each screen must be an object'); continue; }
    id(screen.id, 'screen.id'); check(!screenIds.has(screen.id), `Duplicate screen ID ${screen.id}`); screenIds.add(screen.id);
    for (const control of Array.isArray(screen.controls) ? screen.controls : []) {
      id(control?.id, 'control.id'); check(!controlIds.has(control?.id), `Duplicate control ID ${control?.id}`); controlIds.add(control?.id);
    }
  }
  check(screenIds.has(product.initialScreen), 'product.initialScreen references an unknown screen');
  for (const screen of screens.filter(isRecord)) {
    for (const field of ['title', 'section', 'description']) string(screen[field], `screen.${screen.id}.${field}`);
    check(['chat', 'settings', 'workspace', 'dialog', 'list', 'detail'].includes(screen.layout), `screen.${screen.id}.layout is unsupported`);
    if (screen.parentId !== undefined) check(screenIds.has(screen.parentId) && screen.parentId !== screen.id, `screen.${screen.id}.parentId is invalid`);
    // Parent relationships must be acyclic so browser fallback/back always has an exit.
    const visited = new Set([screen.id]);
    let parent = screen.parentId;
    while (parent) {
      if (visited.has(parent)) { errors.push(`screen.${screen.id} has a cyclic parent path`); break; }
      visited.add(parent); parent = screens.find((candidate) => candidate?.id === parent)?.parentId;
    }
    for (const control of array(screen.controls, `screen.${screen.id}.controls`)) {
      if (!isRecord(control)) { errors.push('Each control must be an object'); continue; }
      const label = `control.${control.id}`;
      string(control.label, `${label}.label`);
      if (control.icon !== undefined) string(control.icon, `${label}.icon`);
      if (control.placement !== undefined) check(['sidebar', 'toolbar', 'composer', 'content', 'tab'].includes(control.placement), `${label}.placement is unsupported`);
      const action = isRecord(control.action) ? control.action : {};
      check(isRecord(control.action), `${label}.action must be an object`);
      check(['navigate', 'notice', 'toggle', 'submit', 'back'].includes(action.kind), `${label}.action.kind is unsupported`);
      if (action.kind === 'navigate') check(screenIds.has(action.target), `${label}.action.target references an unknown screen`);
      if (['notice', 'toggle', 'submit'].includes(action.kind)) string(action.result, `${label}.action.result`);
      const guide = isRecord(control.guide) ? control.guide : {};
      check(isRecord(control.guide), `${label}.guide must be an object`);
      for (const field of ['purpose', 'outcome', 'conditions', 'troubleshooting']) string(guide[field], `${label}.guide.${field}`);
      const steps = array(guide.steps, `${label}.guide.steps`); check(steps.length > 0, `${label}.guide.steps must not be empty`); steps.forEach((step) => string(step, `${label}.guide.steps[]`));
      referenceIds(guide.sourceIds, sourceIds, `${label}.guide.sourceIds`, true);
      check(['documented', 'ui-verified', 'needs-review'].includes(guide.evidence), `${label}.guide.evidence is unsupported`);
      date(guide.verifiedAt, `${label}.guide.verifiedAt`);
      if (guide.keywords !== undefined) array(guide.keywords, `${label}.guide.keywords`).forEach((keyword) => string(keyword, `${label}.guide.keywords[]`));
    }
  }
  const tourIds = new Set();
  for (const tour of array(product.tours, 'product.tours')) {
    if (!isRecord(tour)) { errors.push('Each tour must be an object'); continue; }
    id(tour.id, 'tour.id'); check(!tourIds.has(tour.id), `Duplicate tour ID ${tour.id}`); tourIds.add(tour.id);
    string(tour.title, 'tour.title'); string(tour.description, 'tour.description');
    referenceIds(tour.controlIds, controlIds, 'tour.controlIds'); check(tour.controlIds?.length > 0, 'tour.controlIds must not be empty');
  }
  for (const difference of array(product.differences, 'product.differences')) {
    if (!isRecord(difference)) { errors.push('Each difference must be an object'); continue; }
    for (const field of ['title', 'before', 'now']) string(difference[field], `difference.${field}`);
    referenceIds(difference.sourceIds, sourceIds, 'difference.sourceIds', true);
  }
  const updateIds = new Set();
  for (const update of array(bundle?.updates, 'updates')) {
    if (!isRecord(update)) { errors.push('Each update must be an object'); continue; }
    id(update.id, 'update.id'); check(!updateIds.has(update.id), `Duplicate update ID ${update.id}`); updateIds.add(update.id);
    check(sourceIds.has(update.sourceId), `update.${update.id}.sourceId references an unknown source`);
    string(update.title, 'update.title'); url(update.url, 'update.url');
    date(update.publishedAt, 'update.publishedAt', true); date(update.detectedAt, 'update.detectedAt');
    check(['new', 'edited', 'documentation', 'baseline'].includes(update.type), 'update.type is unsupported');
    check(['pending', 'reviewed'].includes(update.interpretation), 'update.interpretation is unsupported');
    if (update.summaryZh !== undefined) string(update.summaryZh, 'update.summaryZh');
    if (update.interpretation === 'reviewed') string(update.summaryZh, 'Reviewed update.summaryZh');
    referenceIds(update.controlIds, controlIds, 'update.controlIds');
  }
  const tracking = isRecord(bundle?.tracking) ? bundle.tracking : {};
  check(isRecord(bundle?.tracking), 'tracking must be an object');
  check(isRecord(tracking.sources), 'tracking.sources must be an object');
  referenceIds(tracking.reviewControlIds, controlIds, 'tracking.reviewControlIds');
  for (const [sourceId, state] of Object.entries(isRecord(tracking.sources) ? tracking.sources : {})) {
    check(sourceIds.has(sourceId), `tracking.sources references unknown source ${sourceId}`);
    if (!isRecord(state)) { errors.push(`tracking.sources.${sourceId} must be an object`); continue; }
    check(['ok', 'error', 'pending'].includes(state.status), `tracking.${sourceId}.status is unsupported`);
    date(state.lastAttemptAt, `tracking.${sourceId}.lastAttemptAt`, true); date(state.lastSuccessAt, `tracking.${sourceId}.lastSuccessAt`, true);
    if (state.status === 'error') string(state.error, `tracking.${sourceId}.error`);
    if (state.status === 'ok') check(state.lastSuccessAt !== null && typeof state.hash === 'string', `tracking.${sourceId} successful state needs lastSuccessAt and hash`);
    if (state.hash !== undefined) check(typeof state.hash === 'string' && /^[a-f0-9]{64}$/.test(state.hash), `tracking.${sourceId}.hash is invalid`);
    if (state.lastEntryCount !== undefined) check(Number.isInteger(state.lastEntryCount) && state.lastEntryCount >= 0, `tracking.${sourceId}.lastEntryCount is invalid`);
    const entryIds = new Set();
    for (const item of state.entries === undefined ? [] : array(state.entries, `tracking.${sourceId}.entries`)) {
      if (!isRecord(item)) { errors.push('Tracking entries must be objects'); continue; }
      id(item.id, 'tracking.entry.id'); check(!entryIds.has(item.id), 'Duplicate tracking entry ID'); entryIds.add(item.id);
      string(item.title, 'tracking.entry.title'); url(item.url, 'tracking.entry.url'); date(item.publishedAt, 'tracking.entry.publishedAt', true);
      check(typeof item.hash === 'string' && /^[a-f0-9]{64}$/.test(item.hash), 'tracking.entry.hash is invalid');
      check(Object.keys(item).every((key) => ['id', 'title', 'publishedAt', 'hash', 'url'].includes(key)), 'Tracking entries must contain metadata only, no full source content');
    }
  }
  return errors;
}

export async function discoverProductFolders(root = projectRoot) {
  const directory = path.join(root, 'products');
  const folders = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const folder of folders.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!folder.isDirectory() || folder.name.startsWith('.')) continue;
    if (!idPattern.test(folder.name)) throw new Error(`Invalid product folder ID: ${folder.name}`);
    result.push({ id: folder.name, directory: path.join(directory, folder.name) });
  }
  if (!result.length) throw new Error('No products found under products/');
  return result;
}

export async function loadProductBundle(directory) {
  const [product, sources, updates, tracking] = await Promise.all(['product', 'sources', 'updates', 'tracking'].map(async (filename) => JSON.parse(await readFile(path.join(directory, `${filename}.json`), 'utf8'))));
  return { product, sources, updates, tracking };
}

export async function validateProject(root = projectRoot) {
  const folders = await discoverProductFolders(root);
  const errors = [];
  const bundles = [];
  for (const folder of folders) {
    try {
      const bundle = await loadProductBundle(folder.directory);
      errors.push(...validateBundle(bundle, folder.id).map((error) => `${folder.id}: ${error}`));
      checkCollector: {
        const info = await stat(path.join(folder.directory, 'collector.mjs'));
        if (!info.isFile()) { errors.push(`${folder.id}: collector.mjs must be a file`); break checkCollector; }
        const collector = await import(pathToFileURL(path.join(folder.directory, 'collector.mjs')).href);
        if (typeof collector.parseSource !== 'function') errors.push(`${folder.id}: collector.mjs must export parseSource(source, body)`);
      }
      bundles.push({ ...folder, bundle });
    } catch (error) { errors.push(`${folder.id}: ${error.message}`); }
  }
  return { errors, bundles };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { errors, bundles } = await validateProject();
    if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
    else console.log(`Validated ${bundles.length} product folders, ${bundles.reduce((count, { bundle }) => count + bundle.product.screens.length, 0)} screens and all source/control references.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
