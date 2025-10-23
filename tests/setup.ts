/**
 * Test setup and teardown
 * Configures test environment
 */

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-at-least-32-characters-long-for-testing'
process.env.BCRYPT_ROUNDS = '12' // Use secure rounds even for tests
// Use MongoDB with replica set for tests (required by Prisma)
process.env.DATABASE_URL = 'mongodb://localhost:27017/auth-module-test?replicaSet=rs0&serverSelectionTimeoutMS=60000&connectTimeoutMS=60000&maxPoolSize=10&minPoolSize=1'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(process.env as any).NODE_ENV = 'test'
process.env.JWT_EXPIRATION_MINUTES = '15'

// Mock crypto for Node.js environment
if (typeof globalThis.crypto === 'undefined') {
  const { webcrypto } = require('crypto')
  globalThis.crypto = webcrypto
}

// Global test timeout configuration
const testTimeout = 60000 // 60 seconds for database operations
const hookTimeout = 45000 // 45 seconds for setup/teardown

// Configure global timeouts
if (typeof global !== 'undefined') {
  Object.assign(global, {
    TEST_TIMEOUT: testTimeout,
    HOOK_TIMEOUT: hookTimeout
  })
}

// Global setup to ensure database is ready
let databaseReady = false

export const ensureDatabaseReady = async () => {
  if (databaseReady) return true
  
  console.log('🔍 Checking database connection...')
  const isReady = await waitForDatabase(15, 3000) // 15 attempts, 3 second delay
  
  if (isReady) {
    console.log('✅ Database connection verified')
    databaseReady = true
  } else {
    console.warn('⚠️ Database connection not available, tests may fail')
    // Don't fail completely, let tests try to handle it
    databaseReady = false
  }
  
  return isReady
}

// Database connection helper for tests
export const waitForDatabase = async (maxRetries = 30, delay = 1000) => {
  const { PrismaClient } = await import('@prisma/client')
  
  // Try different connection strategies
  const connectionStrategies = [
    // Strategy 1: Replica set with longer timeout and connection pooling (required by Prisma for transactions)
    'mongodb://localhost:27017/auth-module-test?replicaSet=rs0&serverSelectionTimeoutMS=60000&connectTimeoutMS=60000&maxPoolSize=10&minPoolSize=1',
    // Strategy 2: Replica set with direct connection and longer timeout
    'mongodb://localhost:27017/auth-module-test?replicaSet=rs0&directConnection=true&serverSelectionTimeoutMS=60000&connectTimeoutMS=60000&maxPoolSize=10&minPoolSize=1',
    // Strategy 3: Direct connection without replica set (fallback)
    'mongodb://localhost:27017/auth-module-test?directConnection=true&serverSelectionTimeoutMS=60000&connectTimeoutMS=60000&maxPoolSize=10&minPoolSize=1'
  ]
  
  for (const strategy of connectionStrategies) {
    console.log(`Trying connection strategy: ${strategy}`)
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const prisma = new PrismaClient({
          datasources: {
            db: {
              url: strategy
            }
          },
          log: ['error'] // Only log errors to reduce noise
        })
        
        await prisma.$connect()
        await prisma.$disconnect()
        
        // Update the environment variable to use the working connection
        process.env.DATABASE_URL = strategy
        console.log(`✅ Database connection successful with strategy: ${strategy}`)
        return true
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.warn(`Database connection attempt ${i + 1}/${maxRetries} failed with strategy ${strategy}:`, errorMessage)
        if (i === maxRetries - 1) {
          console.warn(`Strategy ${strategy} failed after ${maxRetries} attempts`)
          break // Try next strategy
        }
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  console.error('All database connection strategies failed')
  return false
}
