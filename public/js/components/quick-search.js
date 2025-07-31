/**
 * Quick Search Component
 * 
 * A unified quick search component for CLSI platform that provides:
 * - Intelligent search with auto-complete
 * - Quick data location and filtering
 * - Search history and suggestions
 * - Keyboard shortcuts support
 * - Multi-field search capabilities
 */

class QuickSearch {
  constructor(options = {}) {
    this.options = {
      container: options.container || '.quick-search-container',
      placeholder: options.placeholder || 'Quick search...',
      searchFields: options.searchFields || ['name', 'code'],
      dataSource: options.dataSource || [],
      onSearch: options.onSearch || (() => {}),
      onSelect: options.onSelect || (() => {}),
      enableHistory: options.enableHistory !== false,
      enableSuggestions: options.enableSuggestions !== false,
      maxSuggestions: options.maxSuggestions || 10,
      minSearchLength: options.minSearchLength || 1,
      debounceDelay: options.debounceDelay || 300,
      shortcuts: options.shortcuts !== false,
      categories: options.categories || [],
      ...options
    }

    this.searchHistory = this.loadSearchHistory()
    this.currentSuggestions = []
    this.selectedIndex = -1
    this.isVisible = false
    this.searchTimeout = null

    this.init()
  }

  init() {
    this.createSearchInterface()
    this.bindEvents()
    this.setupKeyboardShortcuts()
  }

  createSearchInterface() {
    const container = document.querySelector(this.options.container)
    if (!container) {
      console.error('Quick search container not found:', this.options.container)
      return
    }

    container.innerHTML = `
      <div class="quick-search-wrapper">
        <div class="quick-search-input-group">
          <div class="quick-search-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>
          <input 
            type="text" 
            class="quick-search-input" 
            placeholder="${this.options.placeholder}"
            autocomplete="off"
            spellcheck="false"
          >
          <div class="quick-search-shortcuts" title="Press Ctrl+K to focus">
            <kbd>Ctrl</kbd><kbd>K</kbd>
          </div>
          <button class="quick-search-clear" style="display: none;" title="Clear search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="quick-search-dropdown" style="display: none;">
          <div class="quick-search-suggestions">
            <!-- Dynamic suggestions -->
          </div>
          
          ${this.options.categories.length > 0 ? `
            <div class="quick-search-categories">
              <div class="quick-search-category-title">Categories</div>
              <div class="quick-search-category-list">
                ${this.options.categories.map(cat => `
                  <button class="quick-search-category-item" data-category="${cat.value}">
                    ${cat.icon ? `<span class="category-icon">${cat.icon}</span>` : ''}
                    <span class="category-name">${cat.name}</span>
                    <span class="category-count">${cat.count || 0}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${this.options.enableHistory ? `
            <div class="quick-search-history" style="display: none;">
              <div class="quick-search-history-title">Recent Searches</div>
              <div class="quick-search-history-list">
                <!-- Dynamic history -->
              </div>
            </div>
          ` : ''}
          
          <div class="quick-search-footer">
            <div class="quick-search-tips">
              <span class="tip"><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
              <span class="tip"><kbd>Enter</kbd> Select</span>
              <span class="tip"><kbd>Esc</kbd> Close</span>
            </div>
          </div>
        </div>
      </div>
    `

    this.elements = {
      wrapper: container.querySelector('.quick-search-wrapper'),
      input: container.querySelector('.quick-search-input'),
      dropdown: container.querySelector('.quick-search-dropdown'),
      suggestions: container.querySelector('.quick-search-suggestions'),
      categories: container.querySelector('.quick-search-categories'),
      history: container.querySelector('.quick-search-history'),
      historyList: container.querySelector('.quick-search-history-list'),
      clearBtn: container.querySelector('.quick-search-clear')
    }
  }

  bindEvents() {
    if (!this.elements.input) return

    // Input events
    this.elements.input.addEventListener('input', (e) => {
      this.handleInput(e.target.value)
    })

    this.elements.input.addEventListener('focus', () => {
      this.showDropdown()
    })

    this.elements.input.addEventListener('keydown', (e) => {
      this.handleKeydown(e)
    })

    // Clear button
    if (this.elements.clearBtn) {
      this.elements.clearBtn.addEventListener('click', () => {
        this.clearSearch()
      })
    }

    // Category buttons
    if (this.elements.categories) {
      this.elements.categories.addEventListener('click', (e) => {
        const categoryBtn = e.target.closest('.quick-search-category-item')
        if (categoryBtn) {
          this.selectCategory(categoryBtn.dataset.category)
        }
      })
    }

    // History items
    if (this.elements.historyList) {
      this.elements.historyList.addEventListener('click', (e) => {
        const historyItem = e.target.closest('.quick-search-history-item')
        if (historyItem) {
          this.selectHistoryItem(historyItem.dataset.query)
        }
      })
    }

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!this.elements.wrapper.contains(e.target)) {
        this.hideDropdown()
      }
    })
  }

  setupKeyboardShortcuts() {
    if (!this.options.shortcuts) return

    document.addEventListener('keydown', (e) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        this.focusSearch()
      }

      // Escape to clear and blur
      if (e.key === 'Escape' && document.activeElement === this.elements.input) {
        this.clearSearch()
        this.elements.input.blur()
      }
    })
  }

  handleInput(value) {
    clearTimeout(this.searchTimeout)
    
    // Show/hide clear button
    if (this.elements.clearBtn) {
      this.elements.clearBtn.style.display = value ? 'flex' : 'none'
    }

    if (value.length < this.options.minSearchLength) {
      this.showDefaultContent()
      return
    }

    // Debounce search
    this.searchTimeout = setTimeout(() => {
      this.performSearch(value)
    }, this.options.debounceDelay)
  }

  handleKeydown(e) {
    if (!this.isVisible) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        this.navigateSuggestions(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        this.navigateSuggestions(-1)
        break
      case 'Enter':
        e.preventDefault()
        this.selectCurrentSuggestion()
        break
      case 'Escape':
        e.preventDefault()
        this.hideDropdown()
        break
    }
  }

  performSearch(query) {
    if (!query.trim()) {
      this.showDefaultContent()
      return
    }

    const results = this.searchData(query)
    this.displaySuggestions(results, query)
    this.options.onSearch(query, results)
  }

  searchData(query) {
    const searchTerm = query.toLowerCase().trim()
    const results = []

    this.options.dataSource.forEach(item => {
      let score = 0
      let matchedFields = []

      // Search in specified fields
      this.options.searchFields.forEach(field => {
        const fieldValue = this.getNestedValue(item, field)
        if (fieldValue && typeof fieldValue === 'string') {
          const fieldLower = fieldValue.toLowerCase()
          
          // Exact match gets highest score
          if (fieldLower === searchTerm) {
            score += 100
            matchedFields.push({ field, type: 'exact', value: fieldValue })
          }
          // Starts with gets high score
          else if (fieldLower.startsWith(searchTerm)) {
            score += 50
            matchedFields.push({ field, type: 'prefix', value: fieldValue })
          }
          // Contains gets medium score
          else if (fieldLower.includes(searchTerm)) {
            score += 25
            matchedFields.push({ field, type: 'contains', value: fieldValue })
          }
        }
      })

      if (score > 0) {
        results.push({
          item,
          score,
          matchedFields,
          relevance: this.calculateRelevance(item, query)
        })
      }
    })

    // Sort by score and relevance
    return results
      .sort((a, b) => b.score - a.score || b.relevance - a.relevance)
      .slice(0, this.options.maxSuggestions)
  }

  calculateRelevance(item, query) {
    // Additional relevance factors can be added here
    // For example: recent usage, popularity, etc.
    return 0
  }

  displaySuggestions(results, query) {
    if (!this.elements.suggestions) return

    if (results.length === 0) {
      this.elements.suggestions.innerHTML = `
        <div class="quick-search-no-results">
          <div class="no-results-icon">🔍</div>
          <div class="no-results-text">No results found for "${query}"</div>
          <div class="no-results-suggestion">Try different keywords or check spelling</div>
        </div>
      `
    } else {
      this.elements.suggestions.innerHTML = results.map((result, index) => {
        const item = result.item
        const primaryField = result.matchedFields[0]
        
        return `
          <div class="quick-search-suggestion-item ${index === this.selectedIndex ? 'selected' : ''}" 
               data-index="${index}">
            <div class="suggestion-main">
              <div class="suggestion-title">
                ${this.highlightMatch(this.getDisplayTitle(item), query)}
              </div>
              <div class="suggestion-subtitle">
                ${this.getDisplaySubtitle(item)}
              </div>
            </div>
            <div class="suggestion-meta">
              <span class="suggestion-type">${this.getItemType(item)}</span>
              ${result.score >= 100 ? '<span class="suggestion-badge exact">Exact</span>' : ''}
            </div>
          </div>
        `
      }).join('')
    }

    this.currentSuggestions = results
    this.selectedIndex = -1
    this.showDropdown()
  }

  showDefaultContent() {
    if (this.options.enableHistory && this.searchHistory.length > 0) {
      this.displaySearchHistory()
    } else if (this.options.categories.length > 0) {
      this.showCategories()
    }
    this.showDropdown()
  }

  displaySearchHistory() {
    if (!this.elements.historyList) return

    this.elements.historyList.innerHTML = this.searchHistory.slice(0, 5).map(query => `
      <div class="quick-search-history-item" data-query="${query}">
        <div class="history-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6l4-4-4-4"></path>
            <path d="M12 23v-6l4 4-4 4"></path>
          </svg>
        </div>
        <div class="history-text">${query}</div>
        <button class="history-remove" data-query="${query}" title="Remove from history">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `).join('')

    if (this.elements.history) {
      this.elements.history.style.display = 'block'
    }
    if (this.elements.suggestions) {
      this.elements.suggestions.innerHTML = ''
    }
  }

  showCategories() {
    if (this.elements.categories) {
      this.elements.categories.style.display = 'block'
    }
    if (this.elements.suggestions) {
      this.elements.suggestions.innerHTML = ''
    }
    if (this.elements.history) {
      this.elements.history.style.display = 'none'
    }
  }

  navigateSuggestions(direction) {
    if (this.currentSuggestions.length === 0) return

    this.selectedIndex += direction

    if (this.selectedIndex < -1) {
      this.selectedIndex = this.currentSuggestions.length - 1
    } else if (this.selectedIndex >= this.currentSuggestions.length) {
      this.selectedIndex = -1
    }

    // Update visual selection
    const items = this.elements.suggestions.querySelectorAll('.quick-search-suggestion-item')
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedIndex)
    })

    // Scroll selected item into view
    if (this.selectedIndex >= 0) {
      const selectedItem = items[this.selectedIndex]
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' })
      }
    }
  }

  selectCurrentSuggestion() {
    if (this.selectedIndex >= 0 && this.currentSuggestions[this.selectedIndex]) {
      const result = this.currentSuggestions[this.selectedIndex]
      this.selectItem(result.item, this.elements.input.value)
    } else if (this.elements.input.value.trim()) {
      // If no suggestion selected but there's input, perform search
      this.addToHistory(this.elements.input.value)
      this.options.onSearch(this.elements.input.value, this.currentSuggestions)
      this.hideDropdown()
    }
  }

  selectItem(item, query) {
    this.addToHistory(query)
    this.options.onSelect(item, query)
    this.hideDropdown()
    
    // Update input with selected item's display name
    this.elements.input.value = this.getDisplayTitle(item)
  }

  selectCategory(category) {
    this.options.onSearch(`category:${category}`, [])
    this.hideDropdown()
  }

  selectHistoryItem(query) {
    this.elements.input.value = query
    this.performSearch(query)
  }

  focusSearch() {
    if (this.elements.input) {
      this.elements.input.focus()
      this.elements.input.select()
    }
  }

  clearSearch() {
    if (this.elements.input) {
      this.elements.input.value = ''
    }
    if (this.elements.clearBtn) {
      this.elements.clearBtn.style.display = 'none'
    }
    this.currentSuggestions = []
    this.selectedIndex = -1
    this.options.onSearch('', [])
    this.showDefaultContent()
  }

  showDropdown() {
    if (this.elements.dropdown) {
      this.elements.dropdown.style.display = 'block'
      this.isVisible = true
    }
  }

  hideDropdown() {
    if (this.elements.dropdown) {
      this.elements.dropdown.style.display = 'none'
      this.isVisible = false
    }
    this.selectedIndex = -1
  }

  // Utility methods
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  getDisplayTitle(item) {
    return item.name || item.title || item.label || 'Unknown'
  }

  getDisplaySubtitle(item) {
    return item.code || item.description || item.category || ''
  }

  getItemType(item) {
    return item.type || item.category || 'Item'
  }

  highlightMatch(text, query) {
    if (!query || !text) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  addToHistory(query) {
    if (!this.options.enableHistory || !query.trim()) return

    const trimmedQuery = query.trim()
    
    // Remove if already exists
    this.searchHistory = this.searchHistory.filter(item => item !== trimmedQuery)
    
    // Add to beginning
    this.searchHistory.unshift(trimmedQuery)
    
    // Keep only last 20 searches
    this.searchHistory = this.searchHistory.slice(0, 20)
    
    this.saveSearchHistory()
  }

  loadSearchHistory() {
    try {
      const history = localStorage.getItem('quickSearchHistory')
      return history ? JSON.parse(history) : []
    } catch (error) {
      console.warn('Failed to load search history:', error)
      return []
    }
  }

  saveSearchHistory() {
    try {
      localStorage.setItem('quickSearchHistory', JSON.stringify(this.searchHistory))
    } catch (error) {
      console.warn('Failed to save search history:', error)
    }
  }

  // Public API methods
  updateDataSource(newData) {
    this.options.dataSource = newData
  }

  updateCategories(newCategories) {
    this.options.categories = newCategories
    // Re-render categories if visible
    if (this.elements.categories && this.isVisible) {
      this.createSearchInterface()
      this.bindEvents()
    }
  }

  setValue(value) {
    if (this.elements.input) {
      this.elements.input.value = value
      this.handleInput(value)
    }
  }

  getValue() {
    return this.elements.input ? this.elements.input.value : ''
  }

  destroy() {
    // Clean up event listeners and DOM
    if (this.elements.wrapper) {
      this.elements.wrapper.remove()
    }
    clearTimeout(this.searchTimeout)
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuickSearch
} else if (typeof window !== 'undefined') {
  window.QuickSearch = QuickSearch
}