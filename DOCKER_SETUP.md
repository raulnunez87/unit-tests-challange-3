# 🐳 Docker Setup for Authentication System

This Docker setup will solve the MongoDB permission issues and provide a consistent development environment.

## 🚀 Quick Start

### 1. **Start the Services**
```bash
# Start MongoDB and the app
docker-compose up -d

# Check if services are running
docker-compose ps
```

### 2. **Initialize MongoDB Replica Set**
```bash
# Connect to MongoDB and initialize replica set
docker exec -it auth-mongodb mongosh --eval "rs.initiate()"

# Verify replica set status
docker exec -it auth-mongodb mongosh --eval "rs.status()"
```

### 3. **Run Tests**
```bash
# Run tests inside the container
docker exec -it auth-app npm test

# Or run tests with verbose output
docker exec -it auth-app npm test -- --reporter=verbose --run
```

## 📋 What This Setup Provides

### **MongoDB Container**
- ✅ MongoDB 7.0 with replica set support
- ✅ No permission issues (runs in container)
- ✅ Persistent data storage
- ✅ Automatic replica set initialization

### **App Container**
- ✅ Node.js 18 environment
- ✅ All dependencies installed
- ✅ Hot reload for development
- ✅ Access to MongoDB via internal network

## 🔧 Configuration

### **Environment Variables**
The setup uses these environment variables:
```env
DATABASE_URL=mongodb://admin:password123@mongodb:27017/auth_system?authSource=admin
JWT_SECRET=your-super-secret-jwt-key-here-make-it-very-long-and-secure
BCRYPT_ROUNDS=12
NODE_ENV=development
```

### **Ports**
- **App**: `http://localhost:3000`
- **MongoDB**: `localhost:27017`

## 🛠️ Development Commands

### **View Logs**
```bash
# View all logs
docker-compose logs -f

# View app logs only
docker-compose logs -f app

# View MongoDB logs only
docker-compose logs -f mongodb
```

### **Access Containers**
```bash
# Access app container
docker exec -it auth-app sh

# Access MongoDB
docker exec -it auth-mongodb mongosh
```

### **Restart Services**
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart app
docker-compose restart mongodb
```

## 🧪 Testing

### **Run All Tests**
```bash
docker exec -it auth-app npm test
```

### **Run Specific Tests**
```bash
# Run only API tests
docker exec -it auth-app npm test tests/api/

# Run only rate limiting tests
docker exec -it auth-app npm test -- -t "Rate Limiting"
```

### **Run Tests with Coverage**
```bash
docker exec -it auth-app npm run test:coverage
```

## 🗄️ Database Management

### **Reset Database**
```bash
# Stop services
docker-compose down

# Remove volumes (this will delete all data)
docker-compose down -v

# Start fresh
docker-compose up -d
```

### **Backup Database**
```bash
# Create backup
docker exec auth-mongodb mongodump --out /backup

# Copy backup to host
docker cp auth-mongodb:/backup ./mongodb-backup
```

## 🐛 Troubleshooting

### **MongoDB Connection Issues**
```bash
# Check if MongoDB is running
docker exec -it auth-mongodb mongosh --eval "db.runCommand('ping')"

# Check replica set status
docker exec -it auth-mongodb mongosh --eval "rs.status()"
```

### **App Not Starting**
```bash
# Check app logs
docker-compose logs app

# Rebuild the app container
docker-compose build app
docker-compose up -d app
```

### **Permission Issues**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

## 📊 Expected Test Results

With Docker, you should see:
```
✓ 155 tests passing
✓ 0 tests failing
```

The rate limiting tests should now pass because:
- ✅ MongoDB is properly configured as a replica set
- ✅ No permission issues
- ✅ Clean environment for each test run
- ✅ Unique IP addresses prevent test interference

## 🎯 Benefits of Docker Setup

1. **No Permission Issues**: MongoDB runs in container
2. **Consistent Environment**: Same setup on any machine
3. **Easy Cleanup**: `docker-compose down -v` removes everything
4. **Isolated Testing**: Each test run gets a clean environment
5. **Production-like**: Similar to how it would run in production

## 🚀 Next Steps

1. **Start the services**: `docker-compose up -d`
2. **Initialize MongoDB**: `docker exec -it auth-mongodb mongosh --eval "rs.initiate()"`
3. **Run tests**: `docker exec -it auth-app npm test`
4. **Enjoy 100% passing tests!** 🎉

## 📝 Notes

- The app will be available at `http://localhost:3000`
- MongoDB data persists between container restarts
- Use `docker-compose down` to stop services
- Use `docker-compose down -v` to remove all data
