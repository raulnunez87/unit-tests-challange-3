import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createToken, verifyToken } from '../../lib/auth';

// Environment variables are set in tests/setup.ts

describe('Auth Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createToken', () => {
    it('should create a valid JWT token with user data', async () => {
      const token = await createToken('user123', 'test@example.com', 'testuser');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should create token with correct payload structure', async () => {
      const token = await createToken('user456', 'user@example.com', 'user456');
      const payload = JSON.parse(atob(token.split('.')[1]));

      expect(payload.sub).toBe('user456');
      expect(payload.email).toBe('user@example.com');
      expect(payload.username).toBe('user456');
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
      expect(payload.jti).toBeDefined();
    });

    it('should create token with 15 minute expiration', async () => {
      const token = await createToken('user789', 'expire@example.com', 'expire');
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const expiration = payload.exp;

      expect(expiration - now).toBeGreaterThan(890); // ~15 minutes
      expect(expiration - now).toBeLessThan(901); // ~15 minutes
    });

    it('should throw error for invalid user data', async () => {
      await expect(createToken(null as any, null as any, null as any)).rejects.toThrow('Token creation failed');
      await expect(createToken(undefined as any, undefined as any, undefined as any)).rejects.toThrow('Token creation failed');
      await expect(createToken('', '', '')).rejects.toThrow('Token creation failed');
    });

    it('should throw error for missing required fields', async () => {
      await expect(createToken('', 'test@example.com', 'user123')).rejects.toThrow('Token creation failed');
      await expect(createToken('user123', '', 'user123')).rejects.toThrow('Token creation failed');
    });
  });

  describe('verifyToken', () => {
    let validToken: string;

    beforeEach(async () => {
      validToken = await createToken('user123', 'test@example.com', 'testuser');
    });

    it('should verify a valid token and return payload', async () => {
      const payload = await verifyToken(validToken);

      expect(payload).toBeDefined();
      expect(payload.sub).toBe('user123');
      expect(payload.email).toBe('test@example.com');
      expect(payload.username).toBe('testuser');
    });

    it('should throw error for invalid token format', async () => {
      await expect(verifyToken('invalid-token')).rejects.toThrow('Token verification failed');
      await expect(verifyToken('invalid.token')).rejects.toThrow('Token verification failed');
      await expect(verifyToken('invalid.token.format.extra')).rejects.toThrow('Token verification failed');
    });

    it('should throw error for empty or null token', async () => {
      await expect(verifyToken('')).rejects.toThrow('Token verification failed');
      await expect(verifyToken(null as any)).rejects.toThrow('Token verification failed');
      await expect(verifyToken(undefined as any)).rejects.toThrow('Token verification failed');
    });

    it('should throw error for token with invalid signature', async () => {
      const parts = validToken.split('.');
      const manipulatedToken = parts[0] + '.' + parts[1] + '.invalid-signature';

      await expect(verifyToken(manipulatedToken)).rejects.toThrow('Invalid token signature');
    });

    it('should throw error for expired token', async () => {
      // Create a token that expires in 1ms
      vi.useFakeTimers();
      const expiredToken = await createToken('user123', 'test@example.com', 'testuser');
      
      // Fast forward time by 16 minutes
      vi.advanceTimersByTime(16 * 60 * 1000);
      
      await expect(verifyToken(expiredToken)).rejects.toThrow('Token verification failed');
      
      vi.useRealTimers();
    });

    it('should throw error for malformed payload', async () => {
      const malformedToken = 'eyJhbGciOiJIUzI1NiJ9.eyJpbnZhbGlkOnBheWxvYWQifQ.invalid-signature';

      await expect(verifyToken(malformedToken)).rejects.toThrow('Invalid token signature');
    });

    it('should handle token with missing required fields', async () => {
      const incompletePayload = {
        sub: 'user123'
        // Missing email, username, etc.
      };
      
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(incompletePayload));
      const incompleteToken = `${header}.${payload}.invalid-signature`;

      await expect(verifyToken(incompleteToken)).rejects.toThrow('Invalid token signature');
    });
  });

  describe('Token Security', () => {
    it('should generate unique jti for each token', async () => {
      const token1 = await createToken('user123', 'test@example.com', 'testuser');
      const token2 = await createToken('user123', 'test@example.com', 'testuser');

      const payload1 = JSON.parse(atob(token1.split('.')[1]));
      const payload2 = JSON.parse(atob(token2.split('.')[1]));

      expect(payload1.jti).not.toBe(payload2.jti);
    });

    it('should handle concurrent token creation', async () => {
      const promises = Array(10).fill(null).map(() => createToken('user123', 'test@example.com', 'testuser'));
      const tokens = await Promise.all(promises);

      // All tokens should be different
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(10);

      // All tokens should be valid
      for (const token of tokens) {
        const payload = await verifyToken(token);
        expect(payload.sub).toBe('user123');
      }
    });
  });
});
