/**
 * Split logic for the four-log archive scripts (`ensure_log_capacity.mjs` writes,
 * `archive_logs.mjs` only reports). `gpp logs ensure-capacity` runs a TypeScript port of
 * this file (`src/lib/logCapacity.ts` in gpp-cli); keep the two in step.
 *
 * The bug this exists to prevent: the old archiver always moved `lines.slice(0, 80%)`,
 * the FIRST 80% of the file. That is right for an append-only log and exactly wrong for
 * GPP logs, which put the newest entries at the top: it archived the newest history and
 * kept the oldest.
 *
 * So: find the dated entries, read the order from their dates, and refuse whenever the
 * order cannot be established. Never guess which end of a history to move.
 *
 * - An entry is a heading (`#` to `###`, or a `====` rule opening a session block) at the
 *   level of the first heading that carries a date (YYYY-MM-DD). Deeper headings are part
 *   of their entry, so the cut never lands inside one.
 * - Everything above the first dated entry (title, `[Unreleased]`, older archive pointers,
 *   reference sections) is the preamble and always stays.
 * - Newest-first: keep the head, archive the tail. Oldest-first: keep the tail, archive
 *   the head.
 * - When the fitting cut would archive open `- [ ]` items, move it toward the old end to
 *   just below the last entry holding one (`keptForOpenItems`; the live file may then be
 *   over the limit). If open items reach the oldest entry there is nothing to archive
 *   (action 'nothing'). `force` keeps the fitting cut and archives the open items.
 * - Refuse when an undated section (a heading at entry level or above with no date, such
 *   as a roadmap) would be archived: that is not history.
 */

export const THRESH_LINES = 1000;
export const THRESH_BYTES = 50 * 1024;
export const KEEP_RATIO = 0.2;

/**
 * When the newest ~20% is still over the thresholds, entries are dropped until the live
 * file fits in this share of them, so there is room to log before the next archive run.
 */
const FIT_RATIO = 0.8;

/** Room left in the live file for the archive pointer. */
const POINTER_LINES = 6;
const POINTER_BYTES = 200;

const DATE_RE = /\d{4}-\d{2}-\d{2}/;
const HEADING_RE = /^(#{1,3})\s+\S/;
const RULE_RE = /^={20,}\s*$/;

/**
 * The heading that starts at line i, or null. A `====` rule counts as level 2 when it
 * opens a block (blank line or start of file before it); its title, and so its date, is
 * on the next line.
 */
export function headingAt(lines, i) {
  const line = lines[i] ?? '';
  const m = line.match(HEADING_RE);
  if (m) {
    return { index: i, level: m[1].length, date: (line.match(DATE_RE) ?? [null])[0] };
  }
  if (RULE_RE.test(line) && (i === 0 || (lines[i - 1] ?? '').trim() === '')) {
    const title = lines[i + 1] ?? '';
    return { index: i, level: 2, date: (title.match(DATE_RE) ?? [null])[0] };
  }
  return null;
}

/**
 * The log's entries: `start` is the line of the first dated heading (everything above is
 * preamble), `level` the entry heading level, `boundaries` every heading from `start` on
 * at that level or above. Null when no heading carries a date.
 */
export function findEntries(lines) {
  const all = [];
  for (let i = 0; i < lines.length; i += 1) {
    const h = headingAt(lines, i);
    if (h) all.push(h);
  }
  const first = all.find((h) => h.date);
  if (!first) return null;
  const boundaries = all.filter((h) => h.index >= first.index && h.level <= first.level);
  return { start: first.index, level: first.level, boundaries };
}

/**
 * 'newest-first' | 'oldest-first' | 'unknown', read from the entry dates. 'unknown' when
 * there are fewer than two dated entries or the dates go both ways equally. The caller
 * must treat 'unknown' as "do not archive".
 */
export function detectOrder(lines) {
  const entries = findEntries(lines);
  if (!entries) return 'unknown';
  const dates = entries.boundaries.map((h) => h.date).filter(Boolean);
  if (dates.length < 2) return 'unknown';

  let descending = 0;
  let ascending = 0;
  for (let i = 1; i < dates.length; i += 1) {
    if (dates[i] < dates[i - 1]) descending += 1;
    else if (dates[i] > dates[i - 1]) ascending += 1;
  }
  if (descending > ascending) return 'newest-first';
  if (ascending > descending) return 'oldest-first';
  return 'unknown';
}

function fits(lineArr, maxLines, maxBytes) {
  const text = lineArr.join('\n');
  return (
    lineArr.length + POINTER_LINES <= maxLines && Buffer.byteLength(text, 'utf-8') + POINTER_BYTES <= maxBytes
  );
}

/**
 * Split a log into `preamble` (always stays), `keep` (entries that stay live) and
 * `archive` (the oldest entries). The cut is on an entry boundary: the one nearest
 * `keepRatio` of the body, moved further toward the old end's opposite if the live file
 * would still be over the thresholds. `overLimit` is true when even one kept entry leaves
 * it over. Throws when the order is unknown or there is nothing to cut between.
 */
export function planSplit(lines, order, opts = {}) {
  const keepRatio = opts.keepRatio ?? KEEP_RATIO;
  const maxLines = Math.floor((opts.maxLines ?? THRESH_LINES) * FIT_RATIO);
  const maxBytes = Math.floor((opts.maxBytes ?? THRESH_BYTES) * FIT_RATIO);

  if (order !== 'newest-first' && order !== 'oldest-first') {
    throw new Error(`log order is "${order}"; refusing to guess which end is history`);
  }
  const entries = findEntries(lines);
  if (!entries) throw new Error('no dated entries found');

  const preamble = lines.slice(0, entries.start);
  const body = lines.slice(entries.start);
  // Cut points relative to the body; never 0, which would leave one side empty.
  const candidates = entries.boundaries.map((h) => h.index - entries.start).filter((i) => i > 0);
  if (candidates.length === 0) throw new Error('the log holds a single entry');

  const newestFirst = order === 'newest-first';
  const target = Math.round(body.length * (newestFirst ? keepRatio : 1 - keepRatio));
  const nearest = candidates.reduce((best, i) => (Math.abs(i - target) < Math.abs(best - target) ? i : best));
  const liveFor = (c) => [...preamble, ...(newestFirst ? body.slice(0, c) : body.slice(c))];

  let cut = nearest;
  let overLimit = false;
  if (!fits(liveFor(cut), maxLines, maxBytes)) {
    // Newest-first keeps less by cutting earlier; oldest-first by cutting later.
    const ordered = newestFirst
      ? candidates.filter((c) => c < nearest).sort((a, b) => b - a)
      : candidates.filter((c) => c > nearest).sort((a, b) => a - b);
    const found = ordered.find((c) => fits(liveFor(c), maxLines, maxBytes));
    if (found !== undefined) {
      cut = found;
    } else {
      cut = newestFirst ? Math.min(...candidates) : Math.max(...candidates);
      overLimit = true;
    }
  }

  return newestFirst
    ? { preamble, keep: body.slice(0, cut), archive: body.slice(cut), overLimit }
    : { preamble, keep: body.slice(cut), archive: body.slice(0, cut), overLimit };
}

/**
 * Like `planSplit`, but the cut is moved toward the old end until no open `- [ ]` item
 * is archived: just below the last entry holding one (newest-first), or just above the
 * first one (oldest-first). Returns null when no such cut archives anything, i.e. open
 * items reach the oldest entry. `overLimit` is set when the live file is then over the
 * (full) thresholds. Throws as `planSplit` does.
 */
export function planKeepingOpenItems(lines, order, opts = {}) {
  if (order !== 'newest-first' && order !== 'oldest-first') {
    throw new Error(`log order is "${order}"; refusing to guess which end is history`);
  }
  const entries = findEntries(lines);
  if (!entries) throw new Error('no dated entries found');
  const preamble = lines.slice(0, entries.start);
  const body = lines.slice(entries.start);
  const candidates = entries.boundaries.map((h) => h.index - entries.start).filter((i) => i > 0);
  if (candidates.length === 0) throw new Error('the log holds a single entry');

  const open = [];
  body.forEach((line, i) => {
    if (countOpenTasks([line]) > 0) open.push(i);
  });
  if (open.length === 0) return null;

  const newestFirst = order === 'newest-first';
  let cut;
  if (newestFirst) {
    const last = open[open.length - 1];
    cut = candidates.filter((c) => c > last).sort((a, b) => a - b)[0];
  } else {
    const first = open[0];
    cut = candidates.filter((c) => c <= first).sort((a, b) => b - a)[0];
  }
  if (cut === undefined) return null;

  const keep = newestFirst ? body.slice(0, cut) : body.slice(cut);
  const archive = newestFirst ? body.slice(cut) : body.slice(0, cut);
  const maxLines = opts.maxLines ?? THRESH_LINES;
  const maxBytes = opts.maxBytes ?? THRESH_BYTES;
  const overLimit = !fits([...preamble, ...keep], maxLines, maxBytes);
  return { preamble, keep, archive, overLimit };
}

/**
 * Unchecked task boxes at the start of a list item. Prose that mentions `- [ ]` inline
 * does not count.
 */
export function countOpenTasks(lines) {
  return lines.filter((line) => /^\s*[-*]\s+\[ \]/.test(line)).length;
}

/** Headings at entry level or above with no date, i.e. sections that are not history. */
export function undatedSections(lines, level) {
  const found = [];
  for (let i = 0; i < lines.length; i += 1) {
    const h = headingAt(lines, i);
    if (h && h.level <= level && !h.date) found.push(lines[i].trim());
  }
  return found;
}

/**
 * Everything the archiver decides about one log, without writing anything.
 * Returns { action: 'ok' | 'archive' | 'nothing' | 'refuse', lines, bytes, order?, plan?,
 * reason?, stranded?, keptForOpenItems?, keptLines?, keptBytes? }. `ensure_log_capacity.mjs` acts on it; `archive_logs.mjs` reports it.
 */
export function assessLog(content, opts = {}) {
  const lines = content.split('\n');
  const bytes = Buffer.byteLength(content, 'utf-8');
  const maxLines = opts.maxLines ?? THRESH_LINES;
  const maxBytes = opts.maxBytes ?? THRESH_BYTES;
  const base = { lines: lines.length, bytes };

  if (lines.length <= maxLines && bytes <= maxBytes) return { ...base, action: 'ok' };

  const order = detectOrder(lines);
  if (order === 'unknown') {
    return {
      ...base,
      action: 'refuse',
      order,
      reason: 'cannot tell which end is history (no clear date order in the entry headings)',
    };
  }

  let plan;
  try {
    plan = planSplit(lines, order, opts);
  } catch (error) {
    return { ...base, action: 'refuse', order, reason: error.message };
  }

  const entries = findEntries(lines);
  let stranded = countOpenTasks(plan.archive);
  let keptForOpenItems = false;
  if (stranded > 0 && !opts.force) {
    // The fitting cut would archive open items: keep every entry that holds one.
    let moved;
    try {
      moved = planKeepingOpenItems(lines, order, opts);
    } catch (error) {
      return { ...base, action: 'refuse', order, reason: error.message };
    }
    if (!moved) {
      return {
        ...base,
        action: 'nothing',
        order,
        reason: 'open "- [ ]" items reach the oldest entry, so nothing can be archived without archiving one',
      };
    }
    plan = moved;
    stranded = 0;
    keptForOpenItems = true;
  }

  const undated = undatedSections(plan.archive, entries.level);
  if (undated.length > 0) {
    return {
      ...base,
      action: 'refuse',
      order,
      plan,
      stranded,
      reason: `${undated.length} undated section(s) would be archived, first: ${JSON.stringify(undated[0])}`,
    };
  }

  const result = { ...base, action: 'archive', order, plan, stranded };
  if (keptForOpenItems) {
    const live = [...plan.preamble, ...plan.keep].join('\n');
    result.keptForOpenItems = true;
    result.keptLines = live.split('\n').length;
    result.keptBytes = Buffer.byteLength(live, 'utf-8');
  }
  return result;
}

/** `TODO.md` -> `TODO_20261117_093000.md.gz`. */
export function archiveName(filename, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 15);
  return `${filename.replace(/\.md$/, '')}_${stamp}.md.gz`;
}

/**
 * The archive file's text (gzip it before writing) and the live file's new text. The
 * pointer goes at the end the archived entries came from.
 */
export function renderSplit(plan, order, { filename, archiveDir, archiveFile, date }) {
  const archiveText =
    `*[Archived from ${filename} on ${date}. Order: ${order}.]*\n\n` + plan.archive.join('\n') + '\n';
  const pointer = `---\n\n*[Older entries archived to ${archiveDir}/${archiveFile} (gzip) on ${date}]*\n`;
  const liveText =
    order === 'newest-first'
      ? [...plan.preamble, ...plan.keep].join('\n') + '\n\n' + pointer
      : [...plan.preamble, pointer, ...plan.keep].join('\n') + '\n';
  return { archiveText, liveText };
}
