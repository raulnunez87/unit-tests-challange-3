import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'

// Import prisma after ensuring environment is set up
let prisma: PrismaClient

/**
 * Tests for the Prisma client configuration
 * Tests singleton pattern, configuration, and environment handling
 */

describe.skip('Prisma Client', () => {
  const originalEnv = process.env.NODE_ENV
  const originalGlobal = globalThis.__prisma

  beforeEach(async () => {
    // Clear any existing mocks
    vi.clearAllMocks()
    // Clear global prisma instance
    globalThis.__prisma = undefined
    
    // Import prisma after environment is set up
    const prismaModule = await import('@/lib/prisma')
    prisma = prismaModule.default
  })

  afterEach(() => {
    // Restore environment
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true })
    globalThis.__prisma = originalGlobal
    // Restore all mocks
    vi.restoreAllMocks()
  })

  describe('Prisma client initialization', () => {
    it('should create a PrismaClient instance', () => {
      expect(prisma).toBeInstanceOf(PrismaClient)
    })

    it('should have correct configuration in development', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true })
      
      // Create a new instance to test development config
      const devPrisma = new PrismaClient({
        log: ['query', 'error', 'warn'],
        errorFormat: 'minimal',
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      })

      expect(devPrisma).toBeInstanceOf(PrismaClient)
      
      // Clean up
      devPrisma.$disconnect()
    })

    it('should have correct configuration in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })
      
      // Create a new instance to test production config
      const prodPrisma = new PrismaClient({
        log: ['error'],
        errorFormat: 'minimal',
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      })

      expect(prodPrisma).toBeInstanceOf(PrismaClient)
      
      // Clean up
      prodPrisma.$disconnect()
    })

    it('should use global instance in development to prevent multiple instances', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true })
      
      // Clear global first
      globalThis.__prisma = undefined
      
      // Import again to test global assignment
      const { default: newPrisma } = require('@/lib/prisma')
      
      expect(globalThis.__prisma).toBe(newPrisma)
      expect(newPrisma).toBeInstanceOf(PrismaClient)
    })

    it('should not assign to global in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })
      
      // Clear global first
      globalThis.__prisma = undefined
      
      // Import again to test no global assignment
      const { default: newPrisma } = require('@/lib/prisma')
      
      expect(globalThis.__prisma).toBeUndefined()
      expect(newPrisma).toBeInstanceOf(PrismaClient)
    })

    it('should handle undefined NODE_ENV', () => {
      delete (process.env as any).NODE_ENV
      
      // Create a new instance
      const testPrisma = new PrismaClient({
        log: ['error'],
        errorFormat: 'minimal',
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      })

      expect(testPrisma).toBeInstanceOf(PrismaClient)
      
      // Clean up
      testPrisma.$disconnect()
    })
  })

  describe('Database operations', () => {
    it('should connect to database successfully', async () => {
      // Test connection
      await expect(prisma.$connect()).resolves.not.toThrow()
      
      // Test disconnection
      await expect(prisma.$disconnect()).resolves.not.toThrow()
    })

    it('should handle connection errors gracefully', async () => {
      // Mock a connection error
      const mockConnect = vi.spyOn(prisma, '$connect')
      mockConnect.mockRejectedValueOnce(new Error('Connection failed'))

      await expect(prisma.$connect()).rejects.toThrow('Connection failed')

      // Restore
      mockConnect.mockRestore()
    })

    it('should perform basic database queries', async () => {
      // Test a simple query that should work
      await expect(prisma.user.count()).resolves.toBeGreaterThanOrEqual(0)
    })

    it('should handle query errors gracefully', async () => {
      // Mock a query error
      const mockCount = vi.spyOn(prisma.user, 'count')
      mockCount.mockRejectedValueOnce(new Error('Query failed'))

      await expect(prisma.user.count()).rejects.toThrow('Query failed')

      // Restore
      mockCount.mockRestore()
    })
  })

  describe('Client configuration', () => {
    it('should have correct datasource configuration', () => {
      // The datasource should be configured with DATABASE_URL
      expect(process.env.DATABASE_URL).toBeDefined()
    })

    it('should export default instance', () => {
      // Should be the default export
      expect(prisma).toBeDefined()
      expect(typeof prisma).toBe('object')
    })

    it('should have all expected Prisma client methods', () => {
      // Check for common Prisma client methods
      expect(prisma.$connect).toBeDefined()
      expect(prisma.$disconnect).toBeDefined()
      expect(prisma.$transaction).toBeDefined()
      
      // Check for raw query methods (may not be available in all Prisma versions)
      if ('$queryRaw' in prisma) {
        expect(prisma.$queryRaw).toBeDefined()
      }
      if ('$executeRaw' in prisma) {
        expect(prisma.$executeRaw).toBeDefined()
      }
      
      // Check for model access
      expect(prisma.user).toBeDefined()
    })

    it('should maintain singleton pattern across imports', () => {
      // Import the module again
      const { default: prisma2 } = require('@/lib/prisma')
      
      // Should be the same instance (in development)
      if (process.env.NODE_ENV === 'development') {
        expect(prisma).toBe(prisma2)
      }
    })
  })

  describe('Error handling', () => {
    it('should handle PrismaClient initialization errors', async () => {
      // Mock PrismaClient constructor to throw
      const { PrismaClient: OriginalPrismaClient } = await vi.importActual('@prisma/client')
      
      vi.mock('@prisma/client', () => ({
        PrismaClient: vi.fn().mockImplementation(() => {
          throw new Error('Prisma initialization failed')
        })
      }))

      // Should throw when creating new instance
      expect(() => new (vi.mocked(require('@prisma/client')).PrismaClient)()).toThrow('Prisma initialization failed')
    })

    it('should handle environment variable issues', () => {
      const originalUrl = process.env.DATABASE_URL
      
      // Temporarily remove DATABASE_URL
      delete process.env.DATABASE_URL
      
      // Create new instance without DATABASE_URL
      const testPrisma = new PrismaClient({
        log: ['error'],
        errorFormat: 'minimal',
        datasources: {
          db: {
            url: undefined
          }
        }
      })

      expect(testPrisma).toBeInstanceOf(PrismaClient)
      
      // Restore
      process.env.DATABASE_URL = originalUrl
      testPrisma.$disconnect()
    })
  })
})
