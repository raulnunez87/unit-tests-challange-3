import { z } from 'zod'

/**
 * Validation schemas for user authentication
 * Following OWASP ASVS V5.1 - Input validation requirements
 */

// Common validation patterns for security
const emailSchema = z.string()
  .trim()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(254, 'Email must not exceed 254 characters') // RFC 5321 limit
  .toLowerCase()

const usernameSchema = z.string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must not exceed 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores')
  .refine((val) => !val.startsWith('_') && !val.endsWith('_'), {
    message: 'Username cannot start or end with underscore'
  })

// Strong password requirements following OWASP guidelines
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')
  .refine((password) => {
    // Check for common weak patterns
    const commonPatterns = [
      /123456/, /password/i, /qwerty/i, /abc123/i,
      /admin/i, /user/i, /test/i, /welcome/i
    ]
    return !commonPatterns.some(pattern => pattern.test(password))
  }, 'Password contains common weak patterns')

/**
 * User registration schema
 * Validates all required fields for user signup
 */
export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

/**
 * User login schema
 * Validates credentials for authentication
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password must not exceed 128 characters')
})

/**
 * API response schemas for consistent error handling
 */
export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  status: z.number()
})

export const apiSuccessSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional()
})

// Type exports for TypeScript
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ApiError = z.infer<typeof apiErrorSchema>
export type ApiSuccess = z.infer<typeof apiSuccessSchema>

/**
 * Validates user input and returns parsed data or throws validation error
 * @param schema - Zod schema to validate against
 * @param data - Raw input data
 * @returns Parsed and validated data
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format Zod validation errors into user-friendly messages
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      
      throw new Error(`Validation failed: ${formattedErrors.map(e => `${e.field}: ${e.message}`).join(', ')}`)
    }
    throw error
  }
}
