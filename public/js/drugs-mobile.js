// Drugs Mobile JavaScript
class DrugsMobile extends MobileBase {
  constructor() {
    super();
    this.currentCategory = 'all';
    this.currentFilter = 'all';
    this.currentStatus = 'all';
    this.searchQuery = '';
    this.drugs = [];
    this.filteredDrugs = [];
    this.initDrugs();
  }

  initDrugs() {
    this.setupCategories();
    this.setupFilters();
    this.setupSearch();
    this.setupFAB();
    this.loadDrugs();
  }

  setupCategories() {
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
      card.addEventListener('click', () => {
        categoryCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        this.currentCategory = card.dataset.category;
        this.filterAndDisplayDrugs();
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

    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const filterType = chip.dataset.filter || chip.dataset.status;
        const isStatusFilter = chip.dataset.status !== undefined;
        
        const siblings = chip.parentElement.querySelectorAll('.filter-chip');
        siblings.forEach(s => s.classList.remove('active'));
        chip.classList.add('active');
        
        if (isStatusFilter) {
          this.currentStatus = filterType;
        } else {
          this.currentFilter = filterType;
        }
        
        this.filterAndDisplayDrugs();
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
        this.filterAndDisplayDrugs();
        
        if (searchClear) {
          searchClear.style.display = this.searchQuery ? 'flex' : 'none';
        }
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        this.searchQuery = '';
        this.filterAndDisplayDrugs();
        searchClear.style.display = 'none';
      });
    }
  }

  setupFAB() {
    const addDrugFab = document.getElementById('addDrugFab');
    if (addDrugFab) {
      addDrugFab.addEventListener('click', () => {
        this.showAddDrugForm();
      });
    }
  }

  async loadDrugs() {
    this.showLoading(true);
    
    try {
      const drugs = await this.fetchDrugs();
      this.drugs = drugs;
      this.filterAndDisplayDrugs();
    } catch (error) {
      console.error('Failed to load drugs:', error);
      this.showToast('Failed to load drugs', 'error');
      this.showEmptyState();
    } finally {
      this.showLoading(false);
    }
  }

  async fetchDrugs() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockDrugs = [
          {
            id: 'DRG-001',
            name: 'Amoxicillin',
            genericName: 'Amoxicillin',
            drugClass: 'beta-lactam',
            code: 'AMX',
            route: 'Oral',
            properties: ['Penicillin', 'Broad-spectrum'],
            status: 'active',
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            description: 'Beta-lactam antibiotic effective against gram-positive and some gram-negative bacteria',
            mechanism: 'Inhibits bacterial cell wall synthesis',
            spectrum: 'Broad-spectrum',
            resistance: 'Beta-lactamase susceptible'
          },
          {
            id: 'DRG-002',
            name: 'Gentamicin',
            genericName: 'Gentamicin sulfate',
            drugClass: 'aminoglycoside',
            code: 'GEN',
            route: 'IV/IM',
            properties: ['Bactericidal', 'Concentration-dependent'],
            status: 'active',
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            description: 'Aminoglycoside antibiotic with excellent gram-negative coverage',
            mechanism: 'Inhibits protein synthesis by binding to 30S ribosomal subunit',
            spectrum: 'Gram-negative, some gram-positive',
            resistance: 'Enzymatic modification'
          },
          {
            id: 'DRG-003',
            name: 'Ciprofloxacin',
            genericName: 'Ciprofloxacin hydrochloride',
            drugClass: 'fluoroquinolone',
            code: 'CIP',
            route: 'Oral/IV',
            properties: ['Bactericidal', 'DNA gyrase inhibitor'],
            status: 'active',
            updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            description: 'Fluoroquinolone with broad-spectrum activity',
            mechanism: 'Inhibits DNA gyrase and topoisomerase IV',
            spectrum: 'Broad-spectrum including Pseudomonas',
            resistance: 'Target modification, efflux pumps'
          },
          {
            id: 'DRG-004',
            name: 'Vancomycin',
            genericName: 'Vancomycin hydrochloride',
            drugClass: 'glycopeptide',
            code: 'VAN',
            route: 'IV',
            properties: ['Bactericidal', 'Cell wall inhibitor'],
            status: 'active',
            updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            description: 'Glycopeptide antibiotic for serious gram-positive infections',
            mechanism: 'Inhibits cell wall synthesis by binding to D-Ala-D-Ala',
            spectrum: 'Gram-positive including MRSA',
            resistance: 'vanA, vanB gene clusters'
          },
          {
            id: 'DRG-005',
            name: 'Penicillin G',
            genericName: 'Benzylpenicillin',
            drugClass: 'beta-lactam',
            code: 'PEN',
            route: 'IV/IM',
            properties: ['Narrow-spectrum', 'Time-dependent'],
            status: 'deprecated',
            updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            description: 'Classic penicillin with narrow spectrum activity',
            mechanism: 'Inhibits transpeptidation in cell wall synthesis',
            spectrum: 'Gram-positive, some gram-negative',
            resistance: 'Beta-lactamase production'
          }
        ];

        resolve(mockDrugs);
      }, 1000);
    });
  }

  filterAndDisplayDrugs() {
    let filtered = [...this.drugs];

    if (this.currentCategory !== 'all') {
      filtered = filtered.filter(drug => drug.drugClass === this.currentCategory);
    }

    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(drug => drug.drugClass === this.currentFilter);
    }

    if (this.currentStatus !== 'all') {
      filtered = filtered.filter(drug => drug.status === this.currentStatus);
    }

    if (this.searchQuery) {
      filtered = filtered.filter(drug =>
        drug.name.toLowerCase().includes(this.searchQuery) ||
        drug.genericName.toLowerCase().includes(this.searchQuery) ||
        drug.code.toLowerCase().includes(this.searchQuery) ||
        drug.drugClass.toLowerCase().includes(this.searchQuery)
      );
    }

    this.filteredDrugs = filtered;
    this.displayDrugs(filtered);
    this.updateCategoryCounts();
  }

  displayDrugs(drugs) {
    const drugsList = document.getElementById('drugsList');
    const emptyState = document.getElementById('emptyState');
    
    if (!drugsList) return;

    if (drugs.length === 0) {
      drugsList.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';
    drugsList.style.display = 'flex';

    const drugsHTML = drugs.map(drug => this.createDrugCard(drug)).join('');
    drugsList.innerHTML = drugsHTML;

    this.setupDrugCardHandlers();
  }

  createDrugCard(drug) {
    const statusClass = drug.status;
    const classType = drug.drugClass;
    
    return `
      <div class="drug-card ${statusClass}" data-drug-id="${drug.id}">
        <div class="drug-header">
          <div class="drug-name">${drug.name}</div>
          <div class="drug-class ${classType}">${drug.drugClass}</div>
        </div>

        <div class="drug-content">
          <div class="drug-generic-name">${drug.genericName}</div>
          <div class="drug-code">${drug.code}</div>
          
          <div class="drug-properties">
            ${drug.properties.map(prop => 
              `<span class="drug-property">${prop}</span>`
            ).join('')}
          </div>
        </div>

        <div class="drug-footer">
          <div class="drug-meta">
            <div class="drug-route">Route: ${drug.route}</div>
            <div class="drug-updated">Updated: ${this.formatRelativeTime(drug.updatedAt)}</div>
          </div>
          
          <div class="drug-status ${statusClass}">
            <span class="drug-status-dot"></span>
            ${drug.status}
          </div>
        </div>

        <div class="drug-swipe-actions">
          <div class="drug-swipe-action" onclick="drugsMobile.editDrug('${drug.id}')">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </div>
        </div>
      </div>
    `;
  }

  setupDrugCardHandlers() {
    const drugCards = document.querySelectorAll('.drug-card');
    drugCards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.drug-swipe-action')) {
          return;
        }
        
        const drugId = card.dataset.drugId;
        this.viewDrugDetails(drugId);
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

  viewDrugDetails(drugId) {
    const drug = this.drugs.find(d => d.id === drugId);
    if (!drug) return;

    const detailsHTML = this.createDrugDetailsHTML(drug);
    this.showBottomSheet(detailsHTML);
  }

  createDrugDetailsHTML(drug) {
    const statusClass = drug.status;
    const classType = drug.drugClass;
    
    return `
      <div class="drug-details">
        <div class="drug-details-header">
          <div class="drug-details-title">${drug.name}</div>
          <div class="drug-details-generic">${drug.genericName}</div>
          <div class="drug-details-meta">
            <span class="drug-details-badge drug-class ${classType}">${drug.drugClass}</span>
            <span class="drug-details-badge drug-status ${statusClass}">${drug.status}</span>
          </div>
        </div>

        <div class="drug-details-section">
          <div class="drug-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Description
          </div>
          <div class="drug-details-content">${drug.description}</div>
        </div>

        <div class="drug-details-section">
          <div class="drug-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7.01 5 5 7.01 5 9.5S7.01 14 9.5 14 14 11.99 14 9.5 11.99 5 9.5 5Z"/>
            </svg>
            Mechanism of Action
          </div>
          <div class="drug-details-content">${drug.mechanism}</div>
        </div>

        <div class="drug-details-section">
          <div class="drug-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Antimicrobial Spectrum
          </div>
          <div class="drug-details-content">${drug.spectrum}</div>
        </div>

        <div class="drug-details-section">
          <div class="drug-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17L10.5 10.84L11.91 12.25L15.83 8.33L19.5 12H17V14H22V9H21ZM7.91 17.25L9.33 15.83L8.5 15L7.08 16.42L5.17 14.5L3.75 15.91L7.91 20.08L3.75 24.25L5.17 25.67L7.08 23.75L8.5 25.17L9.91 23.75L7.91 21.75V17.25Z"/>
            </svg>
            Resistance Mechanisms
          </div>
          <div class="drug-details-content">${drug.resistance}</div>
        </div>

        <div class="drug-details-section">
          <div class="drug-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            Drug Information
          </div>
          <div class="drug-details-grid">
            <div class="drug-details-field">
              <div class="drug-details-field-label">Drug ID</div>
              <div class="drug-details-field-value code">${drug.id}</div>
            </div>
            <div class="drug-details-field">
              <div class="drug-details-field-label">Code</div>
              <div class="drug-details-field-value code">${drug.code}</div>
            </div>
            <div class="drug-details-field">
              <div class="drug-details-field-label">Class</div>
              <div class="drug-details-field-value">${drug.drugClass}</div>
            </div>
            <div class="drug-details-field">
              <div class="drug-details-field-label">Route</div>
              <div class="drug-details-field-value">${drug.route}</div>
            </div>
            <div class="drug-details-field">
              <div class="drug-details-field-label">Status</div>
              <div class="drug-details-field-value">${drug.status}</div>
            </div>
            <div class="drug-details-field">
              <div class="drug-details-field-label">Last Updated</div>
              <div class="drug-details-field-value">${this.formatDate(drug.updatedAt)}</div>
            </div>
          </div>
        </div>

        <div class="drug-details-actions">
          <button class="drug-action-btn" onclick="drugsMobile.editDrug('${drug.id}')">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Edit
          </button>
          <button class="drug-action-btn" onclick="drugsMobile.viewBreakpoints('${drug.id}')">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            Breakpoints
          </button>
          <button class="drug-action-btn primary" onclick="drugsMobile.testDrug('${drug.id}')">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            Test Drug
          </button>
        </div>
      </div>
    `;
  }

  updateCategoryCounts() {
    const allDrugsCount = document.getElementById('allDrugsCount');
    if (allDrugsCount) {
      allDrugsCount.textContent = this.filteredDrugs.length;
    }

    const categories = ['beta-lactam', 'aminoglycoside', 'fluoroquinolone', 'glycopeptide'];
    categories.forEach(category => {
      const count = this.drugs.filter(drug => drug.drugClass === category).length;
      const categoryCard = document.querySelector(`[data-category="${category}"] .category-count`);
      if (categoryCard) {
        categoryCard.textContent = count;
      }
    });
  }

  showAddDrugForm() {
    this.showToast('Add drug functionality coming soon', 'info');
  }

  editDrug(drugId) {
    this.showToast('Edit drug functionality coming soon', 'info');
  }

  viewBreakpoints(drugId) {
    const drug = this.drugs.find(d => d.id === drugId);
    if (!drug) return;

    this.showToast(`Viewing breakpoints for ${drug.name}`, 'info');
  }

  testDrug(drugId) {
    const drug = this.drugs.find(d => d.id === drugId);
    if (!drug) return;

    this.showToast('Testing drug...', 'info');
    
    setTimeout(() => {
      this.showToast(`Drug ${drug.name} test completed successfully`, 'success');
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

// Auto-initialize drugs mobile
document.addEventListener('DOMContentLoaded', () => {
  window.drugsMobile = new DrugsMobile();
});