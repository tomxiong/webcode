import { UserEntity, UserRole } from '../../domain/entities/User.js'
import { UserRepository } from '../../domain/repositories/UserRepository.js'
import { JwtService } from '../../infrastructure/services/JwtService.js'
import { PasswordService } from '../../infrastructure/services/PasswordService.js'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  role: UserRole
}

export interface AuthResponse {
  user: {
    id: string
    username: string
    email: string
    role: UserRole
  }
  token: string
}

export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private passwordService: PasswordService
  ) {}

  async login(request: LoginRequest): Promise<AuthResponse> {
    const user = await this.userRepository.findByUsername(request.username)
    if (!user) {
      throw new Error('Invalid credentials')
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated')
    }

    // Try both verification methods (for backward compatibility with seeded data)
    let isValidPassword = await this.passwordService.verify(
      request.password,
      user.passwordHash
    )
    
    // If PBKDF2 verification fails, try simple hash (for seeded users)
    if (!isValidPassword) {
      isValidPassword = this.passwordService.simpleVerify(request.password, user.passwordHash)
    }
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials')
    }

    const token = this.jwtService.generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    })

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    }
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    // Check if username already exists
    const existingUser = await this.userRepository.findByUsername(request.username)
    if (existingUser) {
      throw new Error('Username already exists')
    }

    // Check if email already exists
    const existingEmail = await this.userRepository.findByEmail(request.email)
    if (existingEmail) {
      throw new Error('Email already exists')
    }

    // Hash password
    const passwordHash = await this.passwordService.hash(request.password)

    // Create user entity
    const user = UserEntity.create(
      request.username,
      request.email,
      passwordHash,
      request.role
    )

    // Save user
    await this.userRepository.save(user)

    // Generate token
    const token = this.jwtService.generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    })

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    }
  }

  async validateToken(token: string): Promise<{ userId: string; username: string; role: UserRole }> {
    try {
      const payload = this.jwtService.verifyToken(token)
      
      if (!payload) {
        throw new Error('Invalid token')
      }
      
      // Verify user still exists and is active
      const user = await this.userRepository.findById(payload.userId)
      if (!user || !user.isActive) {
        throw new Error('Invalid token')
      }

      return payload
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  async getAllUsers(): Promise<UserEntity[]> {
    return await this.userRepository.findAll()
  }

  async getUserById(id: string): Promise<UserEntity | null> {
    return await this.userRepository.findById(id)
  }
}
