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

// Create Prisma client instance
const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'minimal',
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// In development, save the client to global to prevent multiple instances
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

export default prisma
