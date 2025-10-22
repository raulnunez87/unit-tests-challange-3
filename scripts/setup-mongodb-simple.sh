#!/bin/bash

# Simple MongoDB setup script for testing
# This script sets up MongoDB without replica sets for easier testing

echo "🚀 Setting up MongoDB for testing..."

# Stop any existing MongoDB containers
echo "🛑 Stopping existing MongoDB containers..."
docker compose -f docker-compose.simple.yml down 2>/dev/null || true
docker compose -f docker-compose.test.yml down 2>/dev/null || true
docker compose -f docker-compose.yml down 2>/dev/null || true

# Clean up any existing containers
docker rm -f auth-mongodb-test-simple 2>/dev/null || true
docker rm -f auth-mongodb-test 2>/dev/null || true
docker rm -f auth-mongodb 2>/dev/null || true

# Start MongoDB with simple configuration (no replica set)
echo "📦 Starting MongoDB with simple configuration..."
docker compose -f docker-compose.simple.yml up -d mongodb-test

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if docker exec auth-mongodb-test-simple mongosh --eval "db.runCommand('ping').ok" > /dev/null 2>&1; then
    echo "✅ MongoDB is ready!"
    break
  fi
  
  attempt=$((attempt + 1))
  echo "Attempt $attempt/$max_attempts - MongoDB not ready yet..."
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ MongoDB failed to start after $max_attempts attempts"
  echo "📋 Container logs:"
  docker logs auth-mongodb-test-simple
  exit 1
fi

# Test the connection
echo "🔍 Testing database connection..."
if docker exec auth-mongodb-test-simple mongosh --eval "db.runCommand('ping').ok" > /dev/null 2>&1; then
  echo "✅ Database connection test successful!"
  echo ""
  echo "🎉 MongoDB is ready for testing!"
  echo "📝 Connection string: mongodb://localhost:27017/auth-module-test?directConnection=true"
  echo ""
  echo "🧪 You can now run your tests with:"
  echo "   npm test"
  echo "   or"
  echo "   pnpm test"
else
  echo "❌ Database connection test failed"
  exit 1
fi
