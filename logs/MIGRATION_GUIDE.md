# Logging System Migration Guide

If you're adding the GPP logging system to an existing project, follow these steps:

## 1. Install Logging System

Run from your project root:
```bash
gpp logs install
```

Or manually:
```bash
# Copy logging system files
cp -r /path/to/gpp-cli/templates/logs/* logs/

# Make scripts executable
chmod +x logs/archive_logs.py
chmod +x logs/ensure_log_capacity.py
```

## 2. Initialize Log Files

The logging system requires 4 log files:

1. `logs/TODO.md` - Work queue and task status
2. `logs/CHANGELOG.md` - Changelog
3. `logs/DEVELOPMENT.md` - Session-by-session notes
4. `logs/STRATEGY_NOTES.md` - Architecture decisions

If these don't exist, create them with initial headers:

```bash
# Create TODO.md
cat > logs/TODO.md << 'EOF'
# TODO List

## Legend
- [~] Under Development
- [?] Under Review
- [x] Completed
- [ ] Not Started

## Current Tasks
- [ ] Migrate to GPP logging system
EOF

# Create CHANGELOG.md
cat > logs/CHANGELOG.md << 'EOF'
# Changelog
===========

Version 0.1.0 - Initial Migration
Date: $(date +%Y-%m-%d)
Status: ACTIVE

Notes:
- Migrated to GPP logging system
EOF

# Create DEVELOPMENT.md
cat > logs/DEVELOPMENT.md << 'EOF'
# Development Log

## SESSION SUMMARY - $(date +%Y-%m-%d)

**Session Focus:** Migrate to GPP logging system

**What We Accomplished:**
1. Installed GPP logging system
2. Created initial log files

**Status:** COMPLETE
EOF

# Create STRATEGY_NOTES.md
cat > logs/STRATEGY_NOTES.md << 'EOF'
# Strategy Notes

## Migration to GPP Logging System

**Decision:** Adopt GPP 4-log system for project tracking.

**Rationale:**
- Structured approach to project documentation
- Clear separation of concerns (TODO, versions, development, strategy)
- Archive system prevents log bloat
EOF
```

## 3. Archive Existing Logs (Optional)

If you have existing log files, you can:

1. **Keep them separate** - Leave old logs where they are
2. **Migrate content** - Copy relevant sections into the new log files
3. **Archive them** - Move old logs to `logs/legacy/` directory

## 4. Update Your Workflow

Going forward:
- Update all 4 logs together when making changes
- Run `python logs/archive_logs.py` periodically to check capacity
- Use `python logs/ensure_log_capacity.py` to auto-archive when needed

## 5. Verify Installation

Check that everything is set up correctly:

```bash
# Check log files exist
ls -la logs/*.md logs/*.txt

# Check archive directories exist
ls -d logs/*_archives

# Test archive script
python logs/archive_logs.py

# Test capacity script (dry run)
python logs/ensure_log_capacity.py --dry-run
```

## Troubleshooting

**Issue:** Scripts not executable
```bash
chmod +x logs/*.py
```

**Issue:** Python not found
- Ensure Python 3.6+ is installed
- Use `python3` instead of `python` if needed

**Issue:** Archive directories missing
```bash
mkdir -p logs/{todo,changelog,development,strategy}_archives
```
