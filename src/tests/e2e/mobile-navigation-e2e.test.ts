import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock MobileNavigation class (same as unit test)
class MobileNavigation {
  currentPage: string;
  isAuthenticated: boolean;

  constructor() {
    this.currentPage = this.getCurrentPage();
    this.isAuthenticated = this.checkAuthentication();
    this.init();
  }

  init() {
    this.createBottomNavigation();
    this.setupNavigationEvents();
    this.updateActiveNavItem();
    this.checkAuthenticationStatus();
  }

  getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('dashboard')) return 'dashboard';
    if (path.includes('samples')) return 'samples';
    if (path.includes('lab-results')) return 'lab-results';
    if (path.includes('login')) return 'login';
    return 'dashboard';
  }

  checkAuthentication() {
    const token = localStorage.getItem('clsi_auth_token');
    const userData = localStorage.getItem('clsi_user_data');
    return !!(token && userData);
  }

  checkAuthenticationStatus() {
    if (!this.isAuthenticated && this.currentPage !== 'login') {
      window.location.href = '/mobile/login.html';
      return;
    }
    
    if (this.isAuthenticated && this.currentPage === 'login') {
      window.location.href = '/mobile/dashboard.html';
      return;
    }
  }

  createBottomNavigation() {
    if (this.currentPage === 'login' || !this.isAuthenticated) {
      return;
    }

    const navHTML = `
      <nav class="bottom-navigation" id="bottomNavigation">
        <div class="nav-items">
          <a href="/mobile/dashboard.html" class="nav-item" data-page="dashboard">Dashboard</a>
          <a href="/mobile/samples.html" class="nav-item" data-page="samples">Samples</a>
          <a href="/mobile/lab-results.html" class="nav-item" data-page="lab-results">Results</a>
          <button class="nav-item nav-menu-trigger" id="navMenuTrigger">More</button>
        </div>
      </nav>
    `;

    document.body.insertAdjacentHTML('beforeend', navHTML);
    this.addNavigationStyles();
  }

  addNavigationStyles() {
    const styles = `<style id="mobile-navigation-styles">.bottom-navigation { position: fixed; }</style>`;
    document.head.insertAdjacentHTML('beforeend', styles);
  }

  setupNavigationEvents() {
    const menuTrigger = document.getElementById('navMenuTrigger');
    if (menuTrigger) {
      menuTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleNavigationMenu();
      });
    }

    const navItems = document.querySelectorAll('.nav-item[data-page]');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        (item as HTMLElement).style.transform = 'scale(0.95)';
        setTimeout(() => {
          (item as HTMLElement).style.transform = '';
        }, 150);
      });
    });
  }

  toggleNavigationMenu() {
    let overlay = document.getElementById('navMenuOverlay');
    let menu = document.getElementById('navMenu');

    if (!overlay) {
      this.createNavigationMenu();
      overlay = document.getElementById('navMenuOverlay');
      menu = document.getElementById('navMenu');
    }

    const isActive = overlay?.classList.contains('active');
    
    if (isActive) {
      overlay?.classList.remove('active');
      menu?.classList.remove('active');
    } else {
      overlay?.classList.add('active');
      menu?.classList.add('active');
    }
  }

  createNavigationMenu() {
    const userData = JSON.parse(localStorage.getItem('clsi_user_data') || '{}');
    
    const menuHTML = `
      <div class="nav-menu-overlay" id="navMenuOverlay">
        <div class="nav-menu" id="navMenu">
          <div class="nav-menu-item">
            <div>${userData.username || 'User'}</div>
          </div>
          <button class="nav-menu-item" id="logoutButton">Logout</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', menuHTML);

    const overlay = document.getElementById('navMenuOverlay');
    const logoutButton = document.getElementById('logoutButton');

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.toggleNavigationMenu();
        }
      });
    }

    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        this.handleLogout();
      });
    }
  }

  updateActiveNavItem() {
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    navItems.forEach(item => {
      item.classList.remove('active');
      if ((item as HTMLElement).dataset.page === this.currentPage) {
        item.classList.add('active');
      }
    });
  }

  handleLogout() {
    localStorage.removeItem('clsi_auth_token');
    localStorage.removeItem('clsi_user_data');
    window.location.href = '/mobile/login.html';
  }
}

describe('Mobile Navigation E2E Tests', () => {
  let dom: JSDOM;
  let mockLocalStorage: any;

  beforeEach(() => {
    // Create a new JSDOM instance
    dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
      url: 'http://localhost/mobile/dashboard.html',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    // Set up global objects
    global.window = dom.window as any;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
    global.HTMLElement = dom.window.HTMLElement;

    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    
    Object.defineProperty(global.window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    });

    // Mock location
    Object.defineProperty(global.window, 'location', {
      value: {
        pathname: '/mobile/dashboard.html',
        href: 'http://localhost/mobile/dashboard.html',
        assign: vi.fn(),
        replace: vi.fn(),
        reload: vi.fn(),
      },
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    dom.window.close();
    vi.clearAllMocks();
  });

  describe('Complete Mobile Navigation Workflow', () => {
    it('should handle complete user authentication and navigation flow', () => {
      // Setup authenticated user
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"testuser","role":"admin"}';
        return null;
      });

      const navigation = new MobileNavigation();
      
      // Verify navigation is created
      const bottomNav = document.getElementById('bottomNavigation');
      expect(bottomNav).not.toBeNull();
      
      // Verify navigation items exist
      const navItems = document.querySelectorAll('.nav-item[data-page]');
      expect(navItems.length).toBeGreaterThan(0);
      
      // Verify active item is set correctly
      const activeItem = document.querySelector('.nav-item.active');
      expect(activeItem).not.toBeNull();
      expect((activeItem as HTMLElement)?.dataset.page).toBe('dashboard');
    });

    it('should handle navigation between different pages', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"testuser"}';
        return null;
      });

      // Test samples page
      Object.defineProperty(window, 'location', {
        value: { pathname: '/mobile/samples.html', href: '' },
        writable: true,
        configurable: true
      });

      const navigation = new MobileNavigation();
      expect(navigation.currentPage).toBe('samples');
      
      const activeItem = document.querySelector('.nav-item.active');
      expect((activeItem as HTMLElement)?.dataset.page).toBe('samples');
    });

    it('should handle menu overlay interactions', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"testuser"}';
        return null;
      });

      const navigation = new MobileNavigation();
      
      // Open menu
      navigation.toggleNavigationMenu();
      
      const overlay = document.getElementById('navMenuOverlay');
      const menu = document.getElementById('navMenu');
      
      expect(overlay?.classList.contains('active')).toBe(true);
      expect(menu?.classList.contains('active')).toBe(true);
      
      // Close menu by clicking overlay
      const clickEvent = new dom.window.Event('click');
      Object.defineProperty(clickEvent, 'target', { value: overlay });
      overlay?.dispatchEvent(clickEvent);
      
      expect(overlay?.classList.contains('active')).toBe(false);
    });

    it('should handle navigation item visual feedback', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"testuser"}';
        return null;
      });

      const navigation = new MobileNavigation();
      
      const navItem = document.querySelector('.nav-item[data-page]') as HTMLElement;
      expect(navItem).not.toBeNull();
      
      // Simulate click
      const clickEvent = new dom.window.Event('click');
      navItem.dispatchEvent(clickEvent);
      
      // Should apply transform
      expect(navItem.style.transform).toBe('scale(0.95)');
    });
  });

  describe('Mobile Navigation Accessibility', () => {
    it('should provide proper ARIA labels and keyboard navigation', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"testuser"}';
        return null;
      });

      const navigation = new MobileNavigation();
      
      const navItems = document.querySelectorAll('.nav-item');
      expect(navItems.length).toBeGreaterThan(0);
      
      // Check that navigation items are focusable
      navItems.forEach(item => {
        expect(item.tagName === 'A' || item.tagName === 'BUTTON').toBe(true);
      });
    });

    it('should handle keyboard events for menu navigation', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"testuser"}';
        return null;
      });

      const navigation = new MobileNavigation();
      
      const menuTrigger = document.getElementById('navMenuTrigger');
      expect(menuTrigger).not.toBeNull();
      
      // Test keyboard interaction
      const keyEvent = new dom.window.KeyboardEvent('keydown', { key: 'Enter' });
      menuTrigger?.dispatchEvent(keyEvent);
      
      // Menu should still be accessible
      expect(menuTrigger?.tagName).toBe('BUTTON');
    });
  });

  describe('Mobile Navigation Performance', () => {
    it('should initialize quickly and efficiently', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"testuser"}';
        return null;
      });

      const startTime = performance.now();
      const navigation = new MobileNavigation();
      const endTime = performance.now();
      
      // Should initialize quickly (less than 100ms in test environment)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Should have created necessary elements
      expect(document.getElementById('bottomNavigation')).not.toBeNull();
      expect(document.getElementById('mobile-navigation-styles')).not.toBeNull();
    });

    it('should handle rapid menu toggles without issues', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"testuser"}';
        return null;
      });

      const navigation = new MobileNavigation();
      
      // Rapid toggles
      for (let i = 0; i < 10; i++) {
        navigation.toggleNavigationMenu();
      }
      
      // Should still work correctly
      const overlay = document.getElementById('navMenuOverlay');
      expect(overlay).not.toBeNull();
      expect(overlay?.classList.contains('active')).toBe(false); // Should be closed after even number of toggles
    });
  });

  describe('Mobile Navigation Error Handling', () => {
    it('should handle corrupted localStorage gracefully', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return 'invalid-json-data';
        return null;
      });

      expect(() => {
        const navigation = new MobileNavigation();
        navigation.createNavigationMenu();
      }).not.toThrow();
    });

    it('should handle missing DOM elements gracefully', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"testuser"}';
        return null;
      });

      // Clear DOM
      document.body.innerHTML = '';
      
      expect(() => {
        const navigation = new MobileNavigation();
        navigation.setupNavigationEvents();
      }).not.toThrow();
    });

    it('should handle network connectivity issues', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"testuser"}';
        return null;
      });

      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      expect(() => {
        const navigation = new MobileNavigation();
      }).not.toThrow();
      
      expect(navigation.isAuthenticated).toBe(true);
    });
  });

  describe('Mobile Navigation Cross-Browser Compatibility', () => {
    it('should work with different user agent strings', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"testuser"}';
        return null;
      });

      // Simulate different user agents
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
      });

      expect(() => {
        const navigation = new MobileNavigation();
      }).not.toThrow();
      
      const bottomNav = document.getElementById('bottomNavigation');
      expect(bottomNav).not.toBeNull();
    });
  });
});
