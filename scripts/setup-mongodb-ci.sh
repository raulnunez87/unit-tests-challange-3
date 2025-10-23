#!/bin/bash

# MongoDB setup script for CI environments
# This script ensures MongoDB is properly configured with replica set

set -e

echo "🔧 Setting up MongoDB for CI..."

# Wait for MongoDB to be available
echo "⏳ Waiting for MongoDB to be ready..."
timeout=30
counter=0
until nc -z localhost 27017; do
  if [ $counter -ge $timeout ]; then
    echo "❌ MongoDB failed to start within $timeout seconds"
    exit 1
  fi
  echo "⏳ MongoDB not ready yet, waiting... ($counter/$timeout)"
  sleep 2
  counter=$((counter + 2))
done
echo "✅ MongoDB is ready!"

# Initialize replica set
echo "🔧 Initializing MongoDB replica set..."
mongosh --eval "
  try {
    const config = {
      _id: 'rs0',
      members: [{ _id: 0, host: 'localhost:27017' }]
    };
    rs.initiate(config);
    print('Replica set initialization started');
  } catch (e) {
    print('Replica set may already be initialized: ' + e);
  }
" --quiet

# Wait for replica set to be ready
echo "⏳ Waiting for replica set to be ready..."
timeout=60
counter=0
until mongosh --eval "rs.status().ok" --quiet 2>/dev/null | grep -q "1"; do
  if [ $counter -ge $timeout ]; then
    echo "❌ Replica set failed to initialize within $timeout seconds"
    echo "🔍 Checking replica set status..."
    mongosh --eval "rs.status()" --quiet || true
    exit 1
  fi
  echo "⏳ Replica set not ready yet, waiting... ($counter/$timeout)"
  sleep 2
  counter=$((counter + 2))
done

echo "✅ MongoDB replica set is ready!"
echo "🔍 Replica set status:"
mongosh --eval "rs.status()" --quiet

echo "🎉 MongoDB setup completed successfully!"
