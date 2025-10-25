# �� GitHub Actions CI/CD Setup Guide

This document explains how to ensure your GitHub Actions tests will pass successfully.

## ✅ What Was Fixed

### 1. **MongoDB Replica Set Configuration**
- Added `--replSet rs0` flag to MongoDB service in GitHub Actions
- Added replica set initialization step in CI workflow
- Updated `DATABASE_URL` to use replica set configuration

### 2. **Database Connection Fallback**
- Tests now try multiple connection strategies
- In CI, falls back to direct connection if replica set fails
- Automatic retry with exponential backoff

### 3. **Test Timeouts**
- Increased `testTimeout` from 60s to 90s
- Increased `hookTimeout` from 45s to 60s
- Reduced database retry delays for faster tests

### 4. **Environment Variables**
All required environment variables are now set in the CI workflow:
```yaml
env:
  CI: true
  GITHUB_ACTIONS: true
  JWT_SECRET: test-jwt-secret-key-at-least-32-characters-long-for-testing
  BCRYPT_ROUNDS: 12
  DATABASE_URL: mongodb://localhost:27017/auth-module-test?replicaSet=rs0&...
  NODE_ENV: test
  JWT_EXPIRATION_MINUTES: 15
```

## 🧪 Running Tests Locally (Before CI)

To verify your tests will pass in CI, run them locally:

### Option 1: Use Docker (Recommended)
```bash
# Start MongoDB with replica set
docker compose -f docker-compose.ci.yml up -d

# Run tests
npm run test:ci
```

### Option 2: Simulate CI Environment
```bash
export CI=true
export GITHUB_ACTIONS=true
export DATABASE_URL="mongodb://localhost:27017/auth-module-test?replicaSet=rs0&..."
export NODE_ENV=test
export JWT_SECRET="test-jwt-secret-key-at-least-32-characters-long"
export BCRYPT_ROUNDS=12

# Run tests
npm run test:ci
```

## 🔍 Pre-CI Checklist

Before pushing to GitHub, ensure:

- [ ] All tests pass locally: `npm test`
- [ ] Coverage meets 80% threshold: `npm run test:coverage:threshold`
- [ ] No linting errors: `npm run lint`
- [ ] Type check passes: `npm run typecheck`
- [ ] Security audit passes: `npm audit --audit-level=high`

## 📊 CI Workflow Steps

Your GitHub Actions workflow will:

1. ✅ **Setup MongoDB** - Starts MongoDB 7.0 with replica set
2. ✅ **Initialize Replica Set** - Configures MongoDB for Prisma transactions
3. ✅ **Install Dependencies** - Runs `npm ci` for reproducible builds
4. ✅ **Lint & Type Check** - Validates code quality
5. ✅ **Run Tests** - Executes all tests with coverage requirements
6. ✅ **Security Analysis** - Runs SAST and SCA scans
7. ✅ **Upload Coverage** - Stores test coverage artifacts

## 🚨 Common CI Failures & Solutions

### Issue: Test Timeouts
**Solution**: Tests now have 90s timeout. If still timing out, check database connection.

### Issue: MongoDB Connection Failed
**Solution**: Replica set initialization was added. Tests now retry with fallback connections.

### Issue: Coverage Below 80%
**Solution**: Run `npm run test:coverage` locally and add missing tests.

### Issue: Security Vulnerabilities
**Solution**: Run `npm audit fix` to auto-fix issues or update vulnerable packages manually.

## 🔧 Making Changes to CI Workflow

If you need to modify the CI workflow:

1. **Edit `.github/workflows/ci.yml`**
2. **Test locally** with the same environment variables
3. **Push to a feature branch** first
4. **Monitor the GitHub Actions tab** for results

## 📈 Performance Expectations

Your CI pipeline should complete in approximately:
- **Setup**: ~2 minutes
- **Tests**: ~3-5 minutes
- **Security Scan**: ~2-3 minutes
- **Total**: ~7-10 minutes

## 🎯 Success Criteria

Your CI pipeline passes when:
- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ Coverage ≥ 80% for all metrics
- ✅ No linting errors
- ✅ No type errors
- ✅ No critical/high security vulnerabilities
- ✅ MongoDB connection successful

## 🆘 Getting Help

If CI fails:
1. Check the **Actions** tab in GitHub
2. Click on the failed workflow
3. Review the logs for the failing step
4. Run the failing command locally with CI environment variables
5. Fix the issue and push again

## 📝 Notes

- MongoDB is configured with a replica set to support Prisma transactions
- Tests automatically retry failed database operations
- Coverage reports are uploaded as artifacts
- Security scans run on every PR

---

✅ **Your GitHub Actions tests should now pass!** 🎉
