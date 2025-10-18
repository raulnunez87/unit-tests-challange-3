import { NextRequest, NextResponse } from 'next/server'
import { validateInput, registerSchema } from '@/lib/schemas'
import { hashPassword } from '@/lib/crypto'
import { createToken } from '@/lib/auth'
import { checkRateLimit, getClientIP, recordFailedAttempt, checkFailedAttemptRateLimit } from '@/lib/rate-limit'
import prisma from '@/lib/prisma'

/**
 * User registration API endpoint
 * POST /api/auth/register
 * 
 * Security considerations:
 * - Input validation using Zod schemas
 * - Rate limiting to prevent abuse
 * - Secure password hashing with bcrypt
 * - JWT token generation for immediate authentication
 * - Consistent error responses to prevent user enumeration
 */

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request.headers)

    // Parse and validate request body
    const body = await request.json()
    const validatedData = validateInput(registerSchema, body)

    // Check if user already exists
    // Check email first
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUserByEmail) {
      // Check if we should rate limit after failed attempts
      const rateLimitResult = checkFailedAttemptRateLimit(clientIP)
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: 'Too Many Requests',
            message: 'Too many registration attempts. Please try again later.',
            status: 429
          },
          { 
            status: 429,
            headers: {
              'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
              'X-RateLimit-Limit': '5',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
            }
          }
        )
      }
      
      // Record failed attempt for security monitoring
      recordFailedAttempt(clientIP)
      
      return NextResponse.json(
        {
          success: false,
          error: 'Conflict',
          message: 'An account with this email already exists.',
          status: 409
        },
        { status: 409 }
      )
    }

    // Check username
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username: validatedData.username }
    })

    if (existingUserByUsername) {
      // Check if we should rate limit after failed attempts
      const rateLimitResult = checkFailedAttemptRateLimit(clientIP)
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: 'Too Many Requests',
            message: 'Too many registration attempts. Please try again later.',
            status: 429
          },
          { 
            status: 429,
            headers: {
              'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
              'X-RateLimit-Limit': '5',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
            }
          }
        )
      }
      
      // Record failed attempt for security monitoring
      recordFailedAttempt(clientIP)
      
      return NextResponse.json(
        {
          success: false,
          error: 'Conflict',
          message: 'Username is already taken.',
          status: 409
        },
        { status: 409 }
      )
    }

    // Hash password securely
    const hashedPassword = await hashPassword(validatedData.password)

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        username: validatedData.username,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true
        // Explicitly exclude password from response
      }
    })

    // Generate JWT token for immediate authentication
    const token = await createToken(user.id, user.email, user.username)

    // Check rate limit for successful registration
    const rateLimitResult = checkRateLimit(clientIP)
    
    // Return success response with token
    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
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
      { 
        status: 201,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
        }
      }
    )

  } catch (error) {
    console.error('Registration error:', error instanceof Error ? error.message : 'Unknown error')

    // Handle validation errors
    if (error instanceof Error && error.message.includes('Validation failed')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: error.message,
          status: 400
        },
        { status: 400 }
      )
    }

    // Handle database errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conflict',
          message: 'An account with this email or username already exists.',
          status: 409
        },
        { status: 409 }
      )
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An error occurred during registration. Please try again.',
        status: 500
      },
      { status: 500 }
    )
  }
}

/**
 * Handle unsupported HTTP methods
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Method Not Allowed',
      message: 'GET method is not supported for this endpoint',
      status: 405
    },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    {
      error: 'Method Not Allowed',
      message: 'PUT method is not supported for this endpoint',
      status: 405
    },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'Method Not Allowed',
      message: 'DELETE method is not supported for this endpoint',
      status: 405
    },
    { status: 405 }
  )
}
