'use client'

import CookieConsent from 'react-cookie-consent'

export function CookieConsentBanner() {
  return (
    <CookieConsent
      location="bottom"
      buttonText="Accept"
      declineButtonText="Decline"
      enableDeclineButton
      cookieName="fu-project-cookie-consent"
      style={{
        background: '#1e293b',
        padding: '20px',
        alignItems: 'center',
      }}
      buttonStyle={{
        background: '#10b981',
        color: '#fff',
        fontSize: '14px',
        borderRadius: '6px',
        padding: '10px 20px',
      }}
      declineButtonStyle={{
        background: '#6b7280',
        color: '#fff',
        fontSize: '14px',
        borderRadius: '6px',
        padding: '10px 20px',
      }}
      expires={365}
      onAccept={() => {
        // Enable GA4 tracking
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('consent', 'update', {
            analytics_storage: 'granted'
          })
        }
      }}
      onDecline={() => {
        // Disable GA4 tracking
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('consent', 'update', {
            analytics_storage: 'denied'
          })
        }
      }}
    >
      <span style={{ fontSize: '14px' }}>
        This website uses cookies to enhance your user experience and analyze site traffic. By clicking &quot;Accept&quot;, you consent to our use of cookies.{' '}
        <a href="/privacy" style={{ color: '#10b981', textDecoration: 'underline' }}>
          Privacy Policy
        </a>
      </span>
    </CookieConsent>
  )
}
