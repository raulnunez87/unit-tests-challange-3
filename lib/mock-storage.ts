/**
 * Mock storage for testing purposes
 * Simulates a database with in-memory storage
 * This is shared between register-mock and login-mock endpoints
 */

export interface MockUser {
  id: string
  email: string
  username: string
  password: string
  createdAt: Date
}

// Use global variable to persist data across requests in development
declare global {
  var __mockUsers: MockUser[] | undefined
}

// In-memory storage for demo purposes
const users: MockUser[] = globalThis.__mockUsers || []
globalThis.__mockUsers = users

export const mockStorage = {
  // Add a new user
  createUser: (userData: Omit<MockUser, 'id' | 'createdAt'>): MockUser => {
    const user: MockUser = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    }
    users.push(user)
    return user
  },

  // Find user by email
  findByEmail: (email: string): MockUser | undefined => {
    return users.find(user => user.email === email)
  },

  // Find user by username
  findByUsername: (username: string): MockUser | undefined => {
    return users.find(user => user.username === username)
  },

  // Get all users
  getAllUsers: (): MockUser[] => {
    return [...users] // Return copy to prevent external modification
  },

  // Get user count
  getUserCount: (): number => {
    return users.length
  },

  // Clear all users (for testing)
  clearAll: (): void => {
    users.length = 0
  }
}
