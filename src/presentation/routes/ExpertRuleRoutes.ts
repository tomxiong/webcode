import { Hono } from 'hono'
import { ExpertRuleService } from '../../application/services/ExpertRuleService.js'
import { authMiddleware } from '../middleware/AuthMiddleware.js'
import { ExpertRuleType } from '../../domain/entities/ExpertRule.js'

export class ExpertRuleRoutes {
  private router = new Hono()

  constructor(private expertRuleService: ExpertRuleService) {
    this.setupRoutes()
  }

  private setupRoutes() {
    // Apply authentication middleware to all routes
    this.router.use('/*', authMiddleware)

    // Get all expert rules
    this.router.get('/', async (c) => {
      try {
        const rules = await this.expertRuleService.getAllExpertRules()
        return c.json({
          success: true,
          data: rules,
          count: rules.length
        })
      } catch (error) {
        console.error('Error fetching expert rules:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to fetch expert rules',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Get rules by type
    this.router.get('/type/:type', async (c) => {
      try {
        const type = c.req.param('type') as ExpertRuleType
        const year = c.req.query('year') ? parseInt(c.req.query('year')!) : undefined
        
        const rules = await this.expertRuleService.getRulesByType(type, year)
        return c.json({
          success: true,
          data: rules,
          count: rules.length,
          type,
          year
        })
      } catch (error) {
        console.error('Error fetching rules by type:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to fetch rules by type',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Get specific expert rule
    // Get rule statistics (MUST come before /:id route)
    this.router.get('/statistics', async (c) => {
      try {
        const stats = await this.expertRuleService.getRuleStatistics()
        return c.json({
          success: true,
          data: stats
        })
      } catch (error) {
        console.error('Error fetching statistics:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to fetch statistics',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Validate test result using expert rules
    this.router.post('/validate', async (c) => {
      try {
        const context = await c.req.json()
        const result = await this.expertRuleService.validateResult(context)
        
        return c.json({
          success: true,
          data: result
        })
      } catch (error) {
        console.error('Error validating result:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to validate result',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Get specific expert rule (MUST come after /statistics route)
    this.router.get('/:id', async (c) => {
      try {
        const id = c.req.param('id')
        const rule = await this.expertRuleService.getExpertRuleById(id)
        
        if (!rule) {
          return c.json({ 
            success: false, 
            error: 'Expert rule not found' 
          }, 404)
        }
        
        return c.json({
          success: true,
          data: rule
        })
      } catch (error) {
        console.error('Error fetching expert rule:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to fetch expert rule',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Create new expert rule
    // Create new expert rule
    this.router.post('/', async (c) => {
      try {
        const ruleData = await c.req.json()
        const {
          name,
          description,
          ruleType,
          condition,
          action,
          priority,
          year,
          microorganismId,
          drugId,
          sourceReference,
          notes
        } = ruleData
        
        const rule = await this.expertRuleService.createExpertRule(
          name,
          description,
          ruleType,
          condition,
          action,
          priority || 1,
          year || new Date().getFullYear(),
          microorganismId,
          drugId,
          sourceReference,
          notes
        )
        
        return c.json({
          success: true,
          data: rule,
          message: 'Expert rule created successfully'
        }, 201)
      } catch (error) {
        console.error('Error creating expert rule:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to create expert rule',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Update expert rule
    this.router.put('/:id', async (c) => {
      try {
        const id = c.req.param('id')
        const updateData = await c.req.json()
        
        const rule = await this.expertRuleService.updateExpertRule(id, updateData)
        
        if (!rule) {
          return c.json({ 
            success: false, 
            error: 'Expert rule not found' 
          }, 404)
        }
        
        return c.json({
          success: true,
          data: rule,
          message: 'Expert rule updated successfully'
        })
      } catch (error) {
        console.error('Error updating expert rule:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to update expert rule',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Delete expert rule
    // Delete expert rule (soft delete by setting isActive to false)
    this.router.delete('/:id', async (c) => {
      try {
        const id = c.req.param('id')
        const rule = await this.expertRuleService.updateExpertRule(id, { isActive: false })
        
        if (!rule) {
          return c.json({ 
            success: false, 
            error: 'Expert rule not found' 
          }, 404)
        }
        
        return c.json({
          success: true,
          message: 'Expert rule deleted successfully'
        })
      } catch (error) {
        console.error('Error deleting expert rule:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to delete expert rule',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })
  }

  getRoutes() {
    return this.router
  }
}