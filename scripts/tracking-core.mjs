import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

export const hashText = (value) => createHash('sha256').update(value).digest('hex');
export const normalizeText = (value = '') => String(value).normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
export const stableEntryId = (sourceId, identity) => `${sourceId}-${hashText(normalizeText(identity)).slice(0, 20)}`;

/** Only public HTTPS URLs are allowed, including all redirects and extracted links. */
export function assertSafeUrl(value) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new Error('Source URL must be public HTTPS without credentials or a custom port');
  if (!host.includes('.') || host.endsWith('.localhost') || host.endsWith('.local') || host === 'localhost' || host === '::1' || host.includes(':')) throw new Error('Private/local source URLs are not allowed');
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const octets = host.split('.').map(Number);
    if (octets[0] === 0 || octets[0] === 10 || octets[0] === 127 || octets[0] >= 224 || (octets[0] === 169 && octets[1] === 254) || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 192 && octets[1] === 168) || (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127)) throw new Error('Private/local source URLs are not allowed');
  }
  url.hash = '';
  return url.href;
}

export function parseDate(value) {
  const text = normalizeText(value);
  const iso = text.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  const english = text.match(/\b(January|Jan|February|Feb|March|Mar|April|Apr|May|June|Jun|July|Jul|August|Aug|September|Sept|Sep|October|Oct|November|Nov|December|Dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(20\d{2})\b/i);
  const reverse = text.match(/\b(\d{1,2})\s+(January|Jan|February|Feb|March|Mar|April|Apr|May|June|Jun|July|Jul|August|Aug|September|Sept|Sep|October|Oct|November|Nov|December|Dec)\.?[,]?\s+(20\d{2})\b/i);
  let parts;
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  if (iso) parts = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (english) parts = [Number(english[3]), months.indexOf(english[1].toLowerCase().slice(0, 3)) + 1, Number(english[2])];
  else if (reverse) parts = [Number(reverse[3]), months.indexOf(reverse[2].toLowerCase().slice(0, 3)) + 1, Number(reverse[1])];
  else {
    // RSS/Atom timestamps have explicit dates; never infer relative dates such as "Updated today".
    if (!/\b(?:20\d{2}|(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),)\b/.test(text) || !/[T:]|\bGMT\b|\bUTC\b/.test(text)) return null;
    const date = new Date(text);
    return Number.isNaN(date.valueOf()) ? null : date.toISOString().slice(0, 10);
  }
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  if (date.getUTCFullYear() !== parts[0] || date.getUTCMonth() + 1 !== parts[1] || date.getUTCDate() !== parts[2]) return null;
  return date.toISOString().slice(0, 10);
}

const excludedContent = 'script, style, noscript, nav, header, footer, aside, form, button, [role="navigation"], [aria-hidden="true"], .article-feedback, .intercom-reaction-picker, [data-testid="article-feedback"]';

function cleanContent($, node) {
  const clone = $(node).clone();
  clone.find(excludedContent).remove();
  return clone;
}

function normalizedNodeText($, node) {
  const clone = cleanContent($, node);
  clone.find('br, p, li, h1, h2, h3, h4, div, section').each((_, element) => $(element).append(' '));
  return normalizeText(clone.text());
}

function articleRoot($, selector) {
  if (selector) {
    const selected = $(selector).first();
    if (!selected.length) throw new Error(`Configured content selector was not found: ${selector}`);
    return selected;
  }
  for (const candidate of ['.intercom-interblocks', '[data-testid="article-body"]', '.article__body', '[itemprop="articleBody"]', 'article', 'main', '[role="main"]']) {
    const selected = $(candidate).first();
    if (selected.length && normalizedNodeText($, selected).length >= 80) return selected;
  }
  throw new Error('No recognizable article/main content; update the source selector before retrying');
}

function entry(source, { identity, title, text, url = source.url, publishedAt = null }) {
  return { id: stableEntryId(source.id, identity), title: normalizeText(title).slice(0, 220), hash: hashText(normalizeText(`${title} ${text}`)), publishedAt, url: assertSafeUrl(url), matchText: normalizeText(`${title} ${text}`) };
}

function dedupEntries(entries) {
  const grouped = new Map();
  for (const item of entries) {
    const group = grouped.get(item.id) ?? [];
    if (!group.some((prior) => prior.hash === item.hash)) group.push(item);
    grouped.set(item.id, group);
  }
  return [...grouped.values()].map((group) => {
    group.sort((a, b) => a.hash.localeCompare(b.hash));
    return group.length === 1 ? group[0] : { ...group[0], hash: hashText(group.map((item) => item.hash).join('|')), matchText: group.map((item) => item.matchText).join(' ') };
  }).sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '') || a.id.localeCompare(b.id));
}

function parseDatedCards($, root, source) {
  const result = [];
  const seen = new Set();
  for (const time of root.find('time').toArray()) {
    const publishedAt = parseDate($(time).attr('datetime') || $(time).text());
    if (!publishedAt) continue;
    const card = $(time).closest('li, article, [data-release], [data-changelog-entry]');
    if (!card.length || seen.has(card[0])) continue;
    const title = normalizeText(card.find('h1, h2, h3, h4').first().text());
    if (!title) continue;
    const text = normalizedNodeText($, card);
    if (text.length < 35) throw new Error(`Dated release card lacked meaningful content: ${title}`);
    seen.add(card[0]);
    // ChatGPT Learn supplies an anchor ID for each release card, including
    // separate releases on the same day. Preserve that identity across title edits.
    result.push(entry(source, { identity: card.attr('id') || `${publishedAt}:${title}`, title: `${publishedAt} · ${title}`, text, publishedAt }));
  }
  return result;
}

function parseReleaseNotes($, source) {
  const root = cleanContent($, articleRoot($, source.selector));
  let cards = parseDatedCards($, root, source);
  // In Learn's changelog each article contains only one card's prose. Its date
  // and title are siblings in a surrounding list item inside main.
  if (!cards.length && !source.selector && $('main').length) cards = parseDatedCards($, cleanContent($, $('main').first()), source);
  if (cards.length) return cards;
  // Claude groups dated h3 entries beneath month-only h2 headings. Month labels
  // are navigation structure, not revisions to the preceding dated entry.
  root.find('h1, h2, h3, h4').filter((_, node) => /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2}$/i.test(normalizeText($(node).text()))).remove();
  const headings = root.find('h1, h2, h3, h4').toArray().filter((node) => parseDate($(node).text()));
  if (!headings.length) throw new Error('Release notes contained no recognizable dated headings');
  const allNodes = root.find('*').toArray();
  const datedHeadings = new Set(headings);
  const textByHeading = new Map();
  let activeHeading;
  const collectText = (node) => {
    if (datedHeadings.has(node)) { activeHeading = node; textByHeading.set(node, []); }
    if (node.type === 'text' && activeHeading) textByHeading.get(activeHeading).push(node.data);
    for (const child of node.children ?? []) collectText(child);
  };
  for (const node of root.toArray()) collectText(node);
  const result = [];
  for (let index = 0; index < headings.length; index++) {
    const heading = headings[index];
    const start = allNodes.indexOf(heading);
    const end = index + 1 < headings.length ? allNodes.indexOf(headings[index + 1]) : allNodes.length;
    const sectionNodes = allNodes.slice(start, end);
    // Traverse text nodes between date headings. This keeps prose around inline links
    // without reading ancestor .text(), which would include subsequent date sections.
    const text = normalizeText(textByHeading.get(heading).join(' '));
    if (text.length < 35) throw new Error(`Dated release note lacked meaningful content: ${normalizeText($(heading).text())}`);
    const publishedAt = parseDate($(heading).text());
    const subheading = sectionNodes.find((node) => node !== heading && /^(h[1-6]|strong|b)$/.test(node.tagName) && normalizeText($(node).text()).length > 3);
    const title = `${normalizeText($(heading).text())}${subheading ? ` · ${normalizeText($(subheading).text())}` : ''}`;
    result.push(entry(source, { identity: publishedAt, title, text, publishedAt }));
  }
  return result;
}

function parseArticle($, source) {
  const root = articleRoot($, source.selector);
  const text = normalizedNodeText($, root);
  if (text.length < 100) throw new Error('Article content is empty or unexpectedly short');
  const title = normalizeText(root.find('h1').first().text() || $('h1').first().text() || $('meta[property="og:title"]').attr('content') || $('title').text() || source.title);
  const publishedAt = parseDate($('meta[property="article:published_time"]').attr('content') || $('time[datetime]').first().attr('datetime') || '');
  return [entry(source, { identity: source.url, title, text, publishedAt })];
}

const xmlString = (value) => typeof value === 'string' ? value : String(value?.['#text'] ?? value?.['__cdata'] ?? '');
const asArray = (value) => value == null ? [] : Array.isArray(value) ? value : [value];
function parseFeed(source, body) {
  if (XMLValidator.validate(body) !== true) throw new Error('RSS/Atom document is malformed');
  const document = new XMLParser({ ignoreAttributes: false, processEntities: true }).parse(body);
  const rss = document.rss?.channel;
  const atom = document.feed;
  if (!rss && !atom) throw new Error('RSS/Atom root was not found');
  const items = asArray(rss?.item ?? atom?.entry);
  if (!items.length) throw new Error('RSS/Atom source had no entries');
  return items.map((item) => {
    const title = normalizeText(xmlString(item.title));
    const links = asArray(item.link);
    const link = atom ? links.find((candidate) => !candidate['@_rel'] || candidate['@_rel'] === 'alternate')?.['@_href'] : xmlString(item.link);
    if (!title || !link) throw new Error('RSS/Atom entry lacked a title or URL');
    const url = new URL(link, source.url).href;
    const content = xmlString(item['content:encoded'] ?? item.content ?? item.description ?? item.summary);
    const text = normalizeText(load(content).text());
    const publishedAt = parseDate(xmlString(item.pubDate ?? item.published ?? item.updated));
    return entry(source, { identity: xmlString(item.guid ?? item.id) || assertSafeUrl(url), title, text: `${title} ${text}`, url, publishedAt });
  });
}

function parseAnnouncements($, source) {
  const root = cleanContent($, articleRoot($, source.selector));
  const result = [];
  root.find('a[href]').each((_, node) => {
    const anchor = $(node);
    const heading = anchor.find('h2, h3, h4, [data-title], [class*="__title"]').first();
    const title = normalizeText(heading.text() || anchor.attr('aria-label') || anchor.text());
    if (title.length < 15 || title.length > 500 || /^(read more|learn more|view all)/i.test(title)) return;
    const href = anchor.attr('href');
    if (!href || href.startsWith('#')) return;
    let url;
    try { url = assertSafeUrl(new URL(href, source.url).href); } catch { return; }
    if (new URL(url).origin !== new URL(source.url).origin || url === assertSafeUrl(source.url)) return;
    const ancestor = anchor.closest('article, li, [data-card], .card');
    // Anthropic's main is one page-wide article, while each featured anchor has
    // its own time and title. Never hash or keyword-match the surrounding page.
    const card = anchor.find('time').length || (heading.length && (!ancestor.length || ancestor.find('time').length > 1)) ? anchor : ancestor;
    // A long link label alone may be a privacy/help/navigation link. Require
    // article-card structure or a heading/date within the announcement anchor.
    if (!card.length || (!heading.length && ancestor.is('article') && ancestor.find('time').length > 1)) return;
    const text = normalizedNodeText($, card);
    const publishedAt = parseDate(card.find('time').attr('datetime') || card.find('time').text() || text);
    result.push(entry(source, { identity: url, title, text, url, publishedAt }));
  });
  if (!result.length) throw new Error('Announcement page contained no recognizable article links');
  return result;
}

/** The complete body and matchText exist only in memory; callers persist metadata/hashes only. */
export function parseSource(source, body) {
  assertSafeUrl(source.url);
  if (typeof body !== 'string' || !body.trim() || body.length > 8 * 1024 * 1024) throw new Error('Source body is empty or exceeds the 8 MiB limit');
  if (/^(?:\s*<[^>]+>)*\s*(?:access denied|just a moment|verify you are human)/i.test(body) || /<title[^>]*>\s*(?:Just a moment|Access denied|Attention Required|Error\b)/i.test(body)) throw new Error('Source returned a blocked/error page');
  let items;
  if (source.kind === 'rss') items = parseFeed(source, body);
  else {
    const $ = load(body);
    $('script, style, noscript, nav, footer, aside, [role="navigation"]').remove();
    if (source.kind === 'release-notes') items = parseReleaseNotes($, source);
    else if (source.kind === 'article') items = parseArticle($, source);
    else if (source.kind === 'announcements') items = parseAnnouncements($, source);
    else throw new Error(`Unsupported source kind: ${source.kind}`);
  }
  const entries = dedupEntries(items).filter((item) => !source.keywords?.length || source.keywords.some((keyword) => item.matchText.toLowerCase().includes(keyword.toLowerCase())));
  return { hash: hashText(entries.map((item) => `${item.id}:${item.hash}`).sort().join('|')), entries };
}

export function matchingControlIds(product, source, item) {
  const text = normalizeText(item.matchText ?? item.title).toLowerCase();
  return product.screens.flatMap((screen) => screen.controls).filter((control) => {
    if (!control.guide.sourceIds.includes(source.id)) return false;
    // A single article is the direct source for every dependent guide. Broad release notes
    // match feature-specific keywords instead of declaring every guide stale.
    return source.kind === 'article' || [control.label, ...(control.guide.keywords ?? [])].some((keyword) => keyword.length >= 3 && text.includes(keyword.toLowerCase()));
  }).map((control) => control.id).sort();
}

export function recordSourceError(tracking, sourceId, error, attemptedAt) {
  const next = structuredClone(tracking);
  next.sources[sourceId] = { ...next.sources[sourceId], lastAttemptAt: attemptedAt, lastSuccessAt: next.sources[sourceId]?.lastSuccessAt ?? null, status: 'error', error: normalizeText(error instanceof Error ? error.message : error).slice(0, 500) };
  return next;
}

/** No disappearance means deletion: old entries are retained even when sources archive pages. */
export function reconcileSource({ product, source, parsed, tracking, updates, detectedAt }) {
  if (!parsed || !/^[a-f0-9]{64}$/.test(parsed.hash) || !Array.isArray(parsed.entries)) throw new Error('Collector returned invalid parsed data');
  const next = structuredClone(tracking);
  const prior = tracking.sources[source.id];
  const baseline = !prior?.hash;
  const priorEntries = new Map((prior?.entries ?? []).map((item) => [item.id, item]));
  const lastEntryCount = prior?.lastEntryCount ?? prior?.entries?.length ?? 0;
  if (lastEntryCount >= 8 && parsed.entries.length < Math.max(2, lastEntryCount * 0.2)) throw new Error('Parsed source shrank unexpectedly; preserving the last good snapshot');
  const news = new Map(updates.map((item) => [item.id, structuredClone(item)]));
  const stale = new Set(tracking.reviewControlIds);
  let addedCount = 0;
  for (const item of parsed.entries) {
    if (!item.id || !item.title || !/^[a-f0-9]{64}$/.test(item.hash)) throw new Error('Collector returned an invalid entry');
    assertSafeUrl(item.url);
    const previous = priorEntries.get(item.id);
    const changed = !previous || previous.hash !== item.hash;
    if (changed && !baseline) {
      const controlIds = matchingControlIds(product, source, item);
      // ID includes the revision hash: repeat runs dedup, while multiple genuine edits remain visible.
      const id = `${item.id}-${item.hash.slice(0, 16)}`;
      if (!news.has(id)) {
        news.set(id, { id, sourceId: source.id, title: item.title, url: item.url, publishedAt: previous?.publishedAt ?? item.publishedAt, detectedAt, type: previous ? 'edited' : source.kind === 'article' ? 'documentation' : 'new', controlIds, interpretation: 'pending' });
        addedCount++;
      }
      controlIds.forEach((controlId) => stale.add(controlId));
    }
    // Persist an explicit whitelist; no source HTML, prose or in-memory matchText.
    priorEntries.set(item.id, { id: item.id, title: item.title, publishedAt: previous?.publishedAt ?? item.publishedAt, hash: item.hash, url: item.url });
  }
  next.sources[source.id] = { hash: parsed.hash, entries: [...priorEntries.values()].sort((a, b) => a.id.localeCompare(b.id)), lastEntryCount: parsed.entries.length, lastAttemptAt: detectedAt, lastSuccessAt: detectedAt, status: 'ok' };
  next.reviewControlIds = [...stale].sort();
  return { tracking: next, updates: [...news.values()].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt) || a.id.localeCompare(b.id)), addedCount, baseline };
}
