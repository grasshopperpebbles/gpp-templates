// Tests for log_archive.mjs. Run: node --test logs/log_archive.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { gunzipSync, gzipSync } from 'node:zlib';

import {
  assessLog,
  countOpenTasks,
  detectOrder,
  planSplit,
  renderSplit,
  THRESH_BYTES,
  THRESH_LINES,
} from './log_archive.mjs';

const NEWEST_FIRST = [
  '# Log',
  '',
  '## [Unreleased]',
  '',
  '## Entry (2026-08-28)',
  'c',
  '### detail',
  'c2',
  '',
  '## Entry (2026-06-01)',
  'b',
  '',
  '## Entry (2026-01-05)',
  'a',
];

const OLDEST_FIRST = [
  '# Log',
  '',
  '## Entry (2026-01-05)',
  'a',
  '',
  '## Entry (2026-06-01)',
  'b',
  '',
  '## Entry (2026-08-28)',
  'c',
];

/** A newest-first log of `n` dated entries, `bodyLines` lines each, newest first. */
function bigLog(n, bodyLines = 20, extra = () => []) {
  const out = ['# Changelog', '', '## [Unreleased]', ''];
  for (let i = 0; i < n; i += 1) {
    const day = new Date(Date.UTC(2026, 10, 17) - i * 86400000).toISOString().slice(0, 10);
    out.push(`## [0.9.${n - i}] - ${day} - entry ${n - i}`, ...extra(i));
    for (let j = 0; j < bodyLines; j += 1) out.push(`- line ${j} of entry ${n - i}`);
    out.push('');
  }
  return out;
}

test('detectOrder reads descending dates as newest-first', () => {
  assert.equal(detectOrder(NEWEST_FIRST), 'newest-first');
});

test('detectOrder reads ascending dates as oldest-first', () => {
  assert.equal(detectOrder(OLDEST_FIRST), 'oldest-first');
});

test('detectOrder gives up rather than guessing when there are no dates', () => {
  assert.equal(detectOrder(['# Log', '', '## Entry', 'a', '## Entry 2', 'b']), 'unknown');
});

test('detectOrder reads the heading shapes the GPP logs use', () => {
  const lines = [
    '## SESSION NOTE - 2026-11-17 (fix)',
    'x',
    '### Title (2026-11-16, v0.9.1)',
    'y',
    '## [0.9.119] - 2026-11-15 - title',
    'z',
  ];
  assert.equal(detectOrder(lines), 'newest-first');
});

test('detectOrder treats the ==== separator form as a heading', () => {
  const changelogShape = [
    '='.repeat(50),
    'SESSION: newer (2026-08-28)',
    '='.repeat(50),
    'body',
    '',
    '='.repeat(50),
    'SESSION: older (2026-01-05)',
    '='.repeat(50),
    'body',
  ];
  assert.equal(detectOrder(changelogShape), 'newest-first');
});

test('planSplit archives the tail of a newest-first log', () => {
  const { keep, archive } = planSplit(NEWEST_FIRST, 'newest-first', { keepRatio: 0.5 });
  assert.ok(keep.join('\n').includes('2026-08-28'), 'newest entry must stay live');
  assert.ok(!keep.join('\n').includes('2026-01-05'), 'oldest entry must not stay live');
  assert.ok(archive.join('\n').includes('2026-01-05'), 'oldest entry must be archived');
});

test('planSplit archives the head of an oldest-first log', () => {
  const { keep, archive } = planSplit(OLDEST_FIRST, 'oldest-first', { keepRatio: 0.5 });
  assert.ok(keep.join('\n').includes('2026-08-28'), 'newest entry must stay live');
  assert.ok(!keep.join('\n').includes('2026-01-05'), 'oldest entry must not stay live');
  assert.ok(archive.join('\n').includes('2026-01-05'), 'oldest entry must be archived');
});

test('planSplit keeps everything above the first dated entry', () => {
  const { preamble, archive } = planSplit(NEWEST_FIRST, 'newest-first', { keepRatio: 0.5 });
  assert.deepEqual(preamble, ['# Log', '', '## [Unreleased]', '']);
  assert.ok(!archive.includes('# Log'));
});

test('planSplit cuts on an entry boundary, never at a deeper heading', () => {
  for (const ratio of [0.1, 0.3, 0.55, 0.9]) {
    const { archive } = planSplit(NEWEST_FIRST, 'newest-first', { keepRatio: ratio });
    assert.match(archive[0], /^## Entry/, `ratio ${ratio}: archive starts mid-entry: ${archive[0]}`);
  }
});

test('planSplit loses no lines', () => {
  for (const [lines, order] of [
    [NEWEST_FIRST, 'newest-first'],
    [OLDEST_FIRST, 'oldest-first'],
  ]) {
    for (const keepRatio of [0.2, 0.5, 0.8]) {
      const { preamble, keep, archive } = planSplit(lines, order, { keepRatio });
      const rejoined =
        order === 'newest-first' ? [...preamble, ...keep, ...archive] : [...preamble, ...archive, ...keep];
      assert.deepEqual(rejoined, lines, `ratio ${keepRatio} ${order}`);
    }
  }
});

test('planSplit refuses an unknown order rather than defaulting', () => {
  assert.throws(() => planSplit(NEWEST_FIRST, 'unknown'), /order/i);
});

test('planSplit keeps fewer entries when 20% would still be over the thresholds', () => {
  const lines = bigLog(300, 20); // ~6300 lines; 20% is ~1260, over 1000
  const { preamble, keep } = planSplit(lines, 'newest-first');
  const live = [...preamble, ...keep];
  // Fitted to 80% of the thresholds, leaving room to log before the next run.
  assert.ok(live.length <= THRESH_LINES * 0.8, `kept ${live.length} lines`);
  assert.ok(Buffer.byteLength(live.join('\n')) <= THRESH_BYTES * 0.8);
  assert.match(keep[0], /0\.9\.300/, 'the newest entry stays');
});

test('countOpenTasks counts unchecked checkboxes only', () => {
  const lines = [
    '- [ ] open one',
    '  - [ ] open two, indented',
    '- [x] done',
    '- [~] under development',
    'not a task at all',
    'prose mentioning - [ ] inline',
  ];
  assert.equal(countOpenTasks(lines), 2);
});

test('assessLog leaves a small log alone', () => {
  assert.equal(assessLog(NEWEST_FIRST.join('\n')).action, 'ok');
});

test('assessLog refuses an oversized log with no dated entries', () => {
  const lines = Array.from({ length: 1200 }, (_, i) => (i % 50 === 0 ? `## Section ${i}` : `line ${i}`));
  const a = assessLog(lines.join('\n'));
  assert.equal(a.action, 'refuse');
  assert.match(a.reason, /which end/);
});

/** Same as bigLog but oldest-first. */
function bigLogOldestFirst(n, bodyLines = 20, extra = () => []) {
  const out = ['# Changelog', '', '## [Unreleased]', ''];
  for (let i = 0; i < n; i += 1) {
    const day = new Date(Date.UTC(2026, 0, 1) + i * 86400000).toISOString().slice(0, 10);
    out.push(`## [0.9.${i + 1}] - ${day} - entry ${i + 1}`, ...extra(i));
    for (let j = 0; j < bodyLines; j += 1) out.push(`- line ${j} of entry ${i + 1}`);
    out.push('');
  }
  return out;
}

test('newest-first: open items in recent entries move the cut below the last open entry', () => {
  // Entry index 100 from the top (version 200) holds an open item; the fitting cut is
  // far above it, so it would be archived.
  const lines = bigLog(300, 20, (i) => (i === 100 ? ['- [ ] still open'] : []));
  const a = assessLog(lines.join('\n'));
  assert.equal(a.action, 'archive');
  assert.equal(a.stranded, 0);
  assert.equal(a.keptForOpenItems, true);
  assert.equal(a.plan.overLimit, true);
  assert.equal(countOpenTasks(a.plan.archive), 0);
  assert.ok(a.plan.keep.includes('- [ ] still open'));
  assert.match(a.plan.archive[0], /^## \[0\.9\.199\]/, 'cut is just below the last open entry');
  assert.ok(a.keptBytes > THRESH_BYTES * 0.8 && a.keptLines > 0);
  const { preamble, keep, archive } = a.plan;
  assert.deepEqual([...preamble, ...keep, ...archive], lines, 'no lines lost');
});

test('oldest-first: open items move the cut above the first open entry', () => {
  const lines = bigLogOldestFirst(300, 20, (i) => (i === 200 ? ['- [ ] still open'] : []));
  const a = assessLog(lines.join('\n'));
  assert.equal(a.action, 'archive');
  assert.equal(a.keptForOpenItems, true);
  assert.equal(a.plan.overLimit, true);
  assert.equal(countOpenTasks(a.plan.archive), 0);
  assert.ok(a.plan.keep.includes('- [ ] still open'));
  assert.match(a.plan.keep[0], /^## \[0\.9\.201\]/, 'cut is just above the first open entry');
  const { preamble, keep, archive } = a.plan;
  assert.deepEqual([...preamble, ...archive, ...keep], lines, 'no lines lost');
});

test('open items in the oldest entry: nothing to archive, not a refusal', () => {
  const newest = assessLog(bigLog(300, 20, (i) => (i === 299 ? ['- [ ] oldest open'] : [])).join('\n'));
  assert.equal(newest.action, 'nothing');
  assert.match(newest.reason, /oldest entry/);
  const oldest = assessLog(bigLogOldestFirst(300, 20, (i) => (i === 0 ? ['- [ ] oldest open'] : [])).join('\n'));
  assert.equal(oldest.action, 'nothing');
});

test('--force keeps the fitting cut and reports the stranded open items', () => {
  const lines = bigLog(300, 20, (i) => (i === 290 ? ['- [ ] still open'] : []));
  const forced = assessLog(lines.join('\n'), { force: true });
  assert.equal(forced.action, 'archive');
  assert.equal(forced.stranded, 1);
  assert.ok(!forced.keptForOpenItems);
  assert.ok(forced.plan.archive.includes('- [ ] still open'));
  const live = [...forced.plan.preamble, ...forced.plan.keep];
  assert.ok(live.length <= THRESH_LINES * 0.8, 'the fitting cut');
});

test('no open items: behaviour unchanged', () => {
  const a = assessLog(bigLog(300, 20).join('\n'));
  assert.equal(a.action, 'archive');
  assert.equal(a.stranded, 0);
  assert.ok(!a.keptForOpenItems);
  assert.equal(a.plan.overLimit, false);
});

test('assessLog still refuses an undated section when open items also move the cut', () => {
  const lines = [...bigLog(300, 20, (i) => (i === 290 ? ['- [ ] still open'] : [])), '## Future Roadmap'];
  const a = assessLog(lines.join('\n'));
  assert.equal(a.action, 'refuse');
  assert.match(a.reason, /1 undated section/);
});

test('assessLog refuses when an undated section would be archived, even with --force', () => {
  const lines = [...bigLog(300, 20), '## Future Roadmap', '- idea'];
  const a = assessLog(lines.join('\n'), { force: true });
  assert.equal(a.action, 'refuse');
  assert.match(a.reason, /undated section/);
});

test('assessLog ignores headings inside fenced code blocks', () => {
  const fenced = (i) =>
    i % 2 === 0
      ? ['```bash', '# install the tools', 'npm ci', '```']
      : ['~~~md', '## Usage', '```', '### not a fence close', '~~~'];
  const a = assessLog(bigLog(300, 20, fenced).join('\n'));
  assert.equal(a.action, 'archive', a.reason);
  assert.equal(a.order, 'newest-first');
});

test('assessLog never cuts at a dated heading inside a fenced code block', () => {
  const fenced = () => ['```md', '## Example entry (2001-01-01)', '```'];
  const a = assessLog(bigLog(300, 20, fenced).join('\n'));
  assert.equal(a.action, 'archive', a.reason);
  const fences = (part) => part.filter((l) => l.startsWith('```')).length;
  assert.equal(fences(a.plan.keep) % 2, 0, 'live side has whole code blocks');
  assert.equal(fences(a.plan.archive) % 2, 0, 'archive side has whole code blocks');
});

test('renderSplit gzip round-trip: archive holds the oldest entries, live keeps the newest', () => {
  const lines = bigLog(300, 20);
  const a = assessLog(lines.join('\n'));
  assert.equal(a.action, 'archive');
  const { archiveText, liveText } = renderSplit(a.plan, a.order, {
    filename: 'CHANGELOG.md',
    archiveDir: 'changelog_archives',
    archiveFile: 'CHANGELOG_20261117_000000.md.gz',
    date: '2026-11-17',
  });
  const back = gunzipSync(gzipSync(Buffer.from(archiveText))).toString('utf-8');
  assert.equal(back, archiveText);
  assert.ok(back.includes('## [0.9.1] -'), 'oldest entry archived');
  assert.ok(!back.includes('## [0.9.300] -'), 'newest entry not archived');
  assert.ok(liveText.startsWith('# Changelog\n\n## [Unreleased]\n\n## [0.9.300] -'));
  assert.ok(liveText.includes('changelog_archives/CHANGELOG_20261117_000000.md.gz (gzip)'));
  assert.ok(liveText.split('\n').length <= THRESH_LINES);
});
