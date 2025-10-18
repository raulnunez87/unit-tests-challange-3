#!/bin/bash

# Setup script for test MongoDB replica set
echo "Setting up MongoDB replica set for testing..."

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
until mongosh --port 27017 --eval "db.runCommand('ping')" > /dev/null 2>&1; do
  echo "MongoDB is not ready yet..."
  sleep 2
done

echo "MongoDB is ready!"

# Initialize replica set if not already initialized
echo "Checking if replica set is initialized..."
if ! mongosh --port 27017 --eval "rs.status().ok" > /dev/null 2>&1; then
  echo "Initializing replica set..."
  mongosh --port 27017 --eval "
    try {
      var config = {
        _id: 'rs0',
        members: [
          { _id: 0, host: 'localhost:27017' }
        ]
      };
      rs.initiate(config);
      print('Replica set initialization started');
    } catch (e) {
      print('Replica set may already be initialized: ' + e);
    }
  "
  
  # Wait for replica set to be ready with primary
  echo "Waiting for replica set to be ready with primary..."
  for i in {1..60}; do
    if mongosh --port 27017 --eval "rs.status().ok && rs.status().myState === 1" > /dev/null 2>&1; then
      echo "Replica set is ready with primary!"
      break
    fi
    echo "Waiting for replica set primary... ($i/60)"
    sleep 2
  done
  
  # Verify replica set status
  echo "Replica set status:"
  mongosh --port 27017 --eval "rs.status()"
else
  echo "Replica set is already initialized"
fi

echo "Test MongoDB replica set setup complete!"
