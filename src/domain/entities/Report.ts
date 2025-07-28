export interface ReportEntity {
  id: string
  title: string
  description?: string
  type: ReportType
  parameters: ReportParameters
  format: ReportFormat
  schedule?: ReportSchedule
  createdBy: string
  createdAt: Date
  updatedAt: Date
  lastRunAt?: Date
  isActive: boolean
}

export type ReportType = 
  | 'sample_summary'
  | 'lab_results_analysis'
  | 'expert_rules_usage'
  | 'quality_control'
  | 'breakpoint_compliance'
  | 'document_usage'
  | 'user_activity'
  | 'system_performance'

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'html'

export interface ReportParameters {
  dateRange?: {
    startDate: string
    endDate: string
  }
  filters?: {
    microorganismIds?: string[]
    drugIds?: string[]
    sampleTypes?: string[]
    priorities?: string[]
    validationStatus?: string[]
    userIds?: string[]
  }
  groupBy?: string[]
  sortBy?: {
    field: string
    direction: 'asc' | 'desc'
  }
  includeCharts?: boolean
  includeDetails?: boolean
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  dayOfWeek?: number // 0-6 for weekly
  dayOfMonth?: number // 1-31 for monthly
  time: string // HH:MM format
  recipients: string[]
  isEnabled: boolean
}

export interface ReportResult {
  id: string
  reportId: string
  generatedAt: Date
  parameters: ReportParameters
  data: any
  charts?: ChartData[]
  summary: ReportSummary
  filePath?: string
  fileSize?: number
}

export interface ChartData {
  id: string
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area'
  title: string
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor?: string[]
      borderColor?: string[]
    }[]
  }
  options?: any
}

export interface ReportSummary {
  totalRecords: number
  dateRange: {
    startDate: string
    endDate: string
  }
  keyMetrics: {
    [key: string]: number | string
  }
  trends?: {
    field: string
    direction: 'up' | 'down' | 'stable'
    percentage: number
  }[]
}

export interface CreateReportRequest {
  title: string
  description?: string
  type: ReportType
  parameters: ReportParameters
  format: ReportFormat
  schedule?: ReportSchedule
}

export interface UpdateReportRequest {
  title?: string
  description?: string
  parameters?: ReportParameters
  format?: ReportFormat
  schedule?: ReportSchedule
  isActive?: boolean
}

export interface GenerateReportRequest {
  reportId: string
  parameters?: Partial<ReportParameters>
  format?: ReportFormat
}

export interface DashboardWidget {
  id: string
  title: string
  type: 'metric' | 'chart' | 'table' | 'progress'
  size: 'small' | 'medium' | 'large'
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  config: {
    dataSource: string
    refreshInterval?: number // minutes
    filters?: any
    chartType?: string
    showLegend?: boolean
    showLabels?: boolean
  }
  data?: any
  lastUpdated?: Date
}

export interface Dashboard {
  id: string
  title: string
  description?: string
  widgets: DashboardWidget[]
  layout: 'grid' | 'flex'
  isPublic: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}