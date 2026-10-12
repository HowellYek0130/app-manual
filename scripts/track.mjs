import { writeFile, rename, rm, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { assertSafeUrl, recordSourceError, reconcileSource } from './tracking-core.mjs';
import { projectRoot, validateProject, validateBundle } from './validate.mjs';

const maxBytes = 8 * 1024 * 1024;

export async function fetchSource(url, { fetchImpl = fetch, timeoutMs = 25000, attempts = 3, retryDelayMs = 1000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      let target = assertSafeUrl(url);
      const signal = AbortSignal.timeout(timeoutMs);
      for (let redirects = 0; redirects <= 5; redirects++) {
        const response = await fetchImpl(target, { redirect: 'manual', signal, headers: { 'User-Agent': 'AppManual/1.0 (public documentation change monitor; no authentication)', Accept: 'text/html, application/rss+xml, application/atom+xml, application/xml;q=0.9' } });
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          const location = response.headers.get('location');
          if (!location || redirects === 5) throw new Error('Source redirect loop/limit');
          target = assertSafeUrl(new URL(location, target).href);
          await response.body?.cancel();
          continue;
        }
        if (!response.ok) { await response.body?.cancel(); throw new Error(`HTTP ${response.status}`); }
        if (Number(response.headers.get('content-length')) > maxBytes) { await response.body?.cancel(); throw new Error('Source exceeds 8 MiB limit'); }
        const type = response.headers.get('content-type') ?? '';
        if (type && !/(?:html|xml|text\/plain|json)/i.test(type)) { await response.body?.cancel(); throw new Error(`Unsupported source content type: ${type}`); }
        const chunks = [];
        let bytes = 0;
        for await (const chunk of response.body ?? []) {
          bytes += chunk.byteLength;
          if (bytes > maxBytes) throw new Error('Source exceeds 8 MiB limit');
          chunks.push(Buffer.from(chunk));
        }
        return Buffer.concat(chunks).toString('utf8');
      }
      throw new Error('Source redirect loop/limit');
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) await delay(retryDelayMs * (attempt + 1));
    }
  }
  throw lastError;
}

/** Stage every generated file first; rename replaces each file atomically. Validation precedes all writes. */
export async function persistGenerated(changes, { renameImpl = rename, renameAttempts = 6, retryDelayMs = 100, delayImpl = delay } = {}) {
  if (!Number.isInteger(renameAttempts) || renameAttempts < 1 || renameAttempts > 20) throw new Error('renameAttempts must be between 1 and 20');
  if (!Number.isFinite(retryDelayMs) || retryDelayMs < 0 || retryDelayMs > 1000) throw new Error('retryDelayMs must be between 0 and 1000');
  const staged = [];
  try {
    for (const change of changes) {
      const temporary = `${change.filename}.tmp-${process.pid}-${staged.length}`;
      staged.push({ filename: change.filename, temporary });
      await writeFile(temporary, `${JSON.stringify(change.data, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
    }
    for (const item of staged) {
      for (let attempt = 0; attempt < renameAttempts; attempt++) {
        try { await renameImpl(item.temporary, item.filename); break; }
        catch (error) {
          // Windows file watchers and antivirus scanners can temporarily hold the
          // destination open. Retry the atomic replacement; never unlink it or
          // fall back to an in-place write that could destroy the last good data.
          if (!['EPERM', 'EACCES', 'EBUSY'].includes(error.code) || attempt + 1 === renameAttempts) throw error;
          await delayImpl(Math.min(500, retryDelayMs * (attempt + 1)));
        }
      }
    }
  } finally {
    await Promise.all(staged.map((item) => rm(item.temporary, { force: true })));
  }
}

export async function trackProducts({ root = projectRoot, productId, dryRun = false, fetchImpl = fetch, now = new Date().toISOString(), fetchOptions = {}, logger = console.log } = {}) {
  const { errors, bundles } = await validateProject(root);
  if (errors.length) throw new Error(`Tracking refused invalid input:\n${errors.join('\n')}`);
  if (productId && !bundles.some((item) => item.id === productId)) throw new Error(`Unknown product: ${productId}`);
  const changes = [];
  const results = [];
  for (const { id, directory, bundle } of bundles.filter((item) => !productId || item.id === productId)) {
    const collector = await import(pathToFileURL(path.join(directory, 'collector.mjs')).href);
    let { tracking, updates } = structuredClone(bundle);
    // Network requests are independent. Four workers reduce outage latency without
    // overwhelming a documentation host; reconciliation remains source-order deterministic.
    const fetched = new Array(bundle.sources.length);
    let nextSource = 0;
    await Promise.all(Array.from({ length: Math.min(4, bundle.sources.length) }, async () => {
      while (nextSource < bundle.sources.length) {
        const index = nextSource++;
        try { fetched[index] = { body: await fetchSource(bundle.sources[index].url, { ...fetchOptions, fetchImpl }) }; }
        catch (error) { fetched[index] = { error }; }
      }
    }));
    for (const [index, source] of bundle.sources.entries()) {
      try {
        if (fetched[index].error) throw fetched[index].error;
        const body = fetched[index].body;
        const parsed = await collector.parseSource(source, body);
        const result = reconcileSource({ product: bundle.product, source, parsed, tracking, updates, detectedAt: now });
        ({ tracking, updates } = result);
        results.push({ productId: id, sourceId: source.id, status: 'ok', addedCount: result.addedCount, baseline: result.baseline });
        logger(`${id}/${source.id}: ${result.baseline ? 'baseline' : 'checked'}, ${result.addedCount} update(s)`);
      } catch (error) {
        tracking = recordSourceError(tracking, source.id, error, now);
        results.push({ productId: id, sourceId: source.id, status: 'error', error: tracking.sources[source.id].error });
        logger(`${id}/${source.id}: failed (${tracking.sources[source.id].error}); last good data retained`);
      }
    }
    const validation = validateBundle({ ...bundle, tracking, updates }, id);
    if (validation.length) throw new Error(`Generated data validation failed:\n${validation.join('\n')}`);
    changes.push({ filename: path.join(directory, 'tracking.json'), data: tracking }, { filename: path.join(directory, 'updates.json'), data: updates });
  }
  if (!dryRun) await persistGenerated(changes);
  return { results, dryRun, generated: changes };
}

function parseArguments(args) {
  const options = {};
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--dry-run') options.dryRun = true;
    else if (args[index] === '--product') {
      const value = args[++index];
      if (!value || !/^[a-z0-9][a-z0-9._-]*$/.test(value)) throw new Error('--product requires a product folder ID');
      options.productId = value;
    } else throw new Error(`Unknown argument: ${args[index]}`);
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await trackProducts(parseArguments(process.argv.slice(2)));
    const failed = result.results.filter((item) => item.status === 'error');
    const status = `${result.dryRun ? 'Dry run; no files changed. ' : ''}Checked ${result.results.length} sources; ${failed.length} failed. Failures retain the last good snapshot.`;
    console.log(status);
    if (process.env.GITHUB_STEP_SUMMARY) {
      const escape = (text) => String(text).replace(/[<>|\r\n]/g, ' ');
      await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Documentation tracking\n\n${status}\n\n${failed.map((item) => `- ${escape(item.productId)}/${escape(item.sourceId)}: ${escape(item.error)}`).join('\n')}\n`);
    }
    // A network failure is data that must reach the public status page; do not prevent
    // validation, persistence and deployment of the last-good content in this run.
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
