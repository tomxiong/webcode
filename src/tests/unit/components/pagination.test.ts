// Pagination Component Unit Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock DOM environment
const mockContainer = {
  innerHTML: '',
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  addEventListener: vi.fn()
};

// Mock Pagination class (since we're testing the JS version)
class MockPagination {
  public container: any;
  public options: any;
  public currentPage: number;
  public pageSize: number;
  public total: number;

  constructor(container: any, options: any = {}) {
    this.container = container;
    this.options = {
      page: 1,
      pageSize: 20,
      total: 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: true,
      pageSizeOptions: [10, 20, 50, 100],
      maxVisiblePages: 7,
      onPageChange: vi.fn(),
      onPageSizeChange: vi.fn(),
      ...options
    };
    
    this.currentPage = this.options.page;
    this.pageSize = this.options.pageSize;
    this.total = this.options.total;
  }
// Pagination Component Unit Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock DOM environment
const mockContainer = {
  innerHTML: '',
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  addEventListener: vi.fn()
};

// Pagination Component Unit Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock DOM environment
const mockContainer = {
  innerHTML: '',
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  addEventListener: vi.fn()
};

// Mock Pagination class (since we're testing the JS version)
class MockPagination {
  constructor(container: any, options: any = {}) {
    this.container = container;
    this.options = {
      page: 1,
      pageSize: 20,
      total: 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: true,
      pageSizeOptions: [10, 20, 50, 100],
      maxVisiblePages: 7,
      onPageChange: vi.fn(),
      onPageSizeChange: vi.fn(),
      ...options
    };
    
    this.currentPage = this.options.page;
    this.pageSize = this.options.pageSize;
    this.total = this.options.total;
  }

  render() {
    const totalPages = Math.ceil(this.total / this.pageSize);
    this.container.innerHTML = `pagination-content-${totalPages}`;
  }

  goToPage(page: number) {
    if (page === this.currentPage) return;
    
    this.currentPage = page;
    this.render();
    this.options.onPageChange(page, this.pageSize);
  }

  changePageSize(newSize: number) {
    if (newSize === this.pageSize) return;
    
    const currentItem = (this.currentPage - 1) * this.pageSize + 1;
    const newPage = Math.ceil(currentItem / newSize);
    
    this.pageSize = newSize;
    this.currentPage = newPage;
    this.render();
    this.options.onPageSizeChange(newPage, newSize);
  }

  updateTotal(newTotal: number) {
    this.total = newTotal;
    
    const totalPages = Math.ceil(this.total / this.pageSize);
    if (this.currentPage > totalPages && totalPages > 0) {
      this.currentPage = totalPages;
    }
    
    this.render();
  }

  getVisiblePages(totalPages: number) {
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

  getCurrentPage() {
    return this.currentPage;
  }

  getPageSize() {
    return this.pageSize;
  }

  getTotal() {
    return this.total;
  }
}

describe('Pagination Component', () => {
  let pagination: MockPagination;
  let onPageChange: any;
  let onPageSizeChange: any;

  beforeEach(() => {
    onPageChange = vi.fn();
    onPageSizeChange = vi.fn();
    
    pagination = new MockPagination(mockContainer, {
      page: 1,
      pageSize: 20,
      total: 100,
      onPageChange,
      onPageSizeChange
    });
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(pagination.getCurrentPage()).toBe(1);
      expect(pagination.getPageSize()).toBe(20);
      expect(pagination.getTotal()).toBe(100);
    });

    it('should render pagination content', () => {
      pagination.render();
      expect(mockContainer.innerHTML).toContain('pagination-content-5');
    });
  });

  describe('Page Navigation', () => {
    it('should go to specified page', () => {
      pagination.goToPage(3);
      
      expect(pagination.getCurrentPage()).toBe(3);
      expect(onPageChange).toHaveBeenCalledWith(3, 20);
    });

    it('should not change page if same page is selected', () => {
      pagination.goToPage(1);
      
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('should handle page size change', () => {
      pagination.goToPage(3); // Go to page 3 (items 41-60)
      pagination.changePageSize(10);
      
      // Should calculate new page to maintain position
      expect(pagination.getCurrentPage()).toBe(5); // Item 41 is now on page 5
      expect(pagination.getPageSize()).toBe(10);
      expect(onPageSizeChange).toHaveBeenCalledWith(5, 10);
    });
  });

  describe('Total Update', () => {
    it('should update total and adjust current page if necessary', () => {
      pagination.goToPage(5); // Last page with 100 items
      pagination.updateTotal(50); // Reduce total to 50 items
      
      // Should adjust to last available page
      expect(pagination.getCurrentPage()).toBe(3); // 50 items / 20 per page = 3 pages
    });

    it('should not adjust page if still valid', () => {
      pagination.goToPage(2);
      pagination.updateTotal(150);
      
      expect(pagination.getCurrentPage()).toBe(2);
    });
  });

  describe('Visible Pages Calculation', () => {
    it('should return all pages when total pages <= maxVisiblePages', () => {
      const pages = pagination.getVisiblePages(5);
      expect(pages).toEqual([1, 2, 3, 4, 5]);
    });

    it('should include ellipsis for large page counts', () => {
      pagination.currentPage = 10;
      const pages = pagination.getVisiblePages(20);
      
      expect(pages).toContain('...');
      expect(pages[0]).toBe(1);
      expect(pages[pages.length - 1]).toBe(20);
    });

    it('should handle edge cases near beginning', () => {
      pagination.currentPage = 2;
      const pages = pagination.getVisiblePages(20);
      
      expect(pages[0]).toBe(1);
      expect(pages).not.toContain('...');
    });

    it('should handle edge cases near end', () => {
      pagination.currentPage = 19;
      const pages = pagination.getVisiblePages(20);
      
      expect(pages[pages.length - 1]).toBe(20);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero total items', () => {
      pagination.updateTotal(0);
      expect(pagination.getCurrentPage()).toBe(1);
    });

    it('should handle single page', () => {
      pagination.updateTotal(10); // Less than page size
      const pages = pagination.getVisiblePages(1);
      expect(pages).toEqual([1]);
    });

    it('should handle large page sizes', () => {
      pagination.changePageSize(1000);
      expect(pagination.getCurrentPage()).toBe(1);
      expect(pagination.getPageSize()).toBe(1000);
    });
  });
});

describe('Mobile Pagination Component', () => {
  let mobilePagination: any;
  let onLoadMore: any;
  let onPageChange: any;

  beforeEach(() => {
    onLoadMore = vi.fn();
    onPageChange = vi.fn();
    
    // Mock MobilePagination class
    mobilePagination = {
      currentPage: 1,
      pageSize: 20,
      total: 100,
      hasMore: true,
      loading: false,
      options: {
        mode: 'infinite',
        onLoadMore,
        onPageChange
      },
      
      loadMore: vi.fn(async () => {
        if (!mobilePagination.loading && mobilePagination.hasMore) {
          mobilePagination.loading = true;
          await onLoadMore(mobilePagination.currentPage + 1, mobilePagination.pageSize);
          mobilePagination.currentPage++;
          mobilePagination.loading = false;
        }
      }),
      
      updateTotal: vi.fn((newTotal: number) => {
        mobilePagination.total = newTotal;
        const totalPages = Math.ceil(newTotal / mobilePagination.pageSize);
        mobilePagination.hasMore = mobilePagination.currentPage < totalPages;
      }),
      
      reset: vi.fn(() => {
        mobilePagination.currentPage = 1;
        mobilePagination.loading = false;
        mobilePagination.hasMore = true;
      })
    };
  });

  describe('Infinite Scroll Mode', () => {
    it('should load more items when triggered', async () => {
      await mobilePagination.loadMore();
      
      expect(onLoadMore).toHaveBeenCalledWith(2, 20);
      expect(mobilePagination.currentPage).toBe(2);
    });

    it('should not load more when already loading', async () => {
      mobilePagination.loading = true;
      await mobilePagination.loadMore();
      
      expect(onLoadMore).not.toHaveBeenCalled();
    });

    it('should not load more when no more items', async () => {
      mobilePagination.hasMore = false;
      await mobilePagination.loadMore();
      
      expect(onLoadMore).not.toHaveBeenCalled();
    });
  });

  describe('Total Update', () => {
    it('should update hasMore flag correctly', () => {
      mobilePagination.currentPage = 3;
      mobilePagination.updateTotal(50); // 50 items / 20 per page = 2.5 pages
      
      expect(mobilePagination.hasMore).toBe(false);
    });

    it('should maintain hasMore when more pages available', () => {
      mobilePagination.currentPage = 2;
      mobilePagination.updateTotal(100);
      
      expect(mobilePagination.hasMore).toBe(true);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to initial state', () => {
      mobilePagination.currentPage = 5;
      mobilePagination.loading = true;
      mobilePagination.hasMore = false;
      
      mobilePagination.reset();
      
      expect(mobilePagination.currentPage).toBe(1);
      expect(mobilePagination.loading).toBe(false);
      expect(mobilePagination.hasMore).toBe(true);
    });
  });
});