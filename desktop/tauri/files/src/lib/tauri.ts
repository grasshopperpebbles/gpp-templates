import { invoke } from '@tauri-apps/api/core';

/**
 * File operation result
 */
export interface FileResult {
  success: boolean;
  data?: string;
  error?: string;
}

/**
 * Command execution result
 */
export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number | null;
}

/**
 * Read a file from the app data folder (`path` is relative to it; `..` is refused)
 */
export async function readFile(path: string): Promise<FileResult> {
  return invoke<FileResult>('read_file', { path });
}

/**
 * Write content to a file in the app data folder
 */
export async function writeFile(path: string, content: string): Promise<FileResult> {
  return invoke<FileResult>('write_file', { path, content });
}

/**
 * List a directory in the app data folder ('' for the folder itself)
 */
export async function listDirectory(path = ''): Promise<string[]> {
  return invoke<string[]>('list_directory', { path });
}

/**
 * Execute a CLI command. Only programs in ALLOWED_PROGRAMS (src-tauri/src/lib.rs) run.
 */
export async function runCommand(
  program: string,
  args: string[] = [],
  cwd?: string
): Promise<CommandResult> {
  return invoke<CommandResult>('run_command', { program, args, cwd });
}

/**
 * Run GPP command with JSON output
 */
export async function runGpp(
  args: string[],
  cwd?: string
): Promise<{ success: boolean; data?: unknown; error?: { code: string; message: string } }> {
  const result = await runCommand('gpp', ['--json', ...args], cwd);

  if (!result.success) {
    return {
      success: false,
      error: { code: 'COMMAND_FAILED', message: result.stderr },
    };
  }

  try {
    return JSON.parse(result.stdout);
  } catch {
    return {
      success: false,
      error: { code: 'PARSE_ERROR', message: 'Failed to parse GPP output' },
    };
  }
}

/**
 * Store a credential in the system keychain (under this app's identifier)
 */
export async function storeCredential(account: string, password: string): Promise<void> {
  return invoke('store_credential', { account, password });
}

/**
 * Retrieve a credential from the system keychain
 */
export async function getCredential(account: string): Promise<string> {
  return invoke<string>('get_credential', { account });
}

/**
 * Delete a credential from the system keychain
 */
export async function deleteCredential(account: string): Promise<void> {
  return invoke('delete_credential', { account });
}
