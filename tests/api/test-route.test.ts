import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/test/route'

/**
 * Tests for the test API endpoint
 * GET /api/test and POST /api/test
 * 
 * Tests basic API functionality and request handling
 */

describe('Test API Route', () => {
  describe('GET /api/test', () => {
    it('should return successful response', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('API is working!')
    })

    it('should return valid JSON response', async () => {
      const response = await GET()
      const data = await response.json()

      expect(typeof data).toBe('object')
      expect(data).toHaveProperty('message')
      expect(typeof data.message).toBe('string')
    })
  })

  describe('POST /api/test', () => {
    it('should handle valid JSON request body', async () => {
      const requestBody = {
        test: 'data',
        number: 123,
        boolean: true,
        nested: {
          value: 'test'
        }
      }

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('POST request received')
      expect(data.data).toEqual(requestBody)
      expect(data.timestamp).toBeDefined()
      expect(new Date(data.timestamp)).toBeInstanceOf(Date)
    })

    it('should handle empty JSON request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('POST request received')
      expect(data.data).toEqual({})
      expect(data.timestamp).toBeDefined()
    })

    it('should handle null request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(null)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('POST request received')
      expect(data.data).toBeNull()
      expect(data.timestamp).toBeDefined()
    })

    it('should handle invalid JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Failed to parse JSON')
      expect(data.message).toContain('Unexpected token')
    })

    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: '{"incomplete": json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Failed to parse JSON')
      expect(data.message).toBeDefined()
    })

    it('should handle missing request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
        // No body provided
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Failed to parse JSON')
      expect(data.message).toBeDefined()
    })

    it('should return consistent timestamp format', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: 'data' })
      })

      const response = await POST(request)
      const data = await response.json()

      // Verify timestamp is valid ISO string
      const timestamp = new Date(data.timestamp)
      expect(timestamp.toISOString()).toBe(data.timestamp)
      expect(timestamp.getTime()).toBeGreaterThan(0)
    })

    it('should handle large JSON payloads', async () => {
      const largePayload = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          value: `item-${i}`,
          timestamp: new Date().toISOString()
        }))
      }

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(largePayload)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('POST request received')
      expect(data.data).toEqual(largePayload)
      expect(data.data.data).toHaveLength(1000)
    })

    it('should preserve request body structure', async () => {
      const complexBody = {
        string: 'test',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: {
          nested: 'value',
          deep: {
            nested: 'deep value'
          }
        }
      }

      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(complexBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(complexBody)
      expect(data.data.object.deep.nested).toBe('deep value')
    })
  })
})
