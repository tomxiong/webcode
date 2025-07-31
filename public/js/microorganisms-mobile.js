// Microorganisms Mobile JavaScript
class MicroorganismsMobile extends MobileBase {
  constructor() {
    super();
    this.currentView = 'list';
    this.currentFilter = 'all';
    this.currentGram = 'all';
    this.searchQuery = '';
    this.microorganisms = [];
    this.filteredMicroorganisms = [];
    this.treeData = {};
    this.initMicroorganisms();
  }

  initMicroorganisms() {
    this.setupViewToggle();
    this.setupFilters();
    this.setupSearch();
    this.setupFAB();
    this.loadMicroorganisms();
  }

  setupViewToggle() {
    const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
    viewToggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        viewToggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.currentView = btn.dataset.view;
        this.switchView();
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
        const filterType = chip.dataset.filter || chip.dataset.gram;
        const isGramFilter = chip.dataset.gram !== undefined;
        
        const siblings = chip.parentElement.querySelectorAll('.filter-chip');
        siblings.forEach(s => s.classList.remove('active'));
        chip.classList.add('active');
        
        if (isGramFilter) {
          this.currentGram = filterType;
        } else {
          this.currentFilter = filterType;
        }
        
        this.filterAndDisplayMicroorganisms();
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
        this.filterAndDisplayMicroorganisms();
        
        if (searchClear) {
          searchClear.style.display = this.searchQuery ? 'flex' : 'none';
        }
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        this.searchQuery = '';
        this.filterAndDisplayMicroorganisms();
        searchClear.style.display = 'none';
      });
    }
  }

  setupFAB() {
    const addMicroorganismFab = document.getElementById('addMicroorganismFab');
    if (addMicroorganismFab) {
      addMicroorganismFab.addEventListener('click', () => {
        this.showAddMicroorganismForm();
      });
    }
  }

  async loadMicroorganisms() {
    this.showLoading(true);
    
    try {
      const microorganisms = await this.fetchMicroorganisms();
      this.microorganisms = microorganisms;
      this.buildTreeData();
      this.filterAndDisplayMicroorganisms();
    } catch (error) {
      console.error('Failed to load microorganisms:', error);
      this.showToast('Failed to load microorganisms', 'error');
      this.showEmptyState();
    } finally {
      this.showLoading(false);
    }
  }

  async fetchMicroorganisms() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockMicroorganisms = [
          {
            id: 'MO-001',
            name: 'Escherichia coli',
            scientificName: 'Escherichia coli',
            level: 'species',
            code: 'ECOLI',
            gramStain: 'negative',
            parentId: 'GEN-001',
            parentName: 'Escherichia',
            properties: ['Gram-negative', 'Rod-shaped', 'Facultative anaerobe'],
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            description: 'Common gram-negative bacterium found in the intestinal tract',
            morphology: 'Rod-shaped, motile',
            habitat: 'Intestinal tract, environment',
            pathogenicity: 'Opportunistic pathogen',
            drugCount: 45,
            ruleCount: 12
          },
          {
            id: 'MO-002',
            name: 'Staphylococcus aureus',
            scientificName: 'Staphylococcus aureus',
            level: 'species',
            code: 'STAAU',
            gramStain: 'positive',
            parentId: 'GEN-002',
            parentName: 'Staphylococcus',
            properties: ['Gram-positive', 'Cocci', 'Catalase positive'],
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            description: 'Important gram-positive pathogen causing various infections',
            morphology: 'Spherical, clusters',
            habitat: 'Skin, mucous membranes',
            pathogenicity: 'Major pathogen',
            drugCount: 38,
            ruleCount: 15
          },
          {
            id: 'MO-003',
            name: 'Pseudomonas aeruginosa',
            scientificName: 'Pseudomonas aeruginosa',
            level: 'species',
            code: 'PSAER',
            gramStain: 'negative',
            parentId: 'GEN-003',
            parentName: 'Pseudomonas',
            properties: ['Gram-negative', 'Rod-shaped', 'Oxidase positive'],
            updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            description: 'Opportunistic pathogen with high antibiotic resistance',
            morphology: 'Rod-shaped, motile',
            habitat: 'Moist environments',
            pathogenicity: 'Opportunistic pathogen',
            drugCount: 32,
            ruleCount: 18
          },
          {
            id: 'GEN-001',
            name: 'Escherichia',
            scientificName: 'Escherichia',
            level: 'genus',
            code: 'ESCH',
            gramStain: 'negative',
            parentId: null,
            parentName: 'Enterobacteriaceae',
            properties: ['Gram-negative', 'Enterobacteriaceae family'],
            updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            description: 'Genus of gram-negative bacteria in the Enterobacteriaceae family',
            morphology: 'Rod-shaped',
            habitat: 'Intestinal tract',
            pathogenicity: 'Variable',
            drugCount: 0,
            ruleCount: 0
          },
          {
            id: 'GEN-002',
            name: 'Staphylococcus',
            scientificName: 'Staphylococcus',
            level: 'genus',
            code: 'STAPH',
            gramStain: 'positive',
            parentId: null,
            parentName: 'Staphylococcaceae',
            properties: ['Gram-positive', 'Cocci', 'Catalase positive'],
            updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            description: 'Genus of gram-positive bacteria commonly found on skin',
            morphology: 'Spherical, clusters',
            habitat: 'Skin, mucous membranes',
            pathogenicity: 'Variable',
            drugCount: 0,
            ruleCount: 0
          }
        ];

        resolve(mockMicroorganisms);
      }, 1000);
    });
  }

  buildTreeData() {
    this.treeData = {};
    
    // Group by genus
    this.microorganisms.forEach(micro => {
      if (micro.level === 'genus') {
        this.treeData[micro.id] = {
          ...micro,
          children: []
        };
      }
    });

    // Add species to their genus
    this.microorganisms.forEach(micro => {
      if (micro.level === 'species' && micro.parentId && this.treeData[micro.parentId]) {
        this.treeData[micro.parentId].children.push(micro);
      }
    });
  }

  switchView() {
    const listView = document.getElementById('microorganismsList');
    const treeView = document.getElementById('microorganismsTree');
    
    if (this.currentView === 'list') {
      listView.style.display = 'flex';
      treeView.style.display = 'none';
      this.displayMicroorganisms(this.filteredMicroorganisms);
    } else {
      listView.style.display = 'none';
      treeView.style.display = 'block';
      this.displayTreeView();
    }
  }

  filterAndDisplayMicroorganisms() {
    let filtered = [...this.microorganisms];

    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(micro => micro.level === this.currentFilter);
    }

    if (this.currentGram !== 'all') {
      filtered = filtered.filter(micro => micro.gramStain === this.currentGram);
    }

    if (this.searchQuery) {
      filtered = filtered.filter(micro =>
        micro.name.toLowerCase().includes(this.searchQuery) ||
        micro.scientificName.toLowerCase().includes(this.searchQuery) ||
        micro.code.toLowerCase().includes(this.searchQuery)
      );
    }

    this.filteredMicroorganisms = filtered;
    
    if (this.currentView === 'list') {
      this.displayMicroorganisms(filtered);
    } else {
      this.displayTreeView();
    }
  }

  displayMicroorganisms(microorganisms) {
    const microorganismsList = document.getElementById('microorganismsList');
    const emptyState = document.getElementById('emptyState');
    
    if (!microorganismsList) return;

    if (microorganisms.length === 0) {
      microorganismsList.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';
    microorganismsList.style.display = 'flex';

    const microorganismsHTML = microorganisms.map(micro => this.createMicroorganismCard(micro)).join('');
    microorganismsList.innerHTML = microorganismsHTML;

    this.setupMicroorganismCardHandlers();
  }

  createMicroorganismCard(microorganism) {
    const levelClass = microorganism.level;
    const gramClass = `gram-${microorganism.gramStain}`;
    
    return `
      <div class="microorganism-card" data-microorganism-id="${microorganism.id}">
        <div class="microorganism-header">
          <div class="microorganism-name">${microorganism.name}</div>
          <div class="microorganism-level ${levelClass}">${microorganism.level}</div>
        </div>

        <div class="microorganism-content">
          <div class="microorganism-scientific">${microorganism.scientificName}</div>
          <div class="microorganism-code">${microorganism.code}</div>
          
          <div class="microorganism-properties">
            ${microorganism.properties.map(prop => {
              const propClass = prop.toLowerCase().includes('gram') ? gramClass : '';
              return `<span class="microorganism-property ${propClass}">${prop}</span>`;
            }).join('')}
          </div>
        </div>

        <div class="microorganism-footer">
          <div class="microorganism-meta">
            ${microorganism.parentName ? 
              `<div class="microorganism-parent">Parent: ${microorganism.parentName}</div>` : 
              ''
            }
            <div class="microorganism-updated">Updated: ${this.formatRelativeTime(microorganism.updatedAt)}</div>
          </div>
          
          <div class="microorganism-stats">
            <div class="microorganism-stat">
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M7 2v2h1v14a4 4 0 0 0 4 4 4 4 0 0 0 4-4V4h1V2H7M9 4h6v14a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4Z"/>
              </svg>
              ${microorganism.drugCount}
            </div>
            <div class="microorganism-stat">
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              ${microorganism.ruleCount}
            </div>
          </div>
        </div>

        <div class="microorganism-swipe-actions">
          <div class="microorganism-swipe-action" onclick="microorganismsMobile.editMicroorganism('${microorganism.id}')">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </div>
        </div>
      </div>
    `;
  }

  displayTreeView() {
    const treeView = document.getElementById('microorganismsTree');
    if (!treeView) return;

    const treeHTML = Object.values(this.treeData).map(genus => this.createTreeNode(genus)).join('');
    treeView.innerHTML = treeHTML;

    this.setupTreeHandlers();
  }

  createTreeNode(genus) {
    return `
      <div class="tree-node">
        <div class="tree-node-header" data-node-id="${genus.id}">
          <button class="tree-toggle">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </button>
          <div class="tree-node-info">
            <div class="tree-node-name">${genus.name}</div>
            <div class="tree-node-count">${genus.children.length}</div>
          </div>
        </div>
        <div class="tree-node-children" data-children-id="${genus.id}">
          ${genus.children.map(child => this.createTreeChild(child)).join('')}
        </div>
      </div>
    `;
  }

  createTreeChild(species) {
    return `
      <div class="tree-child" data-microorganism-id="${species.id}">
        <div class="tree-child-name">${species.name}</div>
        <div class="tree-child-scientific">${species.scientificName}</div>
      </div>
    `;
  }

  setupTreeHandlers() {
    const treeHeaders = document.querySelectorAll('.tree-node-header');
    treeHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const nodeId = header.dataset.nodeId;
        const toggle = header.querySelector('.tree-toggle');
        const children = document.querySelector(`[data-children-id="${nodeId}"]`);
        
        if (children.classList.contains('expanded')) {
          children.classList.remove('expanded');
          toggle.classList.remove('expanded');
          header.classList.remove('expanded');
        } else {
          children.classList.add('expanded');
          toggle.classList.add('expanded');
          header.classList.add('expanded');
        }
      });
    });

    const treeChildren = document.querySelectorAll('.tree-child');
    treeChildren.forEach(child => {
      child.addEventListener('click', () => {
        const microorganismId = child.dataset.microorganismId;
        this.viewMicroorganismDetails(microorganismId);
      });
    });
  }

  setupMicroorganismCardHandlers() {
    const microorganismCards = document.querySelectorAll('.microorganism-card');
    microorganismCards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.microorganism-swipe-action')) {
          return;
        }
        
        const microorganismId = card.dataset.microorganismId;
        this.viewMicroorganismDetails(microorganismId);
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

  viewMicroorganismDetails(microorganismId) {
    const microorganism = this.microorganisms.find(m => m.id === microorganismId);
    if (!microorganism) return;

    const detailsHTML = this.createMicroorganismDetailsHTML(microorganism);
    this.showBottomSheet(detailsHTML);
  }

  createMicroorganismDetailsHTML(microorganism) {
    const levelClass = microorganism.level;
    const gramClass = `gram-${microorganism.gramStain}`;
    
    return `
      <div class="microorganism-details">
        <div class="microorganism-details-header">
          <div class="microorganism-details-title">${microorganism.name}</div>
          <div class="microorganism-details-scientific">${microorganism.scientificName}</div>
          <div class="microorganism-details-meta">
            <span class="microorganism-details-badge microorganism-level ${levelClass}">${microorganism.level}</span>
            <span class="microorganism-details-badge microorganism-property ${gramClass}">${microorganism.gramStain}</span>
          </div>
        </div>

        <div class="microorganism-details-section">
          <div class="microorganism-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Description
          </div>
          <div class="microorganism-details-content">${microorganism.description}</div>
        </div>

        <div class="microorganism-details-section">
          <div class="microorganism-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7.01 5 5 7.01 5 9.5S7.01 14 9.5 14 14 11.99 14 9.5 11.99 5 9.5 5Z"/>
            </svg>
            Morphology
          </div>
          <div class="microorganism-details-content">${microorganism.morphology}</div>
        </div>

        <div class="microorganism-details-section">
          <div class="microorganism-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Habitat
          </div>
          <div class="microorganism-details-content">${microorganism.habitat}</div>
        </div>

        <div class="microorganism-details-section">
          <div class="microorganism-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17L10.5 10.84L11.91 12.25L15.83 8.33L19.5 12H17V14H22V9H21Z"/>
            </svg>
            Pathogenicity
          </div>
          <div class="microorganism-details-content">${microorganism.pathogenicity}</div>
        </div>

        ${microorganism.parentName ? `
        <div class="microorganism-details-section">
          <div class="microorganism-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3h7z"/>
            </svg>
            Taxonomic Hierarchy
          </div>
          <div class="microorganism-details-hierarchy">
            <div class="hierarchy-level">
              <div class="hierarchy-name">${microorganism.parentName}</div>
              <div class="hierarchy-arrow">→</div>
            </div>
            <div class="hierarchy-level current">
              <div class="hierarchy-name">${microorganism.name}</div>
            </div>
          </div>
        </div>
        ` : ''}

        <div class="microorganism-details-section">
          <div class="microorganism-details-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            Microorganism Information
          </div>
          <div class="microorganism-details-grid">
            <div class="microorganism-details-field">
              <div class="microorganism-details-field-label">ID</div>
              <div class="microorganism-details-field-value code">${microorganism.id}</div>
            </div>
            <div class="microorganism-details-field">
              <div class="microorganism-details-field-label">Code</div>
              <div class="microorganism-details-field-value code">${microorganism.code}</div>
            </div>
            <div class="microorganism-details-field">
              <div class="microorganism-details-field-label">Level</div>
              <div class="microorganism-details-field-value">${microorganism.level}</div>
            </div>
            <div class="microorganism-details-field">
              <div class="microorganism-details-field-label">Gram Stain</div>
              <div class="microorganism-details-field-value">${microorganism.gramStain}</div>
            </div>
            <div class="microorganism-details-field">
              <div class="microorganism-details-field-label">Drugs</div>
              <div class="microorganism-details-field-value">${microorganism.drugCount}</div>
            </div>
            <div class="microorganism-details-field">
              <div class="microorganism-details-field-label">Rules</div>
              <div class="microorganism-details-field-value">${microorganism.ruleCount}</div>
            </div>
          </div>
        </div>

        <div class="microorganism-details-actions">
          <button class="microorganism-action-btn" onclick="microorganismsMobile.editMicroorganism('${microorganism.id}')">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Edit
          </button>
          <button class="microorganism-action-btn" onclick="microorganismsMobile.viewBreakpoints('${microorganism.id}')">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            Breakpoints
          </button>
          <button class="microorganism-action-btn primary" onclick="microorganismsMobile.viewHierarchy('${microorganism.id}')">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3h7z"/>
            </svg>
            Hierarchy
          </button>
        </div>
      </div>
    `;
  }

  showAddMicroorganismForm() {
    this.showToast('Add microorganism functionality coming soon', 'info');
  }

  editMicroorganism(microorganismId) {
    this.showToast('Edit microorganism functionality coming soon', 'info');
  }

  viewBreakpoints(microorganismId) {
    const microorganism = this.microorganisms.find(m => m.id === microorganismId);
    if (!microorganism) return;

    this.showToast(`Viewing breakpoints for ${microorganism.name}`, 'info');
  }

  viewHierarchy(microorganismId) {
    const microorganism = this.microorganisms.find(m => m.id === microorganismId);
    if (!microorganism) return;

    this.showToast(`Viewing hierarchy for ${microorganism.name}`, 'info');
  }

  formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
}

// Auto-initialize microorganisms mobile
document.addEventListener('DOMContentLoaded', () => {
  window.microorganismsMobile = new MicroorganismsMobile();
});