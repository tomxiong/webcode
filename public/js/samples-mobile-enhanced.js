// Enhanced Samples Mobile JavaScript with Pagination and Query
class SamplesMobileEnhanced extends MobileBase {
  constructor() {
    super();
    this.currentFilter = 'all';
    this.currentStatus = 'all';
    this.searchQuery = '';
    this.samples = [];
    this.filteredSamples = [];
    this.selectedSamples = new Set();
    
    // Pagination properties
    this.currentPage = 1;
    this.pageSize = 20;
    this.totalSamples = 0;
    this.hasMore = true;
    this.loading = false;
    
    // Query service
    this.queryService = new QueryService({
      baseUrl: '/api',
      defaultPageSize: this.pageSize
    });
    
    // Filter manager
    this.filterManager = new FilterManager();
    this.setupFilters();
    
    // Pagination component
    this.pagination = null;
    
    this.initSamples();
  }

  setupFilters() {
    // Register available filters
    this.filterManager.registerFilter('status', {
      type: 'select',
      label: 'Status',
      options: [
        { value: 'received', label: 'Received' },
        { value: 'processing', label: 'Processing' },
        { value: 'completed', label: 'Completed' },
        { value: 'urgent', label: 'Urgent' }
      ]
    });

    this.filterManager.registerFilter('priority', {
      type: 'select',
      label: 'Priority',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }
      ]
    });

    this.filterManager.registerFilter('type', {
      type: 'select',
      label: 'Sample Type',
      options: [
        { value: 'Blood Culture', label: 'Blood Culture' },
        { value: 'Urine Culture', label: 'Urine Culture' },
        { value: 'Wound Swab', label: 'Wound Swab' },
        { value: 'Sputum Culture', label: 'Sputum Culture' }
      ]
    });

    this.filterManager.registerFilter('collectionDate', {
      type: 'date',
      label: 'Collection Date'
    });

    this.filterManager.registerFilter('location', {
      type: 'text',
      label: 'Location'
    });
  }

  initSamples() {
    this.setupSearch();
    this.setupFilterUI();
    this.setupPagination();
    this.setupFAB();
    this.setupBatchOperations();
    this.loadSamples();
  }

  setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.debouncedSearch();
        
        // Show/hide clear button
        if (searchClear) {
          searchClear.style.display = this.searchQuery ? 'flex' : 'none';
        }
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        this.searchQuery = '';
        this.resetAndLoad();
        searchClear.style.display = 'none';
      });
    }
  }

  setupFilterUI() {
    const filterContainer = document.getElementById('advancedFilters');
    if (filterContainer) {
      filterContainer.innerHTML = this.filterManager.generateFilterUI();
      
      // Bind filter events
      filterContainer.addEventListener('change', (e) => {
        if (e.target.dataset.filter) {
          const filterName = e.target.dataset.filter;
          const value = e.target.value;
          
          if (value) {
            this.filterManager.setFilter(filterName, value);
          } else {
            this.filterManager.removeFilter(filterName);
          }
          
          this.resetAndLoad();
        }
      });
    }

    // Setup filter chips
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        // Remove active class from all chips
        filterChips.forEach(c => c.classList.remove('active'));
        // Add active class to clicked chip
        chip.classList.add('active');
        
        this.currentFilter = chip.dataset.filter;
        this.resetAndLoad();
      });
    });
  }

  setupPagination() {
    const paginationContainer = document.getElementById('paginationContainer');
    if (paginationContainer) {
      this.pagination = MobilePagination.create(paginationContainer, {
        page: this.currentPage,
        pageSize: this.pageSize,
        total: this.totalSamples,
        mode: 'infinite', // Use infinite scroll for mobile
        onLoadMore: (page, pageSize) => this.loadMoreSamples(page, pageSize),
        onPageChange: (page, pageSize) => this.goToPage(page, pageSize)
      });
    }
  }

  setupFAB() {
    const addSampleFab = document.getElementById('addSampleFab');
    if (addSampleFab) {
      addSampleFab.addEventListener('click', () => {
        this.showAddSampleForm();
      });
    }
  }

  setupBatchOperations() {
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('sample-checkbox')) {
        this.handleSampleSelection(e.target);
      }
    });
  }

  debouncedSearch = this.debounce(() => {
    this.resetAndLoad();
  }, 300);

  async loadSamples(append = false) {
    if (this.loading) return;
    
    this.loading = true;
    this.showLoading(!append);
    
    try {
      const queryParams = this.buildQueryParams();
      const response = await this.queryService.query('/samples', queryParams);
      
      this.totalSamples = response.total;
      this.hasMore = response.hasMore;
      
      if (append) {
        this.samples = [...this.samples, ...response.data];
      } else {
        this.samples = response.data;
      }
      
      this.displaySamples(this.samples, append);
      this.updatePagination();
      
    } catch (error) {
      console.error('Failed to load samples:', error);
      this.showToast('Failed to load samples', 'error');
      this.showEmptyState();
    } finally {
      this.loading = false;
      this.showLoading(false);
    }
  }

  async loadMoreSamples(page, pageSize) {
    this.currentPage = page;
    this.pageSize = pageSize;
    await this.loadSamples(true);
  }

  async goToPage(page, pageSize) {
    this.currentPage = page;
    this.pageSize = pageSize;
    await this.loadSamples(false);
  }

  buildQueryParams() {
    const params = {
      page: this.currentPage,
      pageSize: this.pageSize,
      search: this.searchQuery,
      sortBy: 'receivedDate',
      sortOrder: 'desc'
    };

    // Add current filter
    if (this.currentFilter !== 'all') {
      params.status = this.currentFilter;
    }

    // Add advanced filters
    const activeFilters = this.filterManager.getActiveFilters();
    Object.assign(params, activeFilters);

    return params;
  }

  resetAndLoad() {
    this.currentPage = 1;
    this.samples = [];
    this.loadSamples(false);
  }

  displaySamples(samples, append = false) {
    const samplesList = document.getElementById('samplesList');
    const emptyState = document.getElementById('emptyState');
    
    if (!samplesList) return;

    if (samples.length === 0 && !append) {
      this.showEmptyState();
      return;
    }

    if (emptyState) {
      emptyState.style.display = 'none';
    }

    const samplesHTML = samples.map(sample => this.createSampleCard(sample)).join('');
    
    if (append) {
      samplesList.insertAdjacentHTML('beforeend', samplesHTML);
    } else {
      samplesList.innerHTML = samplesHTML;
    }

    // Add click handlers for sample cards
    this.setupSampleCardHandlers();
  }

  createSampleCard(sample) {
    const statusClass = this.getStatusClass(sample.status);
    const priorityClass = this.getPriorityClass(sample.priority);
    
    return `
      <div class="sample-card ${sample.status}" data-sample-id="${sample.id}">
        <div class="sample-priority ${priorityClass}"></div>
        
        <div class="sample-header">
          <div class="sample-checkbox-container">
            <input type="checkbox" class="sample-checkbox" data-sample-id="${sample.id}">
          </div>
          <div class="sample-info">
            <div class="sample-id">${sample.id}</div>
            <div class="sample-type">${sample.type}</div>
          </div>
          <div class="sample-status ${statusClass}">${sample.status}</div>
        </div>

        <div class="sample-content">
          <div class="sample-field">
            <div class="sample-field-label">Patient</div>
            <div class="sample-field-value">${sample.patientName}</div>
          </div>
          <div class="sample-field">
            <div class="sample-field-label">Location</div>
            <div class="sample-field-value">${sample.location}</div>
          </div>
          <div class="sample-field">
            <div class="sample-field-label">Physician</div>
            <div class="sample-field-value">${sample.physician}</div>
          </div>
          <div class="sample-field">
            <div class="sample-field-label">Received</div>
            <div class="sample-field-value">${this.formatRelativeTime(new Date(sample.receivedDate))}</div>
          </div>
        </div>

        <div class="sample-footer">
          <div class="sample-time">
            Collected: ${this.formatRelativeTime(new Date(sample.collectionDate))}
          </div>
          <div class="sample-actions">
            <button class="sample-action-btn" onclick="samplesMobileEnhanced.viewSampleDetails('${sample.id}')">
              View
            </button>
            ${sample.status === 'received' ? 
              `<button class="sample-action-btn primary" onclick="samplesMobileEnhanced.processSample('${sample.id}')">
                Process
              </button>` : ''
            }
          </div>
        </div>

        <div class="sample-swipe-actions">
          <div class="sample-swipe-action" onclick="samplesMobileEnhanced.processSample('${sample.id}')">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
          </div>
        </div>
      </div>
    `;
  }

  updatePagination() {
    if (this.pagination) {
      this.pagination.updateTotal(this.totalSamples);
    }
  }

  getStatusClass(status) {
    const statusClasses = {
      'received': 'received',
      'processing': 'processing',
      'completed': 'completed',
      'urgent': 'urgent'
    };
    return statusClasses[status] || 'received';
  }

  getPriorityClass(priority) {
    const priorityClasses = {
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    };
    return priorityClasses[priority] || 'medium';
  }

  setupSampleCardHandlers() {
    const sampleCards = document.querySelectorAll('.sample-card');
    sampleCards.forEach(card => {
      // Click handler for viewing details
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on checkbox or buttons
        if (e.target.classList.contains('sample-checkbox') || 
            e.target.classList.contains('sample-action-btn') ||
            e.target.closest('.sample-swipe-action')) {
          return;
        }
        
        const sampleId = card.dataset.sampleId;
        this.viewSampleDetails(sampleId);
      });

      // Swipe gesture support
      let startX = 0;
      let currentX = 0;
      let isSwipeActive = false;

      card.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isSwipeActive = true;
      });

      card.addEventListener('touchmove', (e) => {
        if (!isSwipeActive) return;
        
        currentX = e.touches[0].clientX;
        const diffX = startX - currentX;
        
        if (diffX > 50) {
          card.classList.add('swiping');
        } else {
          card.classList.remove('swiping');
        }
      });

      card.addEventListener('touchend', () => {
        isSwipeActive = false;
        setTimeout(() => {
          card.classList.remove('swiping');
        }, 3000);
      });
    });
  }

  viewSampleDetails(sampleId) {
    const sample = this.samples.find(s => s.id === sampleId);
    if (!sample) return;

    const detailsHTML = this.createSampleDetailsHTML(sample);
    this.showBottomSheet(detailsHTML);
  }

  createSampleDetailsHTML(sample) {
    const statusClass = this.getStatusClass(sample.status);
    
    return `
      <div class="sample-details">
        <div class="sample-details-header">
          <div class="sample-details-title">${sample.id}</div>
          <div class="sample-details-status ${statusClass}">${sample.status}</div>
        </div>

        <div class="sample-details-grid">
          <div class="sample-details-section">
            <div class="sample-details-section-title">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              Patient Information
            </div>
            <div class="sample-details-fields">
              <div class="sample-details-field">
                <div class="sample-details-field-label">Patient ID</div>
                <div class="sample-details-field-value">${sample.patientId}</div>
              </div>
              <div class="sample-details-field">
                <div class="sample-details-field-label">Patient Name</div>
                <div class="sample-details-field-value">${sample.patientName}</div>
              </div>
              <div class="sample-details-field">
                <div class="sample-details-field-label">Location</div>
                <div class="sample-details-field-value">${sample.location}</div>
              </div>
              <div class="sample-details-field">
                <div class="sample-details-field-label">Physician</div>
                <div class="sample-details-field-value">${sample.physician}</div>
              </div>
            </div>
          </div>

          <div class="sample-details-section">
            <div class="sample-details-section-title">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M7 2v2h1v14a4 4 0 0 0 4 4 4 4 0 0 0 4-4V4h1V2H7M9 4h6v14a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4Z"/>
              </svg>
              Sample Information
            </div>
            <div class="sample-details-fields">
              <div class="sample-details-field">
                <div class="sample-details-field-label">Sample Type</div>
                <div class="sample-details-field-value">${sample.type}</div>
              </div>
              <div class="sample-details-field">
                <div class="sample-details-field-label">Priority</div>
                <div class="sample-details-field-value">${sample.priority}</div>
              </div>
              <div class="sample-details-field">
                <div class="sample-details-field-label">Collection Date</div>
                <div class="sample-details-field-value">${this.formatDate(new Date(sample.collectionDate))}</div>
              </div>
              <div class="sample-details-field">
                <div class="sample-details-field-label">Received Date</div>
                <div class="sample-details-field-value">${this.formatDate(new Date(sample.receivedDate))}</div>
              </div>
            </div>
          </div>

          ${sample.notes ? `
            <div class="sample-details-section">
              <div class="sample-details-section-title">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
                Notes
              </div>
              <div class="sample-details-field-value">${sample.notes}</div>
            </div>
          ` : ''}
        </div>

        <div class="sample-details-actions">
          ${sample.status === 'received' ? 
            `<button class="sample-action-btn primary" onclick="samplesMobileEnhanced.processSample('${sample.id}')">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
              </svg>
              Start Processing
            </button>` : ''
          }
          <button class="sample-action-btn" onclick="samplesMobileEnhanced.editSample('${sample.id}')">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Edit Sample
          </button>
          <button class="sample-action-btn" onclick="samplesMobileEnhanced.exportSample('${sample.id}')">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h7l5-5V4c0-1.1-.9-2-2-2zm4 15h-4v4l4-4z"/>
            </svg>
            Export
          </button>
        </div>
      </div>
    `;
  }

  processSample(sampleId) {
    this.showToast('Starting sample processing...', 'info');
    
    // Mock processing - replace with actual API call
    setTimeout(() => {
      this.showToast('Sample processing started successfully', 'success');
      this.hideBottomSheet();
      this.resetAndLoad(); // Refresh the list
    }, 1000);
  }

  editSample(sampleId) {
    const sample = this.samples.find(s => s.id === sampleId);
    if (!sample) return;

    const formHTML = this.createSampleFormHTML(sample);
    this.showBottomSheet(formHTML);
  }

  exportSample(sampleId) {
    this.showToast('Exporting sample data...', 'info');
    
    // Mock export functionality
    setTimeout(() => {
      this.showToast('Sample exported successfully', 'success');
    }, 1500);
  }

  showAddSampleForm() {
    const formHTML = this.createSampleFormHTML();
    this.showBottomSheet(formHTML);
  }

  createSampleFormHTML(sample = null) {
    const isEdit = !!sample;
    const title = isEdit ? 'Edit Sample' : 'Add New Sample';
    
    return `
      <div class="sample-form">
        <h3 style="margin-bottom: var(--spacing-lg); font-size: 1.25rem; font-weight: 600;">${title}</h3>
        
        <form id="sampleForm">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Sample ID</label>
              <input type="text" class="form-input" name="sampleId" 
                     value="${sample?.id || ''}" ${isEdit ? 'readonly' : ''}>
            </div>
            <div class="form-group">
              <label class="form-label">Sample Type</label>
              <select class="form-select" name="sampleType">
                <option value="Blood Culture" ${sample?.type === 'Blood Culture' ? 'selected' : ''}>Blood Culture</option>
                <option value="Urine Culture" ${sample?.type === 'Urine Culture' ? 'selected' : ''}>Urine Culture</option>
                <option value="Wound Swab" ${sample?.type === 'Wound Swab' ? 'selected' : ''}>Wound Swab</option>
                <option value="Sputum Culture" ${sample?.type === 'Sputum Culture' ? 'selected' : ''}>Sputum Culture</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Patient ID</label>
              <input type="text" class="form-input" name="patientId" 
                     value="${sample?.patientId || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Patient Name</label>
              <input type="text" class="form-input" name="patientName" 
                     value="${sample?.patientName || ''}">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Location</label>
              <input type="text" class="form-input" name="location" 
                     value="${sample?.location || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Physician</label>
              <input type="text" class="form-input" name="physician" 
                     value="${sample?.physician || ''}">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority">
                <option value="low" ${sample?.priority === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${sample?.priority === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${sample?.priority === 'high' ? 'selected' : ''}>High</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Collection Date</label>
              <input type="datetime-local" class="form-input" name="collectionDate" 
                     value="${sample ? new Date(sample.collectionDate).toISOString().slice(0, 16) : ''}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-textarea" name="notes" rows="3">${sample?.notes || ''}</textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="form-btn" onclick="samplesMobileEnhanced.hideBottomSheet()">
              Cancel
            </button>
            <button type="submit" class="form-btn primary">
              ${isEdit ? 'Update Sample' : 'Add Sample'}
            </button>
          </div>
        </form>
      </div>
    `;
  }

  handleSampleSelection(checkbox) {
    const sampleId = checkbox.dataset.sampleId;
    
    if (checkbox.checked) {
      this.selectedSamples.add(sampleId);
    } else {
      this.selectedSamples.delete(sampleId);
    }

    this.updateBatchOperations();
  }

  updateBatchOperations() {
    const batchOperations = document.getElementById('batchOperations');
    const selectedCount = this.selectedSamples.size;

    if (selectedCount > 0) {
      if (!batchOperations) {
        this.createBatchOperationsPanel();
      } else {
        batchOperations.classList.add('active');
        this.updateBatchOperationsCount(selectedCount);
      }
    } else if (batchOperations) {
      batchOperations.classList.remove('active');
    }
  }

  createBatchOperationsPanel() {
    const batchHTML = `
      <div class="batch-operations active" id="batchOperations">
        <div class="batch-operations-header">
          <div class="batch-operations-count" id="batchOperationsCount">
            ${this.selectedSamples.size} samples selected
          </div>
          <button class="batch-action-btn" onclick="samplesMobileEnhanced.clearSelection()">
            Clear
          </button>
        </div>
        <div class="batch-operations-actions">
          <button class="batch-action-btn" onclick="samplesMobileEnhanced.batchProcess()">
            Process
          </button>
          <button class="batch-action-btn" onclick="samplesMobileEnhanced.batchExport()">
            Export
          </button>
          <button class="batch-action-btn danger" onclick="samplesMobileEnhanced.batchDelete()">
            Delete
          </button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', batchHTML);
  }

  updateBatchOperationsCount(count) {
    const countElement = document.getElementById('batchOperationsCount');
    if (countElement) {
      countElement.textContent = `${count} samples selected`;
    }
  }

  clearSelection() {
    this.selectedSamples.clear();
    const checkboxes = document.querySelectorAll('.sample-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    this.updateBatchOperations();
  }

  async batchProcess() {
    if (this.selectedSamples.size === 0) return;

    this.showToast(`Processing ${this.selectedSamples.size} samples...`, 'info');
    
    try {
      // Mock batch processing - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.showToast('Batch processing completed', 'success');
      this.clearSelection();
      this.resetAndLoad();
    } catch (error) {
      this.showToast('Batch processing failed', 'error');
    }
  }

  async batchExport() {
    if (this.selectedSamples.size === 0) return;

    try {
      await this.queryService.exportData('/samples/export', {
        ids: Array.from(this.selectedSamples)
      }, 'csv');
      
      this.showToast('Export completed', 'success');
    } catch (error) {
      this.showToast('Export failed', 'error');
    }
  }

  async batchDelete() {
    if (this.selectedSamples.size === 0) return;

    if (confirm(`Are you sure you want to delete ${this.selectedSamples.size} samples?`)) {
      this.showToast(`Deleting ${this.selectedSamples.size} samples...`, 'info');
      
      try {
        // Mock delete functionality - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        this.showToast('Samples deleted successfully', 'success');
        this.clearSelection();
        this.resetAndLoad();
      } catch (error) {
        this.showToast('Delete failed', 'error');
      }
    }
  }

  showEmptyState() {
    const samplesList = document.getElementById('samplesList');
    const emptyState = document.getElementById('emptyState');
    
    if (samplesList) {
      samplesList.innerHTML = '';
    }
    
    if (emptyState) {
      emptyState.style.display = 'block';
    }
  }

  // Utility methods
  formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize enhanced samples mobile when DOM is loaded
let samplesMobileEnhanced;
document.addEventListener('DOMContentLoaded', () => {
  samplesMobileEnhanced = new SamplesMobileEnhanced();
  
  // Setup form submission handler
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'sampleForm') {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const sampleData = Object.fromEntries(formData.entries());
      
      samplesMobileEnhanced.showToast('Saving sample...', 'info');
      
      // Mock save operation
      setTimeout(() => {
        samplesMobileEnhanced.showToast('Sample saved successfully', 'success');
        samplesMobileEnhanced.hideBottomSheet();
        samplesMobileEnhanced.resetAndLoad();
      }, 1000);
    }
  });
});

// Export for global access
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SamplesMobileEnhanced;
} else {
  window.SamplesMobileEnhanced = SamplesMobileEnhanced;
}
