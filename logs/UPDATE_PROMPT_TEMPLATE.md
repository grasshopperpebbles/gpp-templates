# Update Prompt Template

Use this template when prompting AI assistants to update logs:

```
Please update the GPP logging system for this change:

**Change Description:** [Brief description]

**Files Modified:** [List of files]

**Impact:** [What this change affects]

**Testing:** [How this was tested]

Please update all 4 log files:
1. TODO.md - Mark tasks complete, add new tasks if needed
2. CHANGELOG.md - Add version entry with changes
3. DEVELOPMENT.md - Add session summary
4. STRATEGY_NOTES.md - Document any architectural decisions

Follow the format in LOGGING_SYSTEM.md.
```

## Quick Update Commands

For AI assistants, use these patterns:

### Marking Task Complete
```
Update TODO.md: Mark "[task name]" as [x] completed
Update CHANGELOG.md: Add entry for version [X.Y.Z] with changes: [list]
Update DEVELOPMENT.md: Add session summary for [date] with focus: [description]
Update STRATEGY_NOTES.md: Document decision: [decision] with rationale: [reason]
```

### Adding New Task
```
Update TODO.md: Add new task "[task name]" under [section]
Update CHANGELOG.md: Add planned entry for version [X.Y.Z]
Update DEVELOPMENT.md: Note that we're starting work on [task]
Update STRATEGY_NOTES.md: Document approach for [task] if architectural
```

### Session Summary Template
```
## SESSION SUMMARY - YYYY-MM-DD

**Session Focus:** [one sentence]

**Started With:**
- [initial state]

**What We Accomplished:**
1. [accomplishment 1]
2. [accomplishment 2]

**Commands / Verification:**
- [command 1]
- [command 2]

**Status:** [IN PROGRESS | COMPLETE]

**Next Session Should Work On:**
- [next task 1]
- [next task 2]

**Logs Updated:**
- TODO.md
- CHANGELOG.md
- DEVELOPMENT.md
- STRATEGY_NOTES.md
```
