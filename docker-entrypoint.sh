#!/bin/bash

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
until mongosh --eval "db.runCommand('ping').ok" > /dev/null 2>&1; do
  echo "MongoDB is not ready yet..."
  sleep 2
done

echo "MongoDB is ready!"

# Initialize replica set if not already initialized
echo "Checking if replica set is initialized..."
if ! mongosh --eval "rs.status().ok" > /dev/null 2>&1; then
  echo "Initializing replica set..."
  mongosh --eval "
    try {
      rs.initiate({
        _id: 'rs0',
        members: [{ _id: 0, host: 'localhost:27017' }]
      });
      print('Replica set initialization started');
    } catch (e) {
      print('Replica set may already be initialized: ' + e);
    }
  "
  
  # Wait for replica set to be ready
  echo "Waiting for replica set to be ready..."
  for i in {1..30}; do
    if mongosh --eval "rs.status().ok" > /dev/null 2>&1; then
      echo "Replica set is ready!"
      break
    fi
    echo "Waiting for replica set... ($i/30)"
    sleep 2
  done
else
  echo "Replica set is already initialized"
fi

# Start the main application
echo "Starting application..."
exec "$@"
