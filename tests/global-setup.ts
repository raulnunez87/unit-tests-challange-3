/**
 * Global test setup
 * Runs once before all tests to ensure database is ready
 */

import { ensureDatabaseReady } from './setup'

export default async function setup() {
  console.log('🚀 Starting global test setup...')
  
  try {
    // Ensure database is ready
    await ensureDatabaseReady()
    console.log('✅ Global test setup complete')
  } catch (error) {
    console.error('❌ Global test setup failed:', error)
    // Don't throw error to allow tests to continue
  }
}

// Global teardown to clean up connections
export async function teardown() {
  console.log('🧹 Starting global test teardown...')
  
  try {
    // Import and run cleanup
    const { cleanupConnections } = await import('./helpers/db')
    await cleanupConnections()
    console.log('✅ Global test teardown complete')
  } catch (error) {
    console.warn('⚠️ Global test teardown failed:', error)
  }
}
