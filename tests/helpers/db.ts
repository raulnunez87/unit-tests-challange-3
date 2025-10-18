import prisma from '@/lib/prisma'

/**
 * Database helper functions for tests
 * Provides utilities for managing test database state
 */

export const cleanupTestData = async () => {
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
  }
}

export const waitForDatabaseConnection = async (maxRetries = 30, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect()
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

export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.warn('Failed to disconnect from database:', error)
  }
}

export const createTestUser = async (userData: {
  email: string
  username: string
  password: string
}) => {
  try {
    return await prisma.user.create({
      data: userData
    })
  } catch (error) {
    console.warn('Failed to create test user:', error)
    throw error
  }
}

export const deleteTestUser = async (email: string) => {
  try {
    await prisma.user.deleteMany({
      where: {
        email: email
      }
    })
  } catch (error) {
    console.warn('Failed to delete test user:', error)
  }
}
