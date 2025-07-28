import { DocumentRepository } from '../../domain/repositories/DocumentRepository.js'
import { DocumentEntity, CreateDocumentRequest, UpdateDocumentRequest, DocumentSearchQuery, CreateAssociationRequest } from '../../domain/entities/Document.js'
import * as fs from 'fs'
import * as path from 'path'

export class DocumentService {
  private uploadDir = './uploads/documents'

  constructor(private documentRepository: DocumentRepository) {
    this.ensureUploadDirectory()
  }

  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true })
    }
  }

  async getAllDocuments(): Promise<{ success: boolean; data?: DocumentEntity[]; error?: string }> {
    try {
      const documents = await this.documentRepository.findAll()
      return { success: true, data: documents }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async getDocumentById(id: string): Promise<{ success: boolean; data?: DocumentEntity; error?: string }> {
    try {
      const document = await this.documentRepository.findById(id)
      if (!document) {
        return { success: false, error: 'Document not found' }
      }
      return { success: true, data: document }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async getDocumentsByCategory(category: string): Promise<{ success: boolean; data?: DocumentEntity[]; error?: string }> {
    try {
      const documents = await this.documentRepository.findByCategory(category)
      return { success: true, data: documents }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async getDocumentsByEntity(entityType: string, entityId: string): Promise<{ success: boolean; data?: DocumentEntity[]; error?: string }> {
    try {
      const documents = await this.documentRepository.findByEntityAssociation(entityType, entityId)
      return { success: true, data: documents }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async searchDocuments(query: DocumentSearchQuery): Promise<{ success: boolean; data?: { documents: DocumentEntity[], total: number }; error?: string }> {
    try {
      const result = await this.documentRepository.search(query)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async uploadDocument(
    documentData: CreateDocumentRequest,
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string,
    uploadedBy: string
  ): Promise<{ success: boolean; data?: DocumentEntity; error?: string }> {
    try {
      // Generate unique filename
      const fileExtension = path.extname(originalFileName)
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substr(2, 9)
      const fileName = `${timestamp}_${randomString}${fileExtension}`
      const filePath = path.join(this.uploadDir, fileName)

      // Save file to disk
      fs.writeFileSync(filePath, fileBuffer)
      const fileSize = fileBuffer.length

      // Save document metadata to database
      const document = await this.documentRepository.save(
        documentData,
        filePath,
        fileSize,
        mimeType,
        uploadedBy
      )

      return { success: true, data: document }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async updateDocument(id: string, documentData: UpdateDocumentRequest): Promise<{ success: boolean; data?: DocumentEntity; error?: string }> {
    try {
      const document = await this.documentRepository.update(id, documentData)
      if (!document) {
        return { success: false, error: 'Document not found' }
      }
      return { success: true, data: document }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async deleteDocument(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get document to find file path
      const document = await this.documentRepository.findById(id)
      if (!document) {
        return { success: false, error: 'Document not found' }
      }

      // Delete from database
      const deleted = await this.documentRepository.delete(id)
      if (!deleted) {
        return { success: false, error: 'Failed to delete document from database' }
      }

      // Delete file from disk
      try {
        if (fs.existsSync(document.filePath)) {
          fs.unlinkSync(document.filePath)
        }
      } catch (fileError) {
        console.warn('Failed to delete file from disk:', fileError)
        // Continue - database deletion was successful
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async downloadDocument(id: string): Promise<{ success: boolean; data?: { filePath: string; fileName: string; mimeType: string }; error?: string }> {
    try {
      const document = await this.documentRepository.findById(id)
      if (!document) {
        return { success: false, error: 'Document not found' }
      }

      if (!fs.existsSync(document.filePath)) {
        return { success: false, error: 'File not found on disk' }
      }

      return {
        success: true,
        data: {
          filePath: document.filePath,
          fileName: document.fileName,
          mimeType: document.mimeType
        }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async createAssociation(documentId: string, association: CreateAssociationRequest): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await this.documentRepository.createAssociation(documentId, association)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async removeAssociation(documentId: string, entityType: string, entityId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const removed = await this.documentRepository.removeAssociation(documentId, entityType, entityId)
      if (!removed) {
        return { success: false, error: 'Association not found' }
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async getStatistics(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const stats = await this.documentRepository.getStatistics()
      return { success: true, data: stats }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Helper method to validate file types
  isValidFileType(mimeType: string): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif'
    ]
    return allowedTypes.includes(mimeType)
  }

  // Helper method to get file extension from mime type
  getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'text/plain': '.txt',
      'text/markdown': '.md',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif'
    }
    return extensions[mimeType] || ''
  }
}