import { Hono } from 'hono'
import { AuthService } from '../../application/services/AuthService.js'
import { authMiddleware } from '../middleware/AuthMiddleware.js'

export class AuthRoutes {
  private app: Hono

  constructor(private authService: AuthService) {
    this.app = new Hono()
    this.setupRoutes()
  }

  private setupRoutes() {
    // Login route
    this.app.post('/login', async (c) => {
      try {
        console.log('🔐 Login attempt received')
        const { username, password } = await c.req.json()
        console.log(`🔐 Login attempt for user: ${username}`)
        
        if (!username || !password) {
          console.log('❌ Missing username or password')
          return c.json({ 
            success: false,
            error: 'Username and password are required' 
          }, 400)
        }

        const authResult = await this.authService.login({ username, password })
        console.log(`✅ Login successful for user: ${username}, role: ${authResult.user.role}`)

        return c.json({
          success: true,
          message: 'Login successful',
          token: authResult.token,
          user: authResult.user
        })
      } catch (error) {
        console.error('❌ Login error:', error.message)
        return c.json({ 
          success: false,
          error: 'Invalid credentials',
          message: error.message 
        }, 401)
      }
    })

    // Register route
    this.app.post('/register', async (c) => {
      try {
        const { username, email, password, role } = await c.req.json()
        
        if (!username || !email || !password) {
          return c.json({ error: 'Username, email, and password are required' }, 400)
        }

        const registerResult = await this.authService.register({ username, email, password, role })

        return c.json({
          success: true,
          token: registerResult.token,
          user: registerResult.user
        })
      } catch (error) {
        console.error('Register error:', error)
        return c.json({ error: error.message || 'Registration failed' }, 400)
      }
    })

    // Get current user (protected route)
    this.app.get('/me', authMiddleware, async (c) => {
      try {
        const userId = c.get('userId')
        const username = c.get('username')
        const role = c.get('role')

        return c.json({
          success: true,
          user: {
            id: userId,
            username: username,
            role: role
          }
        })
      } catch (error) {
        console.error('Get current user error:', error)
        return c.json({ error: 'Internal server error' }, 500)
      }
    })

    // Get user profile (alias for /me, used by frontend)
    this.app.get('/profile', authMiddleware, async (c) => {
      try {
        const userId = c.get('userId')
        const username = c.get('username')
        const role = c.get('role')

        return c.json({
          success: true,
          user: {
            id: userId,
            username: username,
            role: role
          }
        })
      } catch (error) {
        console.error('Get user profile error:', error)
        return c.json({ error: 'Internal server error' }, 500)
      }
    })

    // Logout route (protected)
    this.app.post('/logout', authMiddleware, async (c) => {
      // In a stateless JWT system, logout is handled client-side
      // by removing the token. Here we just confirm the action.
      return c.json({ success: true, message: 'Logged out successfully' })
    })
  }

  getRoutes(): Hono {
    return this.app
  }
}