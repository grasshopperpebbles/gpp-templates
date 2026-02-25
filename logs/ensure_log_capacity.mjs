#!/usr/bin/env node
/**
 * Ensure Log Capacity - Node.js Version
 *
 * Automatically archives logs when they exceed capacity thresholds.
 * Run this BEFORE updating any log files.
 *
 * Usage:
 *   node logs/ensure_log_capacity.mjs [--dry-run]
 *
 * Thresholds:
 *   - 1000 lines OR 50KB triggers archiving
 *   - Archives first 80% of content, keeps recent 20%
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

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function archiveFile(logPath, archiveDir, dryRun) {
  if (!fs.existsSync(logPath)) {
    return false;
  }

  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n');
  const bytes = Buffer.byteLength(content, 'utf-8');

  if (lines.length <= THRESH_LINES && bytes <= THRESH_BYTES) {
    return false; // No archiving needed
  }

  ensureDir(archiveDir);

  // Generate archive filename with timestamp
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 15);
  const basename = path.basename(logPath);
  const ext = path.extname(basename);
  const stem = basename.slice(0, -ext.length || undefined);
  const archiveFilename = `${stem}_${timestamp}${ext}`;
  const archiveFilePath = path.join(archiveDir, archiveFilename);

  // Move older content (first 80% of lines) to archive
  const splitPoint = Math.floor(lines.length * 0.8);
  const archivedLines = lines.slice(0, splitPoint);
  const remainingLines = lines.slice(splitPoint);

  if (dryRun) {
    console.log(`  [DRY RUN] Would archive ${archivedLines.length} lines to ${archiveFilename}`);
    console.log(`  [DRY RUN] Would keep ${remainingLines.length} lines in ${basename}`);
    return true;
  }

  // Write archived content
  fs.writeFileSync(archiveFilePath, archivedLines.join('\n') + '\n', 'utf-8');

  // Write remaining content with archive pointer
  const dateStr = new Date().toISOString().slice(0, 10);
  const archivePointer = `\n\n---\n\n*[Archived content moved to ${archiveFilename} on ${dateStr}]*\n\n`;
  fs.writeFileSync(logPath, archivePointer + remainingLines.join('\n') + '\n', 'utf-8');

  console.log(`  ✅ Archived ${archivedLines.length} lines to ${archiveFilename}`);
  console.log(`  ✅ Kept ${remainingLines.length} lines in ${basename}`);
  return true;
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const mode = dryRun ? 'DRY RUN' : 'ARCHIVING';

  console.log(`Log capacity check (${mode}):`);
  console.log();

  let archivedCount = 0;

  for (const log of LOGS) {
    const logPath = path.join(__dirname, log.filename);
    const archiveDir = path.join(__dirname, log.archiveDir);

    if (!fs.existsSync(logPath)) {
      console.log(`- ${log.filename}: MISSING (skipping)`);
      continue;
    }

    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.split('\n').length;
    const bytes = Buffer.byteLength(content, 'utf-8');
    const needsArchive = lines > THRESH_LINES || bytes > THRESH_BYTES;

    if (needsArchive) {
      console.log(`- ${log.filename}: ${lines} lines, ${bytes} bytes -> ARCHIVING`);
      if (archiveFile(logPath, archiveDir, dryRun)) {
        archivedCount++;
      }
    } else {
      console.log(`- ${log.filename}: ${lines} lines, ${bytes} bytes -> OK`);
    }
  }

  console.log();
  if (dryRun) {
    console.log(`Would archive ${archivedCount} file(s)`);
  } else {
    console.log(`Archived ${archivedCount} file(s)`);
  }
}

main();
