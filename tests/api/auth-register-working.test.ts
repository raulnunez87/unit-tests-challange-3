import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/register-working/route'
import prisma from '@/lib/prisma'

/**
 * Tests for the working register API endpoint
 * POST /api/auth/register-working
 * 
 * Tests registration with findFirst instead of findUnique for better compatibility
 */

describe('Authentication Register Working API', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    username: `testuser-${Date.now()}`,
    password: 'MySecurePass789!',
    confirmPassword: 'MySecurePass789!'
  }

  beforeEach(() => {
    // Clear any existing mocks
    vi.clearAllMocks()
  })

  afterEach(async () => {
    // Clean up any test users that might have been created
    await prisma.user.deleteMany({
      where: {
        email: testUser.email
      }
    })
  })

  describe('POST /api/auth/register-working', () => {
    it('should register a new user successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUser)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.message).toBe('User registered successfully')
      expect(data.data.user.email).toBe(testUser.email)
      expect(data.data.user.username).toBe(testUser.username)
      expect(data.data.token).toBeDefined()
      expect(data.data.user.password).toBeUndefined() // Password should not be returned
      expect(data.data.user.id).toBeDefined()
      expect(data.data.user.createdAt).toBeDefined()
    })

    it('should reject registration with invalid email', async () => {
      const invalidUser = {
        ...testUser,
        email: 'invalid-email'
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidUser)
      })

      const response = await POST(request)
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

      const request = new NextRequest('http://localhost:3000/api/auth/register-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(weakPasswordUser)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Validation failed')
    })

    it('should reject registration with mismatched passwords', async () => {
      const mismatchedUser = {
        ...testUser,
        confirmPassword: 'DifferentPass789!'
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mismatchedUser)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Passwords do not match')
    })

    it('should reject duplicate email registration', async () => {
      // First registration
      const request1 = new NextRequest('http://localhost:3000/api/auth/register-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUser)
      })
      await POST(request1)

      // Second registration with same email
      const duplicateUser = {
        ...testUser,
        username: 'differentuser'
      }

      const request2 = new NextRequest('http://localhost:3000/api/auth/register-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(duplicateUser)
      })

      const response = await POST(request2)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Conflict')
      expect(data.message).toBe('An account with this email already exists.')
    })

    it('should reject duplicate username registration', async () => {
      // First registration
      const request1 = new NextRequest('http://localhost:3000/api/auth/register-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUser)
      })
      await POST(request1)

      // Second registration with same username
      const duplicateUser = {
        ...testUser,
        email: 'different@example.com'
      }

      const request2 = new NextRequest('http://localhost:3000/api/auth/register-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(duplicateUser)
      })

      const response = await POST(request2)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Conflict')
      expect(data.message).toBe('Username is already taken.')
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
      expect(data.message).toBe('An error occurred during registration. Please try again.')
      expect(data.debug).toBeDefined()
    })

    it('should handle database connection errors gracefully', async () => {
      // Mock prisma to throw an error
      vi.spyOn(prisma.user, 'findFirst').mockRejectedValueOnce(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/auth/register-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUser)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
      expect(data.message).toBe('An error occurred during registration. Please try again.')
      expect(data.debug).toBe('Database connection failed')
    })

    it('should handle missing required fields', async () => {
      const incompleteUser = {
        email: testUser.email
        // missing username, password, confirmPassword
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(incompleteUser)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
      expect(data.message).toContain('Validation failed')
    })

    it('should handle unknown errors gracefully', async () => {
      // Mock prisma to throw a non-Error object
      vi.spyOn(prisma.user, 'findFirst').mockRejectedValueOnce('Unknown error')

      const request = new NextRequest('http://localhost:3000/api/auth/register-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUser)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
      expect(data.message).toBe('An error occurred during registration. Please try again.')
      expect(data.debug).toBe('Unknown error')
    })

    it('should use findFirst instead of findUnique for better compatibility', async () => {
      const findFirstSpy = vi.spyOn(prisma.user, 'findFirst')

      const request = new NextRequest('http://localhost:3000/api/auth/register-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUser)
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(findFirstSpy).toHaveBeenCalledWith({
        where: { email: testUser.email }
      })
      expect(findFirstSpy).toHaveBeenCalledWith({
        where: { username: testUser.username }
      })

      findFirstSpy.mockRestore()
    })

    it('should log registration process steps', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const request = new NextRequest('http://localhost:3000/api/auth/register-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUser)
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(consoleSpy).toHaveBeenCalledWith('Registration request started')
      expect(consoleSpy).toHaveBeenCalledWith('Data validated successfully')
      expect(consoleSpy).toHaveBeenCalledWith('Email check completed')
      expect(consoleSpy).toHaveBeenCalledWith('Username check completed')
      expect(consoleSpy).toHaveBeenCalledWith('Starting password hash')
      expect(consoleSpy).toHaveBeenCalledWith('Password hashed successfully')
      expect(consoleSpy).toHaveBeenCalledWith('Creating user in database')
      expect(consoleSpy).toHaveBeenCalledWith('User created successfully:', expect.any(String))
      expect(consoleSpy).toHaveBeenCalledWith('Generating JWT token')
      expect(consoleSpy).toHaveBeenCalledWith('JWT token generated successfully')

      consoleSpy.mockRestore()
    })

    it('should handle validation errors with proper logging', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const invalidUser = {
        ...testUser,
        email: 'invalid-email'
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidUser)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(consoleSpy).toHaveBeenCalledWith('Registration request started')
      expect(consoleErrorSpy).toHaveBeenCalledWith('Registration error:', expect.any(Error))

      consoleSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })

    it('should create user with single database operation (no transaction)', async () => {
      const createSpy = vi.spyOn(prisma.user, 'create')

      const request = new NextRequest('http://localhost:3000/api/auth/register-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUser)
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(createSpy).toHaveBeenCalledWith({
        data: {
          email: testUser.email,
          username: testUser.username,
          password: expect.any(String) // Hashed password
        },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true
        }
      })

      createSpy.mockRestore()
    })
  })
})
