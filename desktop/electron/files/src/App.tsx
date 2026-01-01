import { useEffect, useState } from 'react';

function App() {
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    // Get app version from Electron
    window.electronAPI.getVersion().then(setVersion);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Electron Desktop App
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Version: {version || 'Loading...'}
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Built with Electron, React, TypeScript, and Vite
        </p>
      </div>
    </div>
  );
}

export default App;
