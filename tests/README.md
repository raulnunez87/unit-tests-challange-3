# 🧪 Test Suite Documentation

## 📋 Overview

This test suite provides comprehensive coverage for the Next.js 14 authentication system, including unit tests, security tests, and integration tests.

## 🏗️ Test Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── auth.test.ts        # JWT token creation/verification
│   ├── crypto.test.ts      # Password hashing and validation
│   ├── rate-limit.test.ts  # Rate limiting functionality
│   └── schemas.test.ts     # Zod validation schemas
├── security/               # Security-focused tests
│   ├── nosql-injection.test.ts    # NoSQL injection protection
│   ├── redos.test.ts              # ReDoS attack protection
│   ├── password-policy.test.ts    # Password strength validation
│   ├── rate-limit.test.ts         # Rate limiting security
│   └── jwt-security.test.ts       # JWT token security
├── integration/            # End-to-end integration tests
│   ├── auth-flow.test.ts          # Complete authentication flow
│   └── protected-endpoint.test.ts # Protected endpoint access
└── setup.ts               # Test environment configuration
```

## 🚀 Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env
```

### Basic Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with coverage threshold (≥80%)
npm run test:coverage:threshold
```

### Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Security tests only
npm run test:security

# Integration tests only
npm run test:integration

# All test suites
npm run test:all
```

### CI/CD Tests

```bash
# Run tests as they would run in CI
npm run test:ci
```

## 🐍 Python Tests (Optional)

### Prerequisites

```bash
# Install Python dependencies
cd pytests
pip install pytest httpx pytest-cov
```

### Running Python Tests

```bash
# Run Python tests
npm run test:python

# Run Python tests with coverage
npm run test:python:coverage
```

## 📊 Coverage Requirements

### Minimum Coverage Thresholds

- **Lines**: ≥80%
- **Branches**: ≥80%
- **Functions**: ≥80%
- **Statements**: ≥80%

### Coverage Reports

Coverage reports are generated in the `./coverage` directory:

- **HTML Report**: `./coverage/index.html`
- **JSON Report**: `./coverage/coverage-final.json`
- **LCOV Report**: `./coverage/lcov.info`

## 🔒 Security Test Categories

### 1. NoSQL Injection Protection
- Tests for MongoDB operator injection (`$ne`, `$or`, `$where`, etc.)
- Prototype pollution attempts
- Constructor pollution attempts
- Nested malicious objects

### 2. ReDoS (Regular Expression Denial of Service)
- Catastrophic backtracking patterns
- Nested quantifiers
- Exponential backtracking
- Large input handling

### 3. Password Policy Enforcement
- Uppercase/lowercase requirements
- Number and special character requirements
- Minimum length enforcement
- Common password rejection
- Sequential character detection

### 4. Rate Limiting Security
- Request limit enforcement
- IP-based tracking
- Time window management
- Bypass attempt prevention

### 5. JWT Security
- Token manipulation detection
- Signature validation
- Expiration handling
- Algorithm security

## 🔄 Integration Test Scenarios

### 1. Complete Authentication Flow
- User registration → Login → Protected access
- Multiple user scenarios
- Token renewal through re-login

### 2. Negative Scenarios
- Duplicate user registration (409)
- Invalid credentials (401)
- Malformed payloads (400)
- Missing required fields

### 3. Edge Cases
- Concurrent requests
- Large payloads
- Special characters
- Unicode handling

### 4. Performance Testing
- High volume requests
- Response time consistency
- Memory usage
- Concurrent access

## 🛠️ Test Configuration

### Environment Variables

```bash
# Test environment
NODE_ENV=test
JWT_SECRET=test-jwt-secret-that-is-at-least-32-characters-long
BCRYPT_ROUNDS=4
DATABASE_URL=mongodb://localhost:27017/test-auth
TEST_BASE_URL=http://localhost:3000
```

### Mock Configuration

- **Mock Storage**: In-memory storage for testing
- **Mock Endpoints**: `/api/auth/register-mock`, `/api/auth/login-mock`
- **Mock Database**: No real database required for most tests

## 📈 Performance Benchmarks

### Expected Response Times

- **Unit Tests**: <100ms per test
- **Security Tests**: <5s per test
- **Integration Tests**: <10s per test
- **Python Tests**: <30s total

### Load Testing

- **Concurrent Requests**: 50+ simultaneous
- **High Volume**: 1000+ requests
- **Memory Usage**: <100MB
- **CPU Usage**: <50%

## 🚨 Troubleshooting

### Common Issues

1. **Test Timeouts**
   ```bash
   # Increase timeout in vitest.config.ts
   testTimeout: 30000
   ```

2. **Coverage Below Threshold**
   ```bash
   # Check uncovered lines
   npm run test:coverage
   open coverage/index.html
   ```

3. **Mock Storage Issues**
   ```bash
   # Clear mock storage
   npm run test:unit
   ```

4. **Python Test Failures**
   ```bash
   # Check Python version
   python --version
   # Should be 3.8+
   ```

### Debug Mode

```bash
# Run tests with debug output
DEBUG=* npm test

# Run specific test with debug
DEBUG=* npm test -- auth.test.ts
```

## 🔧 Customization

### Adding New Tests

1. **Unit Tests**: Add to `tests/unit/`
2. **Security Tests**: Add to `tests/security/`
3. **Integration Tests**: Add to `tests/integration/`

### Test Patterns

```typescript
// Unit test pattern
describe('Component', () => {
  it('should handle valid input', () => {
    // Test implementation
  });
  
  it('should reject invalid input', () => {
    // Test implementation
  });
});

// Security test pattern
describe('Security Feature', () => {
  it('should reject malicious input', async () => {
    // Security test implementation
  });
});

// Integration test pattern
describe('Integration Flow', () => {
  it('should complete full flow', async () => {
    // Integration test implementation
  });
});
```

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Pytest Documentation](https://docs.pytest.org/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc7519)

## 🤝 Contributing

When adding new tests:

1. Follow existing patterns
2. Include both positive and negative cases
3. Add appropriate error messages
4. Update coverage thresholds if needed
5. Document new test categories

## 📝 Test Maintenance

- Run tests before each commit
- Update tests when adding new features
- Review coverage reports regularly
- Keep security tests up to date
- Monitor performance benchmarks
