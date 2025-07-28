import { Database } from '../database/Database.js'
import { ExportImportRepository } from '../../domain/repositories/ExportImportRepository.js'
import { ExportRequest, ImportRequest, ExportTemplate, BackupRecord } from '../../domain/entities/ExportImport.js'

export class SqliteExportImportRepository implements ExportImportRepository {
  constructor(private database: Database) {}

  // Export operations
  async createExportRequest(request: ExportRequest): Promise<void> {
    await this.database.run(`
      INSERT INTO export_requests (
        id, type, format, filters, options, requested_by, created_at, 
        status, file_path, file_size, download_url, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      request.id, request.type, request.format, 
      JSON.stringify(request.filters || {}), 
      JSON.stringify(request.options || {}),
      request.requestedBy, request.createdAt, request.status,
      request.filePath || null, request.fileSize || null,
      request.downloadUrl || null, request.expiresAt || null
    ])
  }

  async getExportRequest(id: string): Promise<ExportRequest | null> {
    const row = await this.database.get<any>(`
      SELECT * FROM export_requests WHERE id = ?
    `, [id])

    if (!row) return null

    return {
      id: row.id,
      type: row.type,
      format: row.format,
      filters: JSON.parse(row.filters || '{}'),
      options: JSON.parse(row.options || '{}'),
      requestedBy: row.requested_by,
      createdAt: row.created_at,
      status: row.status,
      filePath: row.file_path,
      fileSize: row.file_size,
      downloadUrl: row.download_url,
      expiresAt: row.expires_at
    }
  }

  async updateExportRequest(id: string, updates: Partial<ExportRequest>): Promise<void> {
    const fields = []
    const values = []

    if (updates.status) {
      fields.push('status = ?')
      values.push(updates.status)
    }
    if (updates.filePath) {
      fields.push('file_path = ?')
      values.push(updates.filePath)
    }
    if (updates.fileSize) {
      fields.push('file_size = ?')
      values.push(updates.fileSize)
    }
    if (updates.downloadUrl) {
      fields.push('download_url = ?')
      values.push(updates.downloadUrl)
    }
    if (updates.expiresAt) {
      fields.push('expires_at = ?')
      values.push(updates.expiresAt)
    }

    if (fields.length > 0) {
      values.push(id)
      await this.database.run(`
        UPDATE export_requests SET ${fields.join(', ')} WHERE id = ?
      `, values)
    }
  }

  async listExportRequests(userId?: string, limit = 50, offset = 0): Promise<{ requests: ExportRequest[], total: number }> {
    let query = 'SELECT * FROM export_requests'
    let countQuery = 'SELECT COUNT(*) as count FROM export_requests'
    const params = []

    if (userId) {
      query += ' WHERE requested_by = ?'
      countQuery += ' WHERE requested_by = ?'
      params.push(userId)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const [rows, countResult] = await Promise.all([
      this.database.all<any>(query, params),
      this.database.get<any>(countQuery, userId ? [userId] : [])
    ])

    const requests = rows.map((row: any) => ({
      id: row.id,
      type: row.type,
      format: row.format,
      filters: JSON.parse(row.filters || '{}'),
      options: JSON.parse(row.options || '{}'),
      requestedBy: row.requested_by,
      createdAt: row.created_at,
      status: row.status,
      filePath: row.file_path,
      fileSize: row.file_size,
      downloadUrl: row.download_url,
      expiresAt: row.expires_at
    }))

    return { requests, total: countResult?.count || 0 }
  }

  async deleteExportRequest(id: string): Promise<void> {
    await this.database.run('DELETE FROM export_requests WHERE id = ?', [id])
  }

  // Import operations
  async createImportRequest(request: ImportRequest): Promise<void> {
    await this.database.run(`
      INSERT INTO import_requests (
        id, type, format, file_name, file_path, file_size, options,
        requested_by, created_at, status, validation_results, import_results
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      request.id, request.type, request.format, request.fileName,
      request.filePath, request.fileSize, JSON.stringify(request.options || {}),
      request.requestedBy, request.createdAt, request.status,
      JSON.stringify(request.validationResults || []),
      JSON.stringify(request.importResults || {})
    ])
  }

  async getImportRequest(id: string): Promise<ImportRequest | null> {
    const row = await this.database.get<any>(`
      SELECT * FROM import_requests WHERE id = ?
    `, [id])

    if (!row) return null

    return {
      id: row.id,
      type: row.type,
      format: row.format,
      fileName: row.file_name,
      filePath: row.file_path,
      fileSize: row.file_size,
      options: JSON.parse(row.options || '{}'),
      requestedBy: row.requested_by,
      createdAt: row.created_at,
      status: row.status,
      validationResults: JSON.parse(row.validation_results || '[]'),
      importResults: JSON.parse(row.import_results || '{}')
    }
  }

  async updateImportRequest(id: string, updates: Partial<ImportRequest>): Promise<void> {
    const fields = []
    const values = []

    if (updates.status) {
      fields.push('status = ?')
      values.push(updates.status)
    }
    if (updates.validationResults) {
      fields.push('validation_results = ?')
      values.push(JSON.stringify(updates.validationResults))
    }
    if (updates.importResults) {
      fields.push('import_results = ?')
      values.push(JSON.stringify(updates.importResults))
    }

    if (fields.length > 0) {
      values.push(id)
      await this.database.run(`
        UPDATE import_requests SET ${fields.join(', ')} WHERE id = ?
      `, values)
    }
  }

  async listImportRequests(userId?: string, limit = 50, offset = 0): Promise<{ requests: ImportRequest[], total: number }> {
    let query = 'SELECT * FROM import_requests'
    let countQuery = 'SELECT COUNT(*) as count FROM import_requests'
    const params = []

    if (userId) {
      query += ' WHERE requested_by = ?'
      countQuery += ' WHERE requested_by = ?'
      params.push(userId)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const [rows, countResult] = await Promise.all([
      this.database.all<any>(query, params),
      this.database.get<any>(countQuery, userId ? [userId] : [])
    ])

    const requests = rows.map((row: any) => ({
      id: row.id,
      type: row.type,
      format: row.format,
      fileName: row.file_name,
      filePath: row.file_path,
      fileSize: row.file_size,
      options: JSON.parse(row.options || '{}'),
      requestedBy: row.requested_by,
      createdAt: row.created_at,
      status: row.status,
      validationResults: JSON.parse(row.validation_results || '[]'),
      importResults: JSON.parse(row.import_results || '{}')
    }))

    return { requests, total: countResult?.count || 0 }
  }

  async deleteImportRequest(id: string): Promise<void> {
    await this.database.run('DELETE FROM import_requests WHERE id = ?', [id])
  }

  // Export templates
  async createExportTemplate(template: ExportTemplate): Promise<void> {
    await this.database.run(`
      INSERT INTO export_templates (
        id, name, description, type, format, fields, filters,
        created_by, created_at, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      template.id, template.name, template.description, template.type,
      template.format, JSON.stringify(template.fields),
      JSON.stringify(template.filters), template.createdBy,
      template.createdAt, template.isDefault
    ])
  }

  async getExportTemplate(id: string): Promise<ExportTemplate | null> {
    const row = await this.database.get<any>(`
      SELECT * FROM export_templates WHERE id = ?
    `, [id])

    if (!row) return null

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      format: row.format,
      fields: JSON.parse(row.fields),
      filters: JSON.parse(row.filters),
      createdBy: row.created_by,
      createdAt: row.created_at,
      isDefault: row.is_default
    }
  }

  async updateExportTemplate(id: string, updates: Partial<ExportTemplate>): Promise<void> {
    const fields = []
    const values = []

    if (updates.name) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.description) {
      fields.push('description = ?')
      values.push(updates.description)
    }
    if (updates.fields) {
      fields.push('fields = ?')
      values.push(JSON.stringify(updates.fields))
    }
    if (updates.filters) {
      fields.push('filters = ?')
      values.push(JSON.stringify(updates.filters))
    }
    if (updates.isDefault !== undefined) {
      fields.push('is_default = ?')
      values.push(updates.isDefault)
    }

    if (fields.length > 0) {
      values.push(id)
      await this.database.run(`
        UPDATE export_templates SET ${fields.join(', ')} WHERE id = ?
      `, values)
    }
  }

  async listExportTemplates(type?: string, userId?: string): Promise<ExportTemplate[]> {
    let query = 'SELECT * FROM export_templates WHERE 1=1'
    const params = []

    if (type) {
      query += ' AND type = ?'
      params.push(type)
    }
    if (userId) {
      query += ' AND created_by = ?'
      params.push(userId)
    }

    query += ' ORDER BY is_default DESC, name ASC'

    const rows = await this.database.all<any>(query, params)
    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      format: row.format,
      fields: JSON.parse(row.fields),
      filters: JSON.parse(row.filters),
      createdBy: row.created_by,
      createdAt: row.created_at,
      isDefault: row.is_default
    }))
  }

  async deleteExportTemplate(id: string): Promise<void> {
    await this.database.run('DELETE FROM export_templates WHERE id = ?', [id])
  }

  // Backup management
  async createBackupRecord(backup: BackupRecord): Promise<void> {
    await this.database.run(`
      INSERT INTO backup_records (
        id, type, description, file_path, file_size, created_by,
        created_at, expires_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      backup.id, backup.type, backup.description, backup.filePath,
      backup.fileSize, backup.createdBy, backup.createdAt,
      backup.expiresAt, JSON.stringify(backup.metadata)
    ])
  }

  async getBackupRecord(id: string): Promise<BackupRecord | null> {
    const row = await this.database.get<any>(`
      SELECT * FROM backup_records WHERE id = ?
    `, [id])

    if (!row) return null

    return {
      id: row.id,
      type: row.type,
      description: row.description,
      filePath: row.file_path,
      fileSize: row.file_size,
      createdBy: row.created_by,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      metadata: JSON.parse(row.metadata)
    }
  }

  async listBackupRecords(limit = 50, offset = 0): Promise<{ backups: BackupRecord[], total: number }> {
    const [rows, countResult] = await Promise.all([
      this.database.all<any>(`
        SELECT * FROM backup_records 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `, [limit, offset]),
      this.database.get<any>('SELECT COUNT(*) as count FROM backup_records')
    ])

    const backups = rows.map((row: any) => ({
      id: row.id,
      type: row.type,
      description: row.description,
      filePath: row.file_path,
      fileSize: row.file_size,
      createdBy: row.created_by,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      metadata: JSON.parse(row.metadata)
    }))

    return { backups, total: countResult?.count || 0 }
  }

  async deleteBackupRecord(id: string): Promise<void> {
    await this.database.run('DELETE FROM backup_records WHERE id = ?', [id])
  }

  async cleanupExpiredBackups(): Promise<number> {
    const result = await this.database.run(`
      DELETE FROM backup_records 
      WHERE expires_at < datetime('now')
    `)
    return result.changes || 0
  }

  // Data export methods
  async exportBreakpointStandards(filters?: any): Promise<any[]> {
    let query = `
      SELECT bs.*, m.name as microorganism_name, d.name as drug_name
      FROM breakpoint_standards bs
      LEFT JOIN microorganisms m ON bs.microorganism_id = m.id
      LEFT JOIN drugs d ON bs.drug_id = d.id
      WHERE 1=1
    `
    const params = []

    if (filters?.dateRange) {
      query += ' AND bs.created_at BETWEEN ? AND ?'
      params.push(filters.dateRange.startDate, filters.dateRange.endDate)
    }
    if (filters?.year) {
      query += ' AND bs.year = ?'
      params.push(filters.year)
    }

    return this.database.all<any>(query, params)
  }

  async exportExpertRules(filters?: any): Promise<any[]> {
    let query = 'SELECT * FROM expert_rules WHERE 1=1'
    const params = []

    if (filters?.ruleType) {
      query += ' AND rule_type = ?'
      params.push(filters.ruleType)
    }
    if (filters?.isActive !== undefined) {
      query += ' AND is_active = ?'
      params.push(filters.isActive)
    }

    return this.database.all<any>(query, params)
  }

  async exportMicroorganisms(filters?: any): Promise<any[]> {
    let query = 'SELECT * FROM microorganisms WHERE 1=1'
    const params = []

    if (filters?.genus) {
      query += ' AND genus = ?'
      params.push(filters.genus)
    }

    return this.database.all<any>(query, params)
  }

  async exportDrugs(filters?: any): Promise<any[]> {
    let query = 'SELECT * FROM drugs WHERE 1=1'
    const params = []

    if (filters?.category) {
      query += ' AND category = ?'
      params.push(filters.category)
    }

    return this.database.all<any>(query, params)
  }

  async exportFullSystem(filters?: any): Promise<any> {
    const [standards, rules, microorganisms, drugs, users, samples, labResults, documents] = await Promise.all([
      this.exportBreakpointStandards(filters),
      this.exportExpertRules(filters),
      this.exportMicroorganisms(filters),
      this.exportDrugs(filters),
      this.database.all<any>('SELECT id, username, email, role, created_at FROM users'),
      this.database.all<any>('SELECT * FROM samples'),
      this.database.all<any>('SELECT * FROM lab_results'),
      this.database.all<any>('SELECT * FROM documents')
    ])

    return {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        totalRecords: standards.length + rules.length + microorganisms.length + drugs.length + users.length + samples.length + labResults.length + documents.length
      },
      data: {
        breakpointStandards: standards,
        expertRules: rules,
        microorganisms,
        drugs,
        users,
        samples,
        labResults,
        documents
      }
    }
  }

  // Statistics
  async getExportImportStatistics(): Promise<{
    totalExports: number
    totalImports: number
    successfulExports: number
    successfulImports: number
    failedOperations: number
    averageProcessingTime: number
    popularFormats: { format: string, count: number }[]
    recentActivity: { date: string, exports: number, imports: number }[]
  }> {
    const [exportStats, importStats, formatStats, activityStats] = await Promise.all([
      this.database.get<any>(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM export_requests
      `),
      this.database.get<any>(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM import_requests
      `),
      this.database.all<any>(`
        SELECT format, COUNT(*) as count
        FROM (
          SELECT format FROM export_requests
          UNION ALL
          SELECT format FROM import_requests
        ) 
        GROUP BY format
        ORDER BY count DESC
      `),
      this.database.all<any>(`
        SELECT 
          DATE(created_at) as date,
          SUM(CASE WHEN 'export_requests' THEN 1 ELSE 0 END) as exports,
          SUM(CASE WHEN 'import_requests' THEN 1 ELSE 0 END) as imports
        FROM (
          SELECT created_at, 'export_requests' as type FROM export_requests WHERE created_at >= date('now', '-7 days')
          UNION ALL
          SELECT created_at, 'import_requests' as type FROM import_requests WHERE created_at >= date('now', '-7 days')
        )
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `)
    ])

    return {
      totalExports: exportStats?.total || 0,
      totalImports: importStats?.total || 0,
      successfulExports: exportStats?.successful || 0,
      successfulImports: importStats?.successful || 0,
      failedOperations: (exportStats?.failed || 0) + (importStats?.failed || 0),
      averageProcessingTime: 0, // Would need to track processing times
      popularFormats: formatStats.map((row: any) => ({ format: row.format, count: row.count })),
      recentActivity: activityStats.map((row: any) => ({
        date: row.date,
        exports: row.exports || 0,
        imports: row.imports || 0
      }))
    }
  }
}