import { Database } from '../database/Database.js'
import { ReportRepository } from '../../domain/repositories/ReportRepository.js'
import { ReportEntity, ReportResult, CreateReportRequest, UpdateReportRequest, ReportParameters, Dashboard, DashboardWidget } from '../../domain/entities/Report.js'

export class SqliteReportRepository implements ReportRepository {
  constructor(private database: Database) {}

  async create(report: CreateReportRequest, createdBy: string): Promise<ReportEntity> {
    const id = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    
    const query = `
      INSERT INTO reports (id, title, description, type, parameters, format, schedule, created_by, created_at, updated_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    await this.database.run(query, [
      id,
      report.title,
      report.description || null,
      report.type,
      JSON.stringify(report.parameters),
      report.format,
      report.schedule ? JSON.stringify(report.schedule) : null,
      createdBy,
      now.toISOString(),
      now.toISOString(),
      1
    ])

    return this.findById(id) as Promise<ReportEntity>
  }

  async findById(id: string): Promise<ReportEntity | null> {
    const query = `SELECT * FROM reports WHERE id = ?`
    const row = await this.database.get(query, [id])
    return row ? this.mapRowToEntity(row) : null
  }

  async findAll(): Promise<ReportEntity[]> {
    const query = `SELECT * FROM reports ORDER BY created_at DESC`
    const rows = await this.database.all(query)
    return rows.map(row => this.mapRowToEntity(row))
  }

  async findByType(type: string): Promise<ReportEntity[]> {
    const query = `SELECT * FROM reports WHERE type = ? ORDER BY created_at DESC`
    const rows = await this.database.all(query, [type])
    return rows.map(row => this.mapRowToEntity(row))
  }

  async findByUser(userId: string): Promise<ReportEntity[]> {
    const query = `SELECT * FROM reports WHERE created_by = ? ORDER BY created_at DESC`
    const rows = await this.database.all(query, [userId])
    return rows.map(row => this.mapRowToEntity(row))
  }

  async update(id: string, report: UpdateReportRequest): Promise<ReportEntity | null> {
    const existing = await this.findById(id)
    if (!existing) return null

    const updates: string[] = []
    const values: any[] = []

    if (report.title !== undefined) {
      updates.push('title = ?')
      values.push(report.title)
    }
    if (report.description !== undefined) {
      updates.push('description = ?')
      values.push(report.description)
    }
    if (report.parameters !== undefined) {
      updates.push('parameters = ?')
      values.push(JSON.stringify(report.parameters))
    }
    if (report.format !== undefined) {
      updates.push('format = ?')
      values.push(report.format)
    }
    if (report.schedule !== undefined) {
      updates.push('schedule = ?')
      values.push(report.schedule ? JSON.stringify(report.schedule) : null)
    }
    if (report.isActive !== undefined) {
      updates.push('is_active = ?')
      values.push(report.isActive ? 1 : 0)
    }

    updates.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    const query = `UPDATE reports SET ${updates.join(', ')} WHERE id = ?`
    await this.database.run(query, values)

    return this.findById(id)
  }

  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM reports WHERE id = ?`
    const result = await this.database.run(query, [id])
    return result.changes > 0
  }

  async generateReport(reportId: string, parameters?: Partial<ReportParameters>): Promise<ReportResult> {
    const report = await this.findById(reportId)
    if (!report) {
      throw new Error('Report not found')
    }

    const finalParameters = { ...report.parameters, ...parameters }
    const resultId = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Generate report data based on type
    let data: any = {}
    let summary: any = {}

    switch (report.type) {
      case 'sample_summary':
        data = await this.getSampleAnalytics(finalParameters)
        summary = {
          totalRecords: data.totalCount || 0,
          dateRange: finalParameters.dateRange || { startDate: '', endDate: '' },
          keyMetrics: {
            totalSamples: data.totalCount || 0,
            byType: data.byType || {},
            byStatus: data.byStatus || {},
            byPriority: data.byPriority || {}
          }
        }
        break
      case 'lab_results_analysis':
        data = await this.getLabResultAnalytics(finalParameters)
        summary = {
          totalRecords: data.totalCount || 0,
          dateRange: finalParameters.dateRange || { startDate: '', endDate: '' },
          keyMetrics: {
            totalResults: data.totalCount || 0,
            byMethod: data.byMethod || {},
            byValidation: data.byValidation || {},
            qualityControlRate: data.qualityControlRate || 0
          }
        }
        break
      default:
        data = { message: 'Report type not implemented yet' }
        summary = { totalRecords: 0, dateRange: { startDate: '', endDate: '' }, keyMetrics: {} }
    }

    const result: ReportResult = {
      id: resultId,
      reportId,
      generatedAt: new Date(),
      parameters: finalParameters,
      data,
      summary
    }

    await this.saveReportResult(result)
    return result
  }

  async saveReportResult(result: ReportResult): Promise<ReportResult> {
    const query = `
      INSERT INTO report_results (id, report_id, generated_at, parameters, data, summary, file_path, file_size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    await this.database.run(query, [
      result.id,
      result.reportId,
      result.generatedAt.toISOString(),
      JSON.stringify(result.parameters),
      JSON.stringify(result.data),
      JSON.stringify(result.summary),
      result.filePath || null,
      result.fileSize || null
    ])

    return result
  }

  async getReportResults(reportId: string, limit?: number): Promise<ReportResult[]> {
    const query = `
      SELECT * FROM report_results 
      WHERE report_id = ? 
      ORDER BY generated_at DESC 
      ${limit ? `LIMIT ${limit}` : ''}
    `
    const rows = await this.database.all(query, [reportId])
    return rows.map(row => this.mapResultRowToEntity(row))
  }

  async getReportResult(resultId: string): Promise<ReportResult | null> {
    const query = `SELECT * FROM report_results WHERE id = ?`
    const row = await this.database.get(query, [resultId])
    return row ? this.mapResultRowToEntity(row) : null
  }

  async getSampleAnalytics(parameters: ReportParameters): Promise<any> {
    let whereClause = '1=1'
    const queryParams: any[] = []

    if (parameters.dateRange) {
      whereClause += ' AND created_at BETWEEN ? AND ?'
      queryParams.push(parameters.dateRange.startDate, parameters.dateRange.endDate)
    }

    if (parameters.filters?.sampleTypes?.length) {
      whereClause += ` AND specimen_type IN (${parameters.filters.sampleTypes.map(() => '?').join(',')})`
      queryParams.push(...parameters.filters.sampleTypes)
    }

    if (parameters.filters?.priorities?.length) {
      whereClause += ` AND priority IN (${parameters.filters.priorities.map(() => '?').join(',')})`
      queryParams.push(...parameters.filters.priorities)
    }

    const totalQuery = `SELECT COUNT(*) as total FROM samples WHERE ${whereClause}`
    const totalResult = await this.database.get(totalQuery, queryParams)

    const byTypeQuery = `SELECT specimen_type, COUNT(*) as count FROM samples WHERE ${whereClause} GROUP BY specimen_type`
    const byTypeResults = await this.database.all(byTypeQuery, queryParams)

    const byStatusQuery = `SELECT status, COUNT(*) as count FROM samples WHERE ${whereClause} GROUP BY status`
    const byStatusResults = await this.database.all(byStatusQuery, queryParams)

    const byPriorityQuery = `SELECT priority, COUNT(*) as count FROM samples WHERE ${whereClause} GROUP BY priority`
    const byPriorityResults = await this.database.all(byPriorityQuery, queryParams)

    return {
      totalCount: totalResult.total,
      byType: byTypeResults.reduce((acc: any, row: any) => {
        acc[row.specimen_type] = row.count
        return acc
      }, {}),
      byStatus: byStatusResults.reduce((acc: any, row: any) => {
        acc[row.status] = row.count
        return acc
      }, {}),
      byPriority: byPriorityResults.reduce((acc: any, row: any) => {
        acc[row.priority] = row.count
        return acc
      }, {})
    }
  }

  async getLabResultAnalytics(parameters: ReportParameters): Promise<any> {
    let whereClause = '1=1'
    const queryParams: any[] = []

    if (parameters.dateRange) {
      whereClause += ' AND lr.created_at BETWEEN ? AND ?'
      queryParams.push(parameters.dateRange.startDate, parameters.dateRange.endDate)
    }

    const totalQuery = `SELECT COUNT(*) as total FROM lab_results lr WHERE ${whereClause}`
    const totalResult = await this.database.get(totalQuery, queryParams)

    const byMethodQuery = `SELECT test_method, COUNT(*) as count FROM lab_results lr WHERE ${whereClause} GROUP BY test_method`
    const byMethodResults = await this.database.all(byMethodQuery, queryParams)

    const byValidationQuery = `SELECT validation_status, COUNT(*) as count FROM lab_results lr WHERE ${whereClause} GROUP BY validation_status`
    const byValidationResults = await this.database.all(byValidationQuery, queryParams)

    const qcQuery = `SELECT 
      SUM(CASE WHEN quality_control_status = 'passed' THEN 1 ELSE 0 END) as passed,
      COUNT(*) as total
      FROM lab_results lr WHERE ${whereClause}`
    const qcResult = await this.database.get(qcQuery, queryParams)

    return {
      totalCount: totalResult.total,
      byMethod: byMethodResults.reduce((acc: any, row: any) => {
        acc[row.test_method] = row.count
        return acc
      }, {}),
      byValidation: byValidationResults.reduce((acc: any, row: any) => {
        acc[row.validation_status] = row.count
        return acc
      }, {}),
      qualityControlRate: qcResult.total > 0 ? (qcResult.passed / qcResult.total * 100) : 0
    }
  }

  async getExpertRuleAnalytics(parameters: ReportParameters): Promise<any> {
    // Implementation for expert rule analytics
    return { totalApplications: 0, byCategory: {}, byRule: {} }
  }

  async getQualityControlAnalytics(parameters: ReportParameters): Promise<any> {
    // Implementation for quality control analytics
    return { passRate: 0, monthlyTrend: [] }
  }

  async getBreakpointComplianceAnalytics(parameters: ReportParameters): Promise<any> {
    // Implementation for breakpoint compliance analytics
    return { complianceRate: 0, byStandard: {} }
  }

  async getDocumentUsageAnalytics(parameters: ReportParameters): Promise<any> {
    let whereClause = '1=1'
    const queryParams: any[] = []

    if (parameters.dateRange) {
      whereClause += ' AND created_at BETWEEN ? AND ?'
      queryParams.push(parameters.dateRange.startDate, parameters.dateRange.endDate)
    }

    const totalQuery = `SELECT COUNT(*) as total FROM documents WHERE ${whereClause}`
    const totalResult = await this.database.get(totalQuery, queryParams)

    const byCategoryQuery = `SELECT category, COUNT(*) as count FROM documents WHERE ${whereClause} GROUP BY category`
    const byCategoryResults = await this.database.all(byCategoryQuery, queryParams)

    return {
      totalCount: totalResult.total,
      byCategory: byCategoryResults.reduce((acc: any, row: any) => {
        acc[row.category] = row.count
        return acc
      }, {})
    }
  }

  async getUserActivityAnalytics(parameters: ReportParameters): Promise<any> {
    // Implementation for user activity analytics
    return { activeUsers: 0, byRole: {}, loginStats: {} }
  }

  async getSystemPerformanceAnalytics(parameters: ReportParameters): Promise<any> {
    // Implementation for system performance analytics
    return { responseTime: 0, uptime: 100, errorRate: 0 }
  }

  // Dashboard methods
  async createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard> {
    const id = `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    
    const query = `
      INSERT INTO dashboards (id, title, description, widgets, layout, is_public, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    await this.database.run(query, [
      id,
      dashboard.title,
      dashboard.description || null,
      JSON.stringify(dashboard.widgets),
      dashboard.layout,
      dashboard.isPublic ? 1 : 0,
      dashboard.createdBy,
      now.toISOString(),
      now.toISOString()
    ])

    return this.getDashboard(id) as Promise<Dashboard>
  }

  async getDashboard(id: string): Promise<Dashboard | null> {
    const query = `SELECT * FROM dashboards WHERE id = ?`
    const row = await this.database.get(query, [id])
    return row ? this.mapDashboardRowToEntity(row) : null
  }

  async getDashboards(userId?: string): Promise<Dashboard[]> {
    let query = `SELECT * FROM dashboards WHERE is_public = 1`
    const params: any[] = []
    
    if (userId) {
      query += ` OR created_by = ?`
      params.push(userId)
    }
    
    query += ` ORDER BY created_at DESC`
    
    const rows = await this.database.all(query, params)
    return rows.map(row => this.mapDashboardRowToEntity(row))
  }

  async updateDashboard(id: string, dashboard: Partial<Dashboard>): Promise<Dashboard | null> {
    const existing = await this.getDashboard(id)
    if (!existing) return null

    const updates: string[] = []
    const values: any[] = []

    if (dashboard.title !== undefined) {
      updates.push('title = ?')
      values.push(dashboard.title)
    }
    if (dashboard.description !== undefined) {
      updates.push('description = ?')
      values.push(dashboard.description)
    }
    if (dashboard.widgets !== undefined) {
      updates.push('widgets = ?')
      values.push(JSON.stringify(dashboard.widgets))
    }
    if (dashboard.layout !== undefined) {
      updates.push('layout = ?')
      values.push(dashboard.layout)
    }
    if (dashboard.isPublic !== undefined) {
      updates.push('is_public = ?')
      values.push(dashboard.isPublic ? 1 : 0)
    }

    updates.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    const query = `UPDATE dashboards SET ${updates.join(', ')} WHERE id = ?`
    await this.database.run(query, values)

    return this.getDashboard(id)
  }

  async deleteDashboard(id: string): Promise<boolean> {
    const query = `DELETE FROM dashboards WHERE id = ?`
    const result = await this.database.run(query, [id])
    return result.changes > 0
  }

  async createWidget(dashboardId: string, widget: Omit<DashboardWidget, 'id'>): Promise<DashboardWidget> {
    // Implementation for widget creation
    const id = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return { id, ...widget } as DashboardWidget
  }

  async updateWidget(widgetId: string, widget: Partial<DashboardWidget>): Promise<DashboardWidget | null> {
    // Implementation for widget update
    return null
  }

  async deleteWidget(widgetId: string): Promise<boolean> {
    // Implementation for widget deletion
    return false
  }

  async getWidgetData(widgetId: string): Promise<any> {
    // Implementation for widget data retrieval
    return {}
  }

  private mapRowToEntity(row: any): ReportEntity {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      parameters: JSON.parse(row.parameters),
      format: row.format,
      schedule: row.schedule ? JSON.parse(row.schedule) : undefined,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastRunAt: row.last_run_at ? new Date(row.last_run_at) : undefined,
      isActive: row.is_active === 1
    }
  }

  private mapResultRowToEntity(row: any): ReportResult {
    return {
      id: row.id,
      reportId: row.report_id,
      generatedAt: new Date(row.generated_at),
      parameters: JSON.parse(row.parameters),
      data: JSON.parse(row.data),
      summary: JSON.parse(row.summary),
      filePath: row.file_path,
      fileSize: row.file_size
    }
  }

  private mapDashboardRowToEntity(row: any): Dashboard {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      widgets: JSON.parse(row.widgets),
      layout: row.layout,
      isPublic: row.is_public === 1,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }
}