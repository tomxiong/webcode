import { Hono } from 'hono'
import { SampleService } from '../../application/services/SampleService.js'
import { authMiddleware } from '../middleware/AuthMiddleware.js'
import { SampleType, SampleStatus, SamplePriority } from '../../domain/entities/Sample.js'

export class SampleRoutes {
  private router = new Hono()

  constructor(private sampleService: SampleService) {
    this.setupRoutes()
  }

  private setupRoutes() {
    // Apply authentication middleware to all routes
    this.router.use('/*', authMiddleware)

    // Get all samples
    this.router.get('/', async (c) => {
      try {
        const samples = await this.sampleService.getAllSamples()
        return c.json({
          success: true,
          data: samples,
          count: samples.length
        })
      } catch (error) {
        console.error('Error fetching samples:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to fetch samples',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Get samples by status
    this.router.get('/status/:status', async (c) => {
      try {
        const status = c.req.param('status') as SampleStatus
        const samples = await this.sampleService.getSamplesByStatus(status)
        return c.json({
          success: true,
          data: samples,
          count: samples.length,
          status
        })
      } catch (error) {
        console.error('Error fetching samples by status:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to fetch samples by status',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Get samples by type
    this.router.get('/type/:type', async (c) => {
      try {
        const type = c.req.param('type') as SampleType
        const samples = await this.sampleService.getSamplesByType(type)
        return c.json({
          success: true,
          data: samples,
          count: samples.length,
          type
        })
      } catch (error) {
        console.error('Error fetching samples by type:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to fetch samples by type',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Get samples by patient
    this.router.get('/patient/:patientId', async (c) => {
      try {
        const patientId = c.req.param('patientId')
        const samples = await this.sampleService.getSamplesByPatient(patientId)
        return c.json({
          success: true,
          data: samples,
          count: samples.length,
          patientId
        })
      } catch (error) {
        console.error('Error fetching samples by patient:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to fetch samples by patient',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Get sample statistics
    this.router.get('/statistics', async (c) => {
      try {
        const stats = await this.sampleService.getSampleStatistics()
        return c.json({
          success: true,
          data: stats
        })
      } catch (error) {
        console.error('Error fetching sample statistics:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to fetch sample statistics',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Get specific sample
    this.router.get('/:id', async (c) => {
      try {
        const id = c.req.param('id')
        const sample = await this.sampleService.getSampleById(id)
        
        if (!sample) {
          return c.json({ 
            success: false, 
            error: 'Sample not found' 
          }, 404)
        }
        
        return c.json({
          success: true,
          data: sample
        })
      } catch (error) {
        console.error('Error fetching sample:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to fetch sample',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Create new sample
    this.router.post('/', async (c) => {
      try {
        const sampleData = await c.req.json()
        
        // Validate required fields
        if (!sampleData.patientId) {
          return c.json({ 
            success: false, 
            error: 'Missing required field: patientId' 
          }, 400)
        }
        
        if (!sampleData.sampleType) {
          return c.json({ 
            success: false, 
            error: 'Missing required field: sampleType' 
          }, 400)
        }
        
        if (!sampleData.specimenSource) {
          return c.json({ 
            success: false, 
            error: 'Missing required field: specimenSource' 
          }, 400)
        }
        
        // Set default values if not provided
        if (!sampleData.collectionDate) {
          sampleData.collectionDate = new Date()
        } else if (typeof sampleData.collectionDate === 'string') {
          sampleData.collectionDate = new Date(sampleData.collectionDate)
        }
        
        if (!sampleData.priority) {
          sampleData.priority = 'routine'
        }
        
        const sample = await this.sampleService.createSample(sampleData)
        
        return c.json({
          success: true,
          data: sample,
          message: 'Sample created successfully'
        }, 201)
      } catch (error) {
        console.error('Error creating sample:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to create sample',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 400)
      }
    })

    // Update sample
    this.router.put('/:id', async (c) => {
      try {
        const id = c.req.param('id')
        const updateData = await c.req.json()
        
        const sample = await this.sampleService.updateSample(id, updateData)
        
        if (!sample) {
          return c.json({ 
            success: false, 
            error: 'Sample not found' 
          }, 404)
        }
        
        return c.json({
          success: true,
          data: sample,
          message: 'Sample updated successfully'
        })
      } catch (error) {
        console.error('Error updating sample:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to update sample',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Update sample status
    this.router.patch('/:id/status', async (c) => {
      try {
        const id = c.req.param('id')
        const { status, comments } = await c.req.json()
        
        const sample = await this.sampleService.updateSampleStatus(id, status, comments)
        
        if (!sample) {
          return c.json({ 
            success: false, 
            error: 'Sample not found' 
          }, 404)
        }
        
        return c.json({
          success: true,
          data: sample,
          message: 'Sample status updated successfully'
        })
      } catch (error) {
        console.error('Error updating sample status:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to update sample status',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Delete sample
    this.router.delete('/:id', async (c) => {
      try {
        const id = c.req.param('id')
        const success = await this.sampleService.deleteSample(id)
        
        if (!success) {
          return c.json({ 
            success: false, 
            error: 'Sample not found' 
          }, 404)
        }
        
        return c.json({
          success: true,
          message: 'Sample deleted successfully'
        })
      } catch (error) {
        console.error('Error deleting sample:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to delete sample',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })
  }

  getRoutes() {
    return this.router
  }
}