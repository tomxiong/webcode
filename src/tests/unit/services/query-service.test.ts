// Query Service Unit Tests
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Mock QueryService class
class MockQueryService {
  private baseUrl: string;
  private defaultPageSize: number;
  private cache: Map<string, any>;
  private cacheTimeout: number;

  constructor(options: any = {}) {
    this.baseUrl = options.baseUrl || '/api';
    this.defaultPageSize = options.defaultPageSize || 20;
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 5 * 60 * 1000;
  }

  buildQueryParams(params: any) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          (value as any[]).forEach(v => queryParams.append(key, v));
        } else if (typeof value === 'object') {
          queryParams.append(key, JSON.stringify(value));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
    
    return queryParams;
  }

  async query(endpoint: string, params: any = {}) {
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
  }

  async advancedSearch(endpoint: string, searchConfig: any) {
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

  clearCache(pattern?: string) {
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

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalMemory: JSON.stringify(Array.from(this.cache.values())).length
    };
  }
}

// Mock QueryBuilder class
class MockQueryBuilder {
  private params: any = {};

  page(page: number) {
    this.params.page = page;
    return this;
  }

  pageSize(size: number) {
    this.params.pageSize = size;
    return this;
  }

  search(query: string, fields: string[] = []) {
    this.params.search = query;
    if (fields.length > 0) {
      this.params.searchFields = fields.join(',');
    }
    return this;
  }

  filter(key: string, value: any) {
    this.params[key] = value;
    return this;
  }

  filters(filterObj: any) {
    Object.assign(this.params, filterObj);
    return this;
  }

  sort(field: string, order: string = 'asc') {
    this.params.sortBy = field;
    this.params.sortOrder = order;
    return this;
  }

  dateRange(field: string, start: string, end: string) {
    this.params[`${field}_start`] = start;
    this.params[`${field}_end`] = end;
    return this;
  }

  build() {
    return { ...this.params };
  }

  static create() {
    return new MockQueryBuilder();
  }
}

// Mock FilterManager class
class MockFilterManager {
  private filters: Map<string, any> = new Map();
  private activeFilters: Map<string, any> = new Map();

  registerFilter(name: string, config: any) {
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

  setFilter(name: string, value: any) {
    if (this.filters.has(name)) {
      const filter = this.filters.get(name);
      
      if (filter.validation && !filter.validation(value)) {
        throw new Error(`Invalid value for filter ${name}`);
      }
      
      this.activeFilters.set(name, value);
    }
  }

  removeFilter(name: string) {
    this.activeFilters.delete(name);
  }

  clearFilters() {
    this.activeFilters.clear();
  }

  getActiveFilters() {
    const result: any = {};
    
    for (const [name, value] of this.activeFilters) {
      const filter = this.filters.get(name);
      if (filter && value !== null && value !== undefined && value !== '') {
        result[name] = value;
      }
    }
    
    return result;
  }

  getFilterConfig(name: string) {
    return this.filters.get(name);
  }

  getAllFilters() {
    return Array.from(this.filters.entries()).map(([name, config]) => ({
      name,
      ...config
    }));
  }
}

describe('QueryService', () => {
  let queryService: MockQueryService;
  let mockFetch: any;

  beforeEach(() => {
    queryService = new MockQueryService({
      baseUrl: '/api',
      defaultPageSize: 20
    });
    
    mockFetch = vi.mocked(fetch);
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Query Parameters Building', () => {
    it('should build query parameters correctly', () => {
      const params = {
        page: 1,
        pageSize: 20,
        search: 'test',
        filters: { status: 'active' }
      };

      const queryParams = queryService.buildQueryParams(params);
      
      expect(queryParams.get('page')).toBe('1');
      expect(queryParams.get('pageSize')).toBe('20');
      expect(queryParams.get('search')).toBe('test');
      expect(queryParams.get('filters')).toBe('{"status":"active"}');
    });

    it('should handle array values', () => {
      const params = {
        tags: ['tag1', 'tag2', 'tag3']
      };

      const queryParams = queryService.buildQueryParams(params);
      expect(queryParams.getAll('tags')).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should skip null and undefined values', () => {
      const params = {
        page: 1,
        search: null,
        filter: undefined,
        status: ''
      };

      const queryParams = queryService.buildQueryParams(params);
      
      expect(queryParams.get('page')).toBe('1');
      expect(queryParams.get('search')).toBeNull();
      expect(queryParams.get('filter')).toBeNull();
      expect(queryParams.get('status')).toBeNull();
    });
  });

  describe('Basic Query', () => {
    it('should make successful query', async () => {
      const mockResponse = {
        data: [{ id: 1, name: 'Test' }],
        total: 1,
        page: 1,
        pageSize: 20
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await queryService.query('/samples', { page: 1 });
      
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/samples?page=1&pageSize=20');
    });

    it('should handle query errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(queryService.query('/samples')).rejects.toThrow('Query failed: 404 Not Found');
    });
  });

  describe('Advanced Search', () => {
    it('should build advanced search parameters', async () => {
      const mockResponse = { data: [], total: 0 };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const searchConfig = {
        query: 'test search',
        fields: ['name', 'description'],
        filters: { status: 'active' },
        sortBy: 'name',
        sortOrder: 'desc',
        page: 2,
        pageSize: 10,
        exact: true,
        caseSensitive: false
      };

      await queryService.advancedSearch('/samples', searchConfig);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/samples?')
      );
      
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('search=test+search');
      expect(callUrl).toContain('searchFields=name%2Cdescription');
      expect(callUrl).toContain('status=active');
      expect(callUrl).toContain('sortBy=name');
      expect(callUrl).toContain('sortOrder=desc');
      expect(callUrl).toContain('page=2');
      expect(callUrl).toContain('pageSize=10');
      expect(callUrl).toContain('exact=true');
      expect(callUrl).toContain('caseSensitive=false');
    });
  });

  describe('Caching', () => {
    it('should cache successful responses', async () => {
      const mockResponse = { data: [{ id: 1 }] };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // First call
      await queryService.query('/samples');
      
      // Second call should use cache
      const result = await queryService.query('/samples');
      
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should clear cache by pattern', async () => {
      const mockResponse = { data: [] };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      // Make some cached requests
      await queryService.query('/samples');
      await queryService.query('/users');
      
      // Clear samples cache
      queryService.clearCache('samples');
      
      const stats = queryService.getCacheStats();
      expect(stats.keys.some(key => key.includes('users'))).toBe(true);
      expect(stats.keys.some(key => key.includes('samples'))).toBe(false);
    });

    it('should provide cache statistics', async () => {
      const mockResponse = { data: [] };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      await queryService.query('/samples');
      await queryService.query('/users');
      
      const stats = queryService.getCacheStats();
      
      expect(stats.size).toBe(2);
      expect(stats.keys).toHaveLength(2);
      expect(typeof stats.totalMemory).toBe('number');
    });
  });
});

describe('QueryBuilder', () => {
  let queryBuilder: MockQueryBuilder;

  beforeEach(() => {
    queryBuilder = MockQueryBuilder.create();
  });

  it('should build query with page parameters', () => {
    const query = queryBuilder
      .page(2)
      .pageSize(50)
      .build();

    expect(query).toEqual({
      page: 2,
      pageSize: 50
    });
  });

  it('should build query with search parameters', () => {
    const query = queryBuilder
      .search('test query', ['name', 'description'])
      .build();

    expect(query).toEqual({
      search: 'test query',
      searchFields: 'name,description'
    });
  });

  it('should build query with filters', () => {
    const query = queryBuilder
      .filter('status', 'active')
      .filters({ priority: 'high', type: 'urgent' })
      .build();

    expect(query).toEqual({
      status: 'active',
      priority: 'high',
      type: 'urgent'
    });
  });

  it('should build query with sorting', () => {
    const query = queryBuilder
      .sort('createdAt', 'desc')
      .build();

    expect(query).toEqual({
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  });

  it('should build query with date range', () => {
    const query = queryBuilder
      .dateRange('createdAt', '2024-01-01', '2024-12-31')
      .build();

    expect(query).toEqual({
      createdAt_start: '2024-01-01',
      createdAt_end: '2024-12-31'
    });
  });

  it('should build complex query', () => {
    const query = queryBuilder
      .page(3)
      .pageSize(25)
      .search('blood culture', ['type', 'description'])
      .filter('status', 'processing')
      .sort('receivedDate', 'desc')
      .dateRange('collectionDate', '2024-01-01', '2024-01-31')
      .build();

    expect(query).toEqual({
      page: 3,
      pageSize: 25,
      search: 'blood culture',
      searchFields: 'type,description',
      status: 'processing',
      sortBy: 'receivedDate',
      sortOrder: 'desc',
      collectionDate_start: '2024-01-01',
      collectionDate_end: '2024-01-31'
    });
  });
});

describe('FilterManager', () => {
  let filterManager: MockFilterManager;

  beforeEach(() => {
    filterManager = new MockFilterManager();
  });

  describe('Filter Registration', () => {
    it('should register filters with default values', () => {
      filterManager.registerFilter('status', {
        type: 'select',
        options: [{ value: 'active', label: 'Active' }]
      });

      const filter = filterManager.getFilterConfig('status');
      
      expect(filter).toEqual({
        type: 'select',
        label: 'status',
        options: [{ value: 'active', label: 'Active' }],
        multiple: false,
        operator: 'equals',
        validation: null
      });
    });

    it('should register filters with custom configuration', () => {
      filterManager.registerFilter('priority', {
        type: 'select',
        label: 'Priority Level',
        options: [
          { value: 'low', label: 'Low' },
          { value: 'high', label: 'High' }
        ],
        multiple: true,
        operator: 'in'
      });

      const filter = filterManager.getFilterConfig('priority');
      
      expect(filter.label).toBe('Priority Level');
      expect(filter.multiple).toBe(true);
      expect(filter.operator).toBe('in');
    });
  });

  describe('Active Filters Management', () => {
    beforeEach(() => {
      filterManager.registerFilter('status', { type: 'select' });
      filterManager.registerFilter('priority', { type: 'select' });
    });

    it('should set active filters', () => {
      filterManager.setFilter('status', 'active');
      filterManager.setFilter('priority', 'high');

      const activeFilters = filterManager.getActiveFilters();
      
      expect(activeFilters).toEqual({
        status: 'active',
        priority: 'high'
      });
    });

    it('should remove active filters', () => {
      filterManager.setFilter('status', 'active');
      filterManager.setFilter('priority', 'high');
      
      filterManager.removeFilter('status');
      
      const activeFilters = filterManager.getActiveFilters();
      
      expect(activeFilters).toEqual({
        priority: 'high'
      });
    });

    it('should clear all active filters', () => {
      filterManager.setFilter('status', 'active');
      filterManager.setFilter('priority', 'high');
      
      filterManager.clearFilters();
      
      const activeFilters = filterManager.getActiveFilters();
      
      expect(activeFilters).toEqual({});
    });

    it('should validate filter values', () => {
      filterManager.registerFilter('age', {
        type: 'number',
        validation: (value: number) => value >= 0 && value <= 120
      });

      expect(() => {
        filterManager.setFilter('age', 150);
      }).toThrow('Invalid value for filter age');

      expect(() => {
        filterManager.setFilter('age', 25);
      }).not.toThrow();
    });

    it('should ignore filters for unregistered names', () => {
      filterManager.setFilter('nonexistent', 'value');
      
      const activeFilters = filterManager.getActiveFilters();
      expect(activeFilters).toEqual({});
    });

    it('should filter out empty values', () => {
      filterManager.registerFilter('status', { type: 'select' });
      filterManager.registerFilter('search', { type: 'text' });
      
      filterManager.setFilter('status', 'active');
      filterManager.setFilter('search', '');
      
      const activeFilters = filterManager.getActiveFilters();
      expect(activeFilters).toEqual({
        status: 'active'
      });
    });
  });

  describe('Filter Configuration', () => {
    it('should get all registered filters', () => {
      filterManager.registerFilter('status', {
        type: 'select',
        label: 'Status',
        options: [{ value: 'active', label: 'Active' }]
      });
      
      filterManager.registerFilter('priority', {
        type: 'select',
        label: 'Priority'
      });

      const allFilters = filterManager.getAllFilters();
      
      expect(allFilters).toHaveLength(2);
      expect(allFilters[0].name).toBe('status');
      expect(allFilters[1].name).toBe('priority');
    });

    it('should get specific filter configuration', () => {
      filterManager.registerFilter('dateRange', {
        type: 'date',
        label: 'Date Range',
        multiple: true
      });

      const config = filterManager.getFilterConfig('dateRange');
      
      expect(config.type).toBe('date');
      expect(config.label).toBe('Date Range');
      expect(config.multiple).toBe(true);
    });
  });
});
