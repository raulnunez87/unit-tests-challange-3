import { describe, it, expect, beforeEach } from 'vitest';

// Mock the API routes for ReDoS testing
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('ReDoS (Regular Expression Denial of Service) Security Tests', () => {
  beforeEach(() => {
    // Clear any existing test data
  });

  describe('Email Validation ReDoS Protection', () => {
    it('should handle malicious email patterns without hanging', async () => {
      const maliciousEmails = [
        // Catastrophic backtracking patterns
        'a' + 'b'.repeat(100) + '@example.com',
        'a' + 'b'.repeat(1000) + '@example.com',
        'a' + 'b'.repeat(10000) + '@example.com',
        
        // Nested quantifiers
        '(a+)+' + 'b'.repeat(50) + '@example.com',
        '(a|a)+' + 'b'.repeat(50) + '@example.com',
        '(a*)*' + 'b'.repeat(50) + '@example.com',
        
        // Exponential backtracking
        'a'.repeat(20) + 'b'.repeat(20) + '@example.com',
        'a'.repeat(50) + 'b'.repeat(50) + '@example.com',
        
        // Complex nested patterns
        '((a+)+)+' + 'b'.repeat(30) + '@example.com',
        '((a*)*)*' + 'b'.repeat(30) + '@example.com',
        
        // Alternation with repetition
        '(a|aa)+' + 'b'.repeat(40) + '@example.com',
        '(a|aaa)+' + 'b'.repeat(40) + '@example.com',
        
        // Lookahead/lookbehind patterns (if supported)
        '(?=.*a).*' + 'b'.repeat(30) + '@example.com',
        '(?<=a).*' + 'b'.repeat(30) + '@example.com'
      ];

      for (const maliciousEmail of maliciousEmails) {
        const startTime = Date.now();
        
        const response = await fetch(`${BASE_URL}/api/auth/register-mock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: maliciousEmail,
            username: 'testuser',
            password: 'SecurePass123!',
            confirmPassword: 'SecurePass123!'
          })
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Should respond within 5 seconds (timeout protection)
        expect(duration).toBeLessThan(5000);
        
        // Should reject with 400 Bad Request
        expect(response.status).toBe(400);
        
        const result = await response.json();
        expect(result.success).toBe(false);
      }
    });

    it('should handle email with excessive repetition', async () => {
      const excessiveRepetitionEmails = [
        'a'.repeat(1000) + '@example.com',
        'a'.repeat(10000) + '@example.com',
        'a'.repeat(100000) + '@example.com',
        'test' + 'a'.repeat(5000) + '@example.com',
        'a'.repeat(1000) + 'b'.repeat(1000) + '@example.com'
      ];

      for (const email of excessiveRepetitionEmails) {
        const startTime = Date.now();
        
        const response = await fetch(`${BASE_URL}/api/auth/register-mock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            username: 'testuser',
            password: 'SecurePass123!',
            confirmPassword: 'SecurePass123!'
          })
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(5000);
        expect(response.status).toBe(400);
        
        const result = await response.json();
        expect(result.success).toBe(false);
      }
    });
  });

  describe('Username Validation ReDoS Protection', () => {
    it('should handle malicious username patterns without hanging', async () => {
      const maliciousUsernames = [
        // Catastrophic backtracking
        'a' + 'b'.repeat(100),
        'a' + 'b'.repeat(1000),
        
        // Nested quantifiers
        '(a+)+' + 'b'.repeat(50),
        '(a|a)+' + 'b'.repeat(50),
        '(a*)*' + 'b'.repeat(50),
        
        // Exponential patterns
        'a'.repeat(20) + 'b'.repeat(20),
        'a'.repeat(50) + 'b'.repeat(50),
        
        // Complex nested patterns
        '((a+)+)+' + 'b'.repeat(30),
        '((a*)*)*' + 'b'.repeat(30),
        
        // Alternation with repetition
        '(a|aa)+' + 'b'.repeat(40),
        '(a|aaa)+' + 'b'.repeat(40)
      ];

      for (const maliciousUsername of maliciousUsernames) {
        const startTime = Date.now();
        
        const response = await fetch(`${BASE_URL}/api/auth/register-mock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            username: maliciousUsername,
            password: 'SecurePass123!',
            confirmPassword: 'SecurePass123!'
          })
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(5000);
        expect(response.status).toBe(400);
        
        const result = await response.json();
        expect(result.success).toBe(false);
      }
    });

    it('should handle usernames with excessive length', async () => {
      const excessiveUsernames = [
        'a'.repeat(1000),
        'a'.repeat(10000),
        'a'.repeat(100000),
        'test' + 'a'.repeat(5000),
        'a'.repeat(1000) + 'b'.repeat(1000)
      ];

      for (const username of excessiveUsernames) {
        const startTime = Date.now();
        
        const response = await fetch(`${BASE_URL}/api/auth/register-mock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            username,
            password: 'SecurePass123!',
            confirmPassword: 'SecurePass123!'
          })
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(5000);
        expect(response.status).toBe(400);
        
        const result = await response.json();
        expect(result.success).toBe(false);
      }
    });
  });

  describe('Password Validation ReDoS Protection', () => {
    it('should handle malicious password patterns without hanging', async () => {
      const maliciousPasswords = [
        // Catastrophic backtracking
        'a' + 'b'.repeat(100),
        'a' + 'b'.repeat(1000),
        
        // Nested quantifiers
        '(a+)+' + 'b'.repeat(50),
        '(a|a)+' + 'b'.repeat(50),
        '(a*)*' + 'b'.repeat(50),
        
        // Exponential patterns
        'a'.repeat(20) + 'b'.repeat(20),
        'a'.repeat(50) + 'b'.repeat(50),
        
        // Complex nested patterns
        '((a+)+)+' + 'b'.repeat(30),
        '((a*)*)*' + 'b'.repeat(30),
        
        // Alternation with repetition
        '(a|aa)+' + 'b'.repeat(40),
        '(a|aaa)+' + 'b'.repeat(40)
      ];

      for (const maliciousPassword of maliciousPasswords) {
        const startTime = Date.now();
        
        const response = await fetch(`${BASE_URL}/api/auth/register-mock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            username: 'testuser',
            password: maliciousPassword,
            confirmPassword: maliciousPassword
          })
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(5000);
        expect(response.status).toBe(400);
        
        const result = await response.json();
        expect(result.success).toBe(false);
      }
    });

    it('should handle passwords with excessive length', async () => {
      const excessivePasswords = [
        'a'.repeat(1000),
        'a'.repeat(10000),
        'a'.repeat(100000),
        'SecurePass123!' + 'a'.repeat(5000),
        'a'.repeat(1000) + 'b'.repeat(1000)
      ];

      for (const password of excessivePasswords) {
        const startTime = Date.now();
        
        const response = await fetch(`${BASE_URL}/api/auth/register-mock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            username: 'testuser',
            password,
            confirmPassword: password
          })
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(5000);
        expect(response.status).toBe(400);
        
        const result = await response.json();
        expect(result.success).toBe(false);
      }
    });
  });

  describe('Login Endpoint ReDoS Protection', () => {
    it('should handle malicious login patterns without hanging', async () => {
      const maliciousLoginData = [
        {
          email: 'a' + 'b'.repeat(100) + '@example.com',
          password: 'SecurePass123!'
        },
        {
          email: 'test@example.com',
          password: 'a' + 'b'.repeat(100)
        },
        {
          email: '(a+)+' + 'b'.repeat(50) + '@example.com',
          password: '(a|a)+' + 'b'.repeat(50)
        },
        {
          email: 'a'.repeat(1000) + '@example.com',
          password: 'a'.repeat(1000)
        }
      ];

      for (const loginData of maliciousLoginData) {
        const startTime = Date.now();
        
        const response = await fetch(`${BASE_URL}/api/auth/login-mock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData)
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(5000);
        expect(response.status).toBe(400);
        
        const result = await response.json();
        expect(result.success).toBe(false);
      }
    });
  });

  describe('Concurrent ReDoS Protection', () => {
    it('should handle multiple concurrent ReDoS attempts', async () => {
      const maliciousPayload = {
        email: 'a' + 'b'.repeat(100) + '@example.com',
        username: '(a+)+' + 'b'.repeat(50),
        password: '(a|a)+' + 'b'.repeat(50),
        confirmPassword: '(a|a)+' + 'b'.repeat(50)
      };

      const startTime = Date.now();
      
      // Send multiple concurrent requests
      const promises = Array(5).fill(null).map(() => 
        fetch(`${BASE_URL}/api/auth/register-mock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(maliciousPayload)
        })
      );

      const responses = await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should handle all requests within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds for 5 concurrent requests
      
      // All should be rejected
      responses.forEach(response => {
        expect(response.status).toBe(400);
      });
    });

    it('should handle ReDoS attempts with different patterns concurrently', async () => {
      const maliciousPayloads = [
        {
          email: 'a' + 'b'.repeat(100) + '@example.com',
          username: 'testuser',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!'
        },
        {
          email: 'test@example.com',
          username: '(a+)+' + 'b'.repeat(50),
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!'
        },
        {
          email: 'test@example.com',
          username: 'testuser',
          password: '(a|a)+' + 'b'.repeat(50),
          confirmPassword: '(a|a)+' + 'b'.repeat(50)
        },
        {
          email: 'a'.repeat(1000) + '@example.com',
          username: 'a'.repeat(1000),
          password: 'a'.repeat(1000),
          confirmPassword: 'a'.repeat(1000)
        },
        {
          email: '(a*)*' + 'b'.repeat(30) + '@example.com',
          username: '(a*)*' + 'b'.repeat(30),
          password: '(a*)*' + 'b'.repeat(30),
          confirmPassword: '(a*)*' + 'b'.repeat(30)
        }
      ];

      const startTime = Date.now();
      
      const promises = maliciousPayloads.map(payload => 
        fetch(`${BASE_URL}/api/auth/register-mock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        })
      );

      const responses = await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(15000); // 15 seconds for 5 different patterns
      
      responses.forEach(response => {
        expect(response.status).toBe(400);
      });
    });
  });

  describe('Edge Cases and Boundary Testing', () => {
    it('should handle ReDoS patterns with special characters', async () => {
      const specialCharPayloads = [
        {
          email: 'a' + '\\'.repeat(100) + '@example.com',
          username: 'testuser',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!'
        },
        {
          email: 'test@example.com',
          username: 'a' + '\\'.repeat(100),
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!'
        },
        {
          email: 'a' + '\\'.repeat(100) + '@example.com',
          username: 'a' + '\\'.repeat(100),
          password: 'a' + '\\'.repeat(100),
          confirmPassword: 'a' + '\\'.repeat(100)
        }
      ];

      for (const payload of specialCharPayloads) {
        const startTime = Date.now();
        
        const response = await fetch(`${BASE_URL}/api/auth/register-mock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(5000);
        expect(response.status).toBe(400);
        
        const result = await response.json();
        expect(result.success).toBe(false);
      }
    });

    it('should handle ReDoS patterns with Unicode characters', async () => {
      const unicodePayloads = [
        {
          email: 'a' + '🚀'.repeat(100) + '@example.com',
          username: 'testuser',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!'
        },
        {
          email: 'test@example.com',
          username: 'a' + '🚀'.repeat(100),
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!'
        },
        {
          email: 'a' + '🚀'.repeat(100) + '@example.com',
          username: 'a' + '🚀'.repeat(100),
          password: 'a' + '🚀'.repeat(100),
          confirmPassword: 'a' + '🚀'.repeat(100)
        }
      ];

      for (const payload of unicodePayloads) {
        const startTime = Date.now();
        
        const response = await fetch(`${BASE_URL}/api/auth/register-mock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(5000);
        expect(response.status).toBe(400);
        
        const result = await response.json();
        expect(result.success).toBe(false);
      }
    });

    it('should handle ReDoS patterns with mixed character sets', async () => {
      const mixedPayloads = [
        {
          email: 'a' + 'b'.repeat(50) + '🚀'.repeat(50) + '@example.com',
          username: 'testuser',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!'
        },
        {
          email: 'test@example.com',
          username: 'a' + 'b'.repeat(50) + '🚀'.repeat(50),
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!'
        },
        {
          email: 'a' + 'b'.repeat(50) + '🚀'.repeat(50) + '@example.com',
          username: 'a' + 'b'.repeat(50) + '🚀'.repeat(50),
          password: 'a' + 'b'.repeat(50) + '🚀'.repeat(50),
          confirmPassword: 'a' + 'b'.repeat(50) + '🚀'.repeat(50)
        }
      ];

      for (const payload of mixedPayloads) {
        const startTime = Date.now();
        
        const response = await fetch(`${BASE_URL}/api/auth/register-mock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(5000);
        expect(response.status).toBe(400);
        
        const result = await response.json();
        expect(result.success).toBe(false);
      }
    });
  });

  describe('Performance Monitoring', () => {
    it('should maintain consistent response times under ReDoS load', async () => {
      const normalPayload = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      };

      const maliciousPayload = {
        email: 'a' + 'b'.repeat(100) + '@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      };

      // Test normal payload response time
      const normalStartTime = Date.now();
      const normalResponse = await fetch(`${BASE_URL}/api/auth/register-mock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(normalPayload)
      });
      const normalEndTime = Date.now();
      const normalDuration = normalEndTime - normalStartTime;

      // Test malicious payload response time
      const maliciousStartTime = Date.now();
      const maliciousResponse = await fetch(`${BASE_URL}/api/auth/register-mock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maliciousPayload)
      });
      const maliciousEndTime = Date.now();
      const maliciousDuration = maliciousEndTime - maliciousStartTime;

      // Malicious payload should not take significantly longer than normal payload
      expect(maliciousDuration).toBeLessThan(normalDuration * 10); // Within 10x of normal time
      
      expect(normalResponse.status).toBe(201); // Normal payload should succeed
      expect(maliciousResponse.status).toBe(400); // Malicious payload should fail
    });
  });
});
