#!/usr/bin/env node
/**
 * Ensure Log Capacity - Node.js Version
 *
 * Archives the OLDEST end of a log when it exceeds capacity thresholds.
 * Run this BEFORE updating any log files.
 *
 * Usage:
 *   node logs/ensure_log_capacity.mjs [--dry-run] [--force] [--only=TODO.md]
 *
 * Thresholds:
 *   - 1000 lines OR 50KB triggers archiving
 *   - Keeps the newest ~20% of entries live (fewer if that is still over the thresholds),
 *     cut on an entry boundary; everything above the first dated entry stays
 *   - Archive files are gzip-compressed (.md.gz); a pointer line is left in the log
 *
 * Order safety: GPP logs are newest-first. The order is read from the dated entry
 * headings, and a file whose order is unclear is REFUSED, never guessed. A file is also
 * refused when undated sections would land in the archive. When the fitting cut would
 * archive open "- [ ]" items it cuts just below the last entry holding one instead (the
 * log may stay over the limit); if open items reach the oldest entry there is nothing to
 * archive. --force archives the open items too, using the fitting cut. The logic lives in log_archive.mjs.
 */

import fs from 'fs';
import path from 'path';
import { gzipSync } from 'zlib';
import { fileURLToPath } from 'url';

import { archiveName, assessLog, renderSplit } from './log_archive.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGS = [
  { filename: 'TODO.md', archiveDir: 'todo_archives' },
  { filename: 'CHANGELOG.md', archiveDir: 'changelog_archives' },
  { filename: 'DEVELOPMENT.md', archiveDir: 'development_archives' },
  { filename: 'STRATEGY_NOTES.md', archiveDir: 'strategy_archives' },
];

function archiveFile(log, assessment, dryRun) {
  const { order, plan } = assessment;
  const now = new Date();
  const archiveFile = archiveName(log.filename, now);
  const date = now.toISOString().slice(0, 10);
  const { archiveText, liveText } = renderSplit(plan, order, {
    filename: log.filename,
    archiveDir: log.archiveDir,
    archiveFile,
    date,
  });
  const keptLines = liveText.split('\n').length;
  const keptBytes = Buffer.byteLength(liveText, 'utf-8');

  console.log(`  Order: ${order}`);
  if (assessment.stranded > 0) {
    console.log(`  --force: ${assessment.stranded} open "- [ ]" item(s) go to the archive`);
  }
  if (assessment.keptForOpenItems) {
    const kb = (assessment.keptBytes / 1024).toFixed(1);
    console.log(
      plan.overLimit
        ? `  Note: kept ${kb} KB, over the limit, so that no open item is archived`
        : `  Note: kept ${kb} KB, more than the usual fit, so that no open item is archived`,
    );
  } else if (plan.overLimit) {
    console.log('  Note: the newest entry alone is over the thresholds; keeping just that one');
  }

  if (dryRun) {
    console.log(`  [DRY RUN] Would archive ${plan.archive.length} lines to ${archiveFile} (gzip)`);
    console.log(`  [DRY RUN] Would keep ${keptLines} lines, ${keptBytes} bytes in ${log.filename}`);
    console.log(`  [DRY RUN] First archived line: ${JSON.stringify(plan.archive[0])}`);
    return true;
  }

  const archiveDir = path.join(__dirname, log.archiveDir);
  fs.mkdirSync(archiveDir, { recursive: true });
  fs.writeFileSync(path.join(archiveDir, archiveFile), gzipSync(Buffer.from(archiveText, 'utf-8')));
  fs.writeFileSync(path.join(__dirname, log.filename), liveText, 'utf-8');

  console.log(`  ✅ Archived ${plan.archive.length} lines to ${archiveFile} (gzip)`);
  console.log(`  ✅ Kept ${keptLines} lines, ${keptBytes} bytes in ${log.filename}`);
  return true;
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const only = onlyArg ? onlyArg.slice('--only='.length) : null;
  const mode = dryRun ? 'DRY RUN' : 'ARCHIVING';

  console.log(`Log capacity check (${mode}):`);
  console.log();

  let archivedCount = 0;
  let refusedCount = 0;

  for (const log of LOGS) {
    if (only && log.filename !== only) continue;
    const logPath = path.join(__dirname, log.filename);

    if (!fs.existsSync(logPath)) {
      console.log(`- ${log.filename}: MISSING (skipping)`);
      continue;
    }

    const assessment = assessLog(fs.readFileSync(logPath, 'utf-8'), { force });

    if (assessment.action === 'ok') {
      console.log(`- ${log.filename}: ${assessment.lines} lines, ${assessment.bytes} bytes -> OK`);
      continue;
    }

    console.log(`- ${log.filename}: ${assessment.lines} lines, ${assessment.bytes} bytes -> ARCHIVING`);
    if (assessment.action === 'nothing') {
      console.log(`  Nothing to archive: ${assessment.reason}`);
      continue;
    }
    if (assessment.action === 'refuse') {
      console.log(`  ⏭  REFUSED: ${assessment.reason}`);
      refusedCount++;
      continue;
    }
    if (archiveFile(log, assessment, dryRun)) archivedCount++;
  }

  console.log();
  console.log(`${dryRun ? 'Would archive' : 'Archived'} ${archivedCount} file(s)`);
  if (refusedCount > 0) console.log(`Refused ${refusedCount} file(s); see above`);
}

main();
