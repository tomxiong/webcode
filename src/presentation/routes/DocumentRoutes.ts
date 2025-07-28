import { Hono } from 'hono'
import { DocumentService } from '../../application/services/DocumentService.js'
import { authMiddleware } from '../middleware/AuthMiddleware.js'
import { CreateDocumentRequest, UpdateDocumentRequest, CreateAssociationRequest, DocumentSearchQuery } from '../../domain/entities/Document.js'
import * as fs from 'fs'

export class DocumentRoutes {
  private app = new Hono()

  constructor(private documentService: DocumentService) {
    this.setupRoutes()
  }

  private setupRoutes(): void {
    // Apply authentication middleware to all routes
    this.app.use('/*', authMiddleware)

    // Get all documents
    this.app.get('/', async (c) => {
      const result = await this.documentService.getAllDocuments()
      return c.json({
        success: result.success,
        data: result.data,
        count: result.data?.length || 0,
        error: result.error
      })
    })

    // Search documents
    this.app.get('/search', async (c) => {
      const query = c.req.query('q')
      const category = c.req.query('category')
      const tags = c.req.query('tags')?.split(',').filter(Boolean)
      const entityType = c.req.query('entityType')
      const entityId = c.req.query('entityId')
      const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined
      const offset = c.req.query('offset') ? parseInt(c.req.query('offset')!) : undefined

      const searchQuery: DocumentSearchQuery = {
        query,
        category: category as any,
        tags,
        entityType: entityType as any,
        entityId,
        limit,
        offset
      }

      const result = await this.documentService.searchDocuments(searchQuery)
      return c.json({
        success: result.success,
        data: result.data?.documents,
        total: result.data?.total || 0,
        error: result.error
      })
    })

    // Get documents by category
    this.app.get('/category/:category', async (c) => {
      const category = c.req.param('category')
      const result = await this.documentService.getDocumentsByCategory(category)
      return c.json({
        success: result.success,
        data: result.data,
        count: result.data?.length || 0,
        error: result.error
      })
    })

    // Get documents by entity association
    this.app.get('/entity/:entityType/:entityId', async (c) => {
      const entityType = c.req.param('entityType')
      const entityId = c.req.param('entityId')
      const result = await this.documentService.getDocumentsByEntity(entityType, entityId)
      return c.json({
        success: result.success,
        data: result.data,
        count: result.data?.length || 0,
        error: result.error
      })
    })

    // Get document statistics
    this.app.get('/statistics', async (c) => {
      const result = await this.documentService.getStatistics()
      return c.json({
        success: result.success,
        data: result.data,
        error: result.error
      })
    })

    // Upload document
    this.app.post('/upload', async (c) => {
      try {
        const body = await c.req.parseBody()
        const file = body.file as File
        const title = body.title as string
        const description = body.description as string
        const category = body.category as string
        const tags = body.tags ? JSON.parse(body.tags as string) : []
        const version = body.version as string

        if (!file) {
          return c.json({ success: false, error: 'No file provided' }, 400)
        }

        if (!title || !category) {
          return c.json({ success: false, error: 'Title and category are required' }, 400)
        }

        // Validate file type
        if (!this.documentService.isValidFileType(file.type)) {
          return c.json({ success: false, error: 'Invalid file type' }, 400)
        }

        // Get user from auth context
        const user = c.get('user')
        if (!user) {
          return c.json({ success: false, error: 'User not authenticated' }, 401)
        }

        const fileBuffer = Buffer.from(await file.arrayBuffer())
        
        const documentData: CreateDocumentRequest = {
          title,
          description,
          category: category as any,
          tags,
          version
        }

        const result = await this.documentService.uploadDocument(
          documentData,
          fileBuffer,
          file.name,
          file.type,
          user.id
        )

        return c.json({
          success: result.success,
          data: result.data,
          error: result.error
        })
      } catch (error) {
        return c.json({
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed'
        }, 500)
      }
    })

    // Get document by ID
    this.app.get('/:id', async (c) => {
      const id = c.req.param('id')
      const result = await this.documentService.getDocumentById(id)
      return c.json({
        success: result.success,
        data: result.data,
        error: result.error
      })
    })

    // Update document
    this.app.put('/:id', async (c) => {
      try {
        const id = c.req.param('id')
        const body = await c.req.json()
        
        const documentData: UpdateDocumentRequest = {
          title: body.title,
          description: body.description,
          category: body.category,
          tags: body.tags,
          version: body.version
        }

        const result = await this.documentService.updateDocument(id, documentData)
        return c.json({
          success: result.success,
          data: result.data,
          error: result.error
        })
      } catch (error) {
        return c.json({
          success: false,
          error: error instanceof Error ? error.message : 'Update failed'
        }, 500)
      }
    })

    // Delete document
    this.app.delete('/:id', async (c) => {
      const id = c.req.param('id')
      const result = await this.documentService.deleteDocument(id)
      return c.json({
        success: result.success,
        error: result.error
      })
    })

    // Download document
    this.app.get('/:id/download', async (c) => {
      const id = c.req.param('id')
      const result = await this.documentService.downloadDocument(id)
      
      if (!result.success || !result.data) {
        return c.json({
          success: false,
          error: result.error || 'Download failed'
        }, 404)
      }

      // Stream the file
      const fileBuffer = fs.readFileSync(result.data.filePath)
      
      c.header('Content-Type', result.data.mimeType)
      c.header('Content-Disposition', `attachment; filename="${result.data.fileName}"`)
      
      return c.body(fileBuffer)
    })

    // Create document association
    this.app.post('/:id/associate', async (c) => {
      try {
        const documentId = c.req.param('id')
        const body = await c.req.json()
        
        const association: CreateAssociationRequest = {
          entityType: body.entityType,
          entityId: body.entityId,
          associationType: body.associationType
        }

        const result = await this.documentService.createAssociation(documentId, association)
        return c.json({
          success: result.success,
          data: result.data,
          error: result.error
        })
      } catch (error) {
        return c.json({
          success: false,
          error: error instanceof Error ? error.message : 'Association failed'
        }, 500)
      }
    })

    // Remove document association
    this.app.delete('/:id/associate/:entityType/:entityId', async (c) => {
      const documentId = c.req.param('id')
      const entityType = c.req.param('entityType')
      const entityId = c.req.param('entityId')
      
      const result = await this.documentService.removeAssociation(documentId, entityType, entityId)
      return c.json({
        success: result.success,
        error: result.error
      })
    })
  }

  getRoutes() {
    return this.app
  }
}