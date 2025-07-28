import { Hono } from 'hono'
import { ReportService } from '../../application/services/ReportService.js'
import { authMiddleware } from '../middleware/AuthMiddleware.js'
import { CreateReportRequest, UpdateReportRequest, GenerateReportRequest } from '../../domain/entities/Report.js'

export class ReportRoutes {
  private app = new Hono()

  constructor(private reportService: ReportService) {
    this.setupRoutes()
  }

  private setupRoutes(): void {
    // Apply authentication middleware to all routes
    this.app.use('/*', authMiddleware)

    // Get all reports
    this.app.get('/', async (c) => {
      const result = await this.reportService.getReports()
      return c.json({
        success: result.success,
        data: result.data,
        count: result.data?.length || 0,
        error: result.error
      })
    })

    // Create new report
    this.app.post('/', async (c) => {
      try {
        const body = await c.req.json()
        const user = c.get('user')
        
        if (!user) {
          return c.json({ success: false, error: 'User not authenticated' }, 401)
        }

        const reportData: CreateReportRequest = {
          title: body.title,
          description: body.description,
          type: body.type,
          parameters: body.parameters,
          format: body.format,
          schedule: body.schedule
        }

        const result = await this.reportService.createReport(reportData, user.id)
        return c.json({
          success: result.success,
          data: result.data,
          error: result.error
        })
      } catch (error) {
        return c.json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create report'
        }, 500)
      }
    })

    // Get report by ID
    this.app.get('/:id', async (c) => {
      const id = c.req.param('id')
      const result = await this.reportService.getReportById(id)
      return c.json({
        success: result.success,
        data: result.data,
        error: result.error
      })
    })

    // Update report
    this.app.put('/:id', async (c) => {
      try {
        const id = c.req.param('id')
        const body = await c.req.json()
        
        const reportData: UpdateReportRequest = {
          title: body.title,
          description: body.description,
          parameters: body.parameters,
          format: body.format,
          schedule: body.schedule,
          isActive: body.isActive
        }

        const result = await this.reportService.updateReport(id, reportData)
        return c.json({
          success: result.success,
          data: result.data,
          error: result.error
        })
      } catch (error) {
        return c.json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update report'
        }, 500)
      }
    })

    // Delete report
    this.app.delete('/:id', async (c) => {
      const id = c.req.param('id')
      const result = await this.reportService.deleteReport(id)
      return c.json({
        success: result.success,
        error: result.error
      })
    })

    // Generate report
    this.app.post('/:id/generate', async (c) => {
      try {
        const id = c.req.param('id')
        const body = await c.req.json()
        
        const request: GenerateReportRequest = {
          reportId: id,
          parameters: body.parameters,
          format: body.format
        }

        const result = await this.reportService.generateReport(request)
        return c.json({
          success: result.success,
          data: result.data,
          error: result.error
        })
      } catch (error) {
        return c.json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate report'
        }, 500)
      }
    })

    // Get report results
    this.app.get('/:id/results', async (c) => {
      const id = c.req.param('id')
      const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined
      
      const result = await this.reportService.getReportResults(id, limit)
      return c.json({
        success: result.success,
        data: result.data,
        count: result.data?.length || 0,
        error: result.error
      })
    })

    // Get analytics data
    this.app.get('/analytics/:type', async (c) => {
      const type = c.req.param('type')
      const startDate = c.req.query('startDate')
      const endDate = c.req.query('endDate')
      const filters = c.req.query('filters') ? JSON.parse(c.req.query('filters')!) : {}
      
      const parameters = {
        dateRange: startDate && endDate ? { startDate, endDate } : undefined,
        filters
      }

      const result = await this.reportService.getAnalytics(type, parameters)
      return c.json({
        success: result.success,
        data: result.data,
        error: result.error
      })
    })

    // Get system overview
    this.app.get('/dashboard/overview', async (c) => {
      const result = await this.reportService.getSystemOverview()
      return c.json({
        success: result.success,
        data: result.data,
        error: result.error
      })
    })

    // Dashboard management
    this.app.get('/dashboards', async (c) => {
      const user = c.get('user')
      const result = await this.reportService.getDashboards(user?.id)
      return c.json({
        success: result.success,
        data: result.data,
        count: result.data?.length || 0,
        error: result.error
      })
    })

    // Create dashboard
    this.app.post('/dashboards', async (c) => {
      try {
        const body = await c.req.json()
        const user = c.get('user')
        
        if (!user) {
          return c.json({ success: false, error: 'User not authenticated' }, 401)
        }

        const dashboard = {
          title: body.title,
          description: body.description,
          widgets: body.widgets || [],
          layout: body.layout || 'grid',
          isPublic: body.isPublic || false,
          createdBy: user.id
        }

        const result = await this.reportService.createDashboard(dashboard)
        return c.json({
          success: result.success,
          data: result.data,
          error: result.error
        })
      } catch (error) {
        return c.json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create dashboard'
        }, 500)
      }
    })
  }

  getRoutes(): Hono {
    return this.app
  }
}