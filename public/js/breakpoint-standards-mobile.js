// Breakpoint Standards Mobile JavaScript
class BreakpointStandardsMobile extends MobileBase {
  constructor() {
    super();
    this.currentYear = '2023';
    this.currentFilter = 'all';
    this.currentStatus = 'all';
    this.searchQuery = '';
    this.breakpoints = [];
    this.filteredBreakpoints = [];
    this.initBreakpointStandards();
  }

  initBreakpointStandards() {
    this.setupYearSelector();
    this.setupFilters();
    this.setupSearch();
    this.setupFAB();
    this.loadBreakpoints();
  }

  setupYearSelector() {
    const yearButtons = document.querySelectorAll('.year-btn');
    yearButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons
        yearButtons.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        
        this.currentYear = btn.dataset.year;
        this.filterAndDisplayBreakpoints();
      });
    });
  }

  setupFilters() {
    const filterToggle = document.getElementById('filterToggle');
    const filterPanel = document.getElementById('filterPanel');
    
    if (filterToggle && filterPanel) {
      filterToggle.addEventListener('click', () => {
        filterPanel.classList.toggle('active');
      });
    }

    // Filter chips
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const filterType = chip.dataset.filter || chip.dataset.status;
        const isStatusFilter = chip.dataset.status !== undefined;
        
        // Remove active class from siblings
        const siblings = chip.parentElement.querySelectorAll('.filter-chip');
        siblings.forEach(s => s.classList.remove('active'));
        
        // Add active class to clicked chip
        chip.classList.add('active');
        
        if (isStatusFilter) {
          this.currentStatus = filterType;
        } else {
          this.currentFilter = filterType;
        }
        
        this.filterAndDisplayBreakpoints();
      });
    });
  }

  setupSearch() {
    const searchToggle = document.getElementById('searchToggle');
    const searchContainer = document.getElementById('searchContainer');
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');

    if (searchToggle && searchContainer) {
      searchToggle.addEventListener('click', () => {
        searchContainer.classList.toggle('active');
        if (searchContainer.classList.contains('active')) {
          searchInput.focus();
        }
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.filterAndDisplayBreakpoints();
        
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
        this.filterAndDisplayBreakpoints();
        searchClear.style.display = 'none';
      });
    }
  }

  setupFAB() {
    const addBreakpointFab = document.getElementById('addBreakpointFab');
    if (addBreakpointFab) {
      addBreakpointFab.addEventListener('click', () => {
        this.showAddBreakpointForm();
      });
    }
  }

  async loadBreakpoints() {
    this.showLoading(true);
    
    try {
      const breakpoints = await this.fetchBreakpoints();
      this.breakpoints = breakpoints;
      this.filterAndDisplayBreakpoints();
    } catch (error) {
      console.error('Failed to load breakpoint standards:', error);
      this.showToast('Failed to load breakpoint standards', 'error');
      this.showEmptyState();
    } finally {
      this.showLoading(false);
    }
  }

  async fetchBreakpoints() {
    // Mock data for demonstration - replace with actual API calls
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockBreakpoints = [
          {
            id: 'BP-001',
            organism: 'Staphylococcus aureus',
            drug: 'Oxacillin',
            method: 'disk',
            year: '2023',
            susceptible: '≥13',
            intermediate: null,
            resistant: '≤12',
            unit: 'mm',
            status: 'current',
            type: 'clinical',
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            notes: 'Disk diffusion method for oxacillin resistance screening',
            references: ['CLSI M100-S33 Table 2A'],
            qcRanges: {
              'S. aureus ATCC 25923': '18-24 mm'
            }
          },
          {
            id: 'BP-002',
            organism: 'Escherichia coli',
            drug: 'Ciprofloxacin',
            method: 'mic',
            year: '2023',
            susceptible: '≤1',
            intermediate: '2',
            resistant: '≥4',
            unit: 'μg/mL',
            status: 'current',
            type: 'clinical',
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            notes: 'MIC method for fluoroquinolone susceptibility testing',
            references: ['CLSI M100-S33 Table 2B-1'],
            qcRanges: {
              'E. coli ATCC 25922': '0.004-0.015 μg/mL'
            }
          },
          {
            id: 'BP-003',
            organism: 'Enterococcus faecalis',
            drug: 'Vancomycin',
            method: 'mic',
            year: '2023',
            susceptible: '≤4',
            intermediate: '8-16',
            resistant: '≥32',
            unit: 'μg/mL',
            status: 'current',
            type: 'clinical',
            updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            notes: 'Vancomycin susceptibility testing for enterococci',
            references: ['CLSI M100-S33 Table 2C'],
            qcRanges: {
              'E. faecalis ATCC 29212': '1-4 μg/mL'
            }
          },
          {
            id: 'BP-004',
            organism: 'Pseudomonas aeruginosa',
            drug: 'Ceftazidime',
            method: 'disk',
            year: '2023',
            susceptible: '≥18',
            intermediate: '15-17',
            resistant: '≤14',
            unit: 'mm',
            status: 'current',
            type: 'clinical',
            updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            notes: 'Disk diffusion method for ceftazidime',
            references: ['CLSI M100-S33 Table 2B-2'],
            qcRanges: {
              'P. aeruginosa ATCC 27853': '16-20 mm'
            }
          },
          {
            id: 'BP-005',
            organism: 'Streptococcus pneumoniae',
            drug: 'Penicillin',
            method: 'mic',
            year: '2023',
            susceptible: '≤2',
            intermediate: '4',
            resistant: '≥8',
            unit: 'μg/mL',
            status: 'current',
            type: 'clinical',
            updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            notes: 'Penicillin breakpoints for non-meningitis isolates',
            references: ['CLSI M100-S33 Table 2H'],
            qcRanges: {
              'S. pneumoniae ATCC 49619': '0.25-1 μg/mL'
            }
          },
          {
            id: 'BP-006',
            organism: 'Haemophilus influenzae',
            drug: 'Ampicillin',
            method: 'disk',
            year: '2022',
            susceptible: '≥22',
            intermediate: '19-21',
            resistant: '≤18',
            unit: 'mm',
            status: 'archived',
            type: 'clinical',
            updatedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            notes: 'Previous year breakpoints for ampicillin',
            references: ['CLSI M100-S32 Table 2I'],
            qcRanges: {
              'H. influenzae ATCC 49247': '13-21 mm'
            }
          }
        ];

        resolve(mockBreakpoints);
      }, 1000);
    });
  }

  filterAndDisplayBreakpoints() {
    let filtered = [...this.breakpoints];

    // Filter by year
    filtered = filtered.filter(bp => bp.year === this.currentYear);

    // Filter by method
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(bp => bp.method === this.currentFilter);
    }

    // Filter by status
    if (this.currentStatus !== 'all') {
      filtered = filtered.filter(bp => bp.status === this.currentStatus);
    }

    // Filter by search query
    if (this.searchQuery) {
      filtered = filtered.filter(bp =>
        bp.organism.toLowerCase().includes(this.searchQuery) ||
        bp.drug.toLowerCase().includes(this.searchQuery) ||
        bp.method.toLowerCase().includes(this.searchQuery)
      );
    }

    this.filteredBreakpoints = filtered;
    this.displayBreakpoints(filtered);
  }

  displayBreakpoints(breakpoints) {
    const breakpointsList = document.getElementById('breakpointsList');
    const emptyState = document.getElementById('emptyState');
    
    if (!breakpointsList) return;

    if (breakpoints.length === 0) {
      breakpointsList.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';
    breakpointsList.style.display = 'flex';

    const breakpointsHTML = breakpoints.map(bp => this.createBreakpointCard(bp)).join('');
    breakpointsList.innerHTML = breakpointsHTML;

    // Add click handlers for breakpoint cards
    this.setupBreakpointCardHandlers();
  }

  createBreakpointCard(breakpoint) {
    const methodClass = breakpoint.method;
    const statusClass = breakpoint.status;
    const typeClass = breakpoint.type;
    
    return `
      <div class="breakpoint-card ${statusClass} ${typeClass}" data-breakpoint-id="${breakpoint.id}">
        <div class="breakpoint-header">
          <div class="breakpoint-organism">${breakpoint.organism}</div>
          <div class="breakpoint-method ${methodClass}">${breakpoint.method.toUpperCase()}</div>
        </div>

        <div class="breakpoint-content">
          <div class="breakpoint-drug">${breakpoint.drug}</div>
          
          <div class="breakpoint-values">
            <div class="breakpoint-value susceptible">
              <div class="breakpoint-value-label">Susceptible</div>
              <div class="breakpoint-value-number">${breakpoint.susceptible} ${breakpoint.unit}</div>
            </div>
            
            ${breakpoint.intermediate ? `
              <div class="breakpoint-value intermediate">
                <div class="breakpoint-value-label">Intermediate</div>
                <div class="breakpoint-value-number">${breakpoint.intermediate} ${breakpoint.unit}</div>
              </div>
            ` : `
              <div class="breakpoint-value intermediate">
                <div class="breakpoint-value-label">Intermediate</div>
                <div class="breakpoint-value-number">-</div>
              </div>
            `}
            
            <div class="breakpoint-value resistant">
              <div class="breakpoint-value-label">Resistant</div>
              <div class="breakpoint-value-number">${breakpoint.resistant} ${breakpoint.unit}</div>
            </div>
          </div>
        </div>

        <div class="breakpoint-footer">
          <div class="breakpoint-meta">
            <div class="breakpoint-year">CLSI ${breakpoint.year}</div>
            <div class="breakpoint-updated">Updated: ${this.formatRelativeTime(breakpoint.updatedAt)}</div>
          </div>
          
          <div class="breakpoint-status ${statusClass}">
            <span class="breakpoint-status-dot"></span>
            ${breakpoint.status}
          </div>
        </div>

        <div class="breakpoint-swipe-actions">
          <div class="breakpoint-swipe-action" onclick="breakpointStandardsMobile.editBreakpoint('${breakpoint.id}')">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </div>
        </div>
      </div>
    `;
  }

  setupBreakpointCardHandlers() {
    const breakpointCards = document.querySelectorAll('.breakpoint-card');
    breakpointCards.forEach(card => {
      // Click handler for viewing details
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on action buttons
        if (e.target.closest('.breakpoint-swipe-action')) {
          return;
        }
        
        const breakpointId = card.dataset.breakpointId;
        this.viewBreakpointDetails(breakpointId);
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

  viewBreakpointDetails(breakpointId) {
    const breakpoint = this.breakpoints.find(bp => bp.id === breakpointId);
    if (!breakpoint) return;

    const detailsHTML = this.createBreakpointDetailsHTML(breakpoint);
    this.showBottomSheet(detailsHTML);
  }

  createBreakpointDetailsHTML(breakpoint) {
    const methodClass = breakpoint.method;
    const statusClass = breakpoint.status;
    const typeClass = breakpoint.type;
    
    return `
      <div class="breakpoint-details">
        <div class="breakpoint-details-header">
          <div class="breakpoint-details-title">${breakpoint.organism}</div>
          <div class="breakpoint-details-subtitle">${breakpoint.drug}</div>
          <div class="breakpoint-details-meta">
            <span class="breakpoint-details-badge breakpoint-method ${methodClass}">${breakpoint.method.toUpperCase()}</span>
            <span class="breakpoint-details-badge breakpoint-status ${statusClass}">${breakpoint.status}</span>
            <span class="breakpoint-details-badge breakpoint-type ${typeClass}">${breakpoint.type}</span>
          </div>
        </div>

        <div class="breakpoint-details-section">
          <div class="breakpoint-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zM4 4v2h16V4H4zm0 16h16v2H4v-2z"/>
            </svg>
            Breakpoint Values
          </div>
          <div class="breakpoint-details-table">
            <table>
              <thead>
                <tr>
                  <th>Interpretation</th>
                  <th>Value</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Susceptible</td>
                  <td>${breakpoint.susceptible}</td>
                  <td>${breakpoint.unit}</td>
                </tr>
                ${breakpoint.intermediate ? `
                  <tr>
                    <td>Intermediate</td>
                    <td>${breakpoint.intermediate}</td>
                    <td>${breakpoint.unit}</td>
                  </tr>
                ` : ''}
                <tr>
                  <td>Resistant</td>
                  <td>${breakpoint.resistant}</td>
                  <td>${breakpoint.unit}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="breakpoint-details-section">
          <div class="breakpoint-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Quality Control Ranges
          </div>
          <div class="breakpoint-details-content">
            ${Object.entries(breakpoint.qcRanges).map(([strain, range]) => 
              `<div><strong>${strain}:</strong> ${range}</div>`
            ).join('')}
          </div>
        </div>

        <div class="breakpoint-details-section">
          <div class="breakpoint-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M11 9h2V7h-2m1 13c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8m0-18A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2m-1 15h2v-6h-2v6z"/>
            </svg>
            Notes
          </div>
          <div class="breakpoint-details-notes">
            <div class="breakpoint-details-notes-title">Clinical Notes</div>
            <div class="breakpoint-details-notes-content">${breakpoint.notes}</div>
          </div>
        </div>

        <div class="breakpoint-details-section">
          <div class="breakpoint-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            References
          </div>
          <div class="breakpoint-details-content">
            ${breakpoint.references.map(ref => `<div>• ${ref}</div>`).join('')}
          </div>
        </div>

        <div class="breakpoint-details-section">
          <div class="breakpoint-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Breakpoint Information
          </div>
          <div class="breakpoint-details-grid">
            <div class="breakpoint-details-field">
              <div class="breakpoint-details-field-label">Breakpoint ID</div>
              <div class="breakpoint-details-field-value code">${breakpoint.id}</div>
            </div>
            <div class="breakpoint-details-field">
              <div class="breakpoint-details-field-label">Method</div>
              <div class="breakpoint-details-field-value">${breakpoint.method.toUpperCase()}</div>
            </div>
            <div class="breakpoint-details-field">
              <div class="breakpoint-details-field-label">Year</div>
              <div class="breakpoint-details-field-value">${breakpoint.year}</div>
            </div>
            <div class="breakpoint-details-field">
              <div class="breakpoint-details-field-label">Status</div>
              <div class="breakpoint-details-field-value">${breakpoint.status}</div>
            </div>
            <div class="breakpoint-details-field">
              <div class="breakpoint-details-field-label">Type</div>
              <div class="breakpoint-details-field-value">${breakpoint.type}</div>
            </div>
            <div class="breakpoint-details-field">
              <div class="breakpoint-details-field-label">Last Updated</div>
              <div class="breakpoint-details-field-value">${this.formatDate(breakpoint.updatedAt)}</div>
            </div>
          </div>
        </div>

        <div class="breakpoint-details-actions">
          <button class="breakpoint-action-btn" onclick="breakpointStandardsMobile.editBreakpoint('${breakpoint.id}')">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Edit
          </button>
          <button class="breakpoint-action-btn" onclick="breakpointStandardsMobile.compareBreakpoint('${breakpoint.id}')">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            Compare
          </button>
          <button class="breakpoint-action-btn primary" onclick="breakpointStandardsMobile.applyBreakpoint('${breakpoint.id}')">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            Apply
          </button>
        </div>
      </div>
    `;
  }

  showAddBreakpointForm() {
    this.showToast('Add breakpoint functionality coming soon', 'info');
    // In a real implementation, this would show a form to add new breakpoints
  }

  editBreakpoint(breakpointId) {
    this.showToast('Edit breakpoint functionality coming soon', 'info');
    // In a real implementation, this would show an edit form
  }

  compareBreakpoint(breakpointId) {
    const breakpoint = this.breakpoints.find(bp => bp.id === breakpointId);
    if (!breakpoint) return;

    this.showToast('Comparing breakpoint standards...', 'info');
    
    // Mock comparison functionality
    setTimeout(() => {
      this.showToast(`Comparison for ${breakpoint.organism} - ${breakpoint.drug} completed`, 'success');
    }, 2000);
  }

  applyBreakpoint(breakpointId) {
    const breakpoint = this.breakpoints.find(bp => bp.id === breakpointId);
    if (!breakpoint) return;

    this.showToast('Applying breakpoint standard...', 'info');
    
    // Mock apply functionality
    setTimeout(() => {
      this.showToast(`Breakpoint ${breakpoint.id} applied successfully`, 'success');
    }, 1500);
  }

  formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
}

// Auto-initialize breakpoint standards mobile
document.addEventListener('DOMContentLoaded', () => {
  window.breakpointStandardsMobile = new BreakpointStandardsMobile();
});
