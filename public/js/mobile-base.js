// Mobile Base JavaScript
class MobileBase {
  constructor() {
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupSearch();
    this.setupOverlay();
    this.setupTouchEvents();
    this.setupServiceWorker();
  }

  setupNavigation() {
    // Navigation is now handled by mobile-navigation.js
    // This method is kept for compatibility but functionality moved
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
          setTimeout(() => searchInput?.focus(), 300);
        }
      });
    }
    
    if (searchClear && searchInput) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        this.onSearchClear();
      });
      
      searchInput.addEventListener('input', (e) => {
        searchClear.style.display = e.target.value ? 'block' : 'none';
        this.onSearchInput(e.target.value);
      });
    }
  }

  setupOverlay() {
    const overlay = document.getElementById('overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        this.closeAllModals();
      });
    }
  }

  setupTouchEvents() {
    // Add touch event handling for better mobile experience
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
  }

  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }

  toggleOverlay(show) {
    const overlay = document.getElementById('overlay');
    if (overlay) {
      overlay.classList.toggle('active', show);
    }
  }

  closeAllModals() {
    const bottomSheet = document.getElementById('resultBottomSheet');
    const notificationsPanel = document.getElementById('notificationsPanel');
    
    if (bottomSheet) bottomSheet.classList.remove('active');
    if (notificationsPanel) notificationsPanel.classList.remove('active');
    
    this.toggleOverlay(false);
  }

  showBottomSheet(content) {
    const bottomSheet = document.getElementById('resultBottomSheet');
    const bottomSheetContent = document.getElementById('bottomSheetContent');
    
    if (bottomSheet && bottomSheetContent) {
      bottomSheetContent.innerHTML = content;
      bottomSheet.classList.add('active');
      this.toggleOverlay(true);
    }
  }

  hideBottomSheet() {
    const bottomSheet = document.getElementById('resultBottomSheet');
    if (bottomSheet) {
      bottomSheet.classList.remove('active');
      this.toggleOverlay(false);
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  showLoading(show = true) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
      loadingSpinner.style.display = show ? 'flex' : 'none';
    }
  }

  // Touch event handlers for swipe gestures
  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.touchStartTime = Date.now();
  }

  handleTouchMove(e) {
    if (!this.touchStartX || !this.touchStartY) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const diffX = this.touchStartX - touchX;
    const diffY = this.touchStartY - touchY;
    
    // Prevent default for horizontal swipes to enable custom swipe actions
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      e.preventDefault();
    }
  }

  handleTouchEnd(e) {
    if (!this.touchStartX || !this.touchStartY) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = this.touchStartX - touchEndX;
    const diffY = this.touchStartY - touchEndY;
    const diffTime = Date.now() - this.touchStartTime;
    
    // Reset touch coordinates
    this.touchStartX = null;
    this.touchStartY = null;
    this.touchStartTime = null;
    
    // Check for swipe gestures
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50 && diffTime < 300) {
      if (diffX > 0) {
        this.onSwipeLeft(e.target);
      } else {
        this.onSwipeRight(e.target);
      }
    }
  }

  // Override these methods in specific pages
  onSearchInput(query) {
    // Override in specific pages
  }

  onSearchClear() {
    // Override in specific pages
  }

  onSwipeLeft(target) {
    // Override in specific pages
  }

  onSwipeRight(target) {
    // Override in specific pages
  }

  // Utility methods
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  formatRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return this.formatDate(date);
  }

  // API helper methods
  async apiRequest(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const token = localStorage.getItem('authToken');
    if (token) {
      defaultOptions.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get(url) {
    return this.apiRequest(url);
  }

  async post(url, data) {
    return this.apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(url, data) {
    return this.apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(url) {
    return this.apiRequest(url, {
      method: 'DELETE',
    });
  }
}

// Initialize mobile base functionality
const mobileBase = new MobileBase();

// Export for use in other scripts
window.MobileBase = MobileBase;
window.mobileBase = mobileBase;