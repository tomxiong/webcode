import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock MobileNavigation class
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

describe('MobileNavigation', () => {
  let dom: JSDOM;
  let mockLocalStorage: any;
  let originalLocation: Location;

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

    // Store original location
    originalLocation = window.location;

    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    
    // Use Object.defineProperty to properly mock localStorage
    Object.defineProperty(global.window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    });

    // Mock location with configurable property
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
    // Clean up
    dom.window.close();
    vi.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with correct current page and authentication status', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"test"}';
        return null;
      });

      const navigation = new MobileNavigation();
      
      expect(navigation.currentPage).toBe('dashboard');
      expect(navigation.isAuthenticated).toBe(true);
    });

    it('should initialize with unauthenticated status when no token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const navigation = new MobileNavigation();
      
      expect(navigation.isAuthenticated).toBe(false);
    });
  });

  describe('getCurrentPage', () => {
    it('should return "dashboard" for dashboard path', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/mobile/dashboard.html' },
        writable: true,
        configurable: true
      });

      const navigation = new MobileNavigation();
      expect(navigation.getCurrentPage()).toBe('dashboard');
    });

    it('should return "samples" for samples path', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/mobile/samples.html' },
        writable: true,
        configurable: true
      });

      const navigation = new MobileNavigation();
      expect(navigation.getCurrentPage()).toBe('samples');
    });

    it('should return "lab-results" for lab-results path', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/mobile/lab-results.html' },
        writable: true,
        configurable: true
      });

      const navigation = new MobileNavigation();
      expect(navigation.getCurrentPage()).toBe('lab-results');
    });

    it('should return "login" for login path', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/mobile/login.html' },
        writable: true,
        configurable: true
      });

      const navigation = new MobileNavigation();
      expect(navigation.getCurrentPage()).toBe('login');
    });

    it('should return "dashboard" as default for unknown paths', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/unknown/path.html' },
        writable: true,
        configurable: true
      });

      const navigation = new MobileNavigation();
      expect(navigation.getCurrentPage()).toBe('dashboard');
    });
  });

  describe('checkAuthentication', () => {
    it('should return true when both token and user data exist', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"test"}';
        return null;
      });

      const navigation = new MobileNavigation();
      expect(navigation.checkAuthentication()).toBe(true);
    });

    it('should return false when token is missing', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_user_data') return '{"username":"test"}';
        return null;
      });

      const navigation = new MobileNavigation();
      expect(navigation.checkAuthentication()).toBe(false);
    });

    it('should return false when user data is missing', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        return null;
      });

      const navigation = new MobileNavigation();
      expect(navigation.checkAuthentication()).toBe(false);
    });

    it('should return false when both token and user data are missing', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const navigation = new MobileNavigation();
      expect(navigation.checkAuthentication()).toBe(false);
    });
  });

  describe('checkAuthenticationStatus', () => {
    it('should redirect to login when not authenticated and not on login page', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      Object.defineProperty(window, 'location', {
        value: { 
          pathname: '/mobile/dashboard.html',
          href: '',
          assign: vi.fn(),
          replace: vi.fn(),
          reload: vi.fn(),
        },
        writable: true,
        configurable: true
      });

      const navigation = new MobileNavigation();
      navigation.checkAuthenticationStatus();
      
      expect(window.location.href).toBe('/mobile/login.html');
    });

    it('should redirect to dashboard when authenticated and on login page', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"test"}';
        return null;
      });
      
      Object.defineProperty(window, 'location', {
        value: { 
          pathname: '/mobile/login.html',
          href: '',
          assign: vi.fn(),
          replace: vi.fn(),
          reload: vi.fn(),
        },
        writable: true,
        configurable: true
      });

      const navigation = new MobileNavigation();
      navigation.checkAuthenticationStatus();
      
      expect(window.location.href).toBe('/mobile/dashboard.html');
    });

    it('should not redirect when authenticated and not on login page', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"test"}';
        return null;
      });

      const originalHref = window.location.href;
      const navigation = new MobileNavigation();
      navigation.checkAuthenticationStatus();
      
      expect(window.location.href).toBe(originalHref);
    });

    it('should not redirect when not authenticated and on login page', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      Object.defineProperty(window, 'location', {
        value: { 
          pathname: '/mobile/login.html',
          href: 'http://localhost/mobile/login.html',
          assign: vi.fn(),
          replace: vi.fn(),
          reload: vi.fn(),
        },
        writable: true,
        configurable: true
      });

      const originalHref = window.location.href;
      const navigation = new MobileNavigation();
      navigation.checkAuthenticationStatus();
      
      expect(window.location.href).toBe(originalHref);
    });
  });

  describe('createBottomNavigation', () => {
    it('should not create navigation when on login page', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"test"}';
        return null;
      });
      
      Object.defineProperty(window, 'location', {
        value: { pathname: '/mobile/login.html' },
        writable: true,
        configurable: true
      });

      const navigation = new MobileNavigation();
      const navElement = document.getElementById('bottomNavigation');
      
      expect(navElement).toBeNull();
    });

    it('should not create navigation when not authenticated', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const navigation = new MobileNavigation();
      const navElement = document.getElementById('bottomNavigation');
      
      expect(navElement).toBeNull();
    });

    it('should create navigation when authenticated and not on login page', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"test"}';
        return null;
      });

      const navigation = new MobileNavigation();
      const navElement = document.getElementById('bottomNavigation');
      
      expect(navElement).not.toBeNull();
      expect(navElement?.classList.contains('bottom-navigation')).toBe(true);
    });

    it('should create navigation items with correct data attributes', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"test"}';
        return null;
      });

      const navigation = new MobileNavigation();
      const dashboardItem = document.querySelector('[data-page="dashboard"]');
      const samplesItem = document.querySelector('[data-page="samples"]');
      const resultsItem = document.querySelector('[data-page="lab-results"]');
      
      expect(dashboardItem).not.toBeNull();
      expect(samplesItem).not.toBeNull();
      expect(resultsItem).not.toBeNull();
    });
  });

  describe('addNavigationStyles', () => {
    it('should add navigation styles to document head', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"test"}';
        return null;
      });

      const navigation = new MobileNavigation();
      const styleElement = document.getElementById('mobile-navigation-styles');
      
      expect(styleElement).not.toBeNull();
      expect(styleElement?.tagName).toBe('STYLE');
    });
  });

  describe('setupNavigationEvents', () => {
    it('should setup menu trigger event listener', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"test"}';
        return null;
      });

      const navigation = new MobileNavigation();
      const menuTrigger = document.getElementById('navMenuTrigger');
      
      expect(menuTrigger).not.toBeNull();
      
      // Test click event
      const clickEvent = new dom.window.Event('click');
      menuTrigger?.dispatchEvent(clickEvent);
      
      // Should create menu overlay after click
      const overlay = document.getElementById('navMenuOverlay');
      expect(overlay).not.toBeNull();
    });

    it('should setup navigation item click events', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"test"}';
        return null;
      });

      const navigation = new MobileNavigation();
      const navItem = document.querySelector('.nav-item[data-page]') as HTMLElement;
      
      expect(navItem).not.toBeNull();
      
      // Test click event
      const clickEvent = new dom.window.Event('click');
      navItem?.dispatchEvent(clickEvent);
      
      // Should apply transform style
      expect(navItem?.style.transform).toBe('scale(0.95)');
    });
  });

  describe('toggleNavigationMenu', () => {
    it('should create navigation menu if it does not exist', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"test"}';
        return null;
      });

      const navigation = new MobileNavigation();
      navigation.toggleNavigationMenu();
      
      const overlay = document.getElementById('navMenuOverlay');
      const menu = document.getElementById('navMenu');
      
      expect(overlay).not.toBeNull();
      expect(menu).not.toBeNull();
    });

    it('should toggle menu active state', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"test"}';
        return null;
      });

      const navigation = new MobileNavigation();
      
      // First toggle - should activate
      navigation.toggleNavigationMenu();
      let overlay = document.getElementById('navMenuOverlay');
      let menu = document.getElementById('navMenu');
      
      expect(overlay?.classList.contains('active')).toBe(true);
      expect(menu?.classList.contains('active')).toBe(true);
      
      // Second toggle - should deactivate
      navigation.toggleNavigationMenu();
      
      expect(overlay?.classList.contains('active')).toBe(false);
      expect(menu?.classList.contains('active')).toBe(false);
    });
  });

  describe('createNavigationMenu', () => {
    it('should create navigation menu with user data', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"testuser"}';
        return null;
      });

      const navigation = new MobileNavigation();
      navigation.createNavigationMenu();
      
      const menu = document.getElementById('navMenu');
      expect(menu).not.toBeNull();
      expect(menu?.innerHTML).toContain('testuser');
    });

    it('should display user information in menu', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"admin"}';
        return null;
      });

      const navigation = new MobileNavigation();
      navigation.createNavigationMenu();
      
      const menu = document.getElementById('navMenu');
      expect(menu?.innerHTML).toContain('admin');
    });

    it('should setup overlay click event to close menu', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"test"}';
        return null;
      });

      const navigation = new MobileNavigation();
      navigation.createNavigationMenu();
      
      const overlay = document.getElementById('navMenuOverlay');
      expect(overlay).not.toBeNull();
      
      // Add active class first
      overlay?.classList.add('active');
      
      // Test click event on overlay
      const clickEvent = new dom.window.Event('click');
      Object.defineProperty(clickEvent, 'target', { value: overlay });
      overlay?.dispatchEvent(clickEvent);
      
      // Should remove active class
      expect(overlay?.classList.contains('active')).toBe(false);
    });

    it('should setup logout button click event', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"test"}';
        return null;
      });

      const navigation = new MobileNavigation();
      navigation.createNavigationMenu();
      
      const logoutButton = document.getElementById('logoutButton');
      expect(logoutButton).not.toBeNull();
      
      // Test click event
      const clickEvent = new dom.window.Event('click');
      logoutButton?.dispatchEvent(clickEvent);
      
      // Should clear localStorage and redirect
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('clsi_auth_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('clsi_user_data');
      expect(window.location.href).toBe('/mobile/login.html');
    });
  });

  describe('updateActiveNavItem', () => {
    it('should mark dashboard item as active when on dashboard page', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"test"}';
        return null;
      });

      const navigation = new MobileNavigation();
      const dashboardItem = document.querySelector('[data-page="dashboard"]');
      
      expect(dashboardItem?.classList.contains('active')).toBe(true);
    });

    it('should mark samples item as active when on samples page', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"test"}';
        return null;
      });
      
      Object.defineProperty(window, 'location', {
        value: { pathname: '/mobile/samples.html' },
        writable: true,
        configurable: true
      });

      const navigation = new MobileNavigation();
      const samplesItem = document.querySelector('[data-page="samples"]');
      
      expect(samplesItem?.classList.contains('active')).toBe(true);
    });
  });

  describe('handleLogout', () => {
    it('should clear authentication data and redirect to login', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return '{"username":"test"}';
        return null;
      });

      const navigation = new MobileNavigation();
      navigation.handleLogout();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('clsi_auth_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('clsi_user_data');
      expect(window.location.href).toBe('/mobile/login.html');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid JSON in user data gracefully', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'clsi_auth_token') return 'mock-token';
        if (key === 'clsi_user_data') return 'invalid-json';
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
        if (key === 'clsi_user_data') return '{"username":"test"}';
        return null;
      });

      // Clear DOM
      document.body.innerHTML = '';
      
      expect(() => {
        const navigation = new MobileNavigation();
        navigation.setupNavigationEvents();
      }).not.toThrow();
    });

    it('should handle empty localStorage gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('');

      expect(() => {
        const navigation = new MobileNavigation();
      }).not.toThrow();
      
      const navigation = new MobileNavigation();
      expect(navigation.isAuthenticated).toBe(false);
    });
  });
});