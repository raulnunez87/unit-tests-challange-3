import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { NextRequest } from 'next/server'
import { POST as registerHandler } from '@/app/api/auth/register/route'
import { POST as loginHandler } from '@/app/api/auth/login/route'
import { prisma } from '../setup'

/**
 * Integration tests for authentication API endpoints
 * Tests registration, login, validation, and error handling
 */

describe('Authentication API', () => {
  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!'
  }

  const testLogin = {
    email: 'test@example.com',
    password: 'SecurePassword123!'
  }

  beforeEach(async () => {
    // Clean database before each test
    await prisma.user.deleteMany()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify(testUser)
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.user.email).toBe(testUser.email)
      expect(data.data.user.username).toBe(testUser.username)
      expect(data.data.token).toBeDefined()
      expect(data.data.user.password).toBeUndefined() // Password should not be returned
    })

    it('should reject registration with invalid email', async () => {
      const invalidUser = {
        ...testUser,
        email: 'invalid-email'
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify(invalidUser)
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Validation failed')
    })

    it('should reject registration with weak password', async () => {
      const weakPasswordUser = {
        ...testUser,
        password: 'weak',
        confirmPassword: 'weak'
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify(weakPasswordUser)
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Validation failed')
    })

    it('should reject registration with mismatched passwords', async () => {
      const mismatchedUser = {
        ...testUser,
        confirmPassword: 'DifferentPassword123!'
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify(mismatchedUser)
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Passwords do not match')
    })

    it('should reject duplicate email registration', async () => {
      // First registration
      const request1 = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify(testUser)
      })
      await registerHandler(request1)

      // Second registration with same email
      const duplicateUser = {
        ...testUser,
        username: 'differentuser'
      }

      const request2 = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.2'
        },
        body: JSON.stringify(duplicateUser)
      })

      const response = await registerHandler(request2)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Conflict')
      expect(data.message).toContain('email already exists')
    })

    it('should reject duplicate username registration', async () => {
      // First registration
      const request1 = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify(testUser)
      })
      await registerHandler(request1)

      // Second registration with same username
      const duplicateUser = {
        ...testUser,
        email: 'different@example.com'
      }

      const request2 = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.2'
        },
        body: JSON.stringify(duplicateUser)
      })

      const response = await registerHandler(request2)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Conflict')
      expect(data.message).toContain('Username is already taken')
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify(testUser)
      })
      await registerHandler(request)
    })

    it('should login with valid credentials', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify(testLogin)
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.user.email).toBe(testLogin.email)
      expect(data.data.token).toBeDefined()
      expect(data.data.user.password).toBeUndefined()
    })

    it('should reject login with invalid email', async () => {
      const invalidLogin = {
        ...testLogin,
        email: 'nonexistent@example.com'
      }

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify(invalidLogin)
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.message).toBe('Invalid email or password.')
    })

    it('should reject login with invalid password', async () => {
      const invalidLogin = {
        ...testLogin,
        password: 'WrongPassword123!'
      }

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify(invalidLogin)
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.message).toBe('Invalid email or password.')
    })

    it('should reject login with malformed email', async () => {
      const invalidLogin = {
        ...testLogin,
        email: 'invalid-email'
      }

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify(invalidLogin)
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Validation failed')
    })

    it('should handle missing password', async () => {
      const invalidLogin = {
        email: testLogin.email
        // password missing
      }

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify(invalidLogin)
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Validation failed')
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on registration', async () => {
      // Make multiple registration requests from same IP
      for (let i = 0; i < 6; i++) {
        const user = {
          ...testUser,
          email: `test${i}@example.com`,
          username: `testuser${i}`
        }

        const request = new NextRequest('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.1'
          },
          body: JSON.stringify(user)
        })

        const response = await registerHandler(request)
        
        if (i < 5) {
          // First 5 requests should succeed (or fail validation)
          expect(response.status).not.toBe(429)
        } else {
          // 6th request should be rate limited
          const data = await response.json()
          expect(response.status).toBe(429)
          expect(data.error).toBe('Too Many Requests')
        }
      }
    })

    it('should enforce rate limiting on login', async () => {
      // Create a user first
      const registerRequest = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify(testUser)
      })
      await registerHandler(registerRequest)

      // Make multiple login requests from same IP
      for (let i = 0; i < 6; i++) {
        const request = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.1'
          },
          body: JSON.stringify(testLogin)
        })

        const response = await loginHandler(request)
        
        if (i < 5) {
          // First request should succeed, others should fail auth
          if (i === 0) {
            expect(response.status).toBe(200)
          } else {
            expect(response.status).toBe(401)
          }
        } else {
          // 6th request should be rate limited
          const data = await response.json()
          expect(response.status).toBe(429)
          expect(data.error).toBe('Too Many Requests')
        }
      }
    })
  })
})

