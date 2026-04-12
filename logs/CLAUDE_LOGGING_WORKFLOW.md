## Logging System Workflow

**CRITICAL:** This project uses a four-log system for tracking development. You MUST follow this workflow automatically.

### When Starting a New Session

**BEFORE doing anything else**, read `docs/NEXT_SESSION.md` if it exists. This file contains a handoff prompt from the previous session describing what was worked on and what needs attention next. Use it to orient yourself and inform your approach.

### When User Gives You a Task

**BEFORE starting any work**, automatically update ALL 4 logs:

1. **Check for logging system:**
   ```bash
   ls logs/TODO.md 2>/dev/null
   ```

2. **If logs exist, update ALL 4 FIRST:**
   - Read ALL 4 logs to see current state
   - **TODO.md** — Update the CURRENT SESSION section:
     ```markdown
     ## CURRENT SESSION

     ### Currently Working On:
     - [The task the user just gave you]

     ### Last Completed (This Session):
     - [Previous completed items, if any]
     ```
   - If this is a new major task, add it to ACTIVE TASKS section
   - **CHANGELOG.md** — Add a new entry header for the upcoming work
   - **DEVELOPMENT.md** — Log session start and task description
   - **STRATEGY_NOTES.md** — Note any relevant strategic context for the task
   - THEN inform the user: "Updated all 4 logs to track this task."
   - THEN start working on the task

3. **Purpose: Crash Recovery**
   - If session crashes, user can check the 4 logs
   - They'll see exactly what was being worked on
   - They can tell you: "Continue where we left off"

### As You Work

**Throughout the task — ALL 4 logs must stay in sync at every step:**

1. **When completing sub-tasks:**
   - **Update ALL 4 logs:**
     - **TODO.md** — Move completed item to "Last Completed (This Session)", mark sub-task as `[x]`
     - **CHANGELOG.md** — Add the completed sub-task under the current entry
     - **DEVELOPMENT.md** — Document what was done and any technical details
     - **STRATEGY_NOTES.md** — Record any patterns or learnings discovered
   - Continue to next sub-task

2. **When all sub-tasks complete:**
   - **MANDATORY: YOU MUST TEST BEFORE PROCEEDING. THIS IS NOT OPTIONAL. DO NOT SKIP THIS STEP.**
   - Run ALL relevant tests, linters, build commands, or manual verification
   - **YOU MUST SHOW TEST OUTPUT TO THE USER** — do not just say "tests pass"
   - If tests fail: add new subtasks to fix issues, update ALL 4 logs, loop back
   - If tests pass: update ALL 4 logs with implementation summary and test results
   - Mark task as PENDING REVIEW in TODO.md
   - Wait for user approval

3. **After user approval:**
   - **Update ALL 4 logs** with final completion details:
     - **TODO.md** — Move task to COMPLETED TASKS, mark as COMPLETED
     - **CHANGELOG.md** — Finalize the version entry
     - **DEVELOPMENT.md** — Add final implementation summary
     - **STRATEGY_NOTES.md** — Document any strategic learnings
   - **AUTOMATICALLY COMMIT** — stage all changed files and create a git commit with a descriptive message. Do not wait for the user to ask.

### At End of Session

**Triggered when the user explicitly signals the session is over** (e.g., "that's all", "I'm done", "ending session", "that's all for now", "wrapping up", or any similar phrase):

1. **Update ALL 4 logs:**
   - **TODO.md** — Update CURRENT SESSION: if nothing in progress, write "Nothing active - session ended cleanly"; if task incomplete, leave current task description
   - **CHANGELOG.md** — Ensure all work from this session is captured
   - **DEVELOPMENT.md** — Add SESSION SUMMARY (see LOGGING_SYSTEM.md for format)
   - **STRATEGY_NOTES.md** — Capture any outstanding strategic observations from the session
2. **Write `docs/NEXT_SESSION.md`** — This is a handoff prompt for the next Claude session. Overwrite the file each time. Use this format:
   ```markdown
   # Next Session Handoff

   ## Previous Session Summary
   - **Date:** YYYY-MM-DD
   - **What was worked on:** [concise description of tasks completed or in progress]
   - **Key changes made:** [list of significant files/features changed]
   - **Current state:** [what works, what's broken, what's partially done]

   ## What Needs Attention Next
   - [Prioritized list of tasks, bugs, or follow-ups for the next session]

   ## Context the Next Session Should Know
   - [Any non-obvious gotchas, decisions made, or things to watch out for]
   ```
3. **Automatically commit** all log updates and `docs/NEXT_SESSION.md` with a descriptive message
4. **Check for unpushed commits** — run `git log @{u}..HEAD --oneline` (or equivalent). If there are commits that haven't been pushed to the remote, inform the user and ask if they want to push before ending the session.

### Key Rules

- **ALWAYS** read `docs/NEXT_SESSION.md` at the start of every new session
- **ALWAYS** write `docs/NEXT_SESSION.md` at the end of every session
- **ALWAYS** check for ALL 4 logs when starting work
- **ALWAYS** update ALL 4 logs before working on a task
- **ALWAYS** update ALL 4 logs after completing each sub-task
- **ALWAYS** update ALL 4 logs together — there is NO scenario where only one log is updated
- **NEVER** wait for user to ask you to update logs — do it proactively
- **NEVER** skip testing when sub-tasks complete — show test output to the user
- **ALWAYS** auto-commit after task completion (post-approval) and at end of session
- **ALWAYS** check for unpushed commits at end of session and prompt the user before they leave
- Keep all logs synchronized with your actual work at all times

### Log File Locations

```
logs/
├── TODO.md                    # Work queue + crash recovery
├── CHANGELOG.md               # Version history
├── DEVELOPMENT.md             # Session-by-session engineering notes
├── STRATEGY_NOTES.md          # Architecture decisions + learnings
├── LOGGING_SYSTEM.md          # Full documentation
├── archive_logs.mjs           # Archive check script
├── ensure_log_capacity.mjs    # Archive automation script
├── todo_archives/             # Archived TODO files
├── changelog_archives/        # Archived changelogs
├── development_archives/      # Archived development logs
└── strategy_archives/         # Archived strategy notes
```

For complete logging methodology, see: `logs/LOGGING_SYSTEM.md`
