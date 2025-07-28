import { Hono } from 'hono'
import { DrugService } from '../../application/services/DrugService.js'
import { authMiddleware, requireMicrobiologist } from '../middleware/AuthMiddleware.js'
import { DrugCategory } from '../../domain/entities/Drug.js'

export class DrugRoutes {
  private app: Hono

  constructor(private drugService: DrugService) {
    this.app = new Hono()
    this.setupRoutes()
  }

  private setupRoutes() {
    // Get all drugs (public for lab technicians)
    this.app.get('/', authMiddleware, async (c) => {
      try {
        const drugs = await this.drugService.getAllDrugs()
        return c.json({
          success: true,
          data: drugs.map(d => ({
            id: d.id,
            name: d.name,
            code: d.code,
            category: d.category,
            description: d.description,
            isActive: d.isActive,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt
          }))
        })
      } catch (error) {
        console.error('Get drugs error:', error)
        return c.json({ error: 'Failed to fetch drugs' }, 500)
      }
    })

    // Get drug categories
    this.app.get('/categories', authMiddleware, async (c) => {
      try {
        const categories = await this.drugService.getCategories()
        return c.json({
          success: true,
          data: categories
        })
      } catch (error) {
        console.error('Get categories error:', error)
        return c.json({ error: 'Failed to fetch categories' }, 500)
      }
    })

    // Get drugs by category
    this.app.get('/categories/:category', authMiddleware, async (c) => {
      try {
        const category = c.req.param('category') as DrugCategory
        if (!Object.values(DrugCategory).includes(category)) {
          return c.json({ error: 'Invalid category' }, 400)
        }

        const drugs = await this.drugService.getDrugsByCategory(category)
        return c.json({
          success: true,
          data: drugs.map(d => ({
            id: d.id,
            name: d.name,
            code: d.code,
            category: d.category,
            description: d.description,
            isActive: d.isActive,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt
          }))
        })
      } catch (error) {
        console.error('Get drugs by category error:', error)
        return c.json({ error: 'Failed to fetch drugs by category' }, 500)
      }
    })

    // Get drug statistics
    this.app.get('/statistics', authMiddleware, async (c) => {
      try {
        const stats = await this.drugService.getDrugStatistics()
        return c.json({
          success: true,
          data: stats
        })
      } catch (error) {
        console.error('Get drug statistics error:', error)
        return c.json({ error: 'Failed to fetch drug statistics' }, 500)
      }
    })

    // Search drugs
    this.app.get('/search', authMiddleware, async (c) => {
      try {
        const query = c.req.query()
        const criteria = {
          name: query.name,
          code: query.code,
          category: query.category as DrugCategory,
          isActive: query.isActive ? query.isActive === 'true' : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined,
          offset: query.offset ? parseInt(query.offset) : undefined
        }

        const drugs = await this.drugService.searchDrugs(criteria)
        return c.json({
          success: true,
          data: drugs.map(d => ({
            id: d.id,
            name: d.name,
            code: d.code,
            category: d.category,
            description: d.description,
            isActive: d.isActive,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt
          }))
        })
      } catch (error) {
        console.error('Search drugs error:', error)
        return c.json({ error: 'Failed to search drugs' }, 500)
      }
    })

    // Get drug by ID
    this.app.get('/:id', authMiddleware, async (c) => {
      try {
        const id = c.req.param('id')
        const drug = await this.drugService.getDrugById(id)
        
        if (!drug) {
          return c.json({ error: 'Drug not found' }, 404)
        }

        return c.json({
          success: true,
          data: {
            id: drug.id,
            name: drug.name,
            code: drug.code,
            category: drug.category,
            description: drug.description,
            isActive: drug.isActive,
            createdAt: drug.createdAt,
            updatedAt: drug.updatedAt
          }
        })
      } catch (error) {
        console.error('Get drug error:', error)
        return c.json({ error: 'Failed to fetch drug' }, 500)
      }
    })

    // Get drug by code
    this.app.get('/code/:code', authMiddleware, async (c) => {
      try {
        const code = c.req.param('code')
        const drug = await this.drugService.getDrugByCode(code)
        
        if (!drug) {
          return c.json({ error: 'Drug not found' }, 404)
        }

        return c.json({
          success: true,
          data: {
            id: drug.id,
            name: drug.name,
            code: drug.code,
            category: drug.category,
            description: drug.description,
            isActive: drug.isActive,
            createdAt: drug.createdAt,
            updatedAt: drug.updatedAt
          }
        })
      } catch (error) {
        console.error('Get drug by code error:', error)
        return c.json({ error: 'Failed to fetch drug' }, 500)
      }
    })

    // Create drug (requires microbiologist role)
    this.app.post('/', authMiddleware, requireMicrobiologist(), async (c) => {
      try {
        const body = await c.req.json()
        const { name, code, category, description } = body

        if (!name || !code || !category) {
          return c.json({ error: 'Name, code, and category are required' }, 400)
        }

        if (!Object.values(DrugCategory).includes(category)) {
          return c.json({ error: 'Invalid category' }, 400)
        }

        const result = await this.drugService.createDrug({
          name,
          code: code.toUpperCase(), // Standardize code to uppercase
          category,
          description
        })

        if (!result.success) {
          return c.json({ error: result.error }, 400)
        }

        return c.json({
          success: true,
          data: {
            id: result.drug!.id,
            name: result.drug!.name,
            code: result.drug!.code,
            category: result.drug!.category,
            description: result.drug!.description,
            isActive: result.drug!.isActive,
            createdAt: result.drug!.createdAt,
            updatedAt: result.drug!.updatedAt
          }
        }, 201)
      } catch (error) {
        console.error('Create drug error:', error)
        return c.json({ error: 'Failed to create drug' }, 500)
      }
    })

    // Update drug (requires microbiologist role)
    this.app.put('/:id', authMiddleware, requireMicrobiologist(), async (c) => {
      try {
        const id = c.req.param('id')
        const body = await c.req.json()
        const { name, code, category, description, isActive } = body

        if (category && !Object.values(DrugCategory).includes(category)) {
          return c.json({ error: 'Invalid category' }, 400)
        }

        const result = await this.drugService.updateDrug({
          id,
          name,
          code: code ? code.toUpperCase() : undefined,
          category,
          description,
          isActive
        })

        if (!result.success) {
          return c.json({ error: result.error }, 400)
        }

        return c.json({
          success: true,
          data: {
            id: result.drug!.id,
            name: result.drug!.name,
            code: result.drug!.code,
            category: result.drug!.category,
            description: result.drug!.description,
            isActive: result.drug!.isActive,
            createdAt: result.drug!.createdAt,
            updatedAt: result.drug!.updatedAt
          }
        })
      } catch (error) {
        console.error('Update drug error:', error)
        return c.json({ error: 'Failed to update drug' }, 500)
      }
    })

    // Delete drug (requires microbiologist role)
    this.app.delete('/:id', authMiddleware, requireMicrobiologist(), async (c) => {
      try {
        const id = c.req.param('id')
        const result = await this.drugService.deleteDrug(id)

        if (!result.success) {
          return c.json({ error: result.error }, 400)
        }

        return c.json({ success: true, message: 'Drug deleted successfully' })
      } catch (error) {
        console.error('Delete drug error:', error)
        return c.json({ error: 'Failed to delete drug' }, 500)
      }
    })
  }

  getRoutes(): Hono {
    return this.app
  }
}