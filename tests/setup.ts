/**
 * Test setup and teardown
 * Configures test environment
 */

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-at-least-32-characters-long-for-testing'
process.env.BCRYPT_ROUNDS = '12' // Use secure rounds even for tests
// Use MongoDB with replica set for tests (required by Prisma)
process.env.DATABASE_URL = 'mongodb://localhost:27017/auth-module-test?replicaSet=rs0'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(process.env as any).NODE_ENV = 'test'
process.env.JWT_EXPIRATION_MINUTES = '15'

// Mock crypto for Node.js environment
if (typeof globalThis.crypto === 'undefined') {
  const { webcrypto } = require('crypto')
  globalThis.crypto = webcrypto
}

// Global test timeout configuration
const TEST_TIMEOUT = 60000 // 60 seconds for database operations
const HOOK_TIMEOUT = 45000 // 45 seconds for setup/teardown

// Configure global timeouts
if (typeof global !== 'undefined') {
  global.TEST_TIMEOUT = TEST_TIMEOUT
  global.HOOK_TIMEOUT = HOOK_TIMEOUT
}

// Database connection helper for tests
export const waitForDatabase = async (maxRetries = 30, delay = 1000) => {
  const { PrismaClient } = await import('@prisma/client')
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      })
      
      await prisma.$connect()
      await prisma.$disconnect()
      return true
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(`Database connection failed after ${maxRetries} attempts: ${error}`)
      }
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  return false
}
