#!/bin/bash

# Start MongoDB locally for testing
# This script starts MongoDB with replica set configuration

set -e

echo "🚀 Starting MongoDB locally for testing..."

# Check if MongoDB is already running
if lsof -i :27017 > /dev/null 2>&1; then
  echo "⚠️ MongoDB is already running on port 27017"
  echo "🔄 Stopping existing MongoDB..."
  pkill -f mongod || true
  sleep 2
fi

# Start MongoDB with replica set
echo "🔧 Starting MongoDB with replica set configuration..."
mongod --replSet rs0 --bind_ip_all --port 27017 --dbpath ./mongodb-data --logpath ./mongodb.log --fork

# Wait for MongoDB to be ready
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
echo "📝 To stop MongoDB later, run: pkill -f mongod"
