#!/usr/bin/env node
/**
 * Archive Logs Check - Node.js Version
 *
 * Checks log file sizes and suggests archiving when thresholds are exceeded.
 * This is a read-only check - it does not modify any files.
 *
 * Usage:
 *   node logs/archive_logs.mjs
 *
 * Thresholds:
 *   - 1000 lines OR 50KB suggests archiving
 *
 * For each log over the thresholds it also reports what `ensure_log_capacity.mjs` would
 * do: the order it reads from the dated headings, and whether it would REFUSE (order
 * unknown, undated sections in the archived part), archive nothing (open "- [ ]" items
 * reach the oldest entry), or keep more than the limit so no open item is archived. Both scripts
 * use the same logic in log_archive.mjs. Archives are gzip (`*.md.gz`).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { THRESH_BYTES, THRESH_LINES, assessLog } from './log_archive.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGS = [
  { filename: 'TODO.md', archiveDir: 'todo_archives' },
  { filename: 'CHANGELOG.md', archiveDir: 'changelog_archives' },
  { filename: 'DEVELOPMENT.md', archiveDir: 'development_archives' },
  { filename: 'STRATEGY_NOTES.md', archiveDir: 'strategy_archives' },
];

function main() {
  console.log('Log archive check:');

  for (const log of LOGS) {
    const logPath = path.join(__dirname, log.filename);

    if (!fs.existsSync(logPath)) {
      console.log(`- MISSING: ${logPath}`);
      continue;
    }

    const a = assessLog(fs.readFileSync(logPath, 'utf-8'));

    const status = [];
    if (a.lines > THRESH_LINES) {
      status.push(`lines>${THRESH_LINES}`);
    }
    if (a.bytes > THRESH_BYTES) {
      status.push(`size>${THRESH_BYTES}B`);
    }

    const statusStr = status.length === 0 ? 'OK' : `ARCHIVE SUGGESTED: ${status.join(', ')}`;
    console.log(`- ${log.filename}: ${a.lines} lines, ${a.bytes} bytes -> ${statusStr}`);

    if (status.length > 0) {
      console.log(`  Suggested archive dir: ${path.join(__dirname, log.archiveDir)}`);
      console.log(`  Order: ${a.order}`);
      if (a.action === 'refuse') {
        console.log(`  ⚠️  ensure_log_capacity.mjs would REFUSE: ${a.reason}`);
      } else if (a.action === 'nothing') {
        console.log(`  ensure_log_capacity.mjs would archive nothing: ${a.reason}`);
      } else if (a.keptForOpenItems) {
        console.log(
          `  ensure_log_capacity.mjs would archive ${a.plan.archive.length} lines (the oldest entries), keeping ${(a.keptBytes / 1024).toFixed(1)} KB so that no open item is archived`,
        );
      } else {
        console.log(
          `  ensure_log_capacity.mjs would archive ${a.plan.archive.length} lines (the oldest entries)`,
        );
      }
    }
  }
}

main();
