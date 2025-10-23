#!/bin/bash

# Quick test script that bypasses MongoDB replica set issues
# Uses direct connection for faster, more reliable testing

set -e

echo "🧪 Running quick tests with direct MongoDB connection..."

# Set environment variables for direct connection
export DATABASE_URL="mongodb://localhost:27017/auth-module-test?directConnection=true&serverSelectionTimeoutMS=10000&connectTimeoutMS=10000"
export JWT_SECRET="test-jwt-secret-key-at-least-32-characters-long-for-testing"
export BCRYPT_ROUNDS="12"
export NODE_ENV="test"
export JWT_EXPIRATION_MINUTES="15"

echo "🔧 Using direct MongoDB connection (no replica set required)"
echo "📊 Database URL: $DATABASE_URL"

# Run a subset of tests that don't require transactions
echo "🚀 Running quick tests..."
npm run test -- --run tests/unit/ tests/lib/ tests/security/ --reporter=verbose

echo "✅ Quick tests completed!"
