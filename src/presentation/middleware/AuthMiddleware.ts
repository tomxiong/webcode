import { Context, Next } from 'hono'
import { JwtService } from '../../infrastructure/services/JwtService.js'
import { UserRole } from '../../domain/entities/User.js'

const jwtService = new JwtService()

export interface AuthContext {
  user: {
    userId: string
    username: string
    role: UserRole
  }
}

// Simple auth middleware function
export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization header' }, 401)
    }

    const token = authHeader.substring(7)
    const payload = jwtService.verifyToken(token)
    
    if (!payload) {
      return c.json({ error: 'Invalid or expired token' }, 401)
    }

    // Add user info to context
    c.set('userId', payload.userId)
    c.set('username', payload.username)
    c.set('role', payload.role)

    await next()
  } catch (error) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}

// Role-based middleware
export const requireRole = (requiredRoles: UserRole[]) => {
  return async (c: Context, next: Next) => {
    const userRole = c.get('role') as UserRole
    
    if (!userRole) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    if (!requiredRoles.includes(userRole)) {
      return c.json({ error: 'Insufficient permissions' }, 403)
    }

    await next()
  }
}

export const requireAdmin = () => requireRole([UserRole.ADMIN])
export const requireMicrobiologist = () => requireRole([UserRole.ADMIN, UserRole.MICROBIOLOGIST])
export const requireLabTechnician = () => requireRole([UserRole.ADMIN, UserRole.MICROBIOLOGIST, UserRole.LAB_TECHNICIAN])