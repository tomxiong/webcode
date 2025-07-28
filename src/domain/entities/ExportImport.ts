export interface ExportRequest {
  id: string
  type: 'standards' | 'rules' | 'microorganisms' | 'drugs' | 'full_system'
  format: 'json' | 'csv' | 'excel' | 'xml'
  filters?: {
    dateRange?: {
      startDate: string
      endDate: string
    }
    categories?: string[]
    status?: string[]
    includeInactive?: boolean
  }
  options?: {
    includeMetadata?: boolean
    includeRelationships?: boolean
    compressOutput?: boolean
  }
  requestedBy: string
  createdAt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  filePath?: string
  fileSize?: number
  downloadUrl?: string
  expiresAt?: string
}

export interface ImportRequest {
  id: string
  type: 'standards' | 'rules' | 'microorganisms' | 'drugs' | 'full_system'
  format: 'json' | 'csv' | 'excel' | 'xml'
  fileName: string
  filePath: string
  fileSize: number
  options?: {
    validateOnly?: boolean
    skipDuplicates?: boolean
    updateExisting?: boolean
    createBackup?: boolean
  }
  requestedBy: string
  createdAt: string
  status: 'pending' | 'validating' | 'importing' | 'completed' | 'failed'
  validationResults?: ValidationResult[]
  importResults?: ImportResult
}

export interface ValidationResult {
  type: 'error' | 'warning' | 'info'
  message: string
  line?: number
  field?: string
  value?: string
  suggestion?: string
}

export interface ImportResult {
  totalRecords: number
  successfulImports: number
  skippedRecords: number
  failedImports: number
  duplicatesFound: number
  validationErrors: number
  processingTime: number
  summary: {
    created: number
    updated: number
    skipped: number
    failed: number
  }
  details: ImportDetail[]
}

export interface ImportDetail {
  recordId?: string
  action: 'created' | 'updated' | 'skipped' | 'failed'
  reason?: string
  originalData?: any
  processedData?: any
}

export interface ExportTemplate {
  id: string
  name: string
  description: string
  type: 'standards' | 'rules' | 'microorganisms' | 'drugs'
  format: 'json' | 'csv' | 'excel' | 'xml'
  fields: ExportField[]
  filters: any
  createdBy: string
  createdAt: string
  isDefault: boolean
}

export interface ExportField {
  name: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'object'
  required: boolean
  defaultValue?: any
  transformation?: string
}

export interface BackupRecord {
  id: string
  type: 'export' | 'import' | 'scheduled'
  description: string
  filePath: string
  fileSize: number
  createdBy: string
  createdAt: string
  expiresAt: string
  metadata: {
    recordCount: number
    dataTypes: string[]
    version: string
    checksum: string
  }
}