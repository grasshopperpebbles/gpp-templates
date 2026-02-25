# Archive Directories

This directory structure is created by the GPP logging system to store archived log content.

## Archive Directories

- `todo_archives/` - Archived TODO.md content
- `changelog_archives/` - Archived CHANGELOG.md content
- `development_archives/` - Archived DEVELOPMENT.md content
- `strategy_archives/` - Archived STRATEGY_NOTES.md content

## Archive Naming

Archived files are named with timestamps:
- `TODO_20251217_143022.md`
- `CHANGELOG_20251217_143022.md`
- etc.

## When to Archive

Logs are archived when they exceed:
- **1,000 lines** OR
- **50KB** in size

## Archive Process

1. Run `python logs/archive_logs.py` to check if archiving is needed
2. Run `python logs/ensure_log_capacity.py` to automatically archive
3. Or manually move older content to archive directories

## Archive Policy

- **Do not delete** archived content
- **Do not rewrite** history - archive as-is
- Leave a pointer in the main log file indicating what was archived

## Example Archive Pointer

After archiving, the main log file will contain:

```
---

*[Archived content moved to TODO_20251217_143022.md on 2025-12-17]*

[Remaining content continues here...]
```
