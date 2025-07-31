// Mobile Pagination Component
class MobilePagination {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = {
      page: 1,
      pageSize: 20,
      total: 0,
      mode: 'infinite', // 'infinite', 'pages', 'loadmore'
      threshold: 100, // pixels from bottom to trigger load
      maxVisiblePages: 5,
      showTotal: true,
      onPageChange: () => {},
      onLoadMore: () => {},
      loadingText: 'Loading more...',
      noMoreText: 'No more items',
      ...options
    };
    
    this.currentPage = this.options.page;
    this.pageSize = this.options.pageSize;
    this.total = this.options.total;
    this.loading = false;
    this.hasMore = true;
    
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    if (!this.container) return;
    
    const totalPages = Math.ceil(this.total / this.pageSize);
    this.hasMore = this.currentPage < totalPages;
    
    switch (this.options.mode) {
      case 'infinite':
        this.renderInfiniteScroll();
        break;
      case 'loadmore':
        this.renderLoadMore();
        break;
      case 'pages':
        this.renderPageButtons(totalPages);
        break;
    }
  }

  renderInfiniteScroll() {
    this.container.innerHTML = `
      <div class="mobile-pagination infinite-scroll">
        ${this.options.showTotal ? this.renderTotal() : ''}
        <div class="infinite-scroll-trigger" id="infiniteScrollTrigger" 
             style="display: ${this.hasMore ? 'block' : 'none'}">
          <div class="infinite-scroll-loading">
            <div class="loading-spinner"></div>
            <span class="loading-text">${this.options.loadingText}</span>
          </div>
        </div>
        <div class="infinite-scroll-end" style="display: ${!this.hasMore ? 'block' : 'none'}">
          ${this.options.noMoreText}
        </div>
      </div>
    `;
  }

  renderLoadMore() {
    this.container.innerHTML = `
      <div class="mobile-pagination load-more">
        ${this.options.showTotal ? this.renderTotal() : ''}
        <button class="load-more-btn" id="loadMoreBtn" 
                style="display: ${this.hasMore ? 'block' : 'none'}"
                ${this.loading ? 'disabled' : ''}>
          ${this.loading ? 
            `<div class="loading-spinner"></div> ${this.options.loadingText}` : 
            'Load More'
          }
        </button>
        <div class="load-more-end" style="display: ${!this.hasMore ? 'block' : 'none'}">
          ${this.options.noMoreText}
        </div>
      </div>
    `;
  }

  renderPageButtons(totalPages) {
    if (totalPages <= 1) {
      this.container.innerHTML = this.options.showTotal ? this.renderTotal() : '';
      return;
    }
    
    const pages = this.getVisiblePages(totalPages);
    
    this.container.innerHTML = `
      <div class="mobile-pagination page-buttons">
        ${this.options.showTotal ? this.renderTotal() : ''}
        <div class="pagination-controls">
          <button class="pagination-btn prev-btn" ${this.currentPage <= 1 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          
          <div class="pagination-pages">
            ${pages.map(page => {
              if (page === '...') {
                return '<span class="pagination-ellipsis">...</span>';
              }
              return `
                <button class="pagination-btn page-btn ${page === this.currentPage ? 'active' : ''}" 
                        data-page="${page}">
                  ${page}
                </button>
              `;
            }).join('')}
          </div>
          
          <button class="pagination-btn next-btn" ${this.currentPage >= totalPages ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  renderTotal() {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.total);
    
    return `
      <div class="mobile-pagination-total">
        ${start}-${end} of ${this.total}
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
    
    let start = Math.max(1, current - halfVisible);
    let end = Math.min(totalPages, current + halfVisible);
    
    // Adjust range to always show maxVisiblePages
    if (end - start + 1 < maxVisiblePages) {
      if (start === 1) {
        end = Math.min(totalPages, start + maxVisiblePages - 1);
      } else {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
    }
    
    // Add ellipsis if needed
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('...');
      }
    }
    
    // Add visible pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Add ellipsis and last page if needed
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  }

  bindEvents() {
    if (this.options.mode === 'infinite') {
      this.bindInfiniteScroll();
    } else if (this.options.mode === 'loadmore') {
      this.bindLoadMore();
    } else if (this.options.mode === 'pages') {
      this.bindPageButtons();
    }
  }

  bindInfiniteScroll() {
    let isObserving = false;
    
    const observeInfiniteScroll = () => {
      const trigger = document.getElementById('infiniteScrollTrigger');
      if (!trigger || isObserving) return;
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && this.hasMore && !this.loading) {
            this.loadMore();
          }
        });
      }, {
        rootMargin: `${this.options.threshold}px`
      });
      
      observer.observe(trigger);
      isObserving = true;
    };
    
    // Observe after a short delay to ensure DOM is ready
    setTimeout(observeInfiniteScroll, 100);
  }

  bindLoadMore() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        if (!this.loading && this.hasMore) {
          this.loadMore();
        }
      });
    }
  }

  bindPageButtons() {
    // Previous button
    const prevBtn = this.container.querySelector('.prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.goToPage(this.currentPage - 1);
        }
      });
    }
    
    // Next button
    const nextBtn = this.container.querySelector('.next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(this.total / this.pageSize);
        if (this.currentPage < totalPages) {
          this.goToPage(this.currentPage + 1);
        }
      });
    }
    
    // Page buttons
    const pageButtons = this.container.querySelectorAll('.page-btn');
    pageButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        this.goToPage(page);
      });
    });
  }

  async loadMore() {
    if (this.loading || !this.hasMore) return;
    
    this.loading = true;
    this.updateLoadingState();
    
    try {
      const nextPage = this.currentPage + 1;
      await this.options.onLoadMore(nextPage, this.pageSize);
      this.currentPage = nextPage;
      
      const totalPages = Math.ceil(this.total / this.pageSize);
      this.hasMore = this.currentPage < totalPages;
      
    } catch (error) {
      console.error('Load more failed:', error);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  goToPage(page) {
    if (page === this.currentPage) return;
    
    this.currentPage = page;
    this.render();
    this.options.onPageChange(page, this.pageSize);
  }

  updateLoadingState() {
    if (this.options.mode === 'loadmore') {
      const loadMoreBtn = document.getElementById('loadMoreBtn');
      if (loadMoreBtn) {
        loadMoreBtn.disabled = this.loading;
        loadMoreBtn.innerHTML = this.loading ? 
          `<div class="loading-spinner"></div> ${this.options.loadingText}` : 
          'Load More';
      }
    }
  }

  updateTotal(newTotal) {
    this.total = newTotal;
    const totalPages = Math.ceil(this.total / this.pageSize);
    this.hasMore = this.currentPage < totalPages;
    
    // Adjust current page if necessary
    if (this.currentPage > totalPages && totalPages > 0) {
      this.currentPage = totalPages;
    }
    
    this.render();
  }

  setLoading(loading) {
    this.loading = loading;
    this.updateLoadingState();
  }

  reset() {
    this.currentPage = 1;
    this.loading = false;
    this.hasMore = true;
    this.render();
  }

  // Change pagination mode
  setMode(mode) {
    this.options.mode = mode;
    this.render();
    this.bindEvents();
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

  // Static method to create mobile pagination
  static create(container, options) {
    return new MobilePagination(container, options);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobilePagination;
} else {
  window.MobilePagination = MobilePagination;
}