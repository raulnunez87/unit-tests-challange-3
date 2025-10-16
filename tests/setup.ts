/**
 * Test setup and teardown
 * Configures test environment
 */

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-at-least-32-characters-long-for-testing'
process.env.BCRYPT_ROUNDS = '12' // Use secure rounds even for tests
process.env.DATABASE_URL = 'mongodb://localhost:27017/auth-module-test'
process.env.NODE_ENV = 'test'

// Mock crypto for Node.js environment
if (typeof globalThis.crypto === 'undefined') {
  const { webcrypto } = require('crypto')
  globalThis.crypto = webcrypto
}
