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
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THRESH_LINES = 1000;
const THRESH_BYTES = 50 * 1024;

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

    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.split('\n').length;
    const bytes = Buffer.byteLength(content, 'utf-8');

    const status = [];
    if (lines > THRESH_LINES) {
      status.push(`lines>${THRESH_LINES}`);
    }
    if (bytes > THRESH_BYTES) {
      status.push(`size>${THRESH_BYTES}B`);
    }

    const statusStr = status.length === 0 ? 'OK' : `ARCHIVE SUGGESTED: ${status.join(', ')}`;
    console.log(`- ${log.filename}: ${lines} lines, ${bytes} bytes -> ${statusStr}`);

    if (status.length > 0) {
      console.log(`  Suggested archive dir: ${path.join(__dirname, log.archiveDir)}`);
    }
  }
}

main();
