import { NextRequest, NextResponse } from 'next/server'
import { validateInput, registerSchema } from '@/lib/schemas'
import { hashPassword } from '@/lib/crypto'
import { createToken } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('Registration request started')
    
    // Parse and validate request body
    const body = await request.json()
    console.log('Request body parsed:', { email: body.email, username: body.username })
    
    const validatedData = validateInput(registerSchema, body)
    console.log('Data validated successfully')

    // Check if user already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    console.log('Email check completed')

    if (existingUserByEmail) {
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
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username: validatedData.username }
    })
    console.log('Username check completed')

    if (existingUserByUsername) {
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

    // Create user in database
    console.log('Creating user in database')
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
      }
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
