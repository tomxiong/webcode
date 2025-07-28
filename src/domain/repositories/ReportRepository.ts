import { ReportEntity, ReportResult, CreateReportRequest, UpdateReportRequest, ReportParameters, Dashboard, DashboardWidget } from '../entities/Report.js'

export interface ReportRepository {
  // Report Management
  create(report: CreateReportRequest, createdBy: string): Promise<ReportEntity>
  findById(id: string): Promise<ReportEntity | null>
  findAll(): Promise<ReportEntity[]>
  findByType(type: string): Promise<ReportEntity[]>
  findByUser(userId: string): Promise<ReportEntity[]>
  update(id: string, report: UpdateReportRequest): Promise<ReportEntity | null>
  delete(id: string): Promise<boolean>

  // Report Generation
  generateReport(reportId: string, parameters?: Partial<ReportParameters>): Promise<ReportResult>
  saveReportResult(result: ReportResult): Promise<ReportResult>
  getReportResults(reportId: string, limit?: number): Promise<ReportResult[]>
  getReportResult(resultId: string): Promise<ReportResult | null>

  // Analytics Data
  getSampleAnalytics(parameters: ReportParameters): Promise<any>
  getLabResultAnalytics(parameters: ReportParameters): Promise<any>
  getExpertRuleAnalytics(parameters: ReportParameters): Promise<any>
  getQualityControlAnalytics(parameters: ReportParameters): Promise<any>
  getBreakpointComplianceAnalytics(parameters: ReportParameters): Promise<any>
  getDocumentUsageAnalytics(parameters: ReportParameters): Promise<any>
  getUserActivityAnalytics(parameters: ReportParameters): Promise<any>
  getSystemPerformanceAnalytics(parameters: ReportParameters): Promise<any>

  // Dashboard Management
  createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard>
  getDashboard(id: string): Promise<Dashboard | null>
  getDashboards(userId?: string): Promise<Dashboard[]>
  updateDashboard(id: string, dashboard: Partial<Dashboard>): Promise<Dashboard | null>
  deleteDashboard(id: string): Promise<boolean>

  // Widget Management
  createWidget(dashboardId: string, widget: Omit<DashboardWidget, 'id'>): Promise<DashboardWidget>
  updateWidget(widgetId: string, widget: Partial<DashboardWidget>): Promise<DashboardWidget | null>
  deleteWidget(widgetId: string): Promise<boolean>
  getWidgetData(widgetId: string): Promise<any>
}