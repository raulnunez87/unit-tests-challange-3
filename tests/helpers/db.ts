import { PrismaClient } from '@prisma/client'

/**
 * Database helper functions for tests
 * Provides utilities for managing test database state
 */

// Create a dedicated test Prisma client with better error handling
const createTestPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    log: ['error'], // Only log errors to reduce noise
    errorFormat: 'minimal' // Use minimal error format for cleaner output
  })
}

export const cleanupTestData = async () => {
  const prisma = createTestPrismaClient()
  try {
    // Clean up all test users (those with test emails)
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: '@example.com'
        }
      }
    })
  } catch (error) {
    console.warn('Failed to cleanup test data:', error)
    // Don't throw the error to avoid breaking tests
  } finally {
    // Always try to disconnect to clean up connections
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      // Ignore disconnect errors
    }
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
  const prisma = createTestPrismaClient()
  try {
    return await prisma.user.create({
      data: userData
    })
  } catch (error) {
    console.warn('Failed to create test user:', error)
    throw error
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      // Ignore disconnect errors
    }
  }
}

export const deleteTestUser = async (email: string) => {
  const prisma = createTestPrismaClient()
  try {
    await prisma.user.deleteMany({
      where: {
        email: email
      }
    })
  } catch (error) {
    console.warn('Failed to delete test user:', error)
    // Don't throw the error to avoid breaking tests
  } finally {
    // Always try to disconnect to clean up connections
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      // Ignore disconnect errors
    }
  }
}
