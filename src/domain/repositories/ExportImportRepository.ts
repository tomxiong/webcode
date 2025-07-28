import { ExportRequest, ImportRequest, ExportTemplate, BackupRecord } from '../entities/ExportImport.js'

export interface ExportImportRepository {
  // Export operations
  createExportRequest(request: ExportRequest): Promise<void>
  getExportRequest(id: string): Promise<ExportRequest | null>
  updateExportRequest(id: string, updates: Partial<ExportRequest>): Promise<void>
  listExportRequests(userId?: string, limit?: number, offset?: number): Promise<{ requests: ExportRequest[], total: number }>
  deleteExportRequest(id: string): Promise<void>

  // Import operations
  createImportRequest(request: ImportRequest): Promise<void>
  getImportRequest(id: string): Promise<ImportRequest | null>
  updateImportRequest(id: string, updates: Partial<ImportRequest>): Promise<void>
  listImportRequests(userId?: string, limit?: number, offset?: number): Promise<{ requests: ImportRequest[], total: number }>
  deleteImportRequest(id: string): Promise<void>

  // Export templates
  createExportTemplate(template: ExportTemplate): Promise<void>
  getExportTemplate(id: string): Promise<ExportTemplate | null>
  updateExportTemplate(id: string, updates: Partial<ExportTemplate>): Promise<void>
  listExportTemplates(type?: string, userId?: string): Promise<ExportTemplate[]>
  deleteExportTemplate(id: string): Promise<void>

  // Backup management
  createBackupRecord(backup: BackupRecord): Promise<void>
  getBackupRecord(id: string): Promise<BackupRecord | null>
  listBackupRecords(limit?: number, offset?: number): Promise<{ backups: BackupRecord[], total: number }>
  deleteBackupRecord(id: string): Promise<void>
  cleanupExpiredBackups(): Promise<number>

  // Data export methods
  exportBreakpointStandards(filters?: any): Promise<any[]>
  exportExpertRules(filters?: any): Promise<any[]>
  exportMicroorganisms(filters?: any): Promise<any[]>
  exportDrugs(filters?: any): Promise<any[]>
  exportFullSystem(filters?: any): Promise<any>

  // Statistics
  getExportImportStatistics(): Promise<{
    totalExports: number
    totalImports: number
    successfulExports: number
    successfulImports: number
    failedOperations: number
    averageProcessingTime: number
    popularFormats: { format: string, count: number }[]
    recentActivity: { date: string, exports: number, imports: number }[]
  }>
}