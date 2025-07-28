import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'
import { Database } from '../../../infrastructure/database/Database.js'
import { SqliteUserRepository } from '../../../infrastructure/repositories/SqliteUserRepository.js'
import { SqliteMicroorganismRepository } from '../../../infrastructure/repositories/SqliteMicroorganismRepository.js'
import { AuthService } from '../../../application/services/AuthService.js'
import { MicroorganismService } from '../../../application/services/MicroorganismService.js'
import { AuthRoutes } from '../../../presentation/routes/AuthRoutes.js'
import { MicroorganismRoutes } from '../../../presentation/routes/MicroorganismRoutes.js'
import { JwtService } from '../../../infrastructure/services/JwtService.js'
import { PasswordService } from '../../../infrastructure/services/PasswordService.js'
import { authMiddleware } from '../../../presentation/middleware/AuthMiddleware.js'

describe('MicroorganismRoutes Integration Tests', () => {
  let app: Hono
  let database: Database
  let authToken: string

  beforeEach(async () => {
    // Use in-memory database for testing
    database = new Database(':memory:')
    await database.initialize()

    const userRepository = new SqliteUserRepository(database)
    const microorganismRepository = new SqliteMicroorganismRepository(database)
    const jwtService = new JwtService()
    const passwordService = new PasswordService()
    const authService = new AuthService(userRepository, jwtService, passwordService)
    const microorganismService = new MicroorganismService(microorganismRepository)

    const authRoutes = new AuthRoutes(authService)
    const microorganismRoutes = new MicroorganismRoutes(microorganismService)
    
    app = new Hono()
    app.route('/api/auth', authRoutes.getRoutes())
    app.route('/api/microorganisms', microorganismRoutes.getRoutes())

    // Create test user and get token
    await authService.register({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'admin'
    })

    const loginResponse = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
      })
    })

    const loginData = await loginResponse.json()
    authToken = loginData.token
  })

  afterEach(async () => {
    await database.close()
  })

  describe('POST /api/microorganisms', () => {
    it('should create microorganism successfully', async () => {
      const response = await app.request('/api/microorganisms', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          genus: 'Escherichia',
          species: 'coli',
          gramStain: 'negative',
          morphology: 'rod',
          oxygenRequirement: 'facultative',
          catalaseTest: true,
          oxidaseTest: false
        })
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.id).toBeDefined()
    })

    it('should fail to create microorganism without authentication', async () => {
      const response = await app.request('/api/microorganisms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genus: 'Escherichia',
          species: 'coli',
          gramStain: 'negative',
          morphology: 'rod',
          oxygenRequirement: 'facultative',
          catalaseTest: true,
          oxidaseTest: false
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/microorganisms', () => {
    beforeEach(async () => {
      // Create test microorganisms
      await app.request('/api/microorganisms', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          genus: 'Escherichia',
          species: 'coli',
          gramStain: 'negative',
          morphology: 'rod',
          oxygenRequirement: 'facultative',
          catalaseTest: true,
          oxidaseTest: false
        })
      })

      await app.request('/api/microorganisms', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          genus: 'Staphylococcus',
          species: 'aureus',
          gramStain: 'positive',
          morphology: 'cocci',
          oxygenRequirement: 'facultative',
          catalaseTest: true,
          oxidaseTest: false
        })
      })
    })

    it('should list microorganisms successfully', async () => {
      const response = await app.request('/api/microorganisms', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.total).toBe(2)
    })

    it('should support pagination', async () => {
      const response = await app.request('/api/microorganisms?limit=1&offset=0', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.limit).toBe(1)
      expect(data.offset).toBe(0)
    })
  })

  describe('GET /api/microorganisms/search', () => {
    beforeEach(async () => {
      // Create test microorganism
      await app.request('/api/microorganisms', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          genus: 'Escherichia',
          species: 'coli',
          gramStain: 'negative',
          morphology: 'rod',
          oxygenRequirement: 'facultative',
          catalaseTest: true,
          oxidaseTest: false
        })
      })
    })

    it('should search microorganisms successfully', async () => {
      const response = await app.request('/api/microorganisms/search?q=Escherichia', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].genus).toBe('Escherichia')
    })
  })

  describe('GET /api/microorganisms/statistics', () => {
    it('should get microorganism statistics', async () => {
      const response = await app.request('/api/microorganisms/statistics', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('totalCount')
      expect(data.data).toHaveProperty('genusCount')
    })
  })
})