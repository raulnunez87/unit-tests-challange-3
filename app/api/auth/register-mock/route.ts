import { NextRequest, NextResponse } from 'next/server'
import { validateInput, registerSchema } from '@/lib/schemas'
import { hashPassword } from '@/lib/crypto'
import { createToken } from '@/lib/auth'
import { mockStorage } from '@/lib/mock-storage'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    console.log('Registration request started (MOCK)')
    
    // Get client IP for potential rate limiting
    const clientIP = getClientIP(request.headers)
    
    // Parse and validate request body
    const body = await request.json()
    console.log('Request body parsed:', { email: body.email, username: body.username })
    
    const validatedData = validateInput(registerSchema, body)
    console.log('Data validated successfully')

    // Check if user already exists
    const existingUserByEmail = mockStorage.findByEmail(validatedData.email)
    console.log('Email check completed')

    if (existingUserByEmail) {
      // Check rate limiting for failed attempts first
      const { checkFailedAttemptRateLimit } = await import('@/lib/rate-limit')
      const rateLimitResult = checkFailedAttemptRateLimit(clientIP)
      
      // Only apply rate limiting if we've exceeded the limit
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            status: 429,
            retryAfter: rateLimitResult.retryAfter
          },
          { 
            status: 429,
            headers: {
              'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
              'X-RateLimit-Limit': '5',
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
            }
          }
        )
      }
      
      // Record failed attempt for rate limiting (duplicate email) after checking
      const { recordFailedAttempt } = await import('@/lib/rate-limit')
      recordFailedAttempt(clientIP)
      
      return NextResponse.json(
        {
          error: 'Conflict',
          message: 'An account with this email already exists.',
          status: 409
        },
        { status: 409 }
      )
    }

    // Check username
    const existingUserByUsername = mockStorage.findByUsername(validatedData.username)
    console.log('Username check completed')

    if (existingUserByUsername) {
      // Check rate limiting for failed attempts first
      const { checkFailedAttemptRateLimit } = await import('@/lib/rate-limit')
      const rateLimitResult = checkFailedAttemptRateLimit(clientIP)
      
      // Only apply rate limiting if we've exceeded the limit
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            status: 429,
            retryAfter: rateLimitResult.retryAfter
          },
          { 
            status: 429,
            headers: {
              'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
              'X-RateLimit-Limit': '5',
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
            }
          }
        )
      }
      
      // Record failed attempt for rate limiting (duplicate username) after checking
      const { recordFailedAttempt } = await import('@/lib/rate-limit')
      recordFailedAttempt(clientIP)
      
      return NextResponse.json(
        {
          error: 'Conflict',
          message: 'Username is already taken.',
          status: 409
        },
        { status: 409 }
      )
    }

    // Hash password securely
    console.log('Starting password hash')
    const hashedPassword = await hashPassword(validatedData.password)
    console.log('Password hashed successfully')

    // Create user (mock)
    console.log('Creating user (mock)')
    const user = mockStorage.createUser({
      email: validatedData.email,
      username: validatedData.username,
      password: hashedPassword
    })
    console.log('User created successfully:', user.id)

    // Generate JWT token for immediate authentication
    console.log('Generating JWT token')
    const token = await createToken(user.id, user.email, user.username)
    console.log('JWT token generated successfully')

    // Return success response with token
    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully (MOCK)',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            createdAt: user.createdAt
          },
          token
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    
    // Handle validation errors
    if (error instanceof Error && error.message.includes('Validation failed')) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: error.message,
          status: 400
        },
        { status: 400 }
      )
    }

    // Generic error response
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An error occurred during registration. Please try again.',
        status: 500,
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to see registered users (for testing)
export async function GET() {
  const users = mockStorage.getAllUsers()
  return NextResponse.json({
    message: 'Registered users (MOCK)',
    count: users.length,
    users: users.map(user => ({
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt
    }))
  })
}
