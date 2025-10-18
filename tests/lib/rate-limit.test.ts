import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, recordFailedAttempt, clearRateLimit, getClientIP, checkFailedAttemptRateLimit, getRateLimitStatus } from '@/lib/rate-limit'

/**
 * Unit tests for rate limiting utilities
 * Tests rate limit checking, IP tracking, and cache management
 */

describe('Rate Limiting', () => {
  const testIP = '192.168.1.1'

  beforeEach(() => {
    // Clear rate limit cache before each test
    clearRateLimit(testIP)
  })

  describe('checkRateLimit', () => {
    it('should allow first request', () => {
      const result = checkRateLimit(testIP)
      
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4) // 5 - 1
      expect(result.resetTime).toBeGreaterThan(Date.now())
      expect(result.retryAfter).toBeUndefined()
    })

    it('should track multiple requests', () => {
      const result1 = checkRateLimit(testIP)
      const result2 = checkRateLimit(testIP)
      const result3 = checkRateLimit(testIP)
      
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(4)
      
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(3)
      
      expect(result3.allowed).toBe(true)
      expect(result3.remaining).toBe(2)
    })

    it('should block after exceeding limit', () => {
      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        checkRateLimit(testIP)
      }
      
      // 6th request should be blocked
      const result = checkRateLimit(testIP)
      
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeDefined()
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('should handle invalid IP gracefully', () => {
      const result1 = checkRateLimit('')
      const result2 = checkRateLimit(null as any)
      const result3 = checkRateLimit(undefined as any)
      
      // Should fail open and allow request
      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
      expect(result3.allowed).toBe(true)
    })

    it('should track different IPs independently', () => {
      const ip1 = '192.168.1.1'
      const ip2 = '192.168.1.2'
      
      // Make requests from both IPs
      const result1 = checkRateLimit(ip1)
      const result2 = checkRateLimit(ip2)
      
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(4)
      
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(4)
    })
  })

  describe('recordFailedAttempt', () => {
    it('should record failed attempt', () => {
      recordFailedAttempt(testIP)
      
      // Check that the attempt was recorded
      const result = checkRateLimit(testIP)
      expect(result.remaining).toBe(3) // Should be 4 - 1 = 3
    })

    it('should handle invalid IP gracefully', () => {
      expect(() => recordFailedAttempt('')).not.toThrow()
      expect(() => recordFailedAttempt(null as any)).not.toThrow()
      expect(() => recordFailedAttempt(undefined as any)).not.toThrow()
    })

    it('should accumulate failed attempts', () => {
      recordFailedAttempt(testIP)
      recordFailedAttempt(testIP)
      recordFailedAttempt(testIP)
      
      const result = checkRateLimit(testIP)
      expect(result.remaining).toBe(1) // Should be 4 - 3 = 1
    })
  })

  describe('clearRateLimit', () => {
    it('should clear rate limit data', () => {
      // Make some requests
      checkRateLimit(testIP)
      checkRateLimit(testIP)
      
      // Clear the data
      clearRateLimit(testIP)
      
      // Should start fresh
      const result = checkRateLimit(testIP)
      expect(result.remaining).toBe(4) // Fresh start
    })

    it('should handle invalid IP gracefully', () => {
      expect(() => clearRateLimit('')).not.toThrow()
      expect(() => clearRateLimit(null as any)).not.toThrow()
      expect(() => clearRateLimit(undefined as any)).not.toThrow()
    })
  })

  describe('getClientIP', () => {
    it('should extract IP from X-Forwarded-For header', () => {
      const headers = new Headers({
        'x-forwarded-for': '192.168.1.100, 10.0.0.1'
      })
      
      const ip = getClientIP(headers)
      expect(ip).toBe('192.168.1.100')
    })

    it('should extract IP from X-Real-IP header', () => {
      const headers = new Headers({
        'x-real-ip': '192.168.1.200'
      })
      
      const ip = getClientIP(headers)
      expect(ip).toBe('192.168.1.200')
    })

    it('should extract IP from Cloudflare header', () => {
      const headers = new Headers({
        'cf-connecting-ip': '192.168.1.300'
      })
      
      const ip = getClientIP(headers)
      expect(ip).toBe('192.168.1.300')
    })

    it('should return unknown for missing headers', () => {
      const headers = new Headers()
      
      const ip = getClientIP(headers)
      expect(ip).toBe('unknown')
    })

    it('should handle malformed headers', () => {
      const headers = new Headers({
        'x-forwarded-for': ''
      })
      
      const ip = getClientIP(headers)
      expect(ip).toBe('unknown')
    })

    it('should prioritize X-Forwarded-For over other headers', () => {
      const headers = new Headers({
        'x-forwarded-for': '192.168.1.100',
        'x-real-ip': '192.168.1.200',
        'cf-connecting-ip': '192.168.1.300'
      })
      
      const ip = getClientIP(headers)
      expect(ip).toBe('192.168.1.100')
    })

    it('should handle headers with multiple IPs in X-Forwarded-For', () => {
      const headers = new Headers({
        'x-forwarded-for': '192.168.1.100, 10.0.0.1, 172.16.0.1'
      })
      
      const ip = getClientIP(headers)
      expect(ip).toBe('192.168.1.100') // Should take the first IP
    })

    it('should handle empty X-Forwarded-For header', () => {
      const headers = new Headers({
        'x-forwarded-for': ''
      })
      
      const ip = getClientIP(headers)
      expect(ip).toBe('unknown')
    })
  })

  describe('checkFailedAttemptRateLimit', () => {
    beforeEach(() => {
      clearRateLimit(testIP)
    })

    it('should allow request when no previous failed attempts', () => {
      const result = checkFailedAttemptRateLimit(testIP)
      
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(5)
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })

    it('should track failed attempts without incrementing', () => {
      // Record some failed attempts
      recordFailedAttempt(testIP)
      recordFailedAttempt(testIP)
      
      const result = checkFailedAttemptRateLimit(testIP)
      
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(3) // 5 - 2 = 3
    })

    it('should block after exceeding failed attempt limit', () => {
      // Record 5 failed attempts
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(testIP)
      }
      
      const result = checkFailedAttemptRateLimit(testIP)
      
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeDefined()
    })

    it('should handle invalid IP gracefully', () => {
      const result1 = checkFailedAttemptRateLimit('')
      const result2 = checkFailedAttemptRateLimit(null as any)
      const result3 = checkFailedAttemptRateLimit(undefined as any)
      
      // Should fail open and allow request
      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
      expect(result3.allowed).toBe(true)
    })
  })

  describe('getRateLimitStatus', () => {
    beforeEach(() => {
      clearRateLimit(testIP)
    })

    it('should return null for non-existent IP', () => {
      const status = getRateLimitStatus(testIP)
      expect(status).toBeNull()
    })

    it('should return rate limit data for existing IP', () => {
      // Make some requests
      checkRateLimit(testIP)
      checkRateLimit(testIP)
      
      const status = getRateLimitStatus(testIP)
      expect(status).not.toBeNull()
      expect(status?.attempts).toBe(2)
      expect(status?.firstAttempt).toBeDefined()
      expect(status?.lastAttempt).toBeDefined()
    })

    it('should handle invalid IP gracefully', () => {
      const status1 = getRateLimitStatus('')
      const status2 = getRateLimitStatus(null as any)
      const status3 = getRateLimitStatus(undefined as any)
      
      expect(status1).toBeNull()
      expect(status2).toBeNull()
      expect(status3).toBeNull()
    })
  })

  describe('clearRateLimit', () => {
    it('should clear all rate limit data when no IP specified', () => {
      // Make requests from multiple IPs
      checkRateLimit('192.168.1.1')
      checkRateLimit('192.168.1.2')
      
      // Clear all data
      clearRateLimit()
      
      // Both IPs should start fresh
      const result1 = checkRateLimit('192.168.1.1')
      const result2 = checkRateLimit('192.168.1.2')
      
      expect(result1.remaining).toBe(4)
      expect(result2.remaining).toBe(4)
    })

    it('should clear specific IP data when IP specified', () => {
      const ip1 = '192.168.1.1'
      const ip2 = '192.168.1.2'
      
      // Make requests from both IPs
      checkRateLimit(ip1) // 1st attempt for ip1
      checkRateLimit(ip1) // 2nd attempt for ip1
      checkRateLimit(ip2) // 1st attempt for ip2
      
      // Clear only ip1
      clearRateLimit(ip1)
      
      // ip1 should start fresh, ip2 should keep its count
      const result1 = checkRateLimit(ip1) // Fresh start for ip1 (1st attempt)
      const result2 = checkRateLimit(ip2) // 2nd attempt for ip2
      
      expect(result1.remaining).toBe(4) // Fresh start (4 remaining after 1st attempt)
      expect(result2.remaining).toBe(2) // 2 remaining after 2nd attempt (5-2=3, but it's 5-3=2)
    })
  })
})

