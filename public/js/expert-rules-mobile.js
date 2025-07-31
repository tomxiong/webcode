// Expert Rules Mobile JavaScript
class ExpertRulesMobile extends MobileBase {
  constructor() {
    super();
    this.currentCategory = 'all';
    this.currentFilter = 'all';
    this.currentStatus = 'all';
    this.searchQuery = '';
    this.rules = [];
    this.filteredRules = [];
    this.initExpertRules();
  }

  initExpertRules() {
    this.setupCategories();
    this.setupFilters();
    this.setupSearch();
    this.setupFAB();
    this.loadRules();
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
        this.filterAndDisplayRules();
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
        
        this.filterAndDisplayRules();
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
        this.filterAndDisplayRules();
        
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
        this.filterAndDisplayRules();
        searchClear.style.display = 'none';
      });
    }
  }

  setupFAB() {
    const addRuleFab = document.getElementById('addRuleFab');
    if (addRuleFab) {
      addRuleFab.addEventListener('click', () => {
        this.showAddRuleForm();
      });
    }
  }

  async loadRules() {
    this.showLoading(true);
    
    try {
      const rules = await this.fetchRules();
      this.rules = rules;
      this.filterAndDisplayRules();
    } catch (error) {
      console.error('Failed to load expert rules:', error);
      this.showToast('Failed to load expert rules', 'error');
      this.showEmptyState();
    } finally {
      this.showLoading(false);
    }
  }

  async fetchRules() {
    // Mock data for demonstration - replace with actual API calls
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockRules = [
          {
            id: 'ER-001',
            title: 'Enterococcus Vancomycin Intrinsic Resistance',
            type: 'intrinsic',
            description: 'Enterococcus gallinarum and casseliflavus show intrinsic low-level vancomycin resistance',
            conditions: ['Enterococcus gallinarum', 'Enterococcus casseliflavus', 'Vancomycin'],
            action: 'Report as Resistant',
            priority: 'high',
            status: 'active',
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            explanation: 'These species have intrinsic vanA gene variants that confer low-level vancomycin resistance.',
            references: ['CLSI M100-S32', 'EUCAST v12.0']
          },
          {
            id: 'ER-002',
            title: 'Staphylococcus QC Range Check',
            type: 'quality',
            description: 'Quality control ranges for Staphylococcus aureus ATCC 29213',
            conditions: ['S. aureus ATCC 29213', 'Oxacillin', 'QC'],
            action: 'Validate QC Range',
            priority: 'high',
            status: 'active',
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            explanation: 'Ensures proper antimicrobial susceptibility testing quality control.',
            references: ['CLSI M100-S32 Table 5A']
          },
          {
            id: 'ER-003',
            title: 'ESBL Phenotype Confirmation',
            type: 'phenotype',
            description: 'Confirm ESBL production in Enterobacteriaceae',
            conditions: ['Enterobacteriaceae', 'Ceftazidime', 'Ceftriaxone', 'ESBL'],
            action: 'Perform Confirmatory Test',
            priority: 'medium',
            status: 'active',
            updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            explanation: 'ESBL confirmation required when screening criteria are met.',
            references: ['CLSI M100-S32 Section 4.5']
          },
          {
            id: 'ER-004',
            title: 'Carbapenem Acquired Resistance',
            type: 'acquired',
            description: 'Detect acquired carbapenem resistance in Enterobacteriaceae',
            conditions: ['Enterobacteriaceae', 'Carbapenem', 'Acquired'],
            action: 'Report Resistance Mechanism',
            priority: 'high',
            status: 'active',
            updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            explanation: 'Carbapenemase production should be investigated and reported.',
            references: ['CLSI M100-S32 Section 4.4']
          },
          {
            id: 'ER-005',
            title: 'Streptococcus Reporting Guidance',
            type: 'reporting',
            description: 'Reporting guidance for Streptococcus pneumoniae',
            conditions: ['S. pneumoniae', 'Penicillin', 'Reporting'],
            action: 'Apply Reporting Rules',
            priority: 'medium',
            status: 'active',
            updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            explanation: 'Specific reporting requirements for pneumococcal isolates.',
            references: ['CLSI M100-S32 Table 2H']
          },
          {
            id: 'ER-006',
            title: 'Inactive Rule Example',
            type: 'quality',
            description: 'This is an inactive rule for demonstration',
            conditions: ['Example', 'Inactive'],
            action: 'No Action',
            priority: 'low',
            status: 'inactive',
            updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            explanation: 'This rule has been deactivated.',
            references: []
          }
        ];

        resolve(mockRules);
      }, 1000);
    });
  }

  filterAndDisplayRules() {
    let filtered = [...this.rules];

    // Filter by category
    if (this.currentCategory !== 'all') {
      filtered = filtered.filter(rule => rule.type === this.currentCategory);
    }

    // Filter by type (from filter chips)
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(rule => rule.type === this.currentFilter);
    }

    // Filter by status
    if (this.currentStatus !== 'all') {
      filtered = filtered.filter(rule => rule.status === this.currentStatus);
    }

    // Filter by search query
    if (this.searchQuery) {
      filtered = filtered.filter(rule =>
        rule.title.toLowerCase().includes(this.searchQuery) ||
        rule.description.toLowerCase().includes(this.searchQuery) ||
        rule.conditions.some(condition => 
          condition.toLowerCase().includes(this.searchQuery)
        )
      );
    }

    this.filteredRules = filtered;
    this.displayRules(filtered);
    this.updateCategoryCounts();
  }

  displayRules(rules) {
    const rulesList = document.getElementById('rulesList');
    const emptyState = document.getElementById('emptyState');
    
    if (!rulesList) return;

    if (rules.length === 0) {
      rulesList.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';
    rulesList.style.display = 'flex';

    const rulesHTML = rules.map(rule => this.createRuleCard(rule)).join('');
    rulesList.innerHTML = rulesHTML;

    // Add click handlers for rule cards
    this.setupRuleCardHandlers();
  }

  createRuleCard(rule) {
    const priorityClass = this.getPriorityClass(rule.priority);
    const typeClass = rule.type;
    const statusClass = rule.status;
    
    return `
      <div class="rule-card ${statusClass}" data-rule-id="${rule.id}">
        <div class="rule-header">
          <div class="rule-title">${rule.title}</div>
          <div class="rule-type ${typeClass}">${rule.type}</div>
        </div>

        <div class="rule-content">
          <div class="rule-description">${rule.description}</div>
          
          <div class="rule-conditions">
            ${rule.conditions.map(condition => 
              `<span class="rule-condition">${condition}</span>`
            ).join('')}
          </div>
        </div>

        <div class="rule-footer">
          <div class="rule-meta">
            <div class="rule-priority ${priorityClass}">
              Priority: ${rule.priority}
            </div>
            <div class="rule-updated">
              Updated: ${this.formatRelativeTime(rule.updatedAt)}
            </div>
          </div>
          
          <div class="rule-status ${statusClass}">
            <span class="rule-status-dot"></span>
            ${rule.status}
          </div>
        </div>

        <div class="rule-swipe-actions">
          <div class="rule-swipe-action" onclick="expertRulesMobile.editRule('${rule.id}')">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </div>
        </div>
      </div>
    `;
  }

  getPriorityClass(priority) {
    const priorityClasses = {
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    };
    return priorityClasses[priority] || 'low';
  }

  setupRuleCardHandlers() {
    const ruleCards = document.querySelectorAll('.rule-card');
    ruleCards.forEach(card => {
      // Click handler for viewing details
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on action buttons
        if (e.target.closest('.rule-swipe-action')) {
          return;
        }
        
        const ruleId = card.dataset.ruleId;
        this.viewRuleDetails(ruleId);
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

  viewRuleDetails(ruleId) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) return;

    const detailsHTML = this.createRuleDetailsHTML(rule);
    this.showBottomSheet(detailsHTML);
  }

  createRuleDetailsHTML(rule) {
    const typeClass = rule.type;
    const statusClass = rule.status;
    const priorityClass = this.getPriorityClass(rule.priority);
    
    return `
      <div class="rule-details">
        <div class="rule-details-header">
          <div class="rule-details-title">${rule.title}</div>
          <div class="rule-details-meta">
            <span class="rule-details-badge rule-type ${typeClass}">${rule.type}</span>
            <span class="rule-details-badge rule-priority ${priorityClass}">${rule.priority} priority</span>
            <span class="rule-details-badge rule-status ${statusClass}">${rule.status}</span>
          </div>
        </div>

        <div class="rule-details-section">
          <div class="rule-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Description
          </div>
          <div class="rule-details-content">${rule.description}</div>
        </div>

        <div class="rule-details-section">
          <div class="rule-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zM4 4v2h16V4H4zm0 16h16v2H4v-2z"/>
            </svg>
            Conditions
          </div>
          <ul class="rule-details-list">
            ${rule.conditions.map(condition => 
              `<li>${condition}</li>`
            ).join('')}
          </ul>
        </div>

        <div class="rule-details-section">
          <div class="rule-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            Action
          </div>
          <div class="rule-details-content">${rule.action}</div>
        </div>

        <div class="rule-details-section">
          <div class="rule-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M11 9h2V7h-2m1 13c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8m0-18A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2m-1 15h2v-6h-2v6z"/>
            </svg>
            Explanation
          </div>
          <div class="rule-details-content">${rule.explanation}</div>
        </div>

        <div class="rule-details-section">
          <div class="rule-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            References
          </div>
          ${rule.references.length > 0 ? 
            `<ul class="rule-details-list">
              ${rule.references.map(ref => `<li>${ref}</li>`).join('')}
            </ul>` :
            `<div class="rule-details-content">No references available</div>`
          }
        </div>

        <div class="rule-details-section">
          <div class="rule-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Rule Information
          </div>
          <div class="rule-details-grid">
            <div class="rule-details-field">
              <div class="rule-details-field-label">Rule ID</div>
              <div class="rule-details-field-value">${rule.id}</div>
            </div>
            <div class="rule-details-field">
              <div class="rule-details-field-label">Type</div>
              <div class="rule-details-field-value">${rule.type}</div>
            </div>
            <div class="rule-details-field">
              <div class="rule-details-field-label">Priority</div>
              <div class="rule-details-field-value">${rule.priority}</div>
            </div>
            <div class="rule-details-field">
              <div class="rule-details-field-label">Status</div>
              <div class="rule-details-field-value">${rule.status}</div>
            </div>
            <div class="rule-details-field">
              <div class="rule-details-field-label">Last Updated</div>
              <div class="rule-details-field-value">${this.formatDate(rule.updatedAt)}</div>
            </div>
          </div>
        </div>

        <div class="rule-details-actions">
          <button class="rule-action-btn" onclick="expertRulesMobile.editRule('${rule.id}')">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Edit
          </button>
          <button class="rule-action-btn" onclick="expertRulesMobile.duplicateRule('${rule.id}')">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
            Duplicate
          </button>
          <button class="rule-action-btn primary" onclick="expertRulesMobile.testRule('${rule.id}')">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            Test Rule
          </button>
        </div>
      </div>
    `;
  }

  updateCategoryCounts() {
    const allRulesCount = document.getElementById('allRulesCount');
    if (allRulesCount) {
      allRulesCount.textContent = this.filteredRules.length;
    }

    // Update individual category counts
    const categories = ['intrinsic', 'quality', 'acquired', 'phenotype', 'reporting'];
    categories.forEach(category => {
      const count = this.rules.filter(rule => rule.type === category).length;
      const categoryCard = document.querySelector(`[data-category="${category}"] .category-count`);
      if (categoryCard) {
        categoryCard.textContent = count;
      }
    });
  }

  showAddRuleForm() {
    this.showToast('Add rule functionality coming soon', 'info');
    // In a real implementation, this would show a form to add new rules
  }

  editRule(ruleId) {
    this.showToast('Edit rule functionality coming soon', 'info');
    // In a real implementation, this would show an edit form
  }

  duplicateRule(ruleId) {
    this.showToast('Duplicate rule functionality coming soon', 'info');
    // In a real implementation, this would duplicate the rule
  }

  testRule(ruleId) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) return;

    this.showToast('Testing rule...', 'info');
    
    // Mock rule testing
    setTimeout(() => {
      this.showToast(`Rule ${rule.id} test completed successfully`, 'success');
    }, 2000);
  }

  formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
}

// Auto-initialize expert rules mobile
document.addEventListener('DOMContentLoaded', () => {
  window.expertRulesMobile = new ExpertRulesMobile();
});