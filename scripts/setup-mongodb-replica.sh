#!/bin/bash

# MongoDB replica set setup script
# This script ensures MongoDB is properly configured with replica set for Prisma transactions

set -e

echo "🔧 Setting up MongoDB with replica set for Prisma transactions..."

# Function to check if MongoDB is running
check_mongodb() {
  if nc -z localhost 27017 2>/dev/null; then
    return 0
  else
    return 1
  fi
}

# Function to wait for MongoDB to be ready
wait_for_mongodb() {
  echo "⏳ Waiting for MongoDB to be ready..."
  timeout=30
  counter=0
  until check_mongodb; do
    if [ $counter -ge $timeout ]; then
      echo "❌ MongoDB failed to start within $timeout seconds"
      exit 1
    fi
    echo "⏳ MongoDB not ready yet, waiting... ($counter/$timeout)"
    sleep 2
    counter=$((counter + 2))
  done
  echo "✅ MongoDB is ready!"
}

# Function to initialize replica set
init_replica_set() {
  echo "🔧 Initializing MongoDB replica set..."
  
  if command -v mongosh &> /dev/null; then
    echo "Using mongosh for replica set initialization..."
    mongosh --eval "
      try {
        const config = {
          _id: 'rs0',
          members: [{ _id: 0, host: 'localhost:27017' }]
        };
        rs.initiate(config);
        print('✅ Replica set initialization started');
      } catch (e) {
        if (e.message.includes('already initialized')) {
          print('✅ Replica set already initialized');
        } else {
          print('⚠️ Replica set initialization error: ' + e.message);
        }
      }
    " --quiet
  else
    echo "⚠️ mongosh not available, using Node.js for replica set initialization..."
    node -e "
      const { MongoClient } = require('mongodb');
      const client = new MongoClient('mongodb://localhost:27017');
      client.connect()
        .then(() => {
          const admin = client.db('admin');
          return admin.command({
            replSetInitiate: {
              _id: 'rs0',
              members: [{ _id: 0, host: 'localhost:27017' }]
            }
          });
        })
        .then(() => {
          console.log('✅ Replica set initialization started');
          process.exit(0);
        })
        .catch((err) => {
          if (err.message.includes('already initialized')) {
            console.log('✅ Replica set already initialized');
          } else {
            console.error('❌ Replica set initialization failed:', err.message);
          }
          process.exit(0);
        })
        .finally(() => client.close());
    "
  fi
}

# Function to wait for replica set to be ready
wait_for_replica_set() {
  echo "⏳ Waiting for replica set to be ready..."
  timeout=60
  counter=0

  if command -v mongosh &> /dev/null; then
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
  else
    echo "⚠️ mongosh not available, using Node.js to check replica set status..."
    until node -e "
      const { MongoClient } = require('mongodb');
      const client = new MongoClient('mongodb://localhost:27017');
      client.connect()
        .then(() => client.db('admin').command({ replSetGetStatus: 1 }))
        .then((status) => {
          if (status.ok === 1) {
            console.log('✅ Replica set is ready!');
            process.exit(0);
          } else {
            console.log('⏳ Replica set not ready yet...');
            process.exit(1);
          }
        })
        .catch(() => {
          console.log('⏳ Replica set not ready yet...');
          process.exit(1);
        })
        .finally(() => client.close());
    " 2>/dev/null; do
      if [ $counter -ge $timeout ]; then
        echo "❌ Replica set failed to initialize within $timeout seconds"
        exit 1
      fi
      echo "⏳ Replica set not ready yet, waiting... ($counter/$timeout)"
      sleep 2
      counter=$((counter + 2))
    done
  fi
  
  echo "✅ MongoDB replica set is ready!"
}

# Function to verify replica set status
verify_replica_set() {
  echo "🔍 Verifying replica set status..."
  
  if command -v mongosh &> /dev/null; then
    echo "Replica set status:"
    mongosh --eval "rs.status()" --quiet
  else
    echo "⚠️ mongosh not available, using Node.js to check replica set status..."
    node -e "
      const { MongoClient } = require('mongodb');
      const client = new MongoClient('mongodb://localhost:27017');
      client.connect()
        .then(() => client.db('admin').command({ replSetGetStatus: 1 }))
        .then((status) => {
          console.log('✅ Replica set status:', JSON.stringify(status, null, 2));
          process.exit(0);
        })
        .catch((err) => {
          console.error('❌ Failed to get replica set status:', err.message);
          process.exit(1);
        })
        .finally(() => client.close());
    "
  fi
}

# Main execution
echo "🚀 Starting MongoDB replica set setup..."

# Wait for MongoDB to be ready
wait_for_mongodb

# Initialize replica set
init_replica_set

# Wait for replica set to be ready
wait_for_replica_set

# Verify replica set status
verify_replica_set

echo "🎉 MongoDB replica set setup completed successfully!"
echo "📝 Connection string: mongodb://localhost:27017/auth-module-test?replicaSet=rs0"
