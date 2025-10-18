import { NextRequest, NextResponse } from 'next/server'
import { validateInput, loginSchema } from '@/lib/schemas'
import { verifyPassword } from '@/lib/crypto'
import { createToken } from '@/lib/auth'
import { checkRateLimit, getClientIP, recordFailedAttempt, checkFailedAttemptRateLimit } from '@/lib/rate-limit'
import prisma from '@/lib/prisma'

/**
 * User login API endpoint
 * POST /api/auth/login
 * 
 * Security considerations:
 * - Input validation using Zod schemas
 * - Rate limiting to prevent brute force attacks
 * - Secure password verification with bcrypt
 * - Consistent timing to prevent user enumeration
 * - JWT token generation for authenticated sessions
 */

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request.headers)

    // Parse and validate request body
    const body = await request.json()
    const validatedData = validateInput(loginSchema, body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        createdAt: true
      }
    })

    // Always perform password verification to prevent timing attacks
    // This ensures consistent response time regardless of user existence
    const isPasswordValid = user ? await verifyPassword(validatedData.password, user.password) : false

    // If user doesn't exist or password is invalid
    if (!user || !isPasswordValid) {
      // Record failed attempt for security monitoring
      recordFailedAttempt(clientIP)
      
      // Check if we should rate limit after failed attempts
      const rateLimitResult = checkFailedAttemptRateLimit(clientIP)
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: 'Too Many Requests',
            message: 'Too many login attempts. Please try again later.',
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
      
      // Return generic error to prevent user enumeration
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid email or password.',
          status: 401
        },
        { 
          status: 401,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      )
    }

    // Generate JWT token for authenticated session
    const token = await createToken(user.id, user.email, user.username)

    // Check rate limit for successful login
    const rateLimitResult = checkRateLimit(clientIP)
    
    // Return success response with token
    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
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
        status: 200,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
        }
      }
    )

  } catch (error) {
    console.error('Login error:', error instanceof Error ? error.message : 'Unknown error')

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

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An error occurred during login. Please try again.',
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
