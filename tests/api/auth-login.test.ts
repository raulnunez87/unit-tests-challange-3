import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as loginHandler, GET, PUT, DELETE } from '@/app/api/auth/login/route'
import { clearRateLimit } from '@/lib/rate-limit'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/crypto'

/**
 * Tests for the main login API endpoint
 * POST /api/auth/login
 * 
 * Tests authentication, rate limiting, validation, and security features
 */

describe('Authentication Login API', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    username: `testuser-${Date.now()}`,
    password: 'MySecurePass789!'
  }

  beforeEach(async () => {
    // Clear rate limiting cache before each test
    clearRateLimit()
    
    // Create a test user in the database
    const hashedPassword = await hashPassword(testUser.password)
    await prisma.user.create({
      data: {
        email: testUser.email,
        username: testUser.username,
        password: hashedPassword
      }
    })
  })

  afterEach(async () => {
    // Clean up test user
    await prisma.user.deleteMany({
      where: {
        email: testUser.email
      }
    })
    clearRateLimit()
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Login successful')
      expect(data.data.user.email).toBe(testUser.email)
      expect(data.data.user.username).toBe(testUser.username)
      expect(data.data.token).toBeDefined()
      expect(data.data.user.password).toBeUndefined()
      expect(data.data.user.id).toBeDefined()
      expect(data.data.user.createdAt).toBeDefined()
      
      // Check rate limiting headers
      expect(response.headers.get('X-RateLimit-Limit')).toBe('5')
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
    })

    it('should reject login with invalid email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: testUser.password
        })
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
      expect(data.message).toBe('Invalid email or password.')
      expect(data.data).toBeUndefined()
    })

    it('should reject login with invalid password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: 'WrongPassword123!'
        })
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
      expect(data.message).toBe('Invalid email or password.')
    })

    it('should reject login with malformed email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify({
          email: 'invalid-email',
          password: testUser.password
        })
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Validation failed')
    })

    it('should handle missing password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify({
          email: testUser.email
          // password missing
        })
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Validation failed')
    })

    it('should handle missing email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify({
          password: testUser.password
          // email missing
        })
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Validation failed')
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: 'invalid json'
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal Server Error')
      expect(data.message).toBe('An error occurred during login. Please try again.')
    })

    it('should enforce rate limiting after failed attempts', async () => {
      const uniqueIP = '10.0.0.300'
      
      // Make multiple failed login requests
      for (let i = 0; i < 6; i++) {
        const request = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': uniqueIP
          },
          body: JSON.stringify({
            email: testUser.email,
            password: 'WrongPassword123!'
          })
        })

        const response = await loginHandler(request)
        
        if (i < 5) {
          // First 5 requests should fail with 401
          expect(response.status).toBe(401)
        } else {
          // 6th request should be rate limited
          const data = await response.json()
          expect(response.status).toBe(429)
          expect(data.error).toBe('Too Many Requests')
          expect(data.message).toBe('Too many login attempts. Please try again later.')
          expect(response.headers.get('Retry-After')).toBeDefined()
        }
      }
    })

    it('should handle database connection errors gracefully', async () => {
      // Mock prisma to throw an error
      const originalFindUnique = prisma.user.findUnique
      vi.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal Server Error')
      expect(data.message).toBe('An error occurred during login. Please try again.')

      // Restore original method
      vi.restoreAllMocks()
    })
  })

  describe('Unsupported HTTP methods', () => {
    it('should reject GET requests', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method Not Allowed')
      expect(data.message).toBe('GET method is not supported for this endpoint')
    })

    it('should reject PUT requests', async () => {
      const response = await PUT()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method Not Allowed')
      expect(data.message).toBe('PUT method is not supported for this endpoint')
    })

    it('should reject DELETE requests', async () => {
      const response = await DELETE()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method Not Allowed')
      expect(data.message).toBe('DELETE method is not supported for this endpoint')
    })
  })
})
