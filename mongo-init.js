// MongoDB initialization script
// Creates the application database and user

db = db.getSiblingDB('auth-module');

// Create application user
db.createUser({
  user: 'auth-app',
  pwd: 'auth-password',
  roles: [
    {
      role: 'readWrite',
      db: 'auth-module'
    }
  ]
});

// Create initial collections
db.createCollection('users');

print('Database and user created successfully');

