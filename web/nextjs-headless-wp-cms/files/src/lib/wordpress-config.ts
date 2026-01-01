/**
 * WordPress Headless Configuration
 *
 * Fetches configuration from WordPress via GraphQL.
 * Configuration is stored in WordPress admin (Settings → Headless Config)
 * and exposed via the headless-config plugin.
 *
 * This eliminates hardcoded credentials and allows runtime configuration changes.
 */

import { graphqlClient } from './graphql'

export interface HeadlessConfig {
  ga4MeasurementId: string | null
  sentryDsn: string | null
  sentryEnvironment: string
  cloudwatchLogGroup: string | null
  cloudwatchRegion: string
  frontendUrl: string | null
  environment: string
}

const HEADLESS_CONFIG_QUERY = `
  query GetHeadlessConfig {
    headlessConfig {
      ga4MeasurementId
      sentryDsn
      sentryEnvironment
      cloudwatchLogGroup
      cloudwatchRegion
      frontendUrl
      environment
    }
  }
`

// Cache the config for 5 minutes to reduce GraphQL calls
let configCache: HeadlessConfig | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch headless configuration from WordPress
 *
 * @returns HeadlessConfig object
 * @throws Error if GraphQL query fails
 */
export async function getHeadlessConfig(): Promise<HeadlessConfig> {
  // Return cached config if still valid
  if (configCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return configCache
  }

  try {
    const response = await graphqlClient.query<{ headlessConfig: HeadlessConfig }>(
      HEADLESS_CONFIG_QUERY
    )

    configCache = response.headlessConfig
    cacheTimestamp = Date.now()

    return response.headlessConfig
  } catch (error) {
    console.error('Failed to fetch headless config from WordPress:', error)

    // Return fallback config with null values
    // This allows the app to continue running even if WordPress is unreachable
    return {
      ga4MeasurementId: null,
      sentryDsn: null,
      sentryEnvironment: process.env.NODE_ENV || 'production',
      cloudwatchLogGroup: null,
      cloudwatchRegion: 'us-east-1',
      frontendUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
      environment: process.env.NODE_ENV || 'production',
    }
  }
}

/**
 * Get config at build time (for static generation)
 * Falls back to environment variables if WordPress is unreachable
 */
export async function getHeadlessConfigOrFallback(): Promise<HeadlessConfig> {
  try {
    return await getHeadlessConfig()
  } catch (error) {
    console.warn('Using fallback config from environment variables:', error)

    return {
      ga4MeasurementId: process.env.NEXT_PUBLIC_GA_ID || null,
      sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || null,
      sentryEnvironment: process.env.NODE_ENV || 'production',
      cloudwatchLogGroup: process.env.CLOUDWATCH_LOG_GROUP || null,
      cloudwatchRegion: process.env.AWS_REGION || 'us-east-1',
      frontendUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
      environment: process.env.NODE_ENV || 'production',
    }
  }
}

/**
 * Clear the config cache
 * Useful for testing or forcing a refresh
 */
export function clearConfigCache(): void {
  configCache = null
  cacheTimestamp = 0
}
