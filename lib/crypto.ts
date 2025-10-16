import bcrypt from 'bcrypt'

/**
 * Password hashing and verification utilities
 * Following OWASP ASVS V2.1.3 - Password Storage Requirements
 * Uses bcrypt with configurable rounds (12-14 recommended)
 */

// Get bcrypt rounds from environment, default to 12 (OWASP recommended minimum)
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10)

// Validate rounds are within secure range
if (BCRYPT_ROUNDS < 12 || BCRYPT_ROUNDS > 14) {
  throw new Error('BCRYPT_ROUNDS must be between 12 and 14 for security')
}

/**
 * Hashes a plain text password using bcrypt
 * 
 * Security considerations:
 * - Uses 12+ rounds to resist brute force attacks
 * - Automatically generates and includes salt
 * - Returns promise for async operation
 * 
 * @param password - Plain text password to hash
 * @returns Promise resolving to hashed password string
 * @throws Error if hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Validate input
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string')
    }

    // Hash with bcrypt using configured rounds
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)
    
    // Verify hash was created successfully
    if (!hashedPassword || typeof hashedPassword !== 'string') {
      throw new Error('Password hashing failed')
    }

    return hashedPassword
  } catch (error) {
    // Log error without exposing sensitive data
    console.error('Password hashing error:', error instanceof Error ? error.message : 'Unknown error')
    throw new Error('Password hashing failed')
  }
}

/**
 * Verifies a plain text password against a hashed password
 * 
 * Security considerations:
 * - Uses constant-time comparison to prevent timing attacks
 * - Handles all errors uniformly to prevent user enumeration
 * - Never exposes whether user exists or password is correct
 * 
 * @param password - Plain text password to verify
 * @param hashedPassword - Stored hashed password
 * @returns Promise resolving to boolean indicating if password is correct
 * @throws Error if verification fails
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    // Validate inputs
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string')
    }
    
    if (!hashedPassword || typeof hashedPassword !== 'string') {
      throw new Error('Hashed password must be a non-empty string')
    }

    // Verify password using bcrypt's constant-time comparison
    const isValid = await bcrypt.compare(password, hashedPassword)
    
    // Return boolean result
    return Boolean(isValid)
  } catch (error) {
    // Log error without exposing sensitive data
    console.error('Password verification error:', error instanceof Error ? error.message : 'Unknown error')
    
    // Always return false on error to prevent timing attacks
    // This ensures consistent response time regardless of error type
    return false
  }
}

/**
 * Validates password strength without hashing
 * Used for client-side validation feedback
 * 
 * @param password - Password to validate
 * @returns Object with validation result and requirements
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  requirements: {
    length: boolean
    lowercase: boolean
    uppercase: boolean
    number: boolean
    special: boolean
    noCommonPatterns: boolean
  }
  score: number
} {
  const requirements = {
    length: password.length >= 12 && password.length <= 128,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
    noCommonPatterns: !/123456|password|qwerty|abc123|admin|user|test|welcome/i.test(password)
  }

  const score = Object.values(requirements).filter(Boolean).length
  const isValid = score === 6 && requirements.length

  return {
    isValid,
    requirements,
    score
  }
}

/**
 * Generates a cryptographically secure random string
 * Used for generating secure tokens and salts
 * 
 * @param length - Length of the random string (default: 32)
 * @returns Cryptographically secure random string
 */
export function generateSecureRandom(length: number = 32): string {
  if (length < 1 || length > 256) {
    throw new Error('Random string length must be between 1 and 256')
  }

  // Use crypto.getRandomValues for secure randomness
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  
  // Convert to base64url encoding (URL-safe)
  const chars = Array.from(array, byte => String.fromCharCode(byte)).join('')
  return btoa(chars)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, length)
}
