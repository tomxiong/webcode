// Lab Results Mobile JavaScript
class LabResultsMobile extends MobileBase {
  constructor() {
    super();
    this.currentPage = 1;
    this.pageSize = 20;
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.results = [];
    this.isLoading = false;
    this.hasMore = true;
    
    this.initLabResults();
  }

  initLabResults() {
    this.setupFilters();
    this.setupBottomSheet();
    this.setupFAB();
    this.setupInfiniteScroll();
    this.loadResults();
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
        this.resetPagination();
        this.loadResults();
      });
    });
  }

  setupBottomSheet() {
    const closeBtn = document.getElementById('closeBottomSheet');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideBottomSheet();
      });
    }
  }

  setupFAB() {
    const fab = document.getElementById('addResultFab');
    if (fab) {
      fab.addEventListener('click', () => {
        this.showAddResultForm();
      });
    }
  }

  setupInfiniteScroll() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        this.loadMoreResults();
      });
    }

    // Intersection Observer for automatic loading
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.hasMore && !this.isLoading) {
        this.loadMoreResults();
      }
    }, { threshold: 0.1 });

    if (loadMoreBtn) {
      observer.observe(loadMoreBtn);
    }
  }

  resetPagination() {
    this.currentPage = 1;
    this.results = [];
    this.hasMore = true;
  }

  async loadResults() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: this.currentPage,
        limit: this.pageSize,
        filter: this.currentFilter,
        search: this.searchQuery
      });

      const response = await this.get(`/api/lab-results?${params}`);
      
      if (this.currentPage === 1) {
        this.results = response.data;
      } else {
        this.results = [...this.results, ...response.data];
      }
      
      this.hasMore = response.data.length === this.pageSize;
      this.renderResults();
      
    } catch (error) {
      console.error('Failed to load results:', error);
      this.showToast('Failed to load lab results', 'error');
    } finally {
      this.isLoading = false;
      this.showLoading(false);
    }
  }

  async loadMoreResults() {
    if (!this.hasMore || this.isLoading) return;
    
    this.currentPage++;
    await this.loadResults();
  }

  renderResults() {
    const resultsList = document.getElementById('resultsList');
    const emptyState = document.getElementById('emptyState');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (!resultsList) return;
    
    if (this.results.length === 0) {
      resultsList.innerHTML = '';
      emptyState.style.display = 'block';
      loadMoreBtn.style.display = 'none';
      return;
    }
    
    emptyState.style.display = 'none';
    loadMoreBtn.style.display = this.hasMore ? 'block' : 'none';
    
    if (this.currentPage === 1) {
      resultsList.innerHTML = '';
    }
    
    const newResults = this.currentPage === 1 ? this.results : 
      this.results.slice((this.currentPage - 1) * this.pageSize);
    
    newResults.forEach(result => {
      const resultCard = this.createResultCard(result);
      resultsList.appendChild(resultCard);
    });
  }

  createResultCard(result) {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.dataset.resultId = result.id;
    
    card.innerHTML = `
      <div class="result-header">
        <div class="result-id">#${result.id.slice(-8)}</div>
        <div class="result-status status-${result.validationStatus}">
          ${result.validationStatus}
        </div>
      </div>
      
      <div class="result-info">
        <div class="info-item">
          <div class="info-label">Sample</div>
          <div class="info-value">${result.sampleId}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Test Date</div>
          <div class="info-value">${this.formatDate(result.testDate)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Microorganism</div>
          <div class="info-value">${result.microorganismName || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Drug</div>
          <div class="info-value">${result.drugName || 'N/A'}</div>
        </div>
      </div>
      
      <div class="result-interpretation">
        <div class="interpretation-badge interpretation-${result.interpretation?.toLowerCase() || 'nt'}">
          ${result.interpretation || 'NT'}
        </div>
        <div class="raw-result">${result.rawResult}</div>
        ${result.qualityControlPassed ? 
          '<div class="qc-indicator qc-passed"><div class="qc-dot"></div>QC Passed</div>' :
          '<div class="qc-indicator qc-failed"><div class="qc-dot"></div>QC Failed</div>'
        }
      </div>
      
      <div class="swipe-actions">
        <div class="swipe-action edit" data-action="edit">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          Edit
        </div>
        <div class="swipe-action delete" data-action="delete">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          Delete
        </div>
      </div>
    `;
    
    // Add click event for details
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.swipe-action')) {
        this.showResultDetails(result);
      }
    });
    
    // Add swipe action events
    const swipeActions = card.querySelectorAll('.swipe-action');
    swipeActions.forEach(action => {
      action.addEventListener('click', (e) => {
        e.stopPropagation();
        const actionType = action.dataset.action;
        if (actionType === 'edit') {
          this.editResult(result);
        } else if (actionType === 'delete') {
          this.deleteResult(result);
        }
      });
    });
    
    return card;
  }

  showResultDetails(result) {
    const content = `
      <div class="result-details">
        <div class="detail-section">
          <div class="detail-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            Basic Information
          </div>
          <div class="detail-grid">
            <div class="detail-item">
              <div class="detail-label">Result ID</div>
              <div class="detail-value highlight">${result.id}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Sample ID</div>
              <div class="detail-value">${result.sampleId}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Test Method</div>
              <div class="detail-value">${result.testMethod}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Test Date</div>
              <div class="detail-value">${this.formatDate(result.testDate)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Technician</div>
              <div class="detail-value">${result.technician}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Reviewed By</div>
              <div class="detail-value">${result.reviewedBy || 'Not reviewed'}</div>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <div class="detail-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Test Results
          </div>
          <div class="detail-grid">
            <div class="detail-item">
              <div class="detail-label">Raw Result</div>
              <div class="detail-value highlight">${result.rawResult}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Interpretation</div>
              <div class="detail-value">
                <span class="interpretation-badge interpretation-${result.interpretation?.toLowerCase() || 'nt'}">
                  ${result.interpretation || 'NT'}
                </span>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Breakpoint Used</div>
              <div class="detail-value">${result.breakpointUsed || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Quality Control</div>
              <div class="detail-value">
                ${result.qualityControlPassed ? 
                  '<div class="qc-indicator qc-passed"><div class="qc-dot"></div>Passed</div>' :
                  '<div class="qc-indicator qc-failed"><div class="qc-dot"></div>Failed</div>'
                }
              </div>
            </div>
            ${result.instrumentId ? `
              <div class="detail-item">
                <div class="detail-label">Instrument</div>
                <div class="detail-value">${result.instrumentId}</div>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="detail-section">
          <div class="detail-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Validation & Review
          </div>
          <div class="detail-grid">
            <div class="detail-item">
              <div class="detail-label">Status</div>
              <div class="detail-value">
                <span class="result-status status-${result.validationStatus}">
                  ${result.validationStatus}
                </span>
              </div>
            </div>
            ${result.validationComments ? `
              <div class="detail-item full-width">
                <div class="detail-label">Validation Comments</div>
                <div class="detail-value">${result.validationComments}</div>
              </div>
            ` : ''}
          </div>
        </div>
        
        ${result.expertRuleApplied && result.expertRuleApplied !== '[]' ? `
          <div class="detail-section">
            <div class="detail-title">
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Expert Rules Applied
            </div>
            <div class="expert-rules">
              ${JSON.parse(result.expertRuleApplied).map(rule => `
                <div class="rule-item">
                  <div class="rule-name">${rule.name || rule}</div>
                  <div class="rule-description">${rule.description || 'Expert rule applied'}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${result.comments ? `
          <div class="detail-section">
            <div class="detail-title">
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
              Comments
            </div>
            <div class="detail-grid">
              <div class="detail-item full-width">
                <div class="detail-value">${result.comments}</div>
              </div>
            </div>
          </div>
        ` : ''}
        
        <div class="action-buttons">
          <button class="btn-secondary" onclick="labResultsMobile.editResult('${result.id}')">
            Edit Result
          </button>
          <button class="btn-primary" onclick="labResultsMobile.validateResult('${result.id}')">
            ${result.validationStatus === 'pending' ? 'Validate' : 'Re-validate'}
          </button>
          <button class="btn-danger" onclick="labResultsMobile.deleteResult('${result.id}')">
            Delete
          </button>
        </div>
      </div>
    `;
    
    this.showBottomSheet(content);
  }

  async editResult(result) {
    // Show edit form in bottom sheet
    const content = `
      <div class="edit-result-form">
        <form id="editResultForm">
          <div class="form-group">
            <label for="rawResult">Raw Result</label>
            <input type="text" id="rawResult" name="rawResult" value="${result.rawResult}" required>
          </div>
          
          <div class="form-group">
            <label for="interpretation">Interpretation</label>
            <select id="interpretation" name="interpretation" required>
              <option value="S" ${result.interpretation === 'S' ? 'selected' : ''}>Susceptible (S)</option>
              <option value="I" ${result.interpretation === 'I' ? 'selected' : ''}>Intermediate (I)</option>
              <option value="R" ${result.interpretation === 'R' ? 'selected' : ''}>Resistant (R)</option>
              <option value="NT" ${result.interpretation === 'NT' ? 'selected' : ''}>Not Tested (NT)</option>
              <option value="NI" ${result.interpretation === 'NI' ? 'selected' : ''}>Not Interpretable (NI)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="validationComments">Validation Comments</label>
            <textarea id="validationComments" name="validationComments" rows="3">${result.validationComments || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="comments">Comments</label>
            <textarea id="comments" name="comments" rows="3">${result.comments || ''}</textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="labResultsMobile.hideBottomSheet()">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    `;
    
    this.showBottomSheet(content);
    
    // Setup form submission
    const form = document.getElementById('editResultForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.saveResultChanges(result.id, new FormData(form));
      });
    }
  }

  async saveResultChanges(resultId, formData) {
    try {
      const data = Object.fromEntries(formData);
      await this.put(`/api/lab-results/${resultId}`, data);
      
      this.showToast('Result updated successfully', 'success');
      this.hideBottomSheet();
      this.resetPagination();
      this.loadResults();
      
    } catch (error) {
      console.error('Failed to update result:', error);
      this.showToast('Failed to update result', 'error');
    }
  }

  async validateResult(resultId) {
    try {
      await this.post(`/api/lab-results/${resultId}/validate`, {});
      
      this.showToast('Result validated successfully', 'success');
      this.hideBottomSheet();
      this.resetPagination();
      this.loadResults();
      
    } catch (error) {
      console.error('Failed to validate result:', error);
      this.showToast('Failed to validate result', 'error');
    }
  }

  async deleteResult(result) {
    if (typeof result === 'string') {
      // If called with just ID, find the result object
      result = this.results.find(r => r.id === result);
    }
    
    if (!result) return;
    
    const confirmed = confirm(`Are you sure you want to delete result #${result.id.slice(-8)}?`);
    if (!confirmed) return;
    
    try {
      await this.delete(`/api/lab-results/${result.id}`);
      
      this.showToast('Result deleted successfully', 'success');
      this.hideBottomSheet();
      
      // Remove from local results array
      this.results = this.results.filter(r => r.id !== result.id);
      this.renderResults();
      
    } catch (error) {
      console.error('Failed to delete result:', error);
      this.showToast('Failed to delete result', 'error');
    }
  }

  showAddResultForm() {
    const content = `
      <div class="add-result-form">
        <h3>Add New Lab Result</h3>
        <form id="addResultForm">
          <div class="form-group">
            <label for="sampleId">Sample ID</label>
            <input type="text" id="sampleId" name="sampleId" required>
          </div>
          
          <div class="form-group">
            <label for="microorganismId">Microorganism</label>
            <select id="microorganismId" name="microorganismId" required>
              <option value="">Select microorganism...</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="drugId">Drug</label>
            <select id="drugId" name="drugId" required>
              <option value="">Select drug...</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="testMethod">Test Method</label>
            <select id="testMethod" name="testMethod" required>
              <option value="disk_diffusion">Disk Diffusion</option>
              <option value="broth_microdilution">Broth Microdilution</option>
              <option value="agar_dilution">Agar Dilution</option>
              <option value="e_test">E-test</option>
              <option value="automated">Automated</option>
              <option value="molecular">Molecular</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="rawResult">Raw Result</label>
            <input type="text" id="rawResult" name="rawResult" required>
          </div>
          
          <div class="form-group">
            <label for="interpretation">Interpretation</label>
            <select id="interpretation" name="interpretation" required>
              <option value="S">Susceptible (S)</option>
              <option value="I">Intermediate (I)</option>
              <option value="R">Resistant (R)</option>
              <option value="NT">Not Tested (NT)</option>
              <option value="NI">Not Interpretable (NI)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="technician">Technician</label>
            <input type="text" id="technician" name="technician" required>
          </div>
          
          <div class="form-group">
            <label for="comments">Comments</label>
            <textarea id="comments" name="comments" rows="3"></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="labResultsMobile.hideBottomSheet()">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              Add Result
            </button>
          </div>
        </form>
      </div>
    `;
    
    this.showBottomSheet(content);
    
    // Load microorganisms and drugs
    this.loadFormOptions();
    
    // Setup form submission
    const form = document.getElementById('addResultForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.addNewResult(new FormData(form));
      });
    }
  }

  async loadFormOptions() {
    try {
      const [microorganisms, drugs] = await Promise.all([
        this.get('/api/microorganisms'),
        this.get('/api/drugs')
      ]);
      
      const microorganismSelect = document.getElementById('microorganismId');
      const drugSelect = document.getElementById('drugId');
      
      if (microorganismSelect && microorganisms.data) {
        microorganisms.data.forEach(micro => {
          const option = document.createElement('option');
          option.value = micro.id;
          option.textContent = `${micro.genus} ${micro.species}`;
          microorganismSelect.appendChild(option);
        });
      }
      
      if (drugSelect && drugs.data) {
        drugs.data.forEach(drug => {
          const option = document.createElement('option');
          option.value = drug.id;
          option.textContent = drug.name;
          drugSelect.appendChild(option);
        });
      }
      
    } catch (error) {
      console.error('Failed to load form options:', error);
      this.showToast('Failed to load form options', 'error');
    }
  }

  async addNewResult(formData) {
    try {
      const data = Object.fromEntries(formData);
      data.testDate = new Date().toISOString();
      data.validationStatus = 'pending';
      data.qualityControlPassed = false;
      
      await this.post('/api/lab-results', data);
      
      this.showToast('Result added successfully', 'success');
      this.hideBottomSheet();
      this.resetPagination();
      this.loadResults();
      
    } catch (error) {
      console.error('Failed to add result:', error);
      this.showToast('Failed to add result', 'error');
    }
  }

  // Override search methods from base class
  onSearchInput(query) {
    this.searchQuery = query;
    this.debounceSearch();
  }

  onSearchClear() {
    this.searchQuery = '';
    this.resetPagination();
    this.loadResults();
  }

  debounceSearch = this.debounce(() => {
    this.resetPagination();
    this.loadResults();
  }, 300);

  // Override swipe methods from base class
  onSwipeLeft(target) {
    const resultCard = target.closest('.result-card');
    if (resultCard) {
      resultCard.classList.add('swiped');
    }
  }

  onSwipeRight(target) {
    const resultCard = target.closest('.result-card');
    if (resultCard) {
      resultCard.classList.remove('swiped');
    }
  }

  clearFilters() {
    this.currentFilter = 'all';
    this.searchQuery = '';
    
    // Reset UI
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.filter === 'all');
    });
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = '';
    }
    
    this.resetPagination();
    this.loadResults();
  }
}

// CSS for form styles
const formStyles = `
  .edit-result-form,
  .add-result-form {
    padding: var(--spacing-md);
  }
  
  .form-group {
    margin-bottom: var(--spacing-lg);
  }
  
  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 1rem;
    background: var(--surface-color);
    transition: border-color 0.2s;
  }
  
  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgb(37 99 235 / 0.1);
  }
  
  .form-actions {
    display: flex;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-xl);
  }
  
  .form-actions button {
    flex: 1;
  }
`;

// Inject form styles
const styleSheet = document.createElement('style');
styleSheet.textContent = formStyles;
document.head.appendChild(styleSheet);

// Initialize lab results mobile functionality
const labResultsMobile = new LabResultsMobile();

// Export for global access
window.LabResultsMobile = LabResultsMobile;
window.labResultsMobile = labResultsMobile;
