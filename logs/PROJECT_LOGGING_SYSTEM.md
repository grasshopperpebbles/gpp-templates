# Project Logging System

(Managed by gpp logs install)

## Two-Tier Logging System

GPP uses a **two-tier logging system**:

1. **Root-level logs** (`logs/` at project root) - For overall project tasks, cross-platform work, and project-wide decisions
2. **Platform-level logs** (`apps/<platform>/logs/`) - For platform-specific development tasks

**Important:** When working on a specific platform (e.g., `apps/strapi-dev`), log your work in that platform's `logs/` directory, not the root `logs/` directory.

This project uses a **4-log system**. Whenever you make a meaningful change, update **all four files** together.

## The 4 required logs

1. `logs/TODO.md` — Work queue + status
2. `logs/CHANGELOG.md` — Changelog (human-readable)
3. `logs/DEVELOPMENT.md` — Session-by-session engineering notes
4. `logs/STRATEGY_NOTES.md` — Architecture decisions, non-obvious reasoning, gotchas

## Non-negotiable rules

- **Update ALL 4 logs together** (even if the change seems small).
- When a task is "done", **run the relevant tests/validation** first and record the exact commands + results in `DEVELOPMENT.md`.
- **Root-level logs** are for project-wide tasks, cross-platform work, and overall project decisions
- **Platform-level logs** (in `apps/<platform>/logs/`) are for platform-specific development
- Keep logs **project-scoped** (this is for your project, not the gpp-cli tool).
- Archive logs when they exceed **1,000 lines** or **50KB**.

## Session summary format (append to DEVELOPMENT.md)

```
## SESSION SUMMARY - YYYY-MM-DD

**Session Focus:** <one sentence>

**Started With:**
- ...

**What We Accomplished:**
1. ...

**Commands / Verification:**
- ...

**Status:** <IN PROGRESS | COMPLETE>

**Next Session Should Work On:**
- ...

**Logs Updated:**
- TODO.md
- CHANGELOG.md
- DEVELOPMENT.md
- STRATEGY_NOTES.md
```

## Archiving

When a log crosses the archive threshold:
- Move older sections into a file in the matching `*_archives/` folder.
- Leave a short pointer in the main log (what range was archived + where).
- Do **not** rewrite history; archive as-is.

## Archive Management

**IMPORTANT:** Run capacity check BEFORE updating any log files.

```bash
# Check if archiving is needed (read-only)
node logs/archive_logs.mjs

# Perform archiving BEFORE updating logs
node logs/ensure_log_capacity.mjs

# Or use gpp CLI
gpp logs capacity --dry-run  # Check
gpp logs capacity            # Archive
```
