#!/bin/bash

# Test runner script that sets up MongoDB replica set and runs tests
set -e

echo "🚀 Starting test setup..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop any existing test containers
echo "🧹 Cleaning up existing test containers..."
docker compose -f docker-compose.test.yml down -v > /dev/null 2>&1 || true

# Start test MongoDB container
echo "🐳 Starting test MongoDB container..."
docker compose -f docker-compose.test.yml up -d mongodb-test

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 15

# Setup replica set
echo "🔧 Setting up MongoDB replica set..."
./scripts/setup-test-db.sh

# Additional wait for replica set to stabilize
echo "⏳ Waiting for replica set to stabilize..."
sleep 5

# Run tests
echo "🧪 Running tests..."
npm test

# Cleanup
echo "🧹 Cleaning up test containers..."
docker compose -f docker-compose.test.yml down -v

echo "✅ Test run complete!"
