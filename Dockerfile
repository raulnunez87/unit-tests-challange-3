FROM node:18-alpine

WORKDIR /app

# Install MongoDB shell for health checks and OpenSSL for Prisma
RUN apk add --no-cache mongodb-tools openssl1.1-compat

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]