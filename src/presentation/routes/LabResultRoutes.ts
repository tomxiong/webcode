import { Hono } from 'hono'
import { LabResultService } from '../../application/services/LabResultService.js'
import { authMiddleware } from '../middleware/AuthMiddleware.js'
import { ValidationStatus, TestMethod, ResultInterpretation } from '../../domain/entities/LabResult.js'

export class LabResultRoutes {
  private router = new Hono()

  constructor(private labResultService: LabResultService) {
    this.setupRoutes()
  }

  private setupRoutes() {
    // Apply authentication middleware to all routes
    this.router.use('/*', authMiddleware)

    // Get all lab results
    this.router.get('/', async (c) => {
      try {
        const results = await this.labResultService.getAllLabResults()
        return c.json({
          success: true,
          data: results,
          count: results.length
        })
      } catch (error) {
        console.error('Error fetching lab results:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to fetch lab results',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Get results by sample
    this.router.get('/sample/:sampleId', async (c) => {
      try {
        const sampleId = c.req.param('sampleId')
        const results = await this.labResultService.getLabResultsBySample(sampleId)
        return c.json({
          success: true,
          data: results,
          count: results.length,
          sampleId
        })
      } catch (error) {
        console.error('Error fetching results by sample:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to fetch results by sample',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Get results by validation status
    this.router.get('/validation/:status', async (c) => {
      try {
        const status = c.req.param('status') as ValidationStatus
        const results = await this.labResultService.getLabResultsByValidationStatus(status)
        return c.json({
          success: true,
          data: results,
          count: results.length,
          status
        })
      } catch (error) {
        console.error('Error fetching results by validation status:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to fetch results by validation status',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Get pending validation results
    this.router.get('/pending', async (c) => {
      try {
        const results = await this.labResultService.getPendingValidationResults()
        return c.json({
          success: true,
          data: results,
          count: results.length
        })
      } catch (error) {
        console.error('Error fetching pending results:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to fetch pending results',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Get results requiring review
    this.router.get('/review', async (c) => {
      try {
        const results = await this.labResultService.getResultsRequiringReview()
        return c.json({
          success: true,
          data: results,
          count: results.length
        })
      } catch (error) {
        console.error('Error fetching results requiring review:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to fetch results requiring review',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Get lab result statistics
    this.router.get('/statistics', async (c) => {
      try {
        const stats = await this.labResultService.getLabResultStatistics()
        return c.json({
          success: true,
          data: stats
        })
      } catch (error) {
        console.error('Error fetching lab result statistics:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to fetch lab result statistics',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Get specific lab result
    this.router.get('/:id', async (c) => {
      try {
        const id = c.req.param('id')
        const result = await this.labResultService.getLabResultById(id)
        
        if (!result) {
          return c.json({ 
            success: false, 
            error: 'Lab result not found' 
          }, 404)
        }
        
        return c.json({
          success: true,
          data: result
        })
      } catch (error) {
        console.error('Error fetching lab result:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to fetch lab result',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Create new lab result
    this.router.post('/', async (c) => {
      try {
        const resultData = await c.req.json()
        
        // Convert date strings to Date objects
        if (resultData.testDate) {
          resultData.testDate = new Date(resultData.testDate)
        }
        
        const result = await this.labResultService.createLabResult(resultData)
        
        return c.json({
          success: true,
          data: result,
          message: 'Lab result created and auto-validated successfully'
        }, 201)
      } catch (error) {
        console.error('Error creating lab result:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to create lab result',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Update lab result
    this.router.put('/:id', async (c) => {
      try {
        const id = c.req.param('id')
        const updateData = await c.req.json()
        
        // Convert date strings to Date objects
        if (updateData.testDate) {
          updateData.testDate = new Date(updateData.testDate)
        }
        if (updateData.reportDate) {
          updateData.reportDate = new Date(updateData.reportDate)
        }
        
        const result = await this.labResultService.updateLabResult(id, updateData)
        
        if (!result) {
          return c.json({ 
            success: false, 
            error: 'Lab result not found' 
          }, 404)
        }
        
        return c.json({
          success: true,
          data: result,
          message: 'Lab result updated successfully'
        })
      } catch (error) {
        console.error('Error updating lab result:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to update lab result',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Validate lab result
    this.router.post('/:id/validate', async (c) => {
      try {
        const labResultId = c.req.param('id')
        const { interpretation, validationComments, reviewedBy } = await c.req.json()
        
        const validation = {
          labResultId,
          interpretation,
          validationComments,
          reviewedBy
        }
        
        const result = await this.labResultService.validateLabResult(validation)
        
        if (!result) {
          return c.json({ 
            success: false, 
            error: 'Lab result not found' 
          }, 404)
        }
        
        return c.json({
          success: true,
          data: result,
          message: 'Lab result validated successfully'
        })
      } catch (error) {
        console.error('Error validating lab result:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to validate lab result',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Auto-validate lab result
    this.router.post('/:id/auto-validate', async (c) => {
      try {
        const id = c.req.param('id')
        const result = await this.labResultService.autoValidateResult(id)
        
        if (!result) {
          return c.json({ 
            success: false, 
            error: 'Lab result not found' 
          }, 404)
        }
        
        return c.json({
          success: true,
          data: result,
          message: 'Lab result auto-validated successfully'
        })
      } catch (error) {
        console.error('Error auto-validating lab result:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to auto-validate lab result',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Bulk validate results
    this.router.post('/bulk-validate', async (c) => {
      try {
        const { resultIds, reviewedBy } = await c.req.json()
        
        if (!Array.isArray(resultIds) || resultIds.length === 0) {
          return c.json({ 
            success: false, 
            error: 'Invalid or empty result IDs array' 
          }, 400)
        }
        
        const result = await this.labResultService.bulkValidateResults(resultIds, reviewedBy)
        
        return c.json({
          success: true,
          data: result,
          message: `Bulk validation completed: ${result.successful} successful, ${result.failed} failed`
        })
      } catch (error) {
        console.error('Error bulk validating results:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to bulk validate results',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })

    // Delete lab result
    this.router.delete('/:id', async (c) => {
      try {
        const id = c.req.param('id')
        const success = await this.labResultService.deleteLabResult(id)
        
        if (!success) {
          return c.json({ 
            success: false, 
            error: 'Lab result not found' 
          }, 404)
        }
        
        return c.json({
          success: true,
          message: 'Lab result deleted successfully'
        })
      } catch (error) {
        console.error('Error deleting lab result:', error)
        return c.json({ 
          success: false, 
          error: 'Failed to delete lab result',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    })
  }

  getRoutes() {
    return this.router
  }
}