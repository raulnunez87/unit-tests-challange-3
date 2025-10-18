import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from '@/app/api/db-test/route'
import prisma from '@/lib/prisma'

/**
 * Tests for the database test API endpoint
 * GET /api/db-test
 * 
 * Tests database connectivity and basic operations
 */

describe('Database Test API', () => {
  beforeEach(() => {
    // Clear any existing mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore all mocks after each test
    vi.restoreAllMocks()
  })

  describe('GET /api/db-test', () => {
    it('should return successful database connection status', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Database connection successful')
      expect(data.userCount).toBeDefined()
      expect(typeof data.userCount).toBe('number')
      expect(data.timestamp).toBeDefined()
      expect(new Date(data.timestamp)).toBeInstanceOf(Date)
    })

    it('should handle database connection errors gracefully', async () => {
      // Mock prisma.$connect to throw an error
      vi.spyOn(prisma, '$connect').mockRejectedValueOnce(new Error('Connection failed'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database connection failed')
      expect(data.message).toBe('Connection failed')
      expect(data.timestamp).toBeDefined()
      expect(new Date(data.timestamp)).toBeInstanceOf(Date)
    })

    it('should handle database query errors gracefully', async () => {
      // Mock prisma.user.count to throw an error
      vi.spyOn(prisma.user, 'count').mockRejectedValueOnce(new Error('Query failed'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database connection failed')
      expect(data.message).toBe('Query failed')
      expect(data.timestamp).toBeDefined()
    })

    it('should handle unknown errors gracefully', async () => {
      // Mock prisma.$connect to throw a non-Error object
      vi.spyOn(prisma, '$connect').mockRejectedValueOnce('Unknown error')

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database connection failed')
      expect(data.message).toBe('Unknown error')
      expect(data.timestamp).toBeDefined()
    })

    it('should return valid JSON response structure', async () => {
      const response = await GET()
      const data = await response.json()

      // Verify response structure
      expect(data).toHaveProperty('message')
      expect(data).toHaveProperty('userCount')
      expect(data).toHaveProperty('timestamp')
      expect(typeof data.message).toBe('string')
      expect(typeof data.userCount).toBe('number')
      expect(typeof data.timestamp).toBe('string')
    })

    it('should return consistent timestamp format', async () => {
      const response = await GET()
      const data = await response.json()

      // Verify timestamp is valid ISO string
      const timestamp = new Date(data.timestamp)
      expect(timestamp.toISOString()).toBe(data.timestamp)
      expect(timestamp.getTime()).toBeGreaterThan(0)
    })
  })
})
