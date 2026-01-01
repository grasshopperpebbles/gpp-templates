import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number | null;
}

function App() {
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function runGppVersion() {
    setLoading(true);
    try {
      const result = await invoke<CommandResult>('run_command', {
        program: 'gpp',
        args: ['--version'],
        cwd: null,
      });

      if (result.success) {
        setOutput(`GPP Version:\n${result.stdout}`);
      } else {
        setOutput(`Error: ${result.stderr}`);
      }
    } catch (error) {
      setOutput(`Failed to run command: ${error}`);
    }
    setLoading(false);
  }

  async function listHomeDir() {
    setLoading(true);
    try {
      const files = await invoke<string[]>('list_directory', {
        path: process.env.HOME || '~',
      });
      setOutput(`Home directory contents:\n${files.join('\n')}`);
    } catch (error) {
      setOutput(`Failed to list directory: ${error}`);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Tauri Desktop App</h1>

        <div className="space-y-4 mb-8">
          <button
            onClick={runGppVersion}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded mr-4"
          >
            {loading ? 'Running...' : 'Run GPP --version'}
          </button>

          <button
            onClick={listHomeDir}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded"
          >
            {loading ? 'Loading...' : 'List Home Directory'}
          </button>
        </div>

        {output && (
          <pre className="bg-gray-800 p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono">
            {output}
          </pre>
        )}

        <div className="mt-8 text-gray-400 text-sm">
          <p>This template includes:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Tauri 2.0 with React + TypeScript</li>
            <li>IPC commands for file operations</li>
            <li>Shell command execution</li>
            <li>Secure credential storage (keychain)</li>
            <li>Tailwind CSS styling</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
