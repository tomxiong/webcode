// Reports Mobile JavaScript
class ReportsMobile extends MobileBase {
  constructor() {
    super();
    this.currentCategory = 'all';
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.reports = [];
    this.generatingReports = new Set();
    this.initReports();
  }

  initReports() {
    this.setupCategories();
    this.setupQuickGenerate();
    this.setupFAB();
    this.setupFilters();
    this.loadReports();
  }

  setupCategories() {
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
      card.addEventListener('click', () => {
        // Remove active class from all cards
        categoryCards.forEach(c => c.classList.remove('active'));
        // Add active class to clicked card
        card.classList.add('active');
        
        this.currentCategory = card.dataset.category;
        this.loadReports();
      });
    });
  }

  setupQuickGenerate() {
    const quickGenerateBtns = document.querySelectorAll('.quick-generate-btn');
    quickGenerateBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const reportType = btn.dataset.type;
        this.generateQuickReport(reportType);
      });
    });
  }

  setupFAB() {
    const generateReportFab = document.getElementById('generateReportFab');
    if (generateReportFab) {
      generateReportFab.addEventListener('click', () => {
        this.showReportGenerationForm();
      });
    }
  }

  setupFilters() {
    // Setup filter buttons if they exist
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.currentFilter = btn.dataset.filter;
        this.loadReports();
      });
    });

    // Setup sort select if it exists
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortReports(e.target.value);
      });
    }
  }

  async loadReports() {
    this.showLoading(true);
    
    try {
      const reports = await this.fetchReports();
      this.reports = reports;
      this.displayReports(reports);
    } catch (error) {
      console.error('Failed to load reports:', error);
      this.showToast('Failed to load reports', 'error');
      this.showEmptyState();
    } finally {
      this.showLoading(false);
    }
  }

  async fetchReports() {
    // Mock data for demonstration - replace with actual API calls
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockReports = [
          {
            id: 'RPT-2024-001',
            title: 'Daily QC Summary',
            type: 'quality',
            status: 'ready',
            generatedDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
            generatedBy: 'System',
            period: 'Today',
            size: '2.3 MB',
            format: 'PDF',
            description: 'Daily quality control summary report'
          },
          {
            id: 'RPT-2024-002',
            title: 'Weekly Sample Statistics',
            type: 'samples',
            status: 'ready',
            generatedDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
            generatedBy: 'Dr. Smith',
            period: 'Last 7 days',
            size: '5.1 MB',
            format: 'Excel',
            description: 'Weekly sample processing statistics'
          },
          {
            id: 'RPT-2024-003',
            title: 'Monthly Lab Results Analysis',
            type: 'results',
            status: 'generating',
            generatedDate: new Date(),
            generatedBy: 'Dr. Johnson',
            period: 'Last 30 days',
            size: 'Generating...',
            format: 'PDF',
            description: 'Comprehensive monthly lab results analysis'
          },
          {
            id: 'RPT-2024-004',
            title: 'Compliance Audit Report',
            type: 'compliance',
            status: 'ready',
            generatedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            generatedBy: 'Admin',
            period: 'Q4 2024',
            size: '8.7 MB',
            format: 'PDF',
            description: 'Quarterly compliance audit report'
          },
          {
            id: 'RPT-2024-005',
            title: 'Antibiogram Report',
            type: 'results',
            status: 'failed',
            generatedDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
            generatedBy: 'Dr. Brown',
            period: 'Last 6 months',
            size: 'Failed',
            format: 'PDF',
            description: 'Antibiogram analysis report - generation failed'
          }
        ];

        // Filter reports based on current category and filter
        let filteredReports = mockReports;
        
        if (this.currentCategory !== 'all') {
          filteredReports = filteredReports.filter(report => 
            report.type === this.currentCategory
          );
        }

        if (this.currentFilter !== 'all') {
          filteredReports = filteredReports.filter(report => 
            report.status === this.currentFilter
          );
        }

        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          filteredReports = filteredReports.filter(report =>
            report.title.toLowerCase().includes(query) ||
            report.description.toLowerCase().includes(query) ||
            report.generatedBy.toLowerCase().includes(query)
          );
        }

        resolve(filteredReports);
      }, 1000);
    });
  }

  displayReports(reports) {
    const reportsList = document.getElementById('reportsList');
    
    if (!reportsList) return;

    if (reports.length === 0) {
      this.showEmptyState();
      return;
    }

    const reportsHTML = reports.map(report => this.createReportCard(report)).join('');
    reportsList.innerHTML = reportsHTML;

    // Add click handlers for report cards
    this.setupReportCardHandlers();
  }

  createReportCard(report) {
    const statusClass = this.getStatusClass(report.status);
    const typeIcon = this.getTypeIcon(report.type);
    
    return `
      <div class="report-card ${report.status}" data-report-id="${report.id}">
        <div class="report-header">
          <div>
            <div class="report-title">${report.title}</div>
            <div class="report-type">${report.type}</div>
          </div>
          <div class="report-status ${statusClass}">
            ${report.status}
            ${report.status === 'generating' ? '<div class="generating-indicator"></div>' : ''}
          </div>
        </div>

        <div class="report-content">
          <div class="report-field">
            <div class="report-field-label">Generated By</div>
            <div class="report-field-value">${report.generatedBy}</div>
          </div>
          <div class="report-field">
            <div class="report-field-label">Period</div>
            <div class="report-field-value">${report.period}</div>
          </div>
          <div class="report-field">
            <div class="report-field-label">Format</div>
            <div class="report-field-value">${report.format}</div>
          </div>
          <div class="report-field">
            <div class="report-field-label">Size</div>
            <div class="report-field-value">${report.size}</div>
          </div>
        </div>

        <div class="report-footer">
          <div class="report-time">
            Generated: ${this.formatRelativeTime(report.generatedDate)}
          </div>
          <div class="report-actions">
            ${report.status === 'ready' ? 
              `<button class="report-action-btn" onclick="reportsMobile.downloadReport('${report.id}')">
                Download
              </button>
              <button class="report-action-btn primary" onclick="reportsMobile.viewReport('${report.id}')">
                View
              </button>` : 
              report.status === 'generating' ?
              `<button class="report-action-btn" onclick="reportsMobile.cancelGeneration('${report.id}')" disabled>
                Cancel
              </button>` :
              `<button class="report-action-btn primary" onclick="reportsMobile.regenerateReport('${report.id}')">
                Retry
              </button>`
            }
          </div>
        </div>
      </div>
    `;
  }

  getStatusClass(status) {
    const statusClasses = {
      'ready': 'ready',
      'generating': 'generating',
      'failed': 'failed'
    };
    return statusClasses[status] || 'ready';
  }

  getTypeIcon(type) {
    const typeIcons = {
      'quality': '⭐',
      'samples': '📋',
      'results': '📊',
      'compliance': '✅'
    };
    return typeIcons[type] || '📄';
  }

  setupReportCardHandlers() {
    const reportCards = document.querySelectorAll('.report-card');
    reportCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on buttons
        if (e.target.classList.contains('report-action-btn')) {
          return;
        }
        
        const reportId = card.dataset.reportId;
        this.viewReportDetails(reportId);
      });
    });
  }

  viewReport(reportId) {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) return;

    this.showToast('Opening report...', 'info');
    
    // Mock report viewing - replace with actual implementation
    setTimeout(() => {
      this.showToast('Report opened successfully', 'success');
      // In a real implementation, this would open the report in a viewer or new tab
    }, 1000);
  }

  downloadReport(reportId) {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) return;

    this.showToast('Downloading report...', 'info');
    
    // Mock download - replace with actual implementation
    setTimeout(() => {
      this.showToast('Report downloaded successfully', 'success');
      // In a real implementation, this would trigger the actual download
    }, 1500);
  }

  regenerateReport(reportId) {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) return;

    this.showToast('Regenerating report...', 'info');
    
    // Mock regeneration
    setTimeout(() => {
      this.showToast('Report regeneration started', 'success');
      this.loadReports(); // Refresh the list
    }, 1000);
  }

  cancelGeneration(reportId) {
    this.showToast('Cancelling report generation...', 'info');
    
    // Mock cancellation
    setTimeout(() => {
      this.showToast('Report generation cancelled', 'success');
      this.loadReports(); // Refresh the list
    }, 1000);
  }

  viewReportDetails(reportId) {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) return;

    const detailsHTML = this.createReportDetailsHTML(report);
    this.showBottomSheet(detailsHTML);
  }

  createReportDetailsHTML(report) {
    const statusClass = this.getStatusClass(report.status);
    
    return `
      <div class="report-details">
        <div class="report-details-header">
          <div class="report-details-title">${report.title}</div>
          <div class="report-details-status ${statusClass}">${report.status}</div>
        </div>

        <div class="report-details-grid">
          <div class="report-details-section">
            <div class="report-details-section-title">Report Information</div>
            <div class="report-details-fields">
              <div class="report-details-field">
                <div class="report-details-field-label">Report ID</div>
                <div class="report-details-field-value">${report.id}</div>
              </div>
              <div class="report-details-field">
                <div class="report-details-field-label">Type</div>
                <div class="report-details-field-value">${report.type}</div>
              </div>
              <div class="report-details-field">
                <div class="report-details-field-label">Generated By</div>
                <div class="report-details-field-value">${report.generatedBy}</div>
              </div>
              <div class="report-details-field">
                <div class="report-details-field-label">Generated Date</div>
                <div class="report-details-field-value">${this.formatDate(report.generatedDate)}</div>
              </div>
            </div>
          </div>

          <div class="report-details-section">
            <div class="report-details-section-title">Report Parameters</div>
            <div class="report-details-fields">
              <div class="report-details-field">
                <div class="report-details-field-label">Period</div>
                <div class="report-details-field-value">${report.period}</div>
              </div>
              <div class="report-details-field">
                <div class="report-details-field-label">Format</div>
                <div class="report-details-field-value">${report.format}</div>
              </div>
              <div class="report-details-field">
                <div class="report-details-field-label">Size</div>
                <div class="report-details-field-value">${report.size}</div>
              </div>
            </div>
          </div>

          ${report.description ? `
            <div class="report-details-section">
              <div class="report-details-section-title">Description</div>
              <div class="report-details-field-value">${report.description}</div>
            </div>
          ` : ''}
        </div>

        <div class="form-actions">
          ${report.status === 'ready' ? 
            `<button class="form-btn primary" onclick="reportsMobile.downloadReport('${report.id}')">
              Download Report
            </button>
            <button class="form-btn" onclick="reportsMobile.viewReport('${report.id}')">
              View Report
            </button>` : 
            report.status === 'failed' ?
            `<button class="form-btn primary" onclick="reportsMobile.regenerateReport('${report.id}')">
              Regenerate Report
            </button>` : ''
          }
          <button class="form-btn" onclick="reportsMobile.shareReport('${report.id}')">
            Share Report
          </button>
        </div>
      </div>
    `;
  }

  shareReport(reportId) {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) return;

    if (navigator.share) {
      navigator.share({
        title: report.title,
        text: report.description,
        url: window.location.href + '?report=' + reportId
      }).then(() => {
        this.showToast('Report shared successfully', 'success');
      }).catch(() => {
        this.fallbackShare(report);
      });
    } else {
      this.fallbackShare(report);
    }
  }

  fallbackShare(report) {
    const shareUrl = window.location.href + '?report=' + report.id;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.showToast('Report link copied to clipboard', 'success');
      });
    } else {
      this.showToast('Share feature not available', 'error');
    }
  }

  generateQuickReport(reportType) {
    this.showToast(`Generating ${reportType} report...`, 'info');
    
    // Mock quick report generation
    const reportId = 'RPT-' + Date.now();
    this.generatingReports.add(reportId);
    
    setTimeout(() => {
      this.generatingReports.delete(reportId);
      this.showToast('Report generated successfully', 'success');
      this.loadReports(); // Refresh the list
    }, 3000);
  }

  showReportGenerationForm() {
    const formHTML = this.createReportGenerationFormHTML();
    this.showBottomSheet(formHTML);
  }

  createReportGenerationFormHTML() {
    return `
      <div class="report-form">
        <h3 style="margin-bottom: var(--spacing-lg); font-size: 1.25rem; font-weight: 600;">Generate Custom Report</h3>
        
        <form id="reportGenerationForm">
          <div class="form-section">
            <div class="form-section-title">Report Type</div>
            <div class="form-group">
              <select class="form-select" name="reportType" required>
                <option value="">Select report type</option>
                <option value="quality">Quality Control Report</option>
                <option value="samples">Sample Statistics Report</option>
                <option value="results">Lab Results Analysis</option>
                <option value="compliance">Compliance Report</option>
                <option value="custom">Custom Report</option>
              </select>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">Date Range</div>
            <div class="date-range-picker">
              <div class="form-group">
                <label class="form-label">Start Date</label>
                <input type="date" class="form-input" name="startDate" required>
              </div>
              <div class="form-group">
                <label class="form-label">End Date</label>
                <input type="date" class="form-input" name="endDate" required>
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">Report Parameters</div>
            <div class="checkbox-group">
              <div class="checkbox-item">
                <input type="checkbox" id="includeSummary" name="parameters" value="summary" checked>
                <label for="includeSummary">Include Summary</label>
              </div>
              <div class="checkbox-item">
                <input type="checkbox" id="includeCharts" name="parameters" value="charts" checked>
                <label for="includeCharts">Include Charts</label>
              </div>
              <div class="checkbox-item">
                <input type="checkbox" id="includeDetails" name="parameters" value="details">
                <label for="includeDetails">Include Detailed Data</label>
              </div>
              <div class="checkbox-item">
                <input type="checkbox" id="includeComments" name="parameters" value="comments">
                <label for="includeComments">Include Comments</label>
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">Output Format</div>
            <div class="form-group">
              <select class="form-select" name="outputFormat" required>
                <option value="pdf">PDF Document</option>
                <option value="excel">Excel Spreadsheet</option>
                <option value="csv">CSV Data</option>
                <option value="html">HTML Report</option>
              </select>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">Additional Options</div>
            <div class="form-group">
              <label class="form-label">Report Title (Optional)</label>
              <input type="text" class="form-input" name="reportTitle" placeholder="Custom report title">
            </div>
            <div class="form-group">
              <label class="form-label">Notes (Optional)</label>
              <textarea class="form-textarea" name="notes" rows="3" placeholder="Additional notes or comments"></textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="form-btn" onclick="reportsMobile.hideBottomSheet()">
              Cancel
            </button>
            <button type="submit" class="form-btn primary">
              Generate Report
            </button>
          </div>
        </form>
      </div>
    `;
  }

  sortReports(sortBy) {
    switch (sortBy) {
      case 'date-desc':
        this.reports.sort((a, b) => new Date(b.generatedDate) - new Date(a.generatedDate));
        break;
      case 'date-asc':
        this.reports.sort((a, b) => new Date(a.generatedDate) - new Date(b.generatedDate));
        break;
      case 'title-asc':
        this.reports.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        this.reports.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'type':
        this.reports.sort((a, b) => a.type.localeCompare(b.type));
        break;
      default:
        break;
    }
    
    this.displayReports(this.reports);
  }

  showEmptyState() {
    const reportsList = document.getElementById('reportsList');
    
    if (reportsList) {
      reportsList.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: var(--spacing-xl);">
          <svg class="empty-icon" viewBox="0 0 24 24" style="width: 64px; height: 64px; fill: var(--text-secondary); margin-bottom: var(--spacing-lg);">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
          <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: var(--spacing-sm); color: var(--text-primary);">No Reports Found</h3>
          <p style="color: var(--text-secondary); margin-bottom: var(--spacing-lg);">No reports match your current filters.</p>
          <button class="btn-primary" onclick="reportsMobile.showReportGenerationForm()">Generate New Report</button>
        </div>
      `;
    }
  }

  // Override search methods from MobileBase
  onSearchInput(query) {
    this.searchQuery = query;
    this.loadReports();
  }

  onSearchClear() {
    this.searchQuery = '';
    this.loadReports();
  }
}

// Global functions for onclick handlers
window.clearReportFilters = function() {
  const allCategory = document.querySelector('.category-card[data-category="all"]');
  if (allCategory) {
    allCategory.click();
  }
  
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
  }
};

// Initialize reports mobile when DOM is loaded
let reportsMobile;
document.addEventListener('DOMContentLoaded', () => {
  reportsMobile = new ReportsMobile();
  
  // Setup form submission handler
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'reportGenerationForm') {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const reportData = Object.fromEntries(formData.entries());
      
      // Get all checked parameters
      const parameters = Array.from(e.target.querySelectorAll('input[name="parameters"]:checked'))
        .map(input => input.value);
      reportData.parameters = parameters;
      
      reportsMobile.showToast('Generating report...', 'info');
      
      // Mock report generation
      setTimeout(() => {
        reportsMobile.showToast('Report generation started successfully', 'success');
        reportsMobile.hideBottomSheet();
        reportsMobile.loadReports();
      }, 1000);
    }
  });
});
