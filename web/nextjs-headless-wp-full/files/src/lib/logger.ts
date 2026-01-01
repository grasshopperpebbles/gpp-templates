/**
 * Hybrid Logging System - CloudWatch + Sentry
 *
 * This logger provides structured logging to AWS CloudWatch while working
 * alongside Sentry for error tracking.
 *
 * Architecture:
 * - CloudWatch: All logs (info, warn, error, debug) for analytics and monitoring
 * - Sentry: Errors and exceptions only, with user context and Session Replay
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logger'
 *
 * logger.info('User logged in', { userId: 123 })
 * logger.error('Payment failed', { error, orderId: 456 })
 * logger.warn('Rate limit approaching', { requests: 95, limit: 100 })
 * ```
 */

import winston from 'winston'
import Transport from 'winston-transport'
import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs'

// Configuration from WordPress (will be fetched at runtime)
const cloudWatchConfig = {
  logGroup: process.env.CLOUDWATCH_LOG_GROUP || '/aws/nextjs/local',
  region: process.env.AWS_REGION || 'us-east-1',
  enabled: process.env.NODE_ENV === 'production',
}

/**
 * Update CloudWatch config from WordPress
 * Called after fetching headlessConfig
 */
export function updateCloudWatchConfig(logGroup: string | null, region: string) {
  if (logGroup) {
    cloudWatchConfig.logGroup = logGroup
    cloudWatchConfig.region = region
    cloudWatchConfig.enabled = true
  }
}

/**
 * CloudWatch Transport for Winston
 */
class CloudWatchTransport extends Transport {
  private client: CloudWatchLogsClient
  private logGroupName: string
  private logStreamName: string
  private sequenceToken: string | undefined

  constructor(opts: winston.transport.TransportStreamOptions) {
    super(opts)

    this.logGroupName = cloudWatchConfig.logGroup
    this.logStreamName = `nextjs-${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substring(7)}`

    this.client = new CloudWatchLogsClient({
      region: cloudWatchConfig.region,
    })

    // Create log stream (async, doesn't block)
    this.createLogStream().catch(err => {
      console.error('Failed to create CloudWatch log stream:', err)
    })
  }

  private async createLogStream() {
    try {
      await this.client.send(new CreateLogStreamCommand({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
      }))
    } catch (error: unknown) {
      // Log stream might already exist, ignore error
      if (error && typeof error === 'object' && 'name' in error && error.name !== 'ResourceAlreadyExistsException') {
        throw error
      }
    }
  }

  async log(info: winston.Logform.TransformableInfo, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info)
    })

    try {
      await this.sendToCloudWatch(info)
      callback()
    } catch (error) {
      console.error('CloudWatch log failed:', error)
      callback()
    }
  }

  private async sendToCloudWatch(info: winston.Logform.TransformableInfo) {
    const timestamp = Date.now()

    const logEvent = {
      message: JSON.stringify({
        level: info.level,
        message: info.message,
        timestamp: new Date().toISOString(),
        ...(info.metadata && typeof info.metadata === 'object' ? info.metadata : {}),
      }),
      timestamp,
    }

    try {
      const response = await this.client.send(new PutLogEventsCommand({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents: [logEvent],
        sequenceToken: this.sequenceToken,
      }))

      this.sequenceToken = response.nextSequenceToken
    } catch (error: unknown) {
      // If sequence token is invalid, retry once
      if (error && typeof error === 'object' && 'name' in error && error.name === 'InvalidSequenceTokenException') {
        this.sequenceToken = (error as { expectedSequenceToken?: string }).expectedSequenceToken
        await this.sendToCloudWatch(info)
      } else {
        throw error
      }
    }
  }
}

/**
 * Create Winston logger
 */
const transports: winston.transport[] = [
  // Console transport (always enabled for development)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`
        if (Object.keys(metadata).length > 0) {
          msg += ` ${JSON.stringify(metadata)}`
        }
        return msg
      })
    ),
  }),
]

// Add CloudWatch transport in production
if (cloudWatchConfig.enabled) {
  transports.push(new CloudWatchTransport({
    level: 'info',
  }))
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
  // Don't exit on uncaught exceptions (let Sentry handle those)
  exitOnError: false,
})

/**
 * Structured logging helpers
 */
export const log = {
  /**
   * Log informational messages
   * These go to CloudWatch but NOT to Sentry
   */
  info: (message: string, metadata?: Record<string, unknown>) => {
    logger.info(message, { metadata })
  },

  /**
   * Log warnings
   * These go to CloudWatch but NOT to Sentry
   */
  warn: (message: string, metadata?: Record<string, unknown>) => {
    logger.warn(message, { metadata })
  },

  /**
   * Log errors
   * These go to BOTH CloudWatch AND Sentry
   */
  error: (message: string, error?: Error, metadata?: Record<string, unknown>) => {
    logger.error(message, {
      metadata,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : undefined,
    })

    // Also send to Sentry if available
    if (typeof window !== 'undefined') {
      const windowWithSentry = window as Window & {
        Sentry?: {
          captureException: (error: Error, options?: { extra?: Record<string, unknown> }) => void
        }
      }
      if (windowWithSentry.Sentry) {
        windowWithSentry.Sentry.captureException(error || new Error(message), {
          extra: metadata,
        })
      }
    }
  },

  /**
   * Log debug messages
   * Only in development
   */
  debug: (message: string, metadata?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(message, { metadata })
    }
  },

  /**
   * Log API requests
   */
  apiRequest: (method: string, url: string, metadata?: Record<string, unknown>) => {
    logger.info('API Request', {
      metadata: {
        type: 'api_request',
        method,
        url,
        ...metadata,
      },
    })
  },

  /**
   * Log API responses
   */
  apiResponse: (method: string, url: string, status: number, duration: number, metadata?: Record<string, unknown>) => {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'
    logger.log(level, 'API Response', {
      metadata: {
        type: 'api_response',
        method,
        url,
        status,
        duration,
        ...metadata,
      },
    })
  },

  /**
   * Log business events (e-commerce)
   */
  business: (event: string, metadata?: Record<string, unknown>) => {
    logger.info('Business Event', {
      metadata: {
        type: 'business_event',
        event,
        ...metadata,
      },
    })
  },
}

export { logger }
export default log
