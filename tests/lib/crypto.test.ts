import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, validatePasswordStrength, generateSecureRandom } from '@/lib/crypto'

/**
 * Unit tests for crypto utilities
 * Tests password hashing, verification, and validation functions
 */

describe('Crypto Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a valid password', async () => {
      const password = 'SecurePassword123!'
      const hashedPassword = await hashPassword(password)
      
      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(password)
      expect(hashedPassword.length).toBeGreaterThan(50) // bcrypt hash length
    })

    it('should throw error for invalid input', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password hashing failed')
      await expect(hashPassword(null as any)).rejects.toThrow('Password hashing failed')
      await expect(hashPassword(undefined as any)).rejects.toThrow('Password hashing failed')
    })

    it('should produce different hashes for same password', async () => {
      const password = 'SecurePassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      expect(hash1).not.toBe(hash2) // Different salts should produce different hashes
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'SecurePassword123!'
      const hashedPassword = await hashPassword(password)
      
      const isValid = await verifyPassword(password, hashedPassword)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'SecurePassword123!'
      const wrongPassword = 'WrongPassword456!'
      const hashedPassword = await hashPassword(password)
      
      const isValid = await verifyPassword(wrongPassword, hashedPassword)
      expect(isValid).toBe(false)
    })

    it('should handle invalid inputs gracefully', async () => {
      const isValid1 = await verifyPassword('', 'validhash')
      expect(isValid1).toBe(false)
      
      const isValid2 = await verifyPassword('password', '')
      expect(isValid2).toBe(false)
      
      const isValid3 = await verifyPassword('', '')
      expect(isValid3).toBe(false)
    })

    it('should have consistent timing for security', async () => {
      const password = 'SecurePassword123!'
      const hashedPassword = await hashPassword(password)
      
      const start1 = Date.now()
      await verifyPassword(password, hashedPassword)
      const time1 = Date.now() - start1
      
      const start2 = Date.now()
      await verifyPassword('wrong', hashedPassword)
      const time2 = Date.now() - start2
      
      // Times should be similar (within 50ms) to prevent timing attacks
      expect(Math.abs(time1 - time2)).toBeLessThan(50)
    })
  })

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const result = validatePasswordStrength('SecurePass123!')
      
      expect(result.isValid).toBe(true)
      expect(result.requirements.length).toBe(true)
      expect(result.requirements.lowercase).toBe(true)
      expect(result.requirements.uppercase).toBe(true)
      expect(result.requirements.number).toBe(true)
      expect(result.requirements.special).toBe(true)
      expect(result.requirements.noCommonPatterns).toBe(true)
      expect(result.score).toBe(6)
    })

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'short',
        'nouppercase123!',
        'nolowercase123!',
        'NoNumbers!',
        'NoSpecialChars123',
        'password123!', // common pattern
        '123456789!', // common pattern
        'qwerty123!' // common pattern
      ]
      
      weakPasswords.forEach(password => {
        const result = validatePasswordStrength(password)
        expect(result.isValid).toBe(false)
      })
    })

    it('should calculate correct score', () => {
      const result1 = validatePasswordStrength('SecurePass123!')
      expect(result1.score).toBe(6)
      
      const result2 = validatePasswordStrength('SecurePass123') // missing special
      expect(result2.score).toBe(5)
      
      const result3 = validatePasswordStrength('securepass123!') // missing uppercase
      expect(result3.score).toBe(5)
    })
  })

  describe('generateSecureRandom', () => {
    it('should generate random string of specified length', () => {
      const random1 = generateSecureRandom(16)
      const random2 = generateSecureRandom(32)
      const random3 = generateSecureRandom(64)
      
      expect(random1.length).toBe(16)
      expect(random2.length).toBe(32)
      expect(random3.length).toBe(64)
    })

    it('should generate different strings each time', () => {
      const random1 = generateSecureRandom(32)
      const random2 = generateSecureRandom(32)
      
      expect(random1).not.toBe(random2)
    })

    it('should use URL-safe characters', () => {
      const random = generateSecureRandom(100)
      
      // Should not contain +, /, or = characters
      expect(random).not.toContain('+')
      expect(random).not.toContain('/')
      expect(random).not.toContain('=')
    })

    it('should throw error for invalid length', () => {
      expect(() => generateSecureRandom(0)).toThrow('Random string length must be between 1 and 256')
      expect(() => generateSecureRandom(257)).toThrow('Random string length must be between 1 and 256')
    })
  })
})
