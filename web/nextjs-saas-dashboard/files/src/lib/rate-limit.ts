/**
 * Rate Limiting Utility
 *
 * Implements token bucket algorithm using LRU cache.
 * Works in serverless environments (Next.js API routes).
 *
 * Usage:
 * ```typescript
 * import { RateLimitPresets, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit'
 *
 * const limiter = RateLimitPresets.ai_generation()
 *
 * export async function POST(request: Request) {
 *   const identifier = getClientIdentifier(request)
 *   const limit = 10
 *
 *   try {
 *     await limiter.check(limit, identifier)
 *   } catch {
 *     const remaining = Math.max(0, limit - limiter.getUsage(identifier))
 *     return new Response('Rate limit exceeded', {
 *       status: 429,
 *       headers: getRateLimitHeaders(limit, remaining, Date.now() + 60000)
 *     })
 *   }
 *
 *   // Process request...
 * }
 * ```
 */

import { LRUCache } from 'lru-cache'

export interface RateLimitOptions {
  /**
   * Time window in milliseconds
   * @default 60000 (1 minute)
   */
  interval?: number

  /**
   * Maximum number of unique tokens (users/IPs) to track per interval
   * @default 500
   */
  uniqueTokenPerInterval?: number
}

export interface RateLimiter {
  /**
   * Check if request is within rate limit
   * @param limit - Maximum requests allowed per interval
   * @param token - Unique identifier (user ID, IP, session, etc.)
   * @returns Promise that resolves if within limit, rejects if exceeded
   */
  check: (limit: number, token: string) => Promise<void>

  /**
   * Get current usage for a token
   * @param token - Unique identifier
   * @returns Current request count for this interval
   */
  getUsage: (token: string) => number

  /**
   * Reset rate limit for a specific token
   * @param token - Unique identifier
   */
  reset: (token: string) => void
}

/**
 * Create a rate limiter instance
 */
export function rateLimit(options?: RateLimitOptions): RateLimiter {
  const interval = options?.interval || 60000 // 1 minute default
  const uniqueTokenPerInterval = options?.uniqueTokenPerInterval || 500

  const tokenCache = new LRUCache<string, number[]>({
    max: uniqueTokenPerInterval,
    ttl: interval,
  })

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || [0]

        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount)
        }

        tokenCount[0] += 1
        const currentUsage = tokenCount[0]
        const isRateLimited = currentUsage > limit

        if (isRateLimited) {
          reject(new Error(`Rate limit exceeded. Maximum ${limit} requests per ${interval}ms`))
        } else {
          resolve()
        }
      }),

    getUsage: (token: string) => {
      const tokenCount = tokenCache.get(token)
      return tokenCount ? tokenCount[0] : 0
    },

    reset: (token: string) => {
      tokenCache.delete(token)
    },
  }
}

/**
 * Get client identifier from request
 * Priority: User ID > Session ID > IP Address
 */
export function getClientIdentifier(request: Request): string {
  const headers = request.headers

  // Priority 1: User ID (if authenticated)
  const userId = headers.get('x-user-id')
  if (userId) return `user:${userId}`

  // Priority 2: Session ID
  const sessionId = headers.get('x-session-id')
  if (sessionId) return `session:${sessionId}`

  // Priority 3: IP Address (Vercel/AWS forwards real IP here)
  const forwarded = headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : headers.get('x-real-ip') || 'unknown'

  return `ip:${ip}`
}

/**
 * Rate limit response headers (standard)
 */
export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
    'X-RateLimit-Reset': resetTime.toString(),
  }
}

/**
 * Preset rate limiters for common use cases
 */
export const RateLimitPresets = {
  /**
   * Strict: 5 requests per minute
   * Use for: Login, password reset, sensitive operations
   */
  strict: () => rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 }),

  /**
   * Standard: 30 requests per minute
   * Use for: General API calls, form submissions
   */
  standard: () => rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 }),

  /**
   * Relaxed: 120 requests per minute (2 per second)
   * Use for: Read operations, searches, browsing
   */
  relaxed: () => rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 }),

  /**
   * Payment: 3 requests per minute
   * Use for: Payment processing, financial operations
   */
  payment: () => rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 }),

  // ===== AI-SPECIFIC PRESETS =====

  /**
   * AI Generation: 10 requests per minute
   * Use for: AI text/image generation (expensive operations)
   */
  ai_generation: () => rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 }),

  /**
   * AI Free Tier: 5 requests per hour
   * Use for: Free tier AI generation limits
   */
  ai_free_tier: () => rateLimit({ interval: 60 * 60 * 1000, uniqueTokenPerInterval: 500 }),

  /**
   * AI Pro Tier: 100 requests per hour
   * Use for: Pro/paid tier AI generation limits
   */
  ai_pro_tier: () => rateLimit({ interval: 60 * 60 * 1000, uniqueTokenPerInterval: 500 }),

  /**
   * AI Batch: 5 requests per minute
   * Use for: Batch AI operations (multiple generations)
   */
  ai_batch: () => rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 }),
}

/**
 * Tiered rate limiter for subscription-based limits
 *
 * Usage:
 * ```typescript
 * const limiter = createTieredLimiter({
 *   free: { requests: 5, window: 3600000 },    // 5 per hour
 *   pro: { requests: 100, window: 3600000 },   // 100 per hour
 *   enterprise: { requests: 1000, window: 3600000 },
 * })
 *
 * // In API route:
 * await limiter.check(userTier, identifier)
 * ```
 */
export function createTieredLimiter(
  tiers: Record<string, { requests: number; window: number }>
) {
  const limiters = Object.fromEntries(
    Object.entries(tiers).map(([tier, config]) => [
      tier,
      {
        limiter: rateLimit({ interval: config.window }),
        requests: config.requests,
      },
    ])
  )

  return {
    check: async (tier: string, identifier: string) => {
      const tierConfig = limiters[tier] || limiters['free']
      if (!tierConfig) {
        throw new Error(`Unknown tier: ${tier}`)
      }

      const tieredIdentifier = `${identifier}:${tier}`
      await tierConfig.limiter.check(tierConfig.requests, tieredIdentifier)
    },

    getUsage: (tier: string, identifier: string) => {
      const tierConfig = limiters[tier] || limiters['free']
      if (!tierConfig) return 0

      const tieredIdentifier = `${identifier}:${tier}`
      return tierConfig.limiter.getUsage(tieredIdentifier)
    },

    getLimit: (tier: string) => {
      const tierConfig = limiters[tier] || limiters['free']
      return tierConfig?.requests || 0
    },
  }
}

// Pre-configured tiered limiter for AI operations
export const aiTieredLimiter = createTieredLimiter({
  free: { requests: 5, window: 60 * 60 * 1000 },      // 5 per hour
  pro: { requests: 100, window: 60 * 60 * 1000 },     // 100 per hour
  enterprise: { requests: 1000, window: 60 * 60 * 1000 }, // 1000 per hour
})
