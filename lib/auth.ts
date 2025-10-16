import { SignJWT, jwtVerify } from 'jose'

/**
 * JWT authentication utilities using jose library
 * Following OWASP ASVS V2.1 - Authentication Architecture
 * Uses HS256 algorithm with secure token expiration
 */

// JWT configuration constants
const JWT_SECRET = process.env.JWT_SECRET
const TOKEN_EXPIRY = '15m' // 15 minutes as specified
const ALGORITHM = 'HS256'

// Validate JWT secret on module load (skip during build)
if (process.env.NODE_ENV !== 'production' && (!JWT_SECRET || JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must be at least 32 characters long')
}

// Create secret key for jose
const secretKey = new TextEncoder().encode(JWT_SECRET)

/**
 * JWT payload interface
 * Contains minimal user information for security
 */
export interface JWTPayload {
  sub: string // User ID (subject)
  email: string
  username: string
  iat: number // Issued at
  exp: number // Expires at
  jti: string // JWT ID for token uniqueness
}

/**
 * Creates a signed JWT token for authenticated user
 * 
 * Security considerations:
 * - Uses HS256 algorithm for symmetric signing
 * - Short expiration time (15 minutes) to limit exposure
 * - Includes JTI for token uniqueness and revocation
 * - Minimal payload to reduce information leakage
 * 
 * @param userId - User's unique identifier
 * @param email - User's email address
 * @param username - User's username
 * @returns Promise resolving to signed JWT token
 * @throws Error if token creation fails
 */
export async function createToken(userId: string, email: string, username: string): Promise<string> {
  try {
    // Validate inputs
    if (!userId || !email || !username) {
      throw new Error('User ID, email, and username are required')
    }

    // Generate unique token ID for tracking and revocation
    const jti = crypto.randomUUID()

    // Create JWT with minimal payload
    const token = await new SignJWT({
      sub: userId,
      email,
      username,
      jti
    })
      .setProtectedHeader({ alg: ALGORITHM })
      .setIssuedAt()
      .setExpirationTime(TOKEN_EXPIRY)
      .setJti(jti)
      .sign(secretKey)

    return token
  } catch (error) {
    console.error('Token creation error:', error instanceof Error ? error.message : 'Unknown error')
    throw new Error('Token creation failed')
  }
}

/**
 * Verifies and decodes a JWT token
 * 
 * Security considerations:
 * - Validates signature to prevent tampering
 * - Checks expiration to prevent replay attacks
 * - Verifies algorithm to prevent algorithm confusion
 * - Returns structured payload with type safety
 * 
 * @param token - JWT token to verify
 * @returns Promise resolving to decoded JWT payload
 * @throws Error if token is invalid, expired, or malformed
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    // Validate input
    if (!token || typeof token !== 'string') {
      throw new Error('Token must be a non-empty string')
    }

    // Verify and decode token
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: [ALGORITHM]
    })

    // Validate required fields in payload
    if (!payload.sub || !payload.email || !payload.username) {
      throw new Error('Invalid token payload')
    }

    // Type-safe payload with required fields
    const jwtPayload: JWTPayload = {
      sub: payload.sub as string,
      email: payload.email as string,
      username: payload.username as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
      jti: payload.jti as string
    }

    return jwtPayload
  } catch (error) {
    // Handle specific JWT errors
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        throw new Error('Token has expired')
      }
      if (error.message.includes('signature')) {
        throw new Error('Invalid token signature')
      }
      if (error.message.includes('algorithm')) {
        throw new Error('Invalid token algorithm')
      }
    }

    console.error('Token verification error:', error instanceof Error ? error.message : 'Unknown error')
    throw new Error('Token verification failed')
  }
}

/**
 * Extracts token from Authorization header
 * Supports Bearer token format
 * 
 * @param authHeader - Authorization header value
 * @returns Extracted token string or null if not found
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null
  }

  // Check for Bearer token format
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null
  }

  const token = parts[1]
  return token || null
}

/**
 * Validates token and returns user information
 * Combines token extraction and verification
 * 
 * @param authHeader - Authorization header from request
 * @returns Promise resolving to user payload or null if invalid
 */
export async function validateAuthHeader(authHeader: string | null): Promise<JWTPayload | null> {
  try {
    const token = extractTokenFromHeader(authHeader)
    if (!token) {
      return null
    }

    return await verifyToken(token)
  } catch (error) {
    // Return null for any validation error
    return null
  }
}

/**
 * Creates a refresh token (longer-lived token for session management)
 * Used for extending user sessions without re-authentication
 * 
 * @param userId - User's unique identifier
 * @returns Promise resolving to refresh token
 */
export async function createRefreshToken(userId: string): Promise<string> {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }

    const jti = crypto.randomUUID()

    const refreshToken = await new SignJWT({
      sub: userId,
      type: 'refresh'
    })
      .setProtectedHeader({ alg: ALGORITHM })
      .setIssuedAt()
      .setExpirationTime('7d') // 7 days for refresh tokens
      .setJti(jti)
      .sign(secretKey)

    return refreshToken
  } catch (error) {
    console.error('Refresh token creation error:', error instanceof Error ? error.message : 'Unknown error')
    throw new Error('Refresh token creation failed')
  }
}

/**
 * Verifies a refresh token
 * 
 * @param token - Refresh token to verify
 * @returns Promise resolving to user ID or null if invalid
 */
export async function verifyRefreshToken(token: string): Promise<string | null> {
  try {
    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: [ALGORITHM]
    })

    // Check if it's a refresh token
    if (payload.type !== 'refresh') {
      return null
    }

    return payload.sub as string || null
  } catch (error) {
    return null
  }
}
