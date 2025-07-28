export interface Document {
  id: string
  title: string
  description?: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  version: string
  category: DocumentCategory
  tags: string[]
  uploadedBy: string
  createdAt: Date
  updatedAt: Date
}

export interface DocumentEntity extends Document {
  associations?: DocumentAssociation[]
}

export enum DocumentCategory {
  CLSI_STANDARD = 'clsi_standard',
  REFERENCE_PAPER = 'reference_paper',
  GUIDELINE = 'guideline',
  MANUAL = 'manual',
  PROTOCOL = 'protocol',
  OTHER = 'other'
}

export enum EntityType {
  MICROORGANISM = 'microorganism',
  DRUG = 'drug',
  BREAKPOINT_STANDARD = 'breakpoint_standard',
  EXPERT_RULE = 'expert_rule'
}

export enum AssociationType {
  REFERENCE = 'reference',
  GUIDELINE = 'guideline',
  VALIDATION_SOURCE = 'validation_source',
  PROTOCOL = 'protocol',
  SUPPORTING_DOCUMENT = 'supporting_document'
}

export interface DocumentAssociation {
  id: string
  documentId: string
  entityType: EntityType
  entityId: string
  associationType: AssociationType
  createdAt: Date
}

export interface CreateDocumentRequest {
  title: string
  description?: string
  category: DocumentCategory
  tags?: string[]
  version?: string
}

export interface UpdateDocumentRequest {
  title?: string
  description?: string
  category?: DocumentCategory
  tags?: string[]
  version?: string
}

export interface CreateAssociationRequest {
  entityType: EntityType
  entityId: string
  associationType: AssociationType
}

export interface DocumentSearchQuery {
  query?: string
  category?: DocumentCategory
  tags?: string[]
  entityType?: EntityType
  entityId?: string
  limit?: number
  offset?: number
}

export interface DocumentUploadResult {
  document: DocumentEntity
  filePath: string
  fileSize: number
}