#!/bin/bash

# Complete Docker Test Script for Authentication System
# This script sets up MongoDB, initializes replica set, and runs tests

echo "🐳 Setting up Docker environment for authentication system..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker compose -f docker-compose.working.yml down -v 2>/dev/null || true

# Start MongoDB first
echo "🚀 Starting MongoDB..."
docker compose -f docker-compose.working.yml up -d mongodb

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to start..."
for i in {1..60}; do
    if docker compose -f docker-compose.working.yml logs mongodb 2>/dev/null | grep -q "Waiting for connections"; then
        echo "✅ MongoDB is running!"
        break
    fi
    echo "Waiting for MongoDB... ($i/60)"
    sleep 2
done

# Initialize replica set
echo "🔧 Initializing MongoDB replica set..."
docker exec auth-mongodb mongosh --eval "
try {
  rs.initiate({
    _id: 'rs0',
    members: [{ _id: 0, host: 'localhost:27017' }]
  });
  print('Replica set initialization started');
} catch (e) {
  print('Error or already initialized: ' + e);
}
"

# Wait for replica set to be ready
echo "⏳ Waiting for replica set to be ready..."
for i in {1..30}; do
    if docker exec auth-mongodb mongosh --eval "rs.status().ok" > /dev/null 2>&1; then
        echo "✅ Replica set is ready!"
        break
    fi
    echo "Waiting for replica set... ($i/30)"
    sleep 2
done

# Build and start the app
echo "🏗️ Building and starting the app..."
docker compose -f docker-compose.working.yml up -d app

# Wait for app to be ready
echo "⏳ Waiting for app to start..."
sleep 15

# Run tests
echo "🧪 Running tests..."
docker exec auth-app npm test -- --reporter=verbose --run

# Show final status
echo ""
echo "📊 Test Results Summary:"
echo "✅ Tests completed!"
echo ""
echo "🔧 Useful commands:"
echo "  View logs: docker compose -f docker-compose.working.yml logs -f"
echo "  Stop services: docker compose -f docker-compose.working.yml down"
echo "  Clean everything: docker compose -f docker-compose.working.yml down -v"
echo "  Access app: docker exec -it auth-app sh"
echo "  Access MongoDB: docker exec -it auth-mongodb mongosh"
