import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthService } from '../../../application/services/AuthService.js'
import { User } from '../../../domain/entities/User.js'

// Mock dependencies
const mockUserRepository = {
  findByUsername: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  findByEmail: vi.fn()
}

const mockJwtService = {
  generateToken: vi.fn(),
  verifyToken: vi.fn()
}

const mockPasswordService = {
  hashPassword: vi.fn(),
  verifyPassword: vi.fn()
}

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    vi.clearAllMocks()
    authService = new AuthService(
      mockUserRepository as any,
      mockJwtService as any,
      mockPasswordService as any
    )
  })

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = new User(
        'user1',
        'testuser',
        'test@example.com',
        'hashedpassword',
        'admin',
        true,
        new Date(),
        new Date()
      )

      mockUserRepository.findByUsername.mockResolvedValue(mockUser)
      mockPasswordService.verifyPassword.mockResolvedValue(true)
      mockJwtService.generateToken.mockReturnValue('mock-jwt-token')

      const result = await authService.login('testuser', 'password')

      expect(result.success).toBe(true)
      expect(result.token).toBe('mock-jwt-token')
      expect(result.user).toEqual(mockUser)
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('testuser')
      expect(mockPasswordService.verifyPassword).toHaveBeenCalledWith('password', 'hashedpassword')
    })

    it('should fail login with invalid username', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(null)

      const result = await authService.login('invaliduser', 'password')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid username or password')
      expect(result.token).toBeUndefined()
    })

    it('should fail login with invalid password', async () => {
      const mockUser = new User(
        'user1',
        'testuser',
        'test@example.com',
        'hashedpassword',
        'admin',
        true,
        new Date(),
        new Date()
      )

      mockUserRepository.findByUsername.mockResolvedValue(mockUser)
      mockPasswordService.verifyPassword.mockResolvedValue(false)

      const result = await authService.login('testuser', 'wrongpassword')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid username or password')
    })

    it('should fail login with inactive user', async () => {
      const mockUser = new User(
        'user1',
        'testuser',
        'test@example.com',
        'hashedpassword',
        'admin',
        false, // inactive
        new Date(),
        new Date()
      )

      mockUserRepository.findByUsername.mockResolvedValue(mockUser)
      mockPasswordService.verifyPassword.mockResolvedValue(true)

      const result = await authService.login('testuser', 'password')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Account is inactive')
    })
  })

  describe('register', () => {
    it('should successfully register a new user', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(null)
      mockUserRepository.findByEmail.mockResolvedValue(null)
      mockPasswordService.hashPassword.mockResolvedValue('hashedpassword')
      mockUserRepository.create.mockResolvedValue('new-user-id')

      const result = await authService.register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password',
        role: 'viewer'
      })

      expect(result.success).toBe(true)
      expect(result.userId).toBe('new-user-id')
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith('password')
    })

    it('should fail registration with existing username', async () => {
      const existingUser = new User(
        'user1',
        'existinguser',
        'existing@example.com',
        'hashedpassword',
        'admin',
        true,
        new Date(),
        new Date()
      )

      mockUserRepository.findByUsername.mockResolvedValue(existingUser)

      const result = await authService.register({
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password',
        role: 'viewer'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Username already exists')
    })
  })

  describe('verifyToken', () => {
    it('should successfully verify valid token', async () => {
      const mockPayload = { userId: 'user1', username: 'testuser', role: 'admin' }
      const mockUser = new User(
        'user1',
        'testuser',
        'test@example.com',
        'hashedpassword',
        'admin',
        true,
        new Date(),
        new Date()
      )

      mockJwtService.verifyToken.mockReturnValue(mockPayload)
      mockUserRepository.findById.mockResolvedValue(mockUser)

      const result = await authService.verifyToken('valid-token')

      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
    })

    it('should fail verification with invalid token', async () => {
      mockJwtService.verifyToken.mockReturnValue(null)

      const result = await authService.verifyToken('invalid-token')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid token')
    })
  })
})