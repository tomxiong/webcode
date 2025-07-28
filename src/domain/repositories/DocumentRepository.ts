import { DocumentEntity, CreateDocumentRequest, UpdateDocumentRequest, DocumentSearchQuery, DocumentAssociation, CreateAssociationRequest } from '../entities/Document.js'

export interface DocumentRepository {
  findAll(): Promise<DocumentEntity[]>
  findById(id: string): Promise<DocumentEntity | null>
  findByCategory(category: string): Promise<DocumentEntity[]>
  findByEntityAssociation(entityType: string, entityId: string): Promise<DocumentEntity[]>
  search(query: DocumentSearchQuery): Promise<{ documents: DocumentEntity[], total: number }>
  save(document: CreateDocumentRequest, filePath: string, fileSize: number, mimeType: string, uploadedBy: string): Promise<DocumentEntity>
  update(id: string, document: UpdateDocumentRequest): Promise<DocumentEntity | null>
  delete(id: string): Promise<boolean>
  
  // Association management
  createAssociation(documentId: string, association: CreateAssociationRequest): Promise<DocumentAssociation>
  removeAssociation(documentId: string, entityType: string, entityId: string): Promise<boolean>
  getAssociations(documentId: string): Promise<DocumentAssociation[]>
  
  // Statistics
  getStatistics(): Promise<{
    totalDocuments: number
    documentsByCategory: Record<string, number>
    documentsByType: Record<string, number>
    totalFileSize: number
    averageFileSize: number
  }>
}