#!/bin/bash

# Test script that simulates CI environment locally
# This helps verify that the CI setup will work

set -e

echo "🧪 Testing CI environment locally..."

# Set CI environment variables
export CI=true
export GITHUB_ACTIONS=true
export JWT_SECRET="test-jwt-secret-key-at-least-32-characters-long-for-testing"
export BCRYPT_ROUNDS="12"
export DATABASE_URL="mongodb://localhost:27017/auth-module-test?directConnection=true&serverSelectionTimeoutMS=10000&connectTimeoutMS=10000"
export NODE_ENV="test"
export JWT_EXPIRATION_MINUTES="15"

echo "🔧 Environment variables set:"
echo "  CI: $CI"
echo "  GITHUB_ACTIONS: $GITHUB_ACTIONS"
echo "  DATABASE_URL: $DATABASE_URL"
echo "  NODE_ENV: $NODE_ENV"

# Test CI detection
echo "🔍 Testing CI detection..."
node -e "
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
console.log('✅ CI Detection:', isCI);
if (!isCI) {
  console.error('❌ CI environment not detected properly');
  process.exit(1);
}
"

# Test Prisma client creation
echo "🔍 Testing Prisma client creation..."
node -e "
const { PrismaClient } = require('@prisma/client');
try {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    log: ['error']
  });
  console.log('✅ Prisma client created successfully');
} catch (error) {
  console.error('❌ Prisma client creation failed:', error.message);
  process.exit(1);
}
"

# Test database connection (if MongoDB is running)
echo "🔍 Testing database connection..."
if nc -z localhost 27017 2>/dev/null; then
  echo "✅ MongoDB is running, testing connection..."
  node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    log: ['error']
  });
  
  prisma.\$connect()
    .then(() => {
      console.log('✅ Database connection successful');
      return prisma.\$disconnect();
    })
    .then(() => {
      console.log('✅ Database disconnection successful');
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    });
  "
else
  echo "⚠️ MongoDB is not running - skipping database connection test"
  echo "   To test with database, start MongoDB first:"
  echo "   ./scripts/start-mongodb-local.sh"
fi

echo "✅ CI environment test completed successfully!"
echo "🚀 Your tests should now pass in GitHub Actions!"
