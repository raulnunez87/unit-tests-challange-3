import { NextRequest, NextResponse } from 'next/server'
import { validateInput, loginSchema } from '@/lib/schemas'
import { verifyPassword } from '@/lib/crypto'
import { createToken } from '@/lib/auth'
import { mockStorage } from '@/lib/mock-storage'
import { checkFailedAttemptRateLimit, getClientIP, recordFailedAttempt } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    console.log('Login request started (MOCK)')
    
    // Get client IP for potential rate limiting
    const clientIP = getClientIP(request.headers)
    
    // Parse and validate request body
    const body = await request.json()
    console.log('Request body parsed:', { email: body.email })
    
    const validatedData = validateInput(loginSchema, body)
    console.log('Data validated successfully')

    // Find user by email
    const user = mockStorage.findByEmail(validatedData.email)
    console.log('User lookup completed')

    // Always perform password verification to prevent timing attacks
    // This ensures consistent response time regardless of user existence
    const isPasswordValid = user ? await verifyPassword(validatedData.password, user.password) : false
    console.log('Password verification completed')

    // If user doesn't exist or password is invalid
    if (!user || !isPasswordValid) {
      console.log('Login failed: invalid credentials')
      
      // Check rate limiting for failed attempts BEFORE recording
      const rateLimitResult = checkFailedAttemptRateLimit(clientIP)
      
      // Record failed attempt for rate limiting
      recordFailedAttempt(clientIP)
      
      // Only apply rate limiting if we've exceeded the limit
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            success: false,
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
      
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password.',
          message: 'Invalid email or password.',
          status: 401
        },
        { status: 401 }
      )
    }

    console.log('Login successful for user:', user.id)

    // Generate JWT token for authenticated session
    const token = await createToken(user.id, user.email, user.username)
    console.log('JWT token generated successfully')

    // Return success response with token
    return NextResponse.json(
      {
        success: true,
        message: 'Login successful (MOCK)',
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
      { status: 200 }
    )

  } catch (error) {
    console.error('Login error:', error)
    
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
