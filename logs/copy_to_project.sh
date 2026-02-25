#!/bin/bash
# Copy logging system files to project logs/ directory
#
# This script is used by `gpp logs install` to set up the logging system
# in a GPP project.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${1:-$(pwd)}"
LOGS_DIR="${PROJECT_ROOT}/logs"

# Ensure logs directory exists
mkdir -p "${LOGS_DIR}"

# Copy Python scripts
cp "${SCRIPT_DIR}/archive_logs.py" "${LOGS_DIR}/"
cp "${SCRIPT_DIR}/ensure_log_capacity.py" "${LOGS_DIR}/"
chmod +x "${LOGS_DIR}/archive_logs.py"
chmod +x "${LOGS_DIR}/ensure_log_capacity.py"

# Copy documentation
cp "${SCRIPT_DIR}/PROJECT_LOGGING_SYSTEM.md" "${LOGS_DIR}/LOGGING_SYSTEM.md"
cp "${SCRIPT_DIR}/MIGRATION_GUIDE.md" "${LOGS_DIR}/" 2>/dev/null || true
cp "${SCRIPT_DIR}/UPDATE_PROMPT_TEMPLATE.md" "${LOGS_DIR}/" 2>/dev/null || true

# Create initial log files if they don't exist
for log_file in "TODO.md" "DEVELOPMENT.md" "STRATEGY_NOTES.md" "CHANGELOG.md"; do
    if [ ! -f "${LOGS_DIR}/${log_file}" ]; then
        touch "${LOGS_DIR}/${log_file}"
        echo "# ${log_file}" > "${LOGS_DIR}/${log_file}"
        echo "" >> "${LOGS_DIR}/${log_file}"
        echo "See LOGGING_SYSTEM.md for usage guidelines." >> "${LOGS_DIR}/${log_file}"
    fi
done

# Create archive directories
mkdir -p "${LOGS_DIR}/todo_archives"
mkdir -p "${LOGS_DIR}/changelog_archives"
mkdir -p "${LOGS_DIR}/development_archives"
mkdir -p "${LOGS_DIR}/strategy_archives"

echo "✅ Logging system installed in ${LOGS_DIR}"
