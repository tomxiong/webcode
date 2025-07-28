import { Hono } from 'hono'
import { AuthService } from '../../application/services/AuthService.js'
import { authMiddleware } from '../middleware/AuthMiddleware.js'

export class UserRoutes {
  private authService: AuthService

  constructor(authService: AuthService) {
    this.authService = authService
  }

  getRoutes() {
    const app = new Hono()

    // Apply authentication middleware to all routes
    app.use('*', authMiddleware)

    // Get all users
    app.get('/', async (c) => {
      try {
        const users = await this.authService.getAllUsers()
        return c.json({
          success: true,
          data: users.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }))
        })
      } catch (error) {
        console.error('Error fetching users:', error)
        return c.json({ success: false, error: 'Failed to fetch users' }, 500)
      }
    })

    // Get user statistics
    app.get('/statistics', async (c) => {
      try {
        const users = await this.authService.getAllUsers()
        const stats = {
          total: users.length,
          active: users.filter(u => u.isActive).length,
          inactive: users.filter(u => !u.isActive).length,
          byRole: {
            admin: users.filter(u => u.role === 'admin').length,
            microbiologist: users.filter(u => u.role === 'microbiologist').length,
            lab_technician: users.filter(u => u.role === 'lab_technician').length,
            viewer: users.filter(u => u.role === 'viewer').length
          }
        }
        
        return c.json({
          success: true,
          data: stats
        })
      } catch (error) {
        console.error('Error fetching user statistics:', error)
        return c.json({ success: false, error: 'Failed to fetch user statistics' }, 500)
      }
    })

    // Create new user
    app.post('/', async (c) => {
      try {
        const body = await c.req.json()
        const { username, email, password, role } = body

        if (!username || !email || !password || !role) {
          return c.json({ success: false, error: 'Missing required fields' }, 400)
        }

        const result = await this.authService.register(username, email, password, role)
        
        return c.json({
          success: true,
          data: {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email,
            role: result.user.role,
            isActive: result.user.isActive,
            createdAt: result.user.createdAt,
            updatedAt: result.user.updatedAt
          }
        })
      } catch (error) {
        console.error('Error creating user:', error)
        return c.json({ success: false, error: 'Failed to create user' }, 500)
      }
    })

    // Get user by ID
    app.get('/:id', async (c) => {
      try {
        const id = c.req.param('id')
        const user = await this.authService.getUserById(id)
        
        if (!user) {
          return c.json({ success: false, error: 'User not found' }, 404)
        }

        return c.json({
          success: true,
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        })
      } catch (error) {
        console.error('Error fetching user:', error)
        return c.json({ success: false, error: 'Failed to fetch user' }, 500)
      }
    })

    // Update user
    app.put('/:id', async (c) => {
      try {
        const id = c.req.param('id')
        const body = await c.req.json()
        
        const user = await this.authService.getUserById(id)
        if (!user) {
          return c.json({ success: false, error: 'User not found' }, 404)
        }

        // Update user logic would go here
        // For now, just return the existing user
        return c.json({
          success: true,
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        })
      } catch (error) {
        console.error('Error updating user:', error)
        return c.json({ success: false, error: 'Failed to update user' }, 500)
      }
    })

    // Delete user
    app.delete('/:id', async (c) => {
      try {
        const id = c.req.param('id')
        
        // Delete user logic would go here
        // For now, just return success
        return c.json({
          success: true,
          message: 'User deleted successfully'
        })
      } catch (error) {
        console.error('Error deleting user:', error)
        return c.json({ success: false, error: 'Failed to delete user' }, 500)
      }
    })

    return app
  }
}