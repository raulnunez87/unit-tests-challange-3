#!/bin/bash

# Test script to verify MongoDB connection testing works
# This simulates the CI environment MongoDB connection test

set -e

echo "🧪 Testing MongoDB connection methods..."

# Test if MongoDB is running
if ! nc -z localhost 27017 2>/dev/null; then
  echo "❌ MongoDB is not running on localhost:27017"
  echo "   Please start MongoDB first:"
  echo "   ./scripts/start-mongodb-local.sh"
  exit 1
fi

echo "✅ MongoDB is running on localhost:27017"

# Test method 1: mongosh (if available)
echo "🔍 Testing with mongosh..."
if command -v mongosh &> /dev/null; then
  echo "✅ mongosh is available"
  if mongosh --eval "db.runCommand('ping')" --quiet; then
    echo "✅ MongoDB connection verified with mongosh!"
  else
    echo "❌ mongosh connection test failed"
    exit 1
  fi
else
  echo "⚠️ mongosh not available, testing with Node.js fallback..."
fi

# Test method 2: Node.js MongoDB driver (fallback)
echo "🔍 Testing with Node.js MongoDB driver..."
if node -e "
  const { MongoClient } = require('mongodb');
  const client = new MongoClient('mongodb://localhost:27017');
  client.connect()
    .then(() => client.db('admin').command({ ping: 1 }))
    .then(() => {
      console.log('✅ MongoDB connection verified with Node.js!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ MongoDB connection failed:', err.message);
      process.exit(1);
    })
    .finally(() => client.close());
"; then
  echo "✅ Node.js MongoDB connection test passed!"
else
  echo "❌ Node.js MongoDB connection test failed"
  exit 1
fi

echo "🎉 All MongoDB connection tests passed!"
echo "✅ CI environment should now work correctly"
