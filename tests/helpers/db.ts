import { PrismaClient } from '@prisma/client'

/**
 * Database helper functions for tests
 * Provides utilities for managing test database state
 */

// Connection pool to manage Prisma clients
const connectionPool = new Map<string, PrismaClient>()
const MAX_CONNECTIONS = 5

// Get or create a Prisma client with connection pooling
const getPrismaClient = (): PrismaClient => {
  const key = 'test-client'
  
  if (connectionPool.has(key)) {
    return connectionPool.get(key)!
  }
  
  if (connectionPool.size >= MAX_CONNECTIONS) {
    // Close oldest connection if pool is full
    const oldestKey = connectionPool.keys().next().value
    const oldestClient = connectionPool.get(oldestKey)
    if (oldestClient) {
      oldestClient.$disconnect().catch(() => {})
      connectionPool.delete(oldestKey)
    }
  }
  
  const client = createTestPrismaClient()
  connectionPool.set(key, client)
  return client
}

// Clean up all connections
export const cleanupConnections = async () => {
  for (const [key, client] of connectionPool.entries()) {
    try {
      await client.$disconnect()
    } catch (error) {
      console.warn(`Failed to disconnect client ${key}:`, error)
    }
  }
  connectionPool.clear()
}

// Create a dedicated test Prisma client with better error handling
const createTestPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    log: ['error'], // Only log errors to reduce noise
    errorFormat: 'minimal', // Use minimal error format for cleaner output
    // Add connection timeout and retry settings
    __internal: {
      engine: {
        connectTimeout: 10000, // 10 seconds
        socketTimeout: 30000, // 30 seconds
      }
    }
  })
}

// Helper function to retry database operations
const retryDatabaseOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error
      }
      console.warn(`Database operation failed, retrying... (${i + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max retries exceeded')
}

export const cleanupTestData = async () => {
  const prisma = getPrismaClient()
  try {
    // Clean up all test users (those with test emails) with retry
    await retryDatabaseOperation(async () => {
      await prisma.user.deleteMany({
        where: {
          email: {
            contains: '@example.com'
          }
        }
      })
    })
  } catch (error) {
    console.warn('Failed to cleanup test data:', error)
    // Don't throw the error to avoid breaking tests
  }
}

export const waitForDatabaseConnection = async (maxRetries = 30, delay = 1000) => {
  const prisma = createTestPrismaClient()
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect()
      await prisma.$disconnect()
      return true
    } catch (error) {
      if (i === maxRetries - 1) {
        console.warn(`Database connection failed after ${maxRetries} attempts: ${error}`)
        return false
      }
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  return false
}

export const disconnectDatabase = async () => {
  // This function is no longer needed as we create/disconnect clients per operation
  // Keeping for backward compatibility
  console.log('disconnectDatabase called - no action needed with new approach')
}

export const createTestUser = async (userData: {
  email: string
  username: string
  password: string
}) => {
  const prisma = getPrismaClient()
  try {
    return await retryDatabaseOperation(async () => {
      return await prisma.user.create({
        data: userData
      })
    })
  } catch (error) {
    console.warn('Failed to create test user:', error)
    throw error
  }
}

export const deleteTestUser = async (email: string) => {
  const prisma = getPrismaClient()
  try {
    await retryDatabaseOperation(async () => {
      await prisma.user.deleteMany({
        where: {
          email: email
        }
      })
    })
  } catch (error) {
    console.warn('Failed to delete test user:', error)
    // Don't throw the error to avoid breaking tests
  }
}
