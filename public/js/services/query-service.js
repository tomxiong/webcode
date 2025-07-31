// Enhanced Query Service
class QueryService {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '/api';
    this.defaultPageSize = options.defaultPageSize || 20;
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 5 * 60 * 1000; // 5 minutes
    this.debounceTimeout = null;
    this.debounceDelay = options.debounceDelay || 300;
  }

  // Main query method with pagination and filtering
  async query(endpoint, params = {}) {
    const queryParams = this.buildQueryParams({
      page: 1,
      pageSize: this.defaultPageSize,
      ...params
    });

    const cacheKey = `${endpoint}?${queryParams.toString()}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Query failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Query service error:', error);
      throw error;
    }
  }

  // Debounced search for real-time search inputs
  async debouncedQuery(endpoint, params = {}, callback) {
    return new Promise((resolve, reject) => {
      clearTimeout(this.debounceTimeout);
      
      this.debounceTimeout = setTimeout(async () => {
        try {
          const result = await this.query(endpoint, params);
          if (callback) callback(null, result);
          resolve(result);
        } catch (error) {
          if (callback) callback(error);
          reject(error);
        }
      }, this.debounceDelay);
    });
  }

  // Build query parameters from object
  buildQueryParams(params) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else if (typeof value === 'object') {
          queryParams.append(key, JSON.stringify(value));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
    
    return queryParams;
  }

  // Advanced search with multiple fields
  async advancedSearch(endpoint, searchConfig) {
    const {
      query = '',
      fields = [],
      filters = {},
      sortBy = '',
      sortOrder = 'asc',
      page = 1,
      pageSize = this.defaultPageSize,
      exact = false,
      caseSensitive = false
    } = searchConfig;

    const params = {
      page,
      pageSize,
      sortBy,
      sortOrder,
      search: query,
      searchFields: fields.join(','),
      exact: exact ? 'true' : 'false',
      caseSensitive: caseSensitive ? 'true' : 'false',
      ...filters
    };

    return this.query(endpoint, params);
  }

  // Get suggestions for autocomplete
  async getSuggestions(endpoint, field, query, limit = 10) {
    const params = {
      field,
      query,
      limit,
      suggestions: 'true'
    };

    return this.query(endpoint, params);
  }

  // Export data with current filters
  async exportData(endpoint, params = {}, format = 'csv') {
    const queryParams = this.buildQueryParams({
      ...params,
      export: 'true',
      format
    });

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  // Clear cache
  clearCache(pattern = null) {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalMemory: JSON.stringify(Array.from(this.cache.values())).length
    };
  }
}

// Query Builder Helper Class
class QueryBuilder {
  constructor() {
    this.params = {};
  }

  page(page) {
    this.params.page = page;
    return this;
  }

  pageSize(size) {
    this.params.pageSize = size;
    return this;
  }

  search(query, fields = []) {
    this.params.search = query;
    if (fields.length > 0) {
      this.params.searchFields = fields.join(',');
    }
    return this;
  }

  filter(key, value) {
    this.params[key] = value;
    return this;
  }

  filters(filterObj) {
    Object.assign(this.params, filterObj);
    return this;
  }

  sort(field, order = 'asc') {
    this.params.sortBy = field;
    this.params.sortOrder = order;
    return this;
  }

  dateRange(field, start, end) {
    this.params[`${field}_start`] = start;
    this.params[`${field}_end`] = end;
    return this;
  }

  build() {
    return { ...this.params };
  }

  static create() {
    return new QueryBuilder();
  }
}

// Advanced Filter Manager
class FilterManager {
  constructor() {
    this.filters = new Map();
    this.activeFilters = new Map();
  }

  // Register a filter type
  registerFilter(name, config) {
    this.filters.set(name, {
      type: config.type || 'text',
      label: config.label || name,
      options: config.options || [],
      multiple: config.multiple || false,
      operator: config.operator || 'equals',
      validation: config.validation || null,
      ...config
    });
  }

  // Set active filter value
  setFilter(name, value) {
    if (this.filters.has(name)) {
      const filter = this.filters.get(name);
      
      // Validate if validation function provided
      if (filter.validation && !filter.validation(value)) {
        throw new Error(`Invalid value for filter ${name}`);
      }
      
      this.activeFilters.set(name, value);
    }
  }

  // Remove active filter
  removeFilter(name) {
    this.activeFilters.delete(name);
  }

  // Clear all active filters
  clearFilters() {
    this.activeFilters.clear();
  }

  // Get active filters as query parameters
  getActiveFilters() {
    const result = {};
    
    for (const [name, value] of this.activeFilters) {
      const filter = this.filters.get(name);
      if (filter && value !== null && value !== undefined && value !== '') {
        result[name] = value;
      }
    }
    
    return result;
  }

  // Get filter configuration
  getFilterConfig(name) {
    return this.filters.get(name);
  }

  // Get all registered filters
  getAllFilters() {
    return Array.from(this.filters.entries()).map(([name, config]) => ({
      name,
      ...config
    }));
  }

  // Generate filter UI HTML
  generateFilterUI() {
    const filters = this.getAllFilters();
    
    return filters.map(filter => {
      switch (filter.type) {
        case 'select':
          return this.generateSelectFilter(filter);
        case 'date':
          return this.generateDateFilter(filter);
        case 'range':
          return this.generateRangeFilter(filter);
        case 'checkbox':
          return this.generateCheckboxFilter(filter);
        default:
          return this.generateTextFilter(filter);
      }
    }).join('');
  }

  generateSelectFilter(filter) {
    const currentValue = this.activeFilters.get(filter.name) || '';
    
    return `
      <div class="filter-group">
        <label class="filter-label">${filter.label}</label>
        <select class="filter-select" data-filter="${filter.name}" ${filter.multiple ? 'multiple' : ''}>
          <option value="">All</option>
          ${filter.options.map(option => 
            `<option value="${option.value}" ${option.value === currentValue ? 'selected' : ''}>
              ${option.label}
            </option>`
          ).join('')}
        </select>
      </div>
    `;
  }

  generateTextFilter(filter) {
    const currentValue = this.activeFilters.get(filter.name) || '';
    
    return `
      <div class="filter-group">
        <label class="filter-label">${filter.label}</label>
        <input type="text" class="filter-input" data-filter="${filter.name}" 
               value="${currentValue}" placeholder="Enter ${filter.label.toLowerCase()}...">
      </div>
    `;
  }

  generateDateFilter(filter) {
    const currentValue = this.activeFilters.get(filter.name) || '';
    
    return `
      <div class="filter-group">
        <label class="filter-label">${filter.label}</label>
        <input type="date" class="filter-input" data-filter="${filter.name}" value="${currentValue}">
      </div>
    `;
  }

  generateRangeFilter(filter) {
    const currentValue = this.activeFilters.get(filter.name) || { min: '', max: '' };
    
    return `
      <div class="filter-group">
        <label class="filter-label">${filter.label}</label>
        <div class="filter-range">
          <input type="number" class="filter-input" data-filter="${filter.name}_min" 
                 value="${currentValue.min}" placeholder="Min">
          <span class="filter-range-separator">-</span>
          <input type="number" class="filter-input" data-filter="${filter.name}_max" 
                 value="${currentValue.max}" placeholder="Max">
        </div>
      </div>
    `;
  }

  generateCheckboxFilter(filter) {
    const currentValue = this.activeFilters.get(filter.name) || [];
    
    return `
      <div class="filter-group">
        <label class="filter-label">${filter.label}</label>
        <div class="filter-checkboxes">
          ${filter.options.map(option => 
            `<label class="filter-checkbox-label">
              <input type="checkbox" class="filter-checkbox" data-filter="${filter.name}" 
                     value="${option.value}" ${currentValue.includes(option.value) ? 'checked' : ''}>
              ${option.label}
            </label>`
          ).join('')}
        </div>
      </div>
    `;
  }
}

}

// Export classes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QueryService, QueryBuilder, FilterManager };
} else {
  window.QueryService = QueryService;
  window.QueryBuilder = QueryBuilder;
  window.FilterManager = FilterManager;
}

// Global query service instance
window.globalQueryService = new QueryService();
