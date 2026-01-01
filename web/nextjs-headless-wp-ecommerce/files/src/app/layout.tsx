import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CartHydration } from '@/components/cart-hydration'
import { SessionProvider } from '@/components/session-provider'
import { PriceDropNotifications } from '@/components/price-drop-notifications'
import { CookieConsentBanner } from '@/components/cookie-consent-banner'
import { SITE_CONFIG } from '@/lib/config'
import { GoogleAnalytics } from '@next/third-parties/google'
import { getHeadlessConfigOrFallback } from '@/lib/wordpress-config'
import { updateCloudWatchConfig } from '@/lib/logger'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: ['e-commerce', 'online store', 'shopping', 'products'],
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_CONFIG.url,
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: SITE_CONFIG.ogImage,
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    images: [SITE_CONFIG.ogImage],
    creator: '@yourhandle',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch configuration from WordPress (with fallback to env vars)
  const config = await getHeadlessConfigOrFallback()

  // Initialize CloudWatch logger with WordPress config
  updateCloudWatchConfig(config.cloudwatchLogGroup, config.cloudwatchRegion)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <CartHydration />
          <PriceDropNotifications />
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          {config.ga4MeasurementId && (
            <GoogleAnalytics gaId={config.ga4MeasurementId} />
          )}
          <CookieConsentBanner />
          {/* Inject Sentry config for client-side initialization */}
          {config.sentryDsn && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.__SENTRY_DSN__ = ${JSON.stringify(config.sentryDsn)};
                  window.__SENTRY_ENVIRONMENT__ = ${JSON.stringify(config.sentryEnvironment)};
                `,
              }}
            />
          )}
        </SessionProvider>
      </body>
    </html>
  )
}
