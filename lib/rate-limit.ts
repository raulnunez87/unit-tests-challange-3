import { LRUCache } from 'lru-cache'

/**
 * Rate limiting utility using in-memory LRU cache
 * Following OWASP ASVS V4.1 - Rate Limiting and Throttling
 * Prevents brute force attacks and API abuse
 */

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5 // Maximum attempts per window
const RATE_LIMIT_BLOCK_DURATION_MS = 60 * 60 * 1000 // 1 hour block duration

// LRU cache for storing rate limit data
// Uses IP address as key, stores attempt count and timestamps
const rateLimitCache = new LRUCache<string, RateLimitData>({
  max: 10000, // Maximum 10,000 unique IPs
  ttl: RATE_LIMIT_WINDOW_MS, // Auto-expire after window
  updateAgeOnGet: false,
  updateAgeOnHas: false
})

/**
 * Rate limit data structure
 * Tracks attempts and timestamps for each IP
 */
interface RateLimitData {
  attempts: number
  firstAttempt: number
  lastAttempt: number
  blockedUntil?: number
}

/**
 * Rate limit result interface
 * Provides information about current rate limit status
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

/**
 * Checks if an IP address is within rate limits
 * 
 * Security considerations:
 * - Tracks attempts per IP address
 * - Implements sliding window rate limiting
 * - Blocks IPs that exceed threshold
 * - Provides consistent error responses
 * 
 * @param ip - Client IP address
 * @returns Rate limit result with status and metadata
 */
export function checkRateLimit(ip: string): RateLimitResult {
  try {
    // Validate IP address
    if (!ip || typeof ip !== 'string') {
      throw new Error('Invalid IP address')
    }

    const now = Date.now()
    const data = rateLimitCache.get(ip)

    // If no previous data, create new entry
    if (!data) {
      const newData: RateLimitData = {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      }
      rateLimitCache.set(ip, newData)

      return {
        allowed: true,
        remaining: RATE_LIMIT_MAX_ATTEMPTS - 1,
        resetTime: now + RATE_LIMIT_WINDOW_MS
      }
    }

    // Check if IP is currently blocked
    if (data.blockedUntil && now < data.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.blockedUntil,
        retryAfter: Math.ceil((data.blockedUntil - now) / 1000)
      }
    }

    // Check if window has expired
    if (now - data.firstAttempt > RATE_LIMIT_WINDOW_MS) {
      // Reset window
      const newData: RateLimitData = {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      }
      rateLimitCache.set(ip, newData)

      return {
        allowed: true,
        remaining: RATE_LIMIT_MAX_ATTEMPTS - 1,
        resetTime: now + RATE_LIMIT_WINDOW_MS
      }
    }

    // Increment attempts
    const updatedData: RateLimitData = {
      ...data,
      attempts: data.attempts + 1,
      lastAttempt: now
    }

    // Check if limit exceeded
    if (updatedData.attempts > RATE_LIMIT_MAX_ATTEMPTS) {
      // Block IP for specified duration
      updatedData.blockedUntil = now + RATE_LIMIT_BLOCK_DURATION_MS
      rateLimitCache.set(ip, updatedData)

      return {
        allowed: false,
        remaining: 0,
        resetTime: updatedData.blockedUntil,
        retryAfter: Math.ceil(RATE_LIMIT_BLOCK_DURATION_MS / 1000)
      }
    }

    // Update cache with new attempt count
    rateLimitCache.set(ip, updatedData)

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_ATTEMPTS - updatedData.attempts,
      resetTime: data.firstAttempt + RATE_LIMIT_WINDOW_MS
    }
  } catch (error) {
    console.error('Rate limit check error:', error instanceof Error ? error.message : 'Unknown error')
    
    // Fail open - allow request if rate limiting fails
    // This prevents rate limiting from becoming a denial of service
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_ATTEMPTS,
      resetTime: Date.now() + RATE_LIMIT_WINDOW_MS
    }
  }
}

/**
 * Records a failed authentication attempt
 * Used to track unsuccessful login attempts separately
 * 
 * @param ip - Client IP address
 */
export function recordFailedAttempt(ip: string): void {
  try {
    if (!ip || typeof ip !== 'string') {
      return
    }

    const now = Date.now()
    const data = rateLimitCache.get(ip)

    if (!data) {
      const newData: RateLimitData = {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      }
      rateLimitCache.set(ip, newData)
      return
    }

    // Increment failed attempts
    const updatedData: RateLimitData = {
      ...data,
      attempts: data.attempts + 1,
      lastAttempt: now
    }

    rateLimitCache.set(ip, updatedData)
  } catch (error) {
    // Silently fail to prevent logging errors from affecting auth flow
    console.error('Failed attempt recording error:', error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Checks rate limiting for failed attempts without incrementing
 * Used to check if an IP should be rate limited for failed attempts
 * 
 * @param ip - Client IP address
 * @returns Rate limit result with status and metadata
 */
export function checkFailedAttemptRateLimit(ip: string): RateLimitResult {
  try {
    // Validate IP address
    if (!ip || typeof ip !== 'string') {
      throw new Error('Invalid IP address')
    }

    const now = Date.now()
    const data = rateLimitCache.get(ip)

    // If no previous data, allow the request
    if (!data) {
      return {
        allowed: true,
        remaining: RATE_LIMIT_MAX_ATTEMPTS,
        resetTime: now + RATE_LIMIT_WINDOW_MS
      }
    }

    // Check if IP is currently blocked
    if (data.blockedUntil && now < data.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.blockedUntil,
        retryAfter: Math.ceil((data.blockedUntil - now) / 1000)
      }
    }

    // Check if window has expired
    if (now - data.firstAttempt > RATE_LIMIT_WINDOW_MS) {
      return {
        allowed: true,
        remaining: RATE_LIMIT_MAX_ATTEMPTS,
        resetTime: now + RATE_LIMIT_WINDOW_MS
      }
    }

    // Check if limit exceeded (without incrementing)
    if (data.attempts > RATE_LIMIT_MAX_ATTEMPTS) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.firstAttempt + RATE_LIMIT_WINDOW_MS,
        retryAfter: Math.ceil((data.firstAttempt + RATE_LIMIT_WINDOW_MS - now) / 1000)
      }
    }

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_ATTEMPTS - data.attempts,
      resetTime: data.firstAttempt + RATE_LIMIT_WINDOW_MS
    }
  } catch (error) {
    console.error('Rate limit check error:', error instanceof Error ? error.message : 'Unknown error')
    
    // Fail open - allow request if rate limiting fails
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_ATTEMPTS,
      resetTime: Date.now() + RATE_LIMIT_WINDOW_MS
    }
  }
}

/**
 * Clears rate limit data for an IP address or all data
 * Used for testing or manual IP unblocking
 * 
 * @param ip - IP address to clear, or undefined to clear all data
 */
export function clearRateLimit(ip?: string): void {
  try {
    if (ip === undefined) {
      // Clear all data
      rateLimitCache.clear()
      return
    }
    
    if (!ip || typeof ip !== 'string') {
      return
    }
    rateLimitCache.delete(ip)
  } catch (error) {
    console.error('Rate limit clear error:', error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Gets current rate limit status for an IP
 * Useful for monitoring and debugging
 * 
 * @param ip - IP address to check
 * @returns Current rate limit data or null if not found
 */
export function getRateLimitStatus(ip: string): RateLimitData | null {
  try {
    if (!ip || typeof ip !== 'string') {
      return null
    }
    return rateLimitCache.get(ip) || null
  } catch (error) {
    console.error('Rate limit status error:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

/**
 * Extracts client IP address from Next.js request headers
 * Handles various proxy configurations
 * 
 * @param headers - Request headers object
 * @returns Client IP address or 'unknown'
 */
export function getClientIP(headers: Headers): string {
  try {
    // Check common proxy headers in order of preference
    const xForwardedFor = headers.get('x-forwarded-for')
    const xRealIP = headers.get('x-real-ip')
    const cfConnectingIP = headers.get('cf-connecting-ip') // Cloudflare
    
    // X-Forwarded-For can contain multiple IPs, take the first one
    if (xForwardedFor) {
      const ips = xForwardedFor.split(',').map(ip => ip.trim())
      if (ips.length > 0 && ips[0]) {
        return ips[0]
      }
    }
    
    if (xRealIP) {
      return xRealIP
    }
    
    if (cfConnectingIP) {
      return cfConnectingIP
    }
    
    // Fallback to unknown if no IP found
    return 'unknown'
  } catch (error) {
    console.error('IP extraction error:', error instanceof Error ? error.message : 'Unknown error')
    return 'unknown'
  }
}
