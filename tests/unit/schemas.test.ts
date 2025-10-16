import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../../lib/schemas';

describe('Zod Schemas', () => {
  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'MySecurePass123!',
        confirmPassword: 'MySecurePass123!'
      };

      const result = registerSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com',
        'test@.com',
        'test@example.',
        '',
        null,
        undefined
      ];

      invalidEmails.forEach(email => {
        const data = {
          email,
          username: 'testuser',
          password: 'MySecurePass123!',
          confirmPassword: 'SecurePass123!'
        };

        const result = registerSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some(issue => 
            issue.path.includes('email')
          )).toBe(true);
        }
      });
    });

    it('should reject invalid usernames', () => {
      const invalidUsernames = [
        '', // Empty
        'a', // Too short
        'ab', // Too short
        'a'.repeat(31), // Too long
        'user name', // Contains space
        'user@name', // Contains special characters
        '_username', // Starts with underscore
        'username_', // Ends with underscore
        null,
        undefined
      ];

      invalidUsernames.forEach(username => {
        const data = {
          email: 'test@example.com',
          username,
          password: 'MySecurePass123!',
          confirmPassword: 'MySecurePass123!'
        };

        const result = registerSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some(issue => 
            issue.path.includes('username')
          )).toBe(true);
        }
      });
    });

    it('should accept valid usernames', () => {
      const validUsernames = [
        'user123',
        'testuser',
        'myusername',
        'a'.repeat(3), // Minimum length
        'a'.repeat(30), // Maximum length
        'User123',
        'test123',
        'user-name', // Contains hyphen
        'user_name', // Contains underscore
        '123user' // Starts with number
      ];

      validUsernames.forEach(username => {
        const data = {
          email: 'test@example.com',
          username,
          password: 'MySecurePass123!',
          confirmPassword: 'MySecurePass123!'
        };

        const result = registerSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject passwords that do not match', () => {
      const data = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'MySecurePass123!',
        confirmPassword: 'DifferentPass123!'
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('Passwords do not match')
        )).toBe(true);
      }
    });

    it('should reject missing required fields', () => {
      const incompleteData = [
        { username: 'testuser', password: 'SecurePass123!', confirmPassword: 'SecurePass123!' },
        { email: 'test@example.com', password: 'SecurePass123!', confirmPassword: 'SecurePass123!' },
        { email: 'test@example.com', username: 'testuser', confirmPassword: 'SecurePass123!' },
        { email: 'test@example.com', username: 'testuser', password: 'SecurePass123!' }
      ];

      incompleteData.forEach(data => {
        const result = registerSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    it('should reject empty strings for required fields', () => {
      const data = {
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should handle type coercion and transformation', () => {
      const data = {
        email: '  TEST@EXAMPLE.COM  ', // Should be trimmed and lowercased
        username: '  testuser  ', // Should be trimmed
        password: 'MySecurePass123!',
        confirmPassword: 'MySecurePass123!'
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.username).toBe('testuser');
      }
    });

    it('should reject non-string inputs', () => {
      const invalidData = [
        { email: 123, username: 'testuser', password: 'SecurePass123!', confirmPassword: 'SecurePass123!' },
        { email: 'test@example.com', username: 123, password: 'SecurePass123!', confirmPassword: 'SecurePass123!' },
        { email: 'test@example.com', username: 'testuser', password: 123, confirmPassword: 'SecurePass123!' },
        { email: 'test@example.com', username: 'testuser', password: 'SecurePass123!', confirmPassword: 123 }
      ];

      invalidData.forEach(data => {
        const result = registerSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'MySecurePass123!'
      };

      const result = loginSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com',
        'test@.com',
        'test@example.',
        '',
        null,
        undefined
      ];

      invalidEmails.forEach(email => {
        const data = {
          email,
          password: 'MySecurePass123!'
        };

        const result = loginSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some(issue => 
            issue.path.includes('email')
          )).toBe(true);
        }
      });
    });

    it('should reject empty or invalid passwords', () => {
      const invalidPasswords = [
        '',
        null,
        undefined,
        123,
        {},
        []
      ];

      invalidPasswords.forEach(password => {
        const data = {
          email: 'test@example.com',
          password
        };

        const result = loginSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some(issue => 
            issue.path.includes('password')
          )).toBe(true);
        }
      });
    });

    it('should accept valid passwords of any strength for login', () => {
      const validPasswords = [
        'password',
        '123456',
        'SecurePass123!',
        'a', // Even single character should be valid for login
        'very-long-password-with-many-characters'
      ];

      validPasswords.forEach(password => {
        const data = {
          email: 'test@example.com',
          password
        };

        const result = loginSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject missing required fields', () => {
      const incompleteData = [
        { password: 'SecurePass123!' },
        { email: 'test@example.com' }
      ];

      incompleteData.forEach(data => {
        const result = loginSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    it('should handle type coercion and transformation', () => {
      const data = {
        email: '  TEST@EXAMPLE.COM  ', // Should be trimmed and lowercased
        password: 'MySecurePass123!'
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.password).toBe('MySecurePass123!');
      }
    });

    it('should reject extra fields', () => {
      const data = {
        email: 'test@example.com',
        password: 'MySecurePass123!',
        username: 'testuser', // Extra field
        confirmPassword: 'SecurePass123!' // Extra field
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        // Extra fields should be stripped
        expect(result.data).not.toHaveProperty('username');
        expect(result.data).not.toHaveProperty('confirmPassword');
        expect(result.data).toHaveProperty('email');
        expect(result.data).toHaveProperty('password');
      }
    });
  });

  describe('Schema Edge Cases', () => {
    it('should handle very long valid inputs', () => {
      const longEmail = 'a'.repeat(50) + '@example.com';
      const longUsername = 'a'.repeat(30);
      const longPassword = 'A'.repeat(25) + 'a'.repeat(25) + '1'.repeat(25) + '!'.repeat(25); // Valid password with all requirements

      const registerData = {
        email: longEmail,
        username: longUsername,
        password: longPassword,
        confirmPassword: longPassword
      };

      const loginData = {
        email: longEmail,
        password: longPassword
      };

      const registerResult = registerSchema.safeParse(registerData);
      const loginResult = loginSchema.safeParse(loginData);

      expect(registerResult.success).toBe(true);
      expect(loginResult.success).toBe(true);
    });

    it('should handle special characters in valid contexts', () => {
      const specialEmail = 'test+tag@example-domain.co.uk';
      const specialUsername = 'user123';
      const specialPassword = 'Pass123@#$%^&*()_+{}|:<>?[]\\;\'",./';

      const registerData = {
        email: specialEmail,
        username: specialUsername,
        password: specialPassword,
        confirmPassword: specialPassword
      };

      const loginData = {
        email: specialEmail,
        password: specialPassword
      };

      const registerResult = registerSchema.safeParse(registerData);
      const loginResult = loginSchema.safeParse(loginData);

      expect(registerResult.success).toBe(true);
      expect(loginResult.success).toBe(true);
    });

    it('should provide meaningful error messages', () => {
      const invalidData = {
        email: 'invalid-email',
        username: 'ab', // Too short
        password: 'weak',
        confirmPassword: 'different'
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const errorMessages = result.error.issues.map(issue => issue.message);
        
        // Should have errors for email, username, and password mismatch
        expect(errorMessages.some(msg => msg.includes('email'))).toBe(true);
        expect(errorMessages.some(msg => msg.includes('Username'))).toBe(true);
        expect(errorMessages.some(msg => msg.includes('Passwords do not match'))).toBe(true);
      }
    });

    it('should handle null and undefined inputs gracefully', () => {
      const nullData = {
        email: null,
        username: null,
        password: null,
        confirmPassword: null
      };

      const undefinedData = {
        email: undefined,
        username: undefined,
        password: undefined,
        confirmPassword: undefined
      };

      const nullResult = registerSchema.safeParse(nullData);
      const undefinedResult = registerSchema.safeParse(undefinedData);

      expect(nullResult.success).toBe(false);
      expect(undefinedResult.success).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should validate schemas quickly', () => {
      const data = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'MySecurePass123!',
        confirmPassword: 'MySecurePass123!'
      };

      const startTime = Date.now();
      
      // Validate 1000 times
      for (let i = 0; i < 1000; i++) {
        registerSchema.safeParse(data);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete quickly (less than 100ms for 1000 validations)
      expect(duration).toBeLessThan(100);
    });
  });
});
