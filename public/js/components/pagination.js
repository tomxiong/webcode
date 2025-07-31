// Universal Pagination Component
class Pagination {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = {
      page: 1,
      pageSize: 20,
      total: 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: true,
      pageSizeOptions: [10, 20, 50, 100],
      maxVisiblePages: 7,
      onPageChange: () => {},
      onPageSizeChange: () => {},
      ...options
    };
    
    this.currentPage = this.options.page;
    this.pageSize = this.options.pageSize;
    this.total = this.options.total;
    
    this.render();
  }

  render() {
    if (!this.container) return;
    
    const totalPages = Math.ceil(this.total / this.pageSize);
    
    this.container.innerHTML = `
      <div class="pagination-wrapper">
        ${this.options.showTotal ? this.renderTotal() : ''}
        <div class="pagination-controls">
          ${this.renderNavigation(totalPages)}
          ${this.options.showSizeChanger ? this.renderSizeChanger() : ''}
          ${this.options.showQuickJumper ? this.renderQuickJumper(totalPages) : ''}
        </div>
      </div>
    `;
    
    this.bindEvents(totalPages);
  }

  renderTotal() {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.total);
    
    return `
      <div class="pagination-total">
        Showing ${start}-${end} of ${this.total} items
      </div>
    `;
  }

  renderNavigation(totalPages) {
    if (totalPages <= 1) return '';
    
    const pages = this.getVisiblePages(totalPages);
    
    return `
      <div class="pagination-nav">
        <button class="pagination-btn pagination-prev" ${this.currentPage <= 1 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
          Previous
        </button>
        
        <div class="pagination-pages">
          ${pages.map(page => {
            if (page === '...') {
              return '<span class="pagination-ellipsis">...</span>';
            }
            return `
              <button class="pagination-btn pagination-page ${page === this.currentPage ? 'active' : ''}" 
                      data-page="${page}">
                ${page}
              </button>
            `;
          }).join('')}
        </div>
        
        <button class="pagination-btn pagination-next" ${this.currentPage >= totalPages ? 'disabled' : ''}>
          Next
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>
      </div>
    `;
  }

  renderSizeChanger() {
    return `
      <div class="pagination-size-changer">
        <label>Show:</label>
        <select class="pagination-size-select">
          ${this.options.pageSizeOptions.map(size => 
            `<option value="${size}" ${size === this.pageSize ? 'selected' : ''}>${size}</option>`
          ).join('')}
        </select>
        <span>per page</span>
      </div>
    `;
  }

  renderQuickJumper(totalPages) {
    return `
      <div class="pagination-quick-jumper">
        <label>Go to:</label>
        <input type="number" class="pagination-jump-input" min="1" max="${totalPages}" 
               placeholder="${this.currentPage}">
        <button class="pagination-jump-btn">Go</button>
      </div>
    `;
  }

  getVisiblePages(totalPages) {
    const { maxVisiblePages } = this.options;
    const current = this.currentPage;
    
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const pages = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    // Always show first page
    pages.push(1);
    
    let start = Math.max(2, current - halfVisible);
    let end = Math.min(totalPages - 1, current + halfVisible);
    
    // Adjust range if we're near the beginning or end
    if (current <= halfVisible + 1) {
      end = maxVisiblePages - 1;
    } else if (current >= totalPages - halfVisible) {
      start = totalPages - maxVisiblePages + 2;
    }
    
    // Add ellipsis after first page if needed
    if (start > 2) {
      pages.push('...');
    }
    
    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (end < totalPages - 1) {
      pages.push('...');
    }
    
    // Always show last page (if not already included)
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  }

  bindEvents(totalPages) {
    // Previous button
    const prevBtn = this.container.querySelector('.pagination-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.goToPage(this.currentPage - 1);
        }
      });
    }
    
    // Next button
    const nextBtn = this.container.querySelector('.pagination-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.currentPage < totalPages) {
          this.goToPage(this.currentPage + 1);
        }
      });
    }
    
    // Page buttons
    const pageButtons = this.container.querySelectorAll('.pagination-page');
    pageButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        this.goToPage(page);
      });
    });
    
    // Page size changer
    const sizeSelect = this.container.querySelector('.pagination-size-select');
    if (sizeSelect) {
      sizeSelect.addEventListener('change', (e) => {
        const newSize = parseInt(e.target.value);
        this.changePageSize(newSize);
      });
    }
    
    // Quick jumper
    const jumpInput = this.container.querySelector('.pagination-jump-input');
    const jumpBtn = this.container.querySelector('.pagination-jump-btn');
    
    if (jumpInput && jumpBtn) {
      const handleJump = () => {
        const page = parseInt(jumpInput.value);
        if (page >= 1 && page <= totalPages) {
          this.goToPage(page);
          jumpInput.value = '';
        }
      };
      
      jumpBtn.addEventListener('click', handleJump);
      jumpInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleJump();
        }
      });
    }
  }

  goToPage(page) {
    if (page === this.currentPage) return;
    
    this.currentPage = page;
    this.render();
    this.options.onPageChange(page, this.pageSize);
  }

  changePageSize(newSize) {
    if (newSize === this.pageSize) return;
    
    // Calculate new page to maintain roughly the same position
    const currentItem = (this.currentPage - 1) * this.pageSize + 1;
    const newPage = Math.ceil(currentItem / newSize);
    
    this.pageSize = newSize;
    this.currentPage = newPage;
    this.render();
    this.options.onPageSizeChange(newPage, newSize);
  }

  updateTotal(newTotal) {
    this.total = newTotal;
    
    // Adjust current page if necessary
    const totalPages = Math.ceil(this.total / this.pageSize);
    if (this.currentPage > totalPages && totalPages > 0) {
      this.currentPage = totalPages;
    }
    
    this.render();
  }

  getCurrentPage() {
    return this.currentPage;
  }

  getPageSize() {
    return this.pageSize;
  }

  getTotal() {
    return this.total;
  }

  // Static method to create pagination
  static create(container, options) {
    return new Pagination(container, options);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Pagination;
} else {
  window.Pagination = Pagination;
}