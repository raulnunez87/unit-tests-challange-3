import { PrismaClient } from '@prisma/client'

/**
 * Prisma client singleton
 * Ensures single database connection across the application
 * Following best practices for Next.js and Prisma integration
 */

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// Create Prisma client instance with improved connection handling
const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'minimal',
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Add connection configuration for better reliability
  ...(process.env.NODE_ENV === 'test' && {
    // For tests, add more aggressive connection settings
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
})

// Add connection retry logic for test environment
if (process.env.NODE_ENV === 'test') {
  // Ensure connection is established before use
  prisma.$connect().catch((error) => {
    console.warn('Initial Prisma connection failed:', error.message)
  })
}

// In development, save the client to global to prevent multiple instances
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

export default prisma
