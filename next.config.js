/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
    BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS,
    DATABASE_URL: process.env.DATABASE_URL
  }
}

module.exports = nextConfig
