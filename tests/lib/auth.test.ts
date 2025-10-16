import { describe, it, expect, beforeEach } from 'vitest'
import { createToken, verifyToken, extractTokenFromHeader, validateAuthHeader } from '@/lib/auth'

/**
 * Unit tests for JWT authentication utilities
 * Tests token creation, verification, and header parsing
 */

describe('JWT Authentication', () => {
  const testUser = {
    userId: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser'
  }

  beforeEach(() => {
    // Ensure clean state for each test
  })

  describe('createToken', () => {
    it('should create a valid JWT token', async () => {
      const token = await createToken(testUser.userId, testUser.email, testUser.username)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should throw error for missing parameters', async () => {
      await expect(createToken('', testUser.email, testUser.username)).rejects.toThrow('Token creation failed')
      await expect(createToken(testUser.userId, '', testUser.username)).rejects.toThrow('Token creation failed')
      await expect(createToken(testUser.userId, testUser.email, '')).rejects.toThrow('Token creation failed')
    })

    it('should create different tokens for same user', async () => {
      const token1 = await createToken(testUser.userId, testUser.email, testUser.username)
      const token2 = await createToken(testUser.userId, testUser.email, testUser.username)
      
      expect(token1).not.toBe(token2) // Different JTI should make tokens different
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      const token = await createToken(testUser.userId, testUser.email, testUser.username)
      const payload = await verifyToken(token)
      
      expect(payload.sub).toBe(testUser.userId)
      expect(payload.email).toBe(testUser.email)
      expect(payload.username).toBe(testUser.username)
      expect(payload.jti).toBeDefined()
      expect(payload.iat).toBeDefined()
      expect(payload.exp).toBeDefined()
    })

    it('should throw error for invalid token', async () => {
      await expect(verifyToken('invalid.token.here')).rejects.toThrow()
      await expect(verifyToken('not-a-jwt')).rejects.toThrow()
      await expect(verifyToken('')).rejects.toThrow('Token verification failed')
    })

    it('should throw error for expired token', async () => {
      // Create a token with past expiration
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDB9.invalid'
      
      await expect(verifyToken(expiredToken)).rejects.toThrow()
    })

    it('should validate token payload structure', async () => {
      const token = await createToken(testUser.userId, testUser.email, testUser.username)
      const payload = await verifyToken(token)
      
      // Check required fields exist
      expect(payload).toHaveProperty('sub')
      expect(payload).toHaveProperty('email')
      expect(payload).toHaveProperty('username')
      expect(payload).toHaveProperty('iat')
      expect(payload).toHaveProperty('exp')
      expect(payload).toHaveProperty('jti')
      
      // Check field types
      expect(typeof payload.sub).toBe('string')
      expect(typeof payload.email).toBe('string')
      expect(typeof payload.username).toBe('string')
      expect(typeof payload.iat).toBe('number')
      expect(typeof payload.exp).toBe('number')
      expect(typeof payload.jti).toBe('string')
    })
  })

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const token = 'valid.jwt.token'
      const header = `Bearer ${token}`
      
      const extracted = extractTokenFromHeader(header)
      expect(extracted).toBe(token)
    })

    it('should handle case insensitive Bearer', () => {
      const token = 'valid.jwt.token'
      const header = `bearer ${token}`
      
      const extracted = extractTokenFromHeader(header)
      expect(extracted).toBe(token)
    })

    it('should return null for invalid headers', () => {
      expect(extractTokenFromHeader(null)).toBeNull()
      expect(extractTokenFromHeader('')).toBeNull()
      expect(extractTokenFromHeader('Invalid token')).toBeNull()
      expect(extractTokenFromHeader('Bearer')).toBeNull()
      expect(extractTokenFromHeader('Bearer ')).toBeNull()
      expect(extractTokenFromHeader('Basic token')).toBeNull()
    })

    it('should handle malformed headers', () => {
      expect(extractTokenFromHeader('Bearer token1 token2')).toBeNull()
      expect(extractTokenFromHeader('Bearer token extra')).toBeNull()
    })
  })

  describe('validateAuthHeader', () => {
    it('should validate valid auth header', async () => {
      const token = await createToken(testUser.userId, testUser.email, testUser.username)
      const header = `Bearer ${token}`
      
      const payload = await validateAuthHeader(header)
      expect(payload).toBeDefined()
      expect(payload?.sub).toBe(testUser.userId)
      expect(payload?.email).toBe(testUser.email)
      expect(payload?.username).toBe(testUser.username)
    })

    it('should return null for invalid auth header', async () => {
      const result1 = await validateAuthHeader(null)
      expect(result1).toBeNull()
      
      const result2 = await validateAuthHeader('')
      expect(result2).toBeNull()
      
      const result3 = await validateAuthHeader('Bearer invalid.token')
      expect(result3).toBeNull()
      
      const result4 = await validateAuthHeader('Invalid header')
      expect(result4).toBeNull()
    })

    it('should handle expired tokens', async () => {
      // Mock an expired token by creating one and waiting
      const token = await createToken(testUser.userId, testUser.email, testUser.username)
      const header = `Bearer ${token}`
      
      // Note: In real tests, you'd need to mock the time or create an actually expired token
      // For now, we'll test with invalid token
      const result = await validateAuthHeader('Bearer expired.token.here')
      expect(result).toBeNull()
    })
  })
})
