import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'
import { Database } from '../../../infrastructure/database/Database.js'
import { SqliteUserRepository } from '../../../infrastructure/repositories/SqliteUserRepository.js'
import { AuthService } from '../../../application/services/AuthService.js'
import { AuthRoutes } from '../../../presentation/routes/AuthRoutes.js'
import { JwtService } from '../../../infrastructure/services/JwtService.js'
import { PasswordService } from '../../../infrastructure/services/PasswordService.js'

describe('AuthRoutes Integration Tests', () => {
  let app: Hono
  let database: Database
  let authService: AuthService

  beforeEach(async () => {
    // Use in-memory database for testing
    database = new Database(':memory:')
    await database.initialize()

    const userRepository = new SqliteUserRepository(database)
    const jwtService = new JwtService()
    const passwordService = new PasswordService()
    authService = new AuthService(userRepository, jwtService, passwordService)

    const authRoutes = new AuthRoutes(authService)
    app = new Hono()
    app.route('/api/auth', authRoutes.getRoutes())

    // Create test user
    await authService.register({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'admin'
    })
  })

  afterEach(async () => {
    await database.close()
  })

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123'
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.token).toBeDefined()
      expect(data.user.username).toBe('testuser')
    })

    it('should fail login with invalid credentials', async () => {
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          password: 'wrongpassword'
        })
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid username or password')
    })

    it('should fail login with missing fields', async () => {
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser'
          // missing password
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Username and password are required')
    })
  })

  describe('POST /api/auth/register', () => {
    it('should register new user successfully', async () => {
      const response = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
          role: 'viewer'
        })
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.userId).toBeDefined()
    })

    it('should fail registration with existing username', async () => {
      const response = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser', // already exists
          email: 'another@example.com',
          password: 'password123',
          role: 'viewer'
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Username already exists')
    })
  })

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      // First login to get token
      const loginResponse = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123'
        })
      })

      const loginData = await loginResponse.json()
      const token = loginData.token

      // Then get profile
      const response = await app.request('/api/auth/profile', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.user.username).toBe('testuser')
    })

    it('should fail to get profile without token', async () => {
      const response = await app.request('/api/auth/profile', {
        method: 'GET'
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authorization header required')
    })
  })
})