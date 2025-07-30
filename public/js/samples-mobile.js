// Samples Mobile JavaScript
class SamplesMobile extends MobileBase {
  constructor() {
    super();
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.selectedSamples = new Set();
    this.currentPage = 1;
    this.pageSize = 20;
    this.samples = [];
    this.initSamples();
  }

  initSamples() {
    this.setupFilters();
    this.setupSearch();
    this.setupFAB();
    this.setupBatchOperations();
    this.loadSamples();
  }

  setupFilters() {
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        // Remove active class from all chips
        filterChips.forEach(c => c.classList.remove('active'));
        // Add active class to clicked chip
        chip.classList.add('active');
        
        this.currentFilter = chip.dataset.filter;
        this.currentPage = 1;
        this.loadSamples();
      });
    });
  }

  setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      const debouncedSearch = this.debounce((query) => {
        this.searchQuery = query;
        this.currentPage = 1;
        this.loadSamples();
      }, 300);

      searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
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
    // Setup batch operation handlers
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('sample-checkbox')) {
        this.handleSampleSelection(e.target);
      }
    });
  }

  async loadSamples() {
    this.showLoading(true);
    
    try {
      const samples = await this.fetchSamples();
      this.samples = samples;
      this.displaySamples(samples);
      this.updateLoadMoreButton(samples.length);
    } catch (error) {
      console.error('Failed to load samples:', error);
      this.showToast('Failed to load samples', 'error');
      this.showEmptyState();
    } finally {
      this.showLoading(false);
    }
  }

  async fetchSamples() {
    // Mock data for demonstration - replace with actual API calls
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockSamples = [
          {
            id: 'S-2024-001247',
            type: 'Blood Culture',
            status: 'processing',
            priority: 'high',
            patientId: 'P-2024-5678',
            patientName: 'John Doe',
            collectionDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
            receivedDate: new Date(Date.now() - 1 * 60 * 60 * 1000),
            location: 'ICU Ward 3',
            physician: 'Dr. Smith',
            notes: 'Suspected sepsis, urgent processing required'
          },
          {
            id: 'S-2024-001246',
            type: 'Urine Culture',
            status: 'completed',
            priority: 'medium',
            patientId: 'P-2024-5677',
            patientName: 'Jane Smith',
            collectionDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
            receivedDate: new Date(Date.now() - 23 * 60 * 60 * 1000),
            location: 'Emergency Dept',
            physician: 'Dr. Johnson',
            notes: 'UTI symptoms'
          },
          {
            id: 'S-2024-001245',
            type: 'Wound Swab',
            status: 'received',
            priority: 'low',
            patientId: 'P-2024-5676',
            patientName: 'Bob Wilson',
            collectionDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
            receivedDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
            location: 'Surgery Ward',
            physician: 'Dr. Brown',
            notes: 'Post-operative wound check'
          },
          {
            id: 'S-2024-001244',
            type: 'Sputum Culture',
            status: 'urgent',
            priority: 'high',
            patientId: 'P-2024-5675',
            patientName: 'Alice Johnson',
            collectionDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
            receivedDate: new Date(Date.now() - 5 * 60 * 60 * 1000),
            location: 'Respiratory Ward',
            physician: 'Dr. Davis',
            notes: 'Pneumonia suspected, priority testing'
          }
        ];

        // Filter samples based on current filter and search
        let filteredSamples = mockSamples;
        
        if (this.currentFilter !== 'all') {
          filteredSamples = filteredSamples.filter(sample => 
            sample.status === this.currentFilter
          );
        }

        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          filteredSamples = filteredSamples.filter(sample =>
            sample.id.toLowerCase().includes(query) ||
            sample.patientName.toLowerCase().includes(query) ||
            sample.type.toLowerCase().includes(query) ||
            sample.location.toLowerCase().includes(query)
          );
        }

        resolve(filteredSamples);
      }, 1000);
    });
  }

  displaySamples(samples) {
    const samplesList = document.getElementById('samplesList');
    const emptyState = document.getElementById('emptyState');
    
    if (!samplesList) return;

    if (samples.length === 0) {
      this.showEmptyState();
      return;
    }

    if (emptyState) {
      emptyState.style.display = 'none';
    }

    const samplesHTML = samples.map(sample => this.createSampleCard(sample)).join('');
    
    if (this.currentPage === 1) {
      samplesList.innerHTML = samplesHTML;
    } else {
      samplesList.insertAdjacentHTML('beforeend', samplesHTML);
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
          <div>
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
            <div class="sample-field-value">${this.formatRelativeTime(sample.receivedDate)}</div>
          </div>
        </div>

        <div class="sample-footer">
          <div class="sample-time">
            Collected: ${this.formatRelativeTime(sample.collectionDate)}
          </div>
          <div class="sample-actions">
            <button class="sample-action-btn" onclick="samplesMobile.viewSampleDetails('${sample.id}')">
              View
            </button>
            ${sample.status === 'received' ? 
              `<button class="sample-action-btn primary" onclick="samplesMobile.processSample('${sample.id}')">
                Process
              </button>` : ''
            }
          </div>
        </div>
      </div>
    `;
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
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on buttons
        if (e.target.classList.contains('sample-action-btn')) {
          return;
        }
        
        const sampleId = card.dataset.sampleId;
        this.viewSampleDetails(sampleId);
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
            <div class="sample-details-section-title">Patient Information</div>
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
            <div class="sample-details-section-title">Sample Information</div>
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
                <div class="sample-details-field-value">${this.formatDate(sample.collectionDate)}</div>
              </div>
              <div class="sample-details-field">
                <div class="sample-details-field-label">Received Date</div>
                <div class="sample-details-field-value">${this.formatDate(sample.receivedDate)}</div>
              </div>
            </div>
          </div>

          ${sample.notes ? `
            <div class="sample-details-section">
              <div class="sample-details-section-title">Notes</div>
              <div class="sample-details-field-value">${sample.notes}</div>
            </div>
          ` : ''}
        </div>

        <div class="form-actions">
          ${sample.status === 'received' ? 
            `<button class="form-btn primary" onclick="samplesMobile.processSample('${sample.id}')">
              Start Processing
            </button>` : ''
          }
          <button class="form-btn" onclick="samplesMobile.editSample('${sample.id}')">
            Edit Sample
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
      this.loadSamples(); // Refresh the list
    }, 1000);
  }

  editSample(sampleId) {
    const sample = this.samples.find(s => s.id === sampleId);
    if (!sample) return;

    const formHTML = this.createSampleFormHTML(sample);
    this.showBottomSheet(formHTML);
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
                     value="${sample ? sample.collectionDate.toISOString().slice(0, 16) : ''}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-textarea" name="notes" rows="3">${sample?.notes || ''}</textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="form-btn" onclick="samplesMobile.hideBottomSheet()">
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
          <button class="batch-action-btn" onclick="samplesMobile.clearSelection()">
            Clear
          </button>
        </div>
        <div class="batch-operations-actions">
          <button class="batch-action-btn" onclick="samplesMobile.batchProcess()">
            Process
          </button>
          <button class="batch-action-btn" onclick="samplesMobile.batchExport()">
            Export
          </button>
          <button class="batch-action-btn danger" onclick="samplesMobile.batchDelete()">
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

  batchProcess() {
    if (this.selectedSamples.size === 0) return;

    this.showToast(`Processing ${this.selectedSamples.size} samples...`, 'info');
    
    // Mock batch processing
    setTimeout(() => {
      this.showToast('Batch processing completed', 'success');
      this.clearSelection();
      this.loadSamples();
    }, 2000);
  }

  batchExport() {
    if (this.selectedSamples.size === 0) return;

    this.showToast(`Exporting ${this.selectedSamples.size} samples...`, 'info');
    
    // Mock export functionality
    setTimeout(() => {
      this.showToast('Export completed', 'success');
    }, 1500);
  }

  batchDelete() {
    if (this.selectedSamples.size === 0) return;

    if (confirm(`Are you sure you want to delete ${this.selectedSamples.size} samples?`)) {
      this.showToast(`Deleting ${this.selectedSamples.size} samples...`, 'info');
      
      // Mock delete functionality
      setTimeout(() => {
        this.showToast('Samples deleted successfully', 'success');
        this.clearSelection();
        this.loadSamples();
      }, 1500);
    }
  }

  updateLoadMoreButton(samplesCount) {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!loadMoreBtn) return;

    if (samplesCount >= this.pageSize) {
      loadMoreBtn.style.display = 'block';
      loadMoreBtn.onclick = () => this.loadMoreSamples();
    } else {
      loadMoreBtn.style.display = 'none';
    }
  }

  async loadMoreSamples() {
    this.currentPage++;
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (loadMoreBtn) {
      loadMoreBtn.textContent = 'Loading...';
      loadMoreBtn.disabled = true;
    }

    try {
      const samples = await this.fetchSamples();
      this.displaySamples(samples);
      this.updateLoadMoreButton(samples.length);
    } catch (error) {
      console.error('Failed to load more samples:', error);
      this.showToast('Failed to load more samples', 'error');
      this.currentPage--; // Revert page increment
    } finally {
      if (loadMoreBtn) {
        loadMoreBtn.textContent = 'Load More Samples';
        loadMoreBtn.disabled = false;
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

  // Override search methods from MobileBase
  onSearchInput(query) {
    this.searchQuery = query;
    this.currentPage = 1;
    this.loadSamples();
  }

  onSearchClear() {
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadSamples();
  }

  // Override swipe methods for sample cards
  onSwipeLeft(target) {
    const sampleCard = target.closest('.sample-card');
    if (sampleCard) {
      const sampleId = sampleCard.dataset.sampleId;
      this.processSample(sampleId);
    }
  }

  onSwipeRight(target) {
    const sampleCard = target.closest('.sample-card');
    if (sampleCard) {
      const sampleId = sampleCard.dataset.sampleId;
      this.viewSampleDetails(sampleId);
    }
  }
}

// Global functions for onclick handlers
window.clearFilters = function() {
  const allFilter = document.querySelector('.filter-chip[data-filter="all"]');
  if (allFilter) {
    allFilter.click();
  }
  
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
  }
};

// Initialize samples mobile when DOM is loaded
let samplesMobile;
document.addEventListener('DOMContentLoaded', () => {
  samplesMobile = new SamplesMobile();
  
  // Setup form submission handler
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'sampleForm') {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const sampleData = Object.fromEntries(formData.entries());
      
      samplesMobile.showToast('Saving sample...', 'info');
      
      // Mock save operation
      setTimeout(() => {
        samplesMobile.showToast('Sample saved successfully', 'success');
        samplesMobile.hideBottomSheet();
        samplesMobile.loadSamples();
      }, 1000);
    }
  });
});
