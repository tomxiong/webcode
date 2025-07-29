import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthService, LoginRequest, RegisterRequest } from '../../../application/services/AuthService.js'
import { UserEntity, UserRole } from '../../../domain/entities/User.js'

// Mock dependencies
const mockUserRepository = {
  findByUsername: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  save: vi.fn(),
  findAll: vi.fn(),
  delete: vi.fn()
}

const mockJwtService = {
  generateToken: vi.fn(),
  verifyToken: vi.fn()
}

const mockPasswordService = {
  hash: vi.fn(),
  verify: vi.fn(),
  simpleVerify: vi.fn()
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
      const mockUser = {
        id: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'admin' as UserRole,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const loginRequest: LoginRequest = {
        username: 'testuser',
        password: 'password'
      }

      mockUserRepository.findByUsername.mockResolvedValue(mockUser)
      mockPasswordService.verify.mockResolvedValue(true)
      mockJwtService.generateToken.mockReturnValue('mock-jwt-token')

      const result = await authService.login(loginRequest)

      expect(result.token).toBe('mock-jwt-token')
      expect(result.user.username).toBe('testuser')
      expect(result.user.role).toBe('admin')
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('testuser')
      expect(mockPasswordService.verify).toHaveBeenCalledWith('password', 'hashedpassword')
    })

    it('should fail login with invalid username', async () => {
      const loginRequest: LoginRequest = {
        username: 'invaliduser',
        password: 'password'
      }

      mockUserRepository.findByUsername.mockResolvedValue(null)

      await expect(authService.login(loginRequest)).rejects.toThrow('Invalid credentials')
    })

    it('should fail login with invalid password', async () => {
      const mockUser = {
        id: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'admin' as UserRole,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const loginRequest: LoginRequest = {
        username: 'testuser',
        password: 'wrongpassword'
      }

      mockUserRepository.findByUsername.mockResolvedValue(mockUser)
      mockPasswordService.verify.mockResolvedValue(false)
      mockPasswordService.simpleVerify.mockReturnValue(false)

      await expect(authService.login(loginRequest)).rejects.toThrow('Invalid credentials')
    })

    it('should fail login with inactive user', async () => {
      const mockUser = {
        id: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'admin' as UserRole,
        isActive: false, // inactive
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const loginRequest: LoginRequest = {
        username: 'testuser',
        password: 'password'
      }

      mockUserRepository.findByUsername.mockResolvedValue(mockUser)

      await expect(authService.login(loginRequest)).rejects.toThrow('Account is deactivated')
    })
  })

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerRequest: RegisterRequest = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password',
        role: 'viewer' as UserRole
      }

      mockUserRepository.findByUsername.mockResolvedValue(null)
      mockUserRepository.findByEmail.mockResolvedValue(null)
      mockPasswordService.hash.mockResolvedValue('hashedpassword')
      mockUserRepository.save.mockResolvedValue(undefined)
      mockJwtService.generateToken.mockReturnValue('new-user-token')

      // Mock UserEntity.create
      const mockUserEntity = {
        id: 'new-user-id',
        username: 'newuser',
        email: 'new@example.com',
        passwordHash: 'hashedpassword',
        role: 'viewer' as UserRole,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.spyOn(UserEntity, 'create').mockReturnValue(mockUserEntity as any)

      const result = await authService.register(registerRequest)

      expect(result.token).toBe('new-user-token')
      expect(result.user.username).toBe('newuser')
      expect(result.user.email).toBe('new@example.com')
      expect(mockPasswordService.hash).toHaveBeenCalledWith('password')
      expect(mockUserRepository.save).toHaveBeenCalled()
    })

    it('should fail registration with existing username', async () => {
      const existingUser = {
        id: 'user1',
        username: 'existinguser',
        email: 'existing@example.com',
        passwordHash: 'hashedpassword',
        role: 'admin' as UserRole,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const registerRequest: RegisterRequest = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password',
        role: 'viewer' as UserRole
      }

      mockUserRepository.findByUsername.mockResolvedValue(existingUser)

      await expect(authService.register(registerRequest)).rejects.toThrow('Username already exists')
    })

    it('should fail registration with existing email', async () => {
      const existingUser = {
        id: 'user1',
        username: 'existinguser',
        email: 'existing@example.com',
        passwordHash: 'hashedpassword',
        role: 'admin' as UserRole,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const registerRequest: RegisterRequest = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password',
        role: 'viewer' as UserRole
      }

      mockUserRepository.findByUsername.mockResolvedValue(null)
      mockUserRepository.findByEmail.mockResolvedValue(existingUser)

      await expect(authService.register(registerRequest)).rejects.toThrow('Email already exists')
    })
  })

  describe('validateToken', () => {
    it('should successfully validate valid token', async () => {
      const mockPayload = { userId: 'user1', username: 'testuser', role: 'admin' as UserRole }
      const mockUser = {
        id: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'admin' as UserRole,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockJwtService.verifyToken.mockReturnValue(mockPayload)
      mockUserRepository.findById.mockResolvedValue(mockUser)

      const result = await authService.validateToken('valid-token')

      expect(result.userId).toBe('user1')
      expect(result.username).toBe('testuser')
      expect(result.role).toBe('admin')
    })

    it('should fail validation with invalid token', async () => {
      mockJwtService.verifyToken.mockReturnValue(null)

      await expect(authService.validateToken('invalid-token')).rejects.toThrow('Invalid token')
    })

    it('should fail validation when user is inactive', async () => {
      const mockPayload = { userId: 'user1', username: 'testuser', role: 'admin' as UserRole }
      const mockUser = {
        id: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'admin' as UserRole,
        isActive: false, // inactive
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockJwtService.verifyToken.mockReturnValue(mockPayload)
      mockUserRepository.findById.mockResolvedValue(mockUser)

      await expect(authService.validateToken('valid-token')).rejects.toThrow('Invalid token')
    })
  })

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: 'user1',
          username: 'user1',
          email: 'user1@example.com',
          role: 'admin' as UserRole,
          isActive: true
        },
        {
          id: 'user2',
          username: 'user2',
          email: 'user2@example.com',
          role: 'viewer' as UserRole,
          isActive: true
        }
      ]

      mockUserRepository.findAll.mockResolvedValue(mockUsers)

      const result = await authService.getAllUsers()

      expect(result).toEqual(mockUsers)
      expect(mockUserRepository.findAll).toHaveBeenCalled()
    })
  })

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin' as UserRole,
        isActive: true
      }

      mockUserRepository.findById.mockResolvedValue(mockUser)

      const result = await authService.getUserById('user1')

      expect(result).toEqual(mockUser)
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user1')
    })

    it('should return null for non-existent user', async () => {
      mockUserRepository.findById.mockResolvedValue(null)

      const result = await authService.getUserById('nonexistent')

      expect(result).toBeNull()
      expect(mockUserRepository.findById).toHaveBeenCalledWith('nonexistent')
    })
  })
})