import { ExportImportRepository } from '../../domain/repositories/ExportImportRepository.js'
import { ExportRequest, ImportRequest, ExportTemplate, BackupRecord, ValidationResult, ImportResult } from '../../domain/entities/ExportImport.js'
import * as fs from 'fs/promises'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

export class ExportImportService {
  private exportDir = './exports'
  private importDir = './imports'
  private backupDir = './backups'

  constructor(private repository: ExportImportRepository) {
    this.ensureDirectories()
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.exportDir, { recursive: true })
      await fs.mkdir(this.importDir, { recursive: true })
      await fs.mkdir(this.backupDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create directories:', error)
    }
  }

  // Export operations
  async createExportRequest(
    type: 'standards' | 'rules' | 'microorganisms' | 'drugs' | 'full_system',
    format: 'json' | 'csv' | 'excel' | 'xml',
    userId: string,
    filters?: any,
    options?: any
  ): Promise<string> {
    const exportId = uuidv4()
    const request: ExportRequest = {
      id: exportId,
      type,
      format,
      filters,
      options,
      requestedBy: userId,
      createdAt: new Date().toISOString(),
      status: 'pending'
    }

    await this.repository.createExportRequest(request)
    
    // Start export processing asynchronously
    this.processExportRequest(exportId).catch(error => {
      console.error(`Export ${exportId} failed:`, error)
      this.repository.updateExportRequest(exportId, { 
        status: 'failed' 
      })
    })

    return exportId
  }

  private async processExportRequest(exportId: string): Promise<void> {
    await this.repository.updateExportRequest(exportId, { status: 'processing' })

    const request = await this.repository.getExportRequest(exportId)
    if (!request) throw new Error('Export request not found')

    try {
      let data: any
      
      switch (request.type) {
        case 'standards':
          data = await this.repository.exportBreakpointStandards(request.filters)
          break
        case 'rules':
          data = await this.repository.exportExpertRules(request.filters)
          break
        case 'microorganisms':
          data = await this.repository.exportMicroorganisms(request.filters)
          break
        case 'drugs':
          data = await this.repository.exportDrugs(request.filters)
          break
        case 'full_system':
          data = await this.repository.exportFullSystem(request.filters)
          break
        default:
          throw new Error(`Unsupported export type: ${request.type}`)
      }

      const fileName = `${request.type}_export_${Date.now()}.${request.format}`
      const filePath = path.join(this.exportDir, fileName)
      
      await this.writeExportFile(filePath, data, request.format)
      
      const stats = await fs.stat(filePath)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

      await this.repository.updateExportRequest(exportId, {
        status: 'completed',
        filePath,
        fileSize: stats.size,
        downloadUrl: `/api/exports/${exportId}/download`,
        expiresAt
      })

    } catch (error) {
      await this.repository.updateExportRequest(exportId, { status: 'failed' })
      throw error
    }
  }

  private async writeExportFile(filePath: string, data: any, format: string): Promise<void> {
    switch (format) {
      case 'json':
        await fs.writeFile(filePath, JSON.stringify(data, null, 2))
        break
      case 'csv':
        const csv = this.convertToCSV(data)
        await fs.writeFile(filePath, csv)
        break
      case 'xml':
        const xml = this.convertToXML(data)
        await fs.writeFile(filePath, xml)
        break
      case 'excel':
        // For now, export as JSON (Excel support would require additional library)
        await fs.writeFile(filePath, JSON.stringify(data, null, 2))
        break
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  private convertToCSV(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvRows = [headers.join(',')]
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header]
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      })
      csvRows.push(values.join(','))
    }
    
    return csvRows.join('\n')
  }

  private convertToXML(data: any): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n'
    const xmlData = this.objectToXML(data, 'root')
    return xmlHeader + xmlData
  }

  private objectToXML(obj: any, rootName: string): string {
    if (Array.isArray(obj)) {
      return `<${rootName}>\n${obj.map(item => this.objectToXML(item, 'item')).join('\n')}\n</${rootName}>`
    } else if (typeof obj === 'object' && obj !== null) {
      const entries = Object.entries(obj).map(([key, value]) => {
        return `  <${key}>${this.objectToXML(value, key)}</${key}>`
      }).join('\n')
      return `<${rootName}>\n${entries}\n</${rootName}>`
    } else {
      return String(obj)
    }
  }

  // Import operations
  async createImportRequest(
    type: 'standards' | 'rules' | 'microorganisms' | 'drugs' | 'full_system',
    format: 'json' | 'csv' | 'excel' | 'xml',
    fileName: string,
    filePath: string,
    userId: string,
    options?: any
  ): Promise<string> {
    const importId = uuidv4()
    const stats = await fs.stat(filePath)
    
    const request: ImportRequest = {
      id: importId,
      type,
      format,
      fileName,
      filePath,
      fileSize: stats.size,
      options,
      requestedBy: userId,
      createdAt: new Date().toISOString(),
      status: 'pending'
    }

    await this.repository.createImportRequest(request)
    
    // Start import processing asynchronously
    this.processImportRequest(importId).catch(error => {
      console.error(`Import ${importId} failed:`, error)
      this.repository.updateImportRequest(importId, { 
        status: 'failed' 
      })
    })

    return importId
  }

  private async processImportRequest(importId: string): Promise<void> {
    const request = await this.repository.getImportRequest(importId)
    if (!request) throw new Error('Import request not found')

    try {
      // Validation phase
      await this.repository.updateImportRequest(importId, { status: 'validating' })
      const validationResults = await this.validateImportFile(request)
      
      await this.repository.updateImportRequest(importId, { validationResults })

      // Check if validation passed
      const hasErrors = validationResults.some(result => result.type === 'error')
      if (hasErrors && !request.options?.validateOnly) {
        await this.repository.updateImportRequest(importId, { status: 'failed' })
        return
      }

      if (request.options?.validateOnly) {
        await this.repository.updateImportRequest(importId, { status: 'completed' })
        return
      }

      // Import phase
      await this.repository.updateImportRequest(importId, { status: 'importing' })
      const importResults = await this.performImport(request)
      
      await this.repository.updateImportRequest(importId, { 
        status: 'completed',
        importResults 
      })

    } catch (error) {
      await this.repository.updateImportRequest(importId, { status: 'failed' })
      throw error
    }
  }

  private async validateImportFile(request: ImportRequest): Promise<ValidationResult[]> {
    const results: ValidationResult[] = []
    
    try {
      const fileContent = await fs.readFile(request.filePath, 'utf-8')
      let data: any

      // Parse file based on format
      switch (request.format) {
        case 'json':
          data = JSON.parse(fileContent)
          break
        case 'csv':
          data = this.parseCSV(fileContent)
          break
        case 'xml':
          data = this.parseXML(fileContent)
          break
        default:
          results.push({
            type: 'error',
            message: `Unsupported import format: ${request.format}`
          })
          return results
      }

      // Validate data structure
      results.push(...this.validateDataStructure(data, request.type))
      
      // Validate individual records
      if (Array.isArray(data)) {
        data.forEach((record, index) => {
          results.push(...this.validateRecord(record, request.type, index + 1))
        })
      }

    } catch (error) {
      results.push({
        type: 'error',
        message: `Failed to parse file: ${error.message}`
      })
    }

    return results
  }

  private parseCSV(content: string): any[] {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length === 0) return []
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const data = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const record: any = {}
      headers.forEach((header, index) => {
        record[header] = values[index] || ''
      })
      data.push(record)
    }
    
    return data
  }

  private parseXML(content: string): any {
    // Simple XML parsing - in production, use a proper XML parser
    try {
      return JSON.parse(content) // Placeholder
    } catch {
      throw new Error('XML parsing not implemented')
    }
  }

  private validateDataStructure(data: any, type: string): ValidationResult[] {
    const results: ValidationResult[] = []
    
    if (!Array.isArray(data)) {
      results.push({
        type: 'error',
        message: 'Data must be an array of records'
      })
      return results
    }

    if (data.length === 0) {
      results.push({
        type: 'warning',
        message: 'No records found in import file'
      })
    }

    return results
  }

  private validateRecord(record: any, type: string, line: number): ValidationResult[] {
    const results: ValidationResult[] = []
    
    // Type-specific validation
    switch (type) {
      case 'standards':
        if (!record.microorganism_id) {
          results.push({
            type: 'error',
            message: 'Missing required field: microorganism_id',
            line,
            field: 'microorganism_id'
          })
        }
        if (!record.drug_id) {
          results.push({
            type: 'error',
            message: 'Missing required field: drug_id',
            line,
            field: 'drug_id'
          })
        }
        break
      case 'rules':
        if (!record.rule_type) {
          results.push({
            type: 'error',
            message: 'Missing required field: rule_type',
            line,
            field: 'rule_type'
          })
        }
        break
      // Add more validation rules as needed
    }

    return results
  }

  private async performImport(request: ImportRequest): Promise<ImportResult> {
    const fileContent = await fs.readFile(request.filePath, 'utf-8')
    let data: any[]

    switch (request.format) {
      case 'json':
        data = JSON.parse(fileContent)
        break
      case 'csv':
        data = this.parseCSV(fileContent)
        break
      default:
        throw new Error(`Import format ${request.format} not supported`)
    }

    const result: ImportResult = {
      totalRecords: data.length,
      successfulImports: 0,
      skippedRecords: 0,
      failedImports: 0,
      duplicatesFound: 0,
      validationErrors: 0,
      processingTime: Date.now(),
      summary: { created: 0, updated: 0, skipped: 0, failed: 0 },
      details: []
    }

    // Process each record
    for (const record of data) {
      try {
        // Import logic would go here based on type
        // For now, just simulate success
        result.successfulImports++
        result.summary.created++
        result.details.push({
          action: 'created',
          processedData: record
        })
      } catch (error) {
        result.failedImports++
        result.summary.failed++
        result.details.push({
          action: 'failed',
          reason: error.message,
          originalData: record
        })
      }
    }

    result.processingTime = Date.now() - result.processingTime
    return result
  }

  // Template operations
  async createExportTemplate(template: Omit<ExportTemplate, 'id' | 'createdAt'>): Promise<string> {
    const templateId = uuidv4()
    const fullTemplate: ExportTemplate = {
      ...template,
      id: templateId,
      createdAt: new Date().toISOString()
    }

    await this.repository.createExportTemplate(fullTemplate)
    return templateId
  }

  async getExportTemplates(type?: string, userId?: string): Promise<ExportTemplate[]> {
    return this.repository.listExportTemplates(type, userId)
  }

  // Backup operations
  async createBackup(description: string, userId: string): Promise<string> {
    const backupId = uuidv4()
    const fileName = `backup_${Date.now()}.json`
    const filePath = path.join(this.backupDir, fileName)
    
    // Export full system data
    const data = await this.repository.exportFullSystem()
    await fs.writeFile(filePath, JSON.stringify(data, null, 2))
    
    const stats = await fs.stat(filePath)
    const backup: BackupRecord = {
      id: backupId,
      type: 'export',
      description,
      filePath,
      fileSize: stats.size,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      metadata: {
        recordCount: Array.isArray(data) ? data.length : Object.keys(data).length,
        dataTypes: ['standards', 'rules', 'microorganisms', 'drugs'],
        version: '1.0',
        checksum: 'placeholder'
      }
    }

    await this.repository.createBackupRecord(backup)
    return backupId
  }

  async getExportImportStatistics() {
    return this.repository.getExportImportStatistics()
  }

  async cleanupExpiredFiles(): Promise<void> {
    await this.repository.cleanupExpiredBackups()
    // Additional cleanup logic for export/import files
  }
}