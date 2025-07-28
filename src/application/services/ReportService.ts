import { ReportRepository } from '../../domain/repositories/ReportRepository.js'
import { ReportEntity, ReportResult, CreateReportRequest, UpdateReportRequest, GenerateReportRequest, Dashboard, DashboardWidget } from '../../domain/entities/Report.js'

export class ReportService {
  constructor(private reportRepository: ReportRepository) {}

  async createReport(request: CreateReportRequest, createdBy: string): Promise<{ success: boolean; data?: ReportEntity; error?: string }> {
    try {
      const report = await this.reportRepository.create(request, createdBy)
      return { success: true, data: report }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create report' }
    }
  }

  async getReports(): Promise<{ success: boolean; data?: ReportEntity[]; error?: string }> {
    try {
      const reports = await this.reportRepository.findAll()
      return { success: true, data: reports }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get reports' }
    }
  }

  async getReportById(id: string): Promise<{ success: boolean; data?: ReportEntity; error?: string }> {
    try {
      const report = await this.reportRepository.findById(id)
      if (!report) {
        return { success: false, error: 'Report not found' }
      }
      return { success: true, data: report }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get report' }
    }
  }

  async updateReport(id: string, request: UpdateReportRequest): Promise<{ success: boolean; data?: ReportEntity; error?: string }> {
    try {
      const report = await this.reportRepository.update(id, request)
      if (!report) {
        return { success: false, error: 'Report not found' }
      }
      return { success: true, data: report }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update report' }
    }
  }

  async deleteReport(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const deleted = await this.reportRepository.delete(id)
      if (!deleted) {
        return { success: false, error: 'Report not found' }
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete report' }
    }
  }

  async generateReport(request: GenerateReportRequest): Promise<{ success: boolean; data?: ReportResult; error?: string }> {
    try {
      const result = await this.reportRepository.generateReport(request.reportId, request.parameters)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to generate report' }
    }
  }

  async getReportResults(reportId: string, limit?: number): Promise<{ success: boolean; data?: ReportResult[]; error?: string }> {
    try {
      const results = await this.reportRepository.getReportResults(reportId, limit)
      return { success: true, data: results }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get report results' }
    }
  }

  async getDashboards(userId?: string): Promise<{ success: boolean; data?: Dashboard[]; error?: string }> {
    try {
      const dashboards = await this.reportRepository.getDashboards(userId)
      return { success: true, data: dashboards }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get dashboards' }
    }
  }

  async createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; data?: Dashboard; error?: string }> {
    try {
      const newDashboard = await this.reportRepository.createDashboard(dashboard)
      return { success: true, data: newDashboard }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create dashboard' }
    }
  }

  async getAnalytics(type: string, parameters: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      let data: any

      switch (type) {
        case 'sample_summary':
          data = await this.reportRepository.getSampleAnalytics(parameters)
          break
        case 'lab_results_analysis':
          data = await this.reportRepository.getLabResultAnalytics(parameters)
          break
        case 'expert_rules_usage':
          data = await this.reportRepository.getExpertRuleAnalytics(parameters)
          break
        case 'quality_control':
          data = await this.reportRepository.getQualityControlAnalytics(parameters)
          break
        case 'breakpoint_compliance':
          data = await this.reportRepository.getBreakpointComplianceAnalytics(parameters)
          break
        case 'document_usage':
          data = await this.reportRepository.getDocumentUsageAnalytics(parameters)
          break
        case 'user_activity':
          data = await this.reportRepository.getUserActivityAnalytics(parameters)
          break
        case 'system_performance':
          data = await this.reportRepository.getSystemPerformanceAnalytics(parameters)
          break
        default:
          return { success: false, error: 'Invalid analytics type' }
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get analytics' }
    }
  }

  async getSystemOverview(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const parameters = {
        dateRange: {
          startDate: thirtyDaysAgo.toISOString(),
          endDate: now.toISOString()
        }
      }

      const [
        sampleData,
        labResultData,
        expertRuleData,
        qualityControlData,
        documentData
      ] = await Promise.all([
        this.reportRepository.getSampleAnalytics(parameters),
        this.reportRepository.getLabResultAnalytics(parameters),
        this.reportRepository.getExpertRuleAnalytics(parameters),
        this.reportRepository.getQualityControlAnalytics(parameters),
        this.reportRepository.getDocumentUsageAnalytics(parameters)
      ])

      const overview = {
        summary: {
          totalSamples: sampleData.totalCount || 0,
          totalResults: labResultData.totalCount || 0,
          rulesApplied: expertRuleData.totalApplications || 0,
          qualityControlRate: qualityControlData.passRate || 0,
          documentsUploaded: documentData.totalCount || 0
        },
        trends: {
          samplesThisMonth: sampleData.monthlyTrend || [],
          resultsThisMonth: labResultData.monthlyTrend || [],
          qualityTrend: qualityControlData.monthlyTrend || []
        },
        charts: {
          samplesByType: sampleData.byType || [],
          resultsByMethod: labResultData.byMethod || [],
          rulesByCategory: expertRuleData.byCategory || [],
          documentsByCategory: documentData.byCategory || []
        }
      }

      return { success: true, data: overview }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get system overview' }
    }
  }
}