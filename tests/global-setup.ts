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
