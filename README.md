# Secure Authentication Module

A complete, production-ready authentication module built with Next.js 14, Prisma, MongoDB, and TypeScript. This implementation follows OWASP ASVS security standards and includes comprehensive testing.

## 🔐 Security Features

- **Input Validation**: Zod schemas for all user inputs
- **Password Security**: bcrypt with 12+ rounds for secure hashing
- **JWT Authentication**: jose library with HS256 algorithm
- **Rate Limiting**: In-memory LRU cache to prevent brute force attacks
- **Error Handling**: Consistent responses with proper HTTP status codes
- **OWASP Compliance**: Follows ASVS V2.1 (Authentication) and V5.1 (Input Validation)

## 🏗️ Architecture

```
├── app/api/auth/
│   ├── register/route.ts    # User registration endpoint
│   └── login/route.ts       # User authentication endpoint
├── lib/
│   ├── auth.ts             # JWT token management
│   ├── crypto.ts           # Password hashing utilities
│   ├── rate-limit.ts       # Rate limiting implementation
│   ├── schemas.ts          # Zod validation schemas
│   └── prisma.ts           # Database client
├── tests/
│   ├── lib/                # Unit tests for utilities
│   ├── api/                # Integration tests for endpoints
│   └── setup.ts            # Test configuration
└── prisma/
    └── schema.prisma       # Database schema
```

## 🚀 Getting Started

### Quick Start (30 seconds)

```bash
git clone <repository-url>
cd secure-auth-module
npm install
cp env.example .env
npm run dev
```

Then visit `http://localhost:3000` and click "Test Registration"! 

> **Note**: This uses the mock version which works immediately without any database setup.

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker (optional, for full database functionality)

### Full Setup (With Database)

#### Option 1: Using Docker (Recommended)

1. **Start MongoDB with Docker**
   ```bash
   # Start MongoDB container
   docker compose up -d mongodb
   
   # Wait for MongoDB to start (about 10 seconds)
   sleep 10
   
   # Initialize replica set (required for Prisma)
   docker exec auth-module-mongodb mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"
   ```

2. **Update environment variables**
   ```bash
   echo 'JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
   BCRYPT_ROUNDS="12"
   DATABASE_URL="mongodb://localhost:27017/auth-module?replicaSet=rs0"
   NODE_ENV="development"' > .env
   ```

3. **Generate Prisma client**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

#### Option 2: Local MongoDB Installation

1. **Install MongoDB locally**
   ```bash
   # macOS with Homebrew
   brew tap mongodb/brew
   brew install mongodb-community
   
   # Start MongoDB as replica set
   mongod --replSet rs0 --port 27017 --dbpath /opt/homebrew/var/mongodb > /opt/homebrew/var/log/mongodb/mongod.log 2>&1 &
   
   # Initialize replica set
   mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"
   ```

2. **Set up environment variables**
   ```bash
   echo 'JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
   BCRYPT_ROUNDS="12"
   DATABASE_URL="mongodb://localhost:27017/auth-module?replicaSet=rs0"
   NODE_ENV="development"' > .env
   ```

3. **Generate Prisma client and push schema**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🧪 Testing

### Test the API Endpoints

#### Using the Web Interface
1. Visit `http://localhost:3000`
2. Use the interactive test buttons to register and login users
3. View real-time API responses

#### Using curl/API Testing Tools

**Test Registration (Mock Version - Always Works)**
```bash
curl -X POST http://localhost:3000/api/auth/register-mock \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser", 
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }'
```

**Test Registration (Full Database Version)**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }'
```

**Test Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**View Registered Users (Mock Version)**
```bash
curl http://localhost:3000/api/auth/register-mock
```

### Run Unit Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Test Categories

- **Unit Tests**: Test individual utility functions (`crypto`, `auth`, `rate-limit`)
- **Integration Tests**: Test API endpoints with real database operations
- **Security Tests**: Validate rate limiting, input validation, and error handling

## 📡 API Endpoints

### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "username": "username",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token"
  }
}
```

### POST /api/auth/login

Authenticate a user and return a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "username": "username",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token"
  }
}
```

## 🔒 Security Implementation

### Password Requirements
- Minimum 12 characters
- Must contain uppercase, lowercase, numbers, and special characters
- Rejects common weak patterns
- Uses bcrypt with 12+ rounds for hashing

### JWT Configuration
- HS256 algorithm for symmetric signing
- 15-minute token expiration
- Unique JTI for token tracking
- Minimal payload to reduce information leakage

### Rate Limiting
- 5 attempts per 15-minute window per IP
- 1-hour block duration for exceeded limits
- LRU cache with 10,000 IP capacity
- Consistent error responses to prevent enumeration

### Input Validation
- Zod schemas for all inputs
- Email format validation (RFC 5321 compliant)
- Username format restrictions
- Password strength validation
- Consistent error messages

## 🛡️ OWASP ASVS Compliance

This implementation addresses the following OWASP ASVS requirements:

- **V2.1.1**: Implement secure authentication mechanisms
- **V2.1.2**: Use strong password policies
- **V2.1.3**: Implement secure password storage (bcrypt)
- **V2.1.4**: Implement secure session management (JWT)
- **V4.1**: Implement rate limiting and throttling
- **V5.1**: Implement input validation
- **V6.1**: Implement proper error handling

## 📊 Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "status": 400
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created (registration)
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid credentials)
- `409`: Conflict (duplicate email/username)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## 🔧 Development

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Open Prisma Studio
npx prisma studio
```

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Replica Set Error
**Error**: `Prisma needs to perform transactions, which requires your MongoDB server to be run as a replica set`

**Solution**:
```bash
# For Docker setup
docker exec auth-module-mongodb mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"

# For local MongoDB
mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"
```

#### 2. Port 27017 Already in Use
**Error**: `Bind for 0.0.0.0:27017 failed: port is already allocated`

**Solution**:
```bash
# Check what's using the port
lsof -i :27017

# Stop conflicting services
brew services stop mongodb-community
# or
docker stop $(docker ps -q --filter "publish=27017")
```

#### 3. JWT_SECRET Error
**Error**: `JWT_SECRET must be at least 32 characters long`

**Solution**:
```bash
# Update .env file with a proper secret
echo 'JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"' >> .env
```

#### 4. bcrypt Architecture Error in Docker
**Error**: `Exec format error` when building Docker image

**Solution**: Use the mock version for testing or ensure proper Docker platform:
```bash
# Use mock endpoints for testing
curl -X POST http://localhost:3000/api/auth/register-mock
```

### Quick Fixes

**Reset Everything**:
```bash
# Stop all services
docker compose down
pkill -f "next dev"
pkill -f mongod

# Clean start
npm run dev
```

**Use Mock Version (Always Works)**:
- Use `/api/auth/register-mock` instead of `/api/auth/register`
- No database setup required
- Perfect for testing and development

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.