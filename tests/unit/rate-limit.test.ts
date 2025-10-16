import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit, clearRateLimit } from '../../lib/rate-limit';

describe('Rate Limit Utilities', () => {
  beforeEach(() => {
    // Clear any existing rate limit data for common test IPs
    clearRateLimit('192.168.1.1');
    clearRateLimit('192.168.1.2');
    clearRateLimit('192.168.1.3');
    clearRateLimit('192.168.1.4');
    clearRateLimit('192.168.1.5');
    clearRateLimit('192.168.1.6');
    clearRateLimit('192.168.1.7');
    clearRateLimit('192.168.1.8');
    clearRateLimit('192.168.1.9');
    clearRateLimit('192.168.1.10');
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    clearRateLimit('192.168.1.1');
    clearRateLimit('192.168.1.2');
    clearRateLimit('192.168.1.3');
    clearRateLimit('192.168.1.4');
    clearRateLimit('192.168.1.5');
    clearRateLimit('192.168.1.6');
    clearRateLimit('192.168.1.7');
    clearRateLimit('192.168.1.8');
    clearRateLimit('192.168.1.9');
    clearRateLimit('192.168.1.10');
  });

  describe('checkRateLimit', () => {
    it('should allow requests within rate limit', () => {
      const ip = '192.168.1.1';
      const result = checkRateLimit(ip);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // Default limit is 5
      expect(result.resetTime).toBeDefined();
    });

    it('should track multiple requests from same IP', () => {
      const ip = '192.168.1.2';
      
      // First request
      const result1 = checkRateLimit(ip);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);

      // Second request
      const result2 = checkRateLimit(ip);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);

      // Third request
      const result3 = checkRateLimit(ip);
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(2);
    });

    it('should block requests after exceeding rate limit', () => {
      const ip = '192.168.1.3';
      
      // Make 5 requests (limit is 5)
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(ip);
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const blockedResult = checkRateLimit(ip);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remaining).toBe(0);
    });

    it('should track different IPs independently', () => {
      const ip1 = '192.168.1.4';
      const ip2 = '192.168.1.5';
      
      // Make requests from IP1
      checkRateLimit(ip1);
      checkRateLimit(ip1);
      
      // Make requests from IP2
      checkRateLimit(ip2);
      
      // Check that IPs are tracked independently
      const result1 = checkRateLimit(ip1);
      const result2 = checkRateLimit(ip2);
      
      expect(result1.remaining).toBe(2); // 5 - 3 requests
      expect(result2.remaining).toBe(3); // 5 - 2 requests
    });

    it('should reset counter after time window expires', () => {
      const ip = '192.168.1.6';
      
      // Make requests up to limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip);
      }
      
      // Should be blocked
      const blockedResult = checkRateLimit(ip);
      expect(blockedResult.allowed).toBe(false);
      
      // Clear the rate limit data to simulate window expiry
      clearRateLimit(ip);
      
      // Should be allowed again
      const allowedResult = checkRateLimit(ip);
      expect(allowedResult.allowed).toBe(true);
      expect(allowedResult.remaining).toBe(4);
    });

    it('should handle concurrent requests from same IP', () => {
      const ip = '192.168.1.7';
      
      // Simulate concurrent requests
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(checkRateLimit(ip));
      }
      
      // All should be allowed but with decreasing remaining count
      expect(results[0].remaining).toBe(4);
      expect(results[1].remaining).toBe(3);
      expect(results[2].remaining).toBe(2);
      expect(results[3].remaining).toBe(1);
      expect(results[4].remaining).toBe(0);
      
      results.forEach(result => {
        expect(result.allowed).toBe(true);
      });
    });

    it('should handle edge cases for IP addresses', () => {
      // Test with different IP formats
      const ips = [
        '127.0.0.1',
        '::1',
        '192.168.0.1',
        '10.0.0.1',
        'fe80::1',
        'localhost'
      ];
      
      ips.forEach(ip => {
        const result = checkRateLimit(ip);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);
      });
    });

    it('should handle empty or invalid IP addresses', () => {
      const invalidIPs = ['', null, undefined, 'invalid-ip'];
      
      invalidIPs.forEach(ip => {
        expect(() => checkRateLimit(ip as any)).not.toThrow();
        const result = checkRateLimit(ip as any);
        expect(result.allowed).toBe(true);
      });
    });

    it('should provide correct reset time', () => {
      const ip = '192.168.1.8';
      const result = checkRateLimit(ip);
      
      expect(result.resetTime).toBeDefined();
      expect(typeof result.resetTime).toBe('number');
      expect(result.resetTime).toBeGreaterThan(Date.now());
      
      // Reset time should be approximately 15 minutes from now
      const expectedResetTime = Date.now() + (15 * 60 * 1000);
      const timeDifference = Math.abs(result.resetTime - expectedResetTime);
      expect(timeDifference).toBeLessThan(1000); // Within 1 second
    });
  });

  describe('clearRateLimit', () => {
    it('should clear rate limit data for specific IP', () => {
      const ip = '192.168.1.9';
      
      // Make some requests
      checkRateLimit(ip);
      checkRateLimit(ip);
      
      // Clear rate limit
      clearRateLimit(ip);
      
      // Next request should start fresh
      const result = checkRateLimit(ip);
      expect(result.remaining).toBe(4);
    });

    it('should clear all rate limit data when no IP provided', () => {
      const ip1 = '192.168.1.10';
      const ip2 = '192.168.1.11';
      
      // Make requests from both IPs
      checkRateLimit(ip1);
      checkRateLimit(ip2);
      
      // Clear all data
      clearRateLimit();
      
      // Both IPs should start fresh
      const result1 = checkRateLimit(ip1);
      const result2 = checkRateLimit(ip2);
      
      expect(result1.remaining).toBe(4);
      expect(result2.remaining).toBe(4);
    });

    it('should handle clearing non-existent IP', () => {
      const ip = '192.168.1.12';
      
      // Clear rate limit for IP that hasn't made requests
      expect(() => clearRateLimit(ip)).not.toThrow();
      
      // Should still work normally
      const result = checkRateLimit(ip);
      expect(result.allowed).toBe(true);
    });
  });

  describe('LRU Cache Behavior', () => {
    it('should handle cache eviction when full', () => {
      // This test assumes the cache has a maximum size
      // We'll make requests from many different IPs
      const ips = [];
      for (let i = 0; i < 1000; i++) {
        ips.push(`192.168.1.${i}`);
      }
      
      // Make requests from all IPs
      ips.forEach(ip => {
        checkRateLimit(ip);
      });
      
      // Make another request from first IP
      const result = checkRateLimit(ips[0]);
      expect(result.allowed).toBe(true);
    });

    it('should maintain access order for LRU eviction', () => {
      const ip1 = '192.168.1.100';
      const ip2 = '192.168.1.101';
      
      // Access IP1 first
      checkRateLimit(ip1);
      
      // Access IP2
      checkRateLimit(ip2);
      
      // Access IP1 again (should update its position in LRU)
      checkRateLimit(ip1);
      
      // Both should still be accessible
      const result1 = checkRateLimit(ip1);
      const result2 = checkRateLimit(ip2);
      
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large number of requests efficiently', () => {
      const ip = '192.168.1.200';
      const startTime = Date.now();
      
      // Make 1000 requests
      for (let i = 0; i < 1000; i++) {
        checkRateLimit(ip);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete quickly (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle many different IPs efficiently', () => {
      const startTime = Date.now();
      
      // Make requests from 1000 different IPs
      for (let i = 0; i < 1000; i++) {
        checkRateLimit(`192.168.1.${i}`);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete quickly
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limit errors gracefully', () => {
      const ip = '192.168.1.300';
      
      // This test ensures the function doesn't throw errors
      expect(() => {
        for (let i = 0; i < 1000; i++) {
          checkRateLimit(ip);
        }
      }).not.toThrow();
    });

    it('should maintain consistency under concurrent access', async () => {
      const ip = '192.168.1.301';
      
      // Simulate concurrent access with immediate execution
      const promises = Array(10).fill(null).map(() => {
        return Promise.resolve().then(() => {
          const result = checkRateLimit(ip);
          return result;
        });
      });
      
      const results = await Promise.all(promises);
      
      // All results should be valid
      results.forEach(result => {
        expect(result).toHaveProperty('allowed');
        expect(result).toHaveProperty('remaining');
        expect(result).toHaveProperty('resetTime');
      });
    });
  });
});
