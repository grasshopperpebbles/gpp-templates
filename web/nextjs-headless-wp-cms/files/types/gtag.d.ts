// Google Analytics gtag types
declare global {
  interface Window {
    gtag?: (
      command: 'consent',
      action: 'update' | 'default',
      params: {
        analytics_storage?: 'granted' | 'denied'
        ad_storage?: 'granted' | 'denied'
      }
    ) => void
  }
}

export {}
