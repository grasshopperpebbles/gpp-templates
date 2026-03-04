# Headless Config WordPress Plugin

Centralized configuration management for headless Next.js frontends. Store API keys, measurement IDs, and other configuration in WordPress and expose via GraphQL.

## Features

- ✅ WordPress admin settings page
- ✅ GraphQL exposure via WPGraphQL
- ✅ Sanitized and validated inputs
- ✅ Support for multiple environments
- ✅ No hardcoded credentials in frontend

## Configuration Fields

### Analytics & Monitoring
- **GA4 Measurement ID**: Google Analytics 4 tracking ID
- **Sentry DSN**: Sentry error tracking Data Source Name
- **Sentry Environment**: Environment name for Sentry

### AWS CloudWatch
- **CloudWatch Log Group**: Log group name for Next.js logs
- **AWS Region**: AWS region for CloudWatch

### Site Configuration
- **Frontend URL**: Your Next.js frontend URL
- **Environment**: Current environment (development/staging/production)

## WordPress Admin

Navigate to: **Settings → Headless Config**

## GraphQL Query

```graphql
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
```

## Next.js Usage

```typescript
// lib/wordpress-config.ts
import { graphqlClient } from './graphql'

interface HeadlessConfig {
  ga4MeasurementId: string | null
  sentryDsn: string | null
  sentryEnvironment: string
  cloudwatchLogGroup: string | null
  cloudwatchRegion: string
  frontendUrl: string | null
  environment: string
}

export async function getHeadlessConfig(): Promise<HeadlessConfig> {
  const query = `
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

  const response = await graphqlClient.request(query)
  return response.headlessConfig
}
```

## Requirements

- WordPress 6.0+
- PHP 8.0+
- WPGraphQL plugin installed and activated

## Installation

1. Copy plugin folder to `wp-content/plugins/headless-config/`
2. Activate plugin in WordPress admin
3. Configure settings at Settings → Headless Config
4. Query via GraphQL from your Next.js app

## Security

All inputs are sanitized using WordPress functions:
- `sanitize_text_field()` for text inputs
- `esc_url_raw()` for URLs
- Values are escaped on output

## License

GPL v2 or later
