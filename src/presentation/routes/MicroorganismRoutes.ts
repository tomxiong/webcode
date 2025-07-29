import { Hono } from 'hono'
import { MicroorganismService } from '../../application/services/MicroorganismService.js'
import { authMiddleware, requireMicrobiologist } from '../middleware/AuthMiddleware.js'

export class MicroorganismRoutes {
  private app: Hono

  constructor(private microorganismService: MicroorganismService) {
    this.app = new Hono()
    this.setupRoutes()
  }

  private setupRoutes() {
    // Get all microorganisms (public for lab technicians)
    this.app.get('/', authMiddleware, async (c) => {
      try {
        const query = c.req.query()
        const limit = query.limit ? parseInt(query.limit) : undefined
        const offset = query.offset ? parseInt(query.offset) : 0
        
        // If pagination is requested, use search with criteria
        if (limit !== undefined) {
          const criteria = {
            limit: limit,
            offset: offset
          }
          const microorganisms = await this.microorganismService.searchMicroorganisms(criteria)
          const allMicroorganisms = await this.microorganismService.getAllMicroorganisms()
          
          const mappedData = microorganisms.map(m => ({
            id: m.id,
            genus: m.genus,
            groupName: m.group,
            species: m.species,
            commonName: m.commonName,
            description: m.description,
            isActive: m.isActive,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt
          }))
          
          return c.json({
            success: true,
            data: mappedData,
            total: allMicroorganisms.length,
            limit: limit,
            offset: offset
          })
        } else {
          // No pagination, return all
          const microorganisms = await this.microorganismService.getAllMicroorganisms()
          const mappedData = microorganisms.map(m => ({
            id: m.id,
            genus: m.genus,
            groupName: m.group,
            species: m.species,
            commonName: m.commonName,
            description: m.description,
            isActive: m.isActive,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt
          }))
          
          return c.json({
            success: true,
            data: mappedData,
            total: mappedData.length
          })
        }
      } catch (error) {
        console.error('Get microorganisms error:', error)
        return c.json({ error: 'Failed to fetch microorganisms' }, 500)
      }
    })

    // Get statistics
    this.app.get('/statistics', authMiddleware, async (c) => {
      try {
        const statistics = await this.microorganismService.getStatistics()
        return c.json({
          success: true,
          data: statistics
        })
      } catch (error) {
        console.error('Get statistics error:', error)
        return c.json({ error: 'Failed to fetch statistics' }, 500)
      }
    })

    // Get hierarchical data
    this.app.get('/hierarchy', authMiddleware, async (c) => {
      try {
        const hierarchy = await this.microorganismService.getHierarchicalData()
        return c.json({
          success: true,
          data: hierarchy
        })
      } catch (error) {
        console.error('Get hierarchy error:', error)
        return c.json({ error: 'Failed to fetch hierarchical data' }, 500)
      }
    })

    // Get genera list
    this.app.get('/genera', authMiddleware, async (c) => {
      try {
        const genera = await this.microorganismService.getGenera()
        return c.json({
          success: true,
          data: genera
        })
      } catch (error) {
        console.error('Get genera error:', error)
        return c.json({ error: 'Failed to fetch genera' }, 500)
      }
    })

    // Get species by genus
    this.app.get('/genera/:genus/species', authMiddleware, async (c) => {
      try {
        const genus = c.req.param('genus')
        const species = await this.microorganismService.getSpeciesByGenus(genus)
        return c.json({
          success: true,
          data: species
        })
      } catch (error) {
        console.error('Get species error:', error)
        return c.json({ error: 'Failed to fetch species' }, 500)
      }
    })

    // Search microorganisms
    this.app.get('/search', authMiddleware, async (c) => {
      try {
        const query = c.req.query()
        const criteria = {
          genus: query.genus,
          groupName: query.groupName,
          species: query.species,
          commonName: query.commonName,
          isActive: query.isActive ? query.isActive === 'true' : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined,
          offset: query.offset ? parseInt(query.offset) : undefined
        }

        const microorganisms = await this.microorganismService.searchMicroorganisms(criteria)
        
        // Get total count for pagination
        const allMicroorganisms = await this.microorganismService.getAllMicroorganisms()
        const total = allMicroorganisms.length

        return c.json({
          success: true,
          data: microorganisms.map(m => ({
            id: m.id,
            genus: m.genus,
            groupName: m.group,
            species: m.species,
            commonName: m.commonName,
            description: m.description,
            isActive: m.isActive,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt
          })),
          total: total,
          count: microorganisms.length,
          limit: criteria.limit,
          offset: criteria.offset || 0
        })
      } catch (error) {
        console.error('Search microorganisms error:', error)
        return c.json({ error: 'Failed to search microorganisms' }, 500)
      }
    })

    // Get microorganism by ID
    this.app.get('/:id', authMiddleware, async (c) => {
      try {
        const id = c.req.param('id')
        const microorganism = await this.microorganismService.getMicroorganismById(id)
        
        if (!microorganism) {
          return c.json({ error: 'Microorganism not found' }, 404)
        }

        return c.json({
          success: true,
          data: {
            id: microorganism.id,
            genus: microorganism.genus,
            groupName: microorganism.group,
            species: microorganism.species,
            commonName: microorganism.commonName,
            description: microorganism.description,
            isActive: microorganism.isActive,
            createdAt: microorganism.createdAt,
            updatedAt: microorganism.updatedAt
          }
        })
      } catch (error) {
        console.error('Get microorganism error:', error)
        return c.json({ error: 'Failed to fetch microorganism' }, 500)
      }
    })

    // Create microorganism (requires microbiologist role)
    this.app.post('/', authMiddleware, requireMicrobiologist(), async (c) => {
      try {
        const body = await c.req.json()
        const { genus, groupName, species, commonName, description } = body

        if (!genus || !species) {
          return c.json({ error: 'Genus and species are required' }, 400)
        }

        const result = await this.microorganismService.createMicroorganism({
          genus,
          groupName,
          species,
          commonName,
          description
        })

        if (!result.success) {
          return c.json({ error: result.error }, 400)
        }

        return c.json({
          success: true,
          id: result.microorganism!.id,
          genus: result.microorganism!.genus,
          groupName: result.microorganism!.group,
          species: result.microorganism!.species,
          commonName: result.microorganism!.commonName,
          description: result.microorganism!.description,
          isActive: result.microorganism!.isActive,
          createdAt: result.microorganism!.createdAt,
          updatedAt: result.microorganism!.updatedAt
        }, 201)
      } catch (error) {
        console.error('Create microorganism error:', error)
        return c.json({ error: 'Failed to create microorganism' }, 500)
      }
    })

    // Update microorganism (requires microbiologist role)
    this.app.put('/:id', authMiddleware, requireMicrobiologist(), async (c) => {
      try {
        const id = c.req.param('id')
        const body = await c.req.json()
        const { genus, groupName, species, commonName, description, isActive } = body

        const result = await this.microorganismService.updateMicroorganism({
          id,
          genus,
          groupName,
          species,
          commonName,
          description,
          isActive
        })

        if (!result.success) {
          return c.json({ error: result.error }, 400)
        }

        return c.json({
          success: true,
          data: {
            id: result.microorganism!.id,
            genus: result.microorganism!.genus,
            groupName: result.microorganism!.group,
            species: result.microorganism!.species,
            commonName: result.microorganism!.commonName,
            description: result.microorganism!.description,
            isActive: result.microorganism!.isActive,
            createdAt: result.microorganism!.createdAt,
            updatedAt: result.microorganism!.updatedAt
          }
        })
      } catch (error) {
        console.error('Update microorganism error:', error)
        return c.json({ error: 'Failed to update microorganism' }, 500)
      }
    })

    // Delete microorganism (requires microbiologist role)
    this.app.delete('/:id', authMiddleware, requireMicrobiologist(), async (c) => {
      try {
        const id = c.req.param('id')
        const result = await this.microorganismService.deleteMicroorganism(id)

        if (!result.success) {
          return c.json({ error: result.error }, 400)
        }

        return c.json({ success: true, message: 'Microorganism deleted successfully' })
      } catch (error) {
        console.error('Delete microorganism error:', error)
        return c.json({ error: 'Failed to delete microorganism' }, 500)
      }
    })
  }

  getRoutes(): Hono {
    return this.app
  }
}