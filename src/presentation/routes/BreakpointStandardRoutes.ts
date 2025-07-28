import { Hono } from 'hono'
import { BreakpointStandardService } from '../../application/services/BreakpointStandardService.js'
import { authMiddleware, requireRole } from '../middleware/AuthMiddleware.js'
import { TestMethod } from '../../domain/entities/BreakpointStandard.js'
import { UserRole } from '../../domain/entities/User.js'

export class BreakpointStandardRoutes {
  private app = new Hono()

  constructor(
    private breakpointService: BreakpointStandardService
  ) {
    this.setupRoutes()
  }

  private setupRoutes() {
    // Get all available years
    this.app.get('/years', authMiddleware, async (c) => {
      try {
        const years = await this.breakpointService.getAvailableYears()
        return c.json({
          success: true,
          data: years
        })
      } catch (error) {
        console.error('Error fetching years:', error)
        return c.json({
          success: false,
          error: 'Failed to fetch available years'
        }, 500)
      }
    })

    // Get breakpoints by year
    this.app.get('/year/:year', authMiddleware, async (c) => {
      try {
        const year = parseInt(c.req.param('year'))
        if (isNaN(year)) {
          return c.json({
            success: false,
            error: 'Invalid year parameter'
          }, 400)
        }

        const standards = await this.breakpointService.getStandardsByYear(year)
        return c.json({
          success: true,
          data: standards,
          count: standards.length
        })
      } catch (error) {
        console.error('Error fetching standards by year:', error)
        return c.json({
          success: false,
          error: 'Failed to fetch standards'
        }, 500)
      }
    })

    // Search breakpoints
    this.app.get('/search', authMiddleware, async (c) => {
      try {
        const microorganismId = c.req.query('microorganismId')
        const drugId = c.req.query('drugId')
        const year = c.req.query('year')
        const method = c.req.query('method') as TestMethod

        if (!microorganismId || !drugId) {
          return c.json({
            success: false,
            error: 'microorganismId and drugId are required'
          }, 400)
        }

        const query = {
          microorganismId,
          drugId,
          year: year ? parseInt(year) : undefined,
          method
        }

        const standards = await this.breakpointService.findBreakpoints(query)
        return c.json({
          success: true,
          data: standards,
          count: standards.length
        })
      } catch (error) {
        console.error('Error searching breakpoints:', error)
        return c.json({
          success: false,
          error: 'Failed to search breakpoints'
        }, 500)
      }
    })

    // Get latest breakpoint
    this.app.get('/latest', authMiddleware, async (c) => {
      try {
        const microorganismId = c.req.query('microorganismId')
        const drugId = c.req.query('drugId')
        const method = c.req.query('method') as TestMethod

        if (!microorganismId || !drugId) {
          return c.json({
            success: false,
            error: 'microorganismId and drugId are required'
          }, 400)
        }

        const standard = await this.breakpointService.getLatestBreakpoint(
          microorganismId,
          drugId,
          method
        )

        if (!standard) {
          return c.json({
            success: false,
            error: 'No breakpoint standard found'
          }, 404)
        }

        return c.json({
          success: true,
          data: standard
        })
      } catch (error) {
        console.error('Error fetching latest breakpoint:', error)
        return c.json({
          success: false,
          error: 'Failed to fetch latest breakpoint'
        }, 500)
      }
    })

    // Interpret test result
    this.app.post('/interpret', authMiddleware, async (c) => {
      try {
        const body = await c.req.json()
        const { microorganismId, drugId, testValue, method, year } = body

        if (!microorganismId || !drugId || testValue === undefined || !method) {
          return c.json({
            success: false,
            error: 'microorganismId, drugId, testValue, and method are required'
          }, 400)
        }

        if (typeof testValue !== 'number') {
          return c.json({
            success: false,
            error: 'testValue must be a number'
          }, 400)
        }

        const interpretation = await this.breakpointService.interpretResult(
          microorganismId,
          drugId,
          testValue,
          method,
          year
        )

        if (!interpretation) {
          return c.json({
            success: false,
            error: 'No applicable breakpoint standard found'
          }, 404)
        }

        return c.json({
          success: true,
          data: interpretation
        })
      } catch (error) {
        console.error('Error interpreting result:', error)
        return c.json({
          success: false,
          error: 'Failed to interpret result'
        }, 500)
      }
    })

    // Compare breakpoint versions
    this.app.get('/compare', authMiddleware, async (c) => {
      try {
        const microorganismId = c.req.query('microorganismId')
        const drugId = c.req.query('drugId')
        const method = c.req.query('method') as TestMethod

        if (!microorganismId || !drugId) {
          return c.json({
            success: false,
            error: 'microorganismId and drugId are required'
          }, 400)
        }

        const comparisons = await this.breakpointService.compareBreakpointVersions(
          microorganismId,
          drugId,
          method
        )

        return c.json({
          success: true,
          data: comparisons
        })
      } catch (error) {
        console.error('Error comparing breakpoints:', error)
        return c.json({
          success: false,
          error: 'Failed to compare breakpoints'
        }, 500)
      }
    })

    // Create new breakpoint standard (admin only)
    this.app.post('/', requireRole([UserRole.ADMIN, UserRole.MICROBIOLOGIST]), async (c) => {
      try {
        const body = await c.req.json()
        const {
          microorganismId,
          drugId,
          year,
          method,
          breakpoints,
          notes,
          sourceDocument
        } = body

        if (!microorganismId || !drugId || !year || !method || !breakpoints) {
          return c.json({
            success: false,
            error: 'microorganismId, drugId, year, method, and breakpoints are required'
          }, 400)
        }

        const standard = await this.breakpointService.createBreakpointStandard(
          microorganismId,
          drugId,
          year,
          method,
          breakpoints,
          notes,
          sourceDocument
        )

        return c.json({
          success: true,
          data: standard
        }, 201)
      } catch (error) {
        console.error('Error creating breakpoint standard:', error)
        return c.json({
          success: false,
          error: 'Failed to create breakpoint standard'
        }, 500)
      }
    })

    // Update breakpoint standard (admin only)
    this.app.put('/:id', requireRole([UserRole.ADMIN, UserRole.MICROBIOLOGIST]), async (c) => {
      try {
        const id = c.req.param('id')
        const body = await c.req.json()

        const updated = await this.breakpointService.updateBreakpointStandard(id, body)

        if (!updated) {
          return c.json({
            success: false,
            error: 'Breakpoint standard not found'
          }, 404)
        }

        return c.json({
          success: true,
          data: updated
        })
      } catch (error) {
        console.error('Error updating breakpoint standard:', error)
        return c.json({
          success: false,
          error: 'Failed to update breakpoint standard'
        }, 500)
      }
    })

    // Get breakpoint statistics
    this.app.get('/statistics', authMiddleware, async (c) => {
      try {
        const years = await this.breakpointService.getAvailableYears()
        const totalStandards = (await Promise.all(
          years.map(year => this.breakpointService.getStandardsByYear(year))
        )).reduce((sum, standards) => sum + standards.length, 0)

        const methodCounts: Record<string, number> = {}
        const yearCounts: Record<number, number> = {}

        for (const year of years) {
          const standards = await this.breakpointService.getStandardsByYear(year)
          yearCounts[year] = standards.length

          for (const standard of standards) {
            methodCounts[standard.method] = (methodCounts[standard.method] || 0) + 1
          }
        }

        return c.json({
          success: true,
          data: {
            totalStandards,
            availableYears: years.length,
            yearRange: years.length > 0 ? {
              earliest: Math.min(...years),
              latest: Math.max(...years)
            } : null,
            methodDistribution: methodCounts,
            yearDistribution: yearCounts
          }
        })
      } catch (error) {
        console.error('Error fetching statistics:', error)
        return c.json({
          success: false,
          error: 'Failed to fetch statistics'
        }, 500)
      }
    })
  }

  getRoutes() {
    return this.app
  }
}