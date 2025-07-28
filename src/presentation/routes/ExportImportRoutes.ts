import { Hono } from 'hono'
import { ExportImportService } from '../../application/services/ExportImportService.js'
import { authMiddleware } from '../middleware/AuthMiddleware.js'

export class ExportImportRoutes {
  private app = new Hono()

  constructor(private exportImportService: ExportImportService) {
    this.setupRoutes()
  }

  private setupRoutes() {
    // All routes require authentication
    this.app.use('*', authMiddleware)

    // Export operations
    this.app.post('/exports', async (c) => {
      try {
        const { type, format, filters, options } = await c.req.json()
        const userId = c.get('user').id

        const exportId = await this.exportImportService.createExportRequest(
          type, format, userId, filters, options
        )

        return c.json({
          success: true,
          data: { id: exportId, status: 'pending' }
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 400)
      }
    })

    this.app.get('/exports', async (c) => {
      try {
        const userId = c.get('user').role === 'admin' ? undefined : c.get('user').id
        const limit = parseInt(c.req.query('limit') || '50')
        const offset = parseInt(c.req.query('offset') || '0')

        const result = await this.exportImportService.repository.listExportRequests(userId, limit, offset)

        return c.json({
          success: true,
          data: result.requests,
          total: result.total,
          limit,
          offset
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 500)
      }
    })

    // Import operations
    this.app.post('/imports', async (c) => {
      try {
        const { type, format, fileName, filePath, options } = await c.req.json()
        const userId = c.get('user').id

        const importId = await this.exportImportService.createImportRequest(
          type, format, fileName, filePath, userId, options
        )

        return c.json({
          success: true,
          data: { id: importId, status: 'pending' }
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 400)
      }
    })

    // Statistics
    this.app.get('/statistics', async (c) => {
      try {
        const stats = await this.exportImportService.getExportImportStatistics()

        return c.json({
          success: true,
          data: stats
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 500)
      }
    })
  }

  getRoutes() {
    return this.app
  }
}