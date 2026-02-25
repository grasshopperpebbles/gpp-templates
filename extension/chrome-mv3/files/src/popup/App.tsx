import { useEffect, useState } from 'react';

interface ExtensionState {
  enabled: boolean;
  loading: boolean;
}

function App() {
  const [state, setState] = useState<ExtensionState>({
    enabled: true,
    loading: true,
  });

  useEffect(() => {
    // Get initial status from background
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting status:', chrome.runtime.lastError);
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }
      setState({
        enabled: response?.enabled ?? true,
        loading: false,
      });
    });
  }, []);

  const handleToggle = () => {
    setState((prev) => ({ ...prev, loading: true }));
    chrome.runtime.sendMessage({ type: 'TOGGLE_ENABLED' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error toggling:', chrome.runtime.lastError);
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }
      setState({
        enabled: response?.enabled ?? !state.enabled,
        loading: false,
      });
    });
  };

  const handleCapture = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;

    chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error capturing:', chrome.runtime.lastError);
        return;
      }
      console.log('Captured data:', response?.data);
      alert('Data captured! Check console for details.');
    });
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>My Extension</h1>
      </header>

      <main style={styles.main}>
        <div style={styles.statusRow}>
          <span>Status:</span>
          <span style={{ color: state.enabled ? '#22c55e' : '#ef4444' }}>
            {state.loading ? 'Loading...' : state.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <button
          onClick={handleToggle}
          disabled={state.loading}
          style={{
            ...styles.button,
            backgroundColor: state.enabled ? '#ef4444' : '#22c55e',
          }}
        >
          {state.enabled ? 'Disable' : 'Enable'}
        </button>

        <button
          onClick={handleCapture}
          disabled={!state.enabled || state.loading}
          style={{
            ...styles.button,
            backgroundColor: '#3b82f6',
            opacity: state.enabled ? 1 : 0.5,
          }}
        >
          Capture Page Data
        </button>
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerText}>v0.1.0</p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '200px',
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: '16px',
    backgroundColor: '#1f2937',
    color: 'white',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
  },
  main: {
    flex: 1,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  button: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  footer: {
    padding: '8px 16px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: 'white',
  },
  footerText: {
    margin: 0,
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'center',
  },
};

export default App;
