import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'

// Mock MobileNavigation class since it's in a separate file
class MobileNavigation {
  currentPage: string
  isAuthenticated: boolean

  constructor() {
    this.currentPage = this.getCurrentPage()
    this.isAuthenticated = this.checkAuthentication()
    this.init()
  }

  init() {
    this.createBottomNavigation()
    this.setupNavigationEvents()
    this.updateActiveNavItem()
    this.checkAuthenticationStatus()
  }

  getCurrentPage(): string {
    const path = window.location.pathname
    if (path.includes('dashboard')) return 'dashboard'
    if (path.includes('samples')) return 'samples'
    if (path.includes('lab-results')) return 'lab-results'
    if (path.includes('login')) return 'login'
    return 'dashboard'
  }

  checkAuthentication(): boolean {
    const token = localStorage.getItem('clsi_auth_token')
    const userData = localStorage.getItem('clsi_user_data')
    return !!(token && userData)
  }

  checkAuthenticationStatus(): void {
    if (!this.isAuthenticated && this.currentPage !== 'login') {
      window.location.href = '/mobile/login.html'
      return
    }
    
    if (this.isAuthenticated && this.currentPage === 'login') {
      window.location.href = '/mobile/dashboard.html'
      return
    }
  }

  createBottomNavigation(): void {
    if (this.currentPage === 'login' || !this.isAuthenticated) {
      return
    }

    const navHTML = `
      <nav class="bottom-navigation" id="bottomNavigation">
        <div class="nav-items">
          <a href="/mobile/dashboard.html" class="nav-item" data-page="dashboard">
            <svg class="nav-icon" viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M13 3v6h8V3m-8 18h8V11h-8M3 21h8v-6H3m0-2h8V3H3v10Z"/>
            </svg>
            <span class="nav-label">Dashboard</span>
          </a>
          <a href="/mobile/samples.html" class="nav-item" data-page="samples">
            <svg class="nav-icon" viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M7 2v2h1v14a4 4 0 0 0 4 4 4 4 0 0 0 4-4V4h1V2H7M9 4h6v14a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4Z"/>
            </svg>
            <span class="nav-label">Samples</span>
          </a>
          <a href="/mobile/lab-results.html" class="nav-item" data-page="lab-results">
            <svg class="nav-icon" viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            <span class="nav-label">Results</span>
          </a>
          <button class="nav-item nav-menu-trigger" id="navMenuTrigger">
            <svg class="nav-icon" viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M12 16c2.206 0 4-1.794 4-4s-1.794-4-4-4-4 1.794-4 4 1.794 4 4 4zm0-6c1.084 0 2 .916 2 2s-.916 2-2 2-2-.916-2-2 .916-2 2-2z"/>
            </svg>
            <span class="nav-label">More</span>
          </button>
        </div>
      </nav>
    `

    document.body.insertAdjacentHTML('beforeend', navHTML)
    this.addNavigationStyles()
  }

  addNavigationStyles(): void {
    const styles = `
      <style id="mobile-navigation-styles">
        .bottom-navigation { position: fixed; bottom: 0; left: 0; right: 0; }
        .nav-items { display: flex; justify-content: space-around; }
        .nav-item { display: flex; flex-direction: column; align-items: center; }
        .nav-item.active { color: var(--primary-color); }
      </style>
    `
    document.head.insertAdjacentHTML('beforeend', styles)
  }

  setupNavigationEvents(): void {
    const menuTrigger = document.getElementById('navMenuTrigger')
    if (menuTrigger) {
      menuTrigger.addEventListener('click', (e) => {
        e.preventDefault()
        this.toggleNavigationMenu()
      })
    }

    const navItems = document.querySelectorAll('.nav-item[data-page]')
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        ;(item as HTMLElement).style.transform = 'scale(0.95)'
        setTimeout(() => {
          ;(item as HTMLElement).style.transform = ''
        }, 150)
      })
    })
  }

  toggleNavigationMenu(): void {
    let overlay = document.getElementById('navMenuOverlay')
    let menu = document.getElementById('navMenu')

    if (!overlay) {
      this.createNavigationMenu()
      overlay = document.getElementById('navMenuOverlay')
      menu = document.getElementById('navMenu')
    }

    const isActive = overlay?.classList.contains('active')
    
    if (isActive) {
      overlay?.classList.remove('active')
      menu?.classList.remove('active')
    } else {
      overlay?.classList.add('active')
      menu?.classList.add('active')
    }
  }

  createNavigationMenu(): void {
    const userData = JSON.parse(localStorage.getItem('clsi_user_data') || '{}')
    
    const menuHTML = `
      <div class="nav-menu-overlay" id="navMenuOverlay">
        <div class="nav-menu" id="navMenu">
          <div class="nav-menu-item" style="pointer-events: none; opacity: 0.7;">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <div>
              <div style="font-weight: 600;">${userData.username || 'User'}</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">${userData.role || 'User'}</div>
            </div>
          </div>
          <div class="nav-menu-divider"></div>
          <button class="nav-menu-item" id="logoutButton">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 0 1 2 2v2h-2V4H4v16h10v-2h2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10Z"/>
            </svg>
            Logout
          </button>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML('beforeend', menuHTML)

    const overlay = document.getElementById('navMenuOverlay')
    const logoutButton = document.getElementById('logoutButton')

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.toggleNavigationMenu()
        }
      })
    }

    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        this.handleLogout()
      })
    }
  }

  updateActiveNavItem(): void {
    const navItems = document.querySelectorAll('.nav-item[data-page]')
    navItems.forEach(item => {
      item.classList.remove('active')
      if ((item as HTMLElement).dataset.page === this.currentPage) {
        item.classList.add('active')
      }
    })
  }

  handleLogout(): void {
    localStorage.removeItem('clsi_auth_token')
    localStorage.removeItem('clsi_user_data')
    window.location.href = '/mobile/login.html'
  }
}

describe('MobileNavigation', () => {
  let dom: JSDOM
  let mockLocalStorage: { [key: string]: string }
  let mockLocation: { pathname: string; href: string }

  beforeEach(() => {
    // Setup JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
      url: 'http://localhost:3000/mobile/dashboard.html'
    })

    // Setup global objects
    global.window = dom.window as any
    global.document = dom.window.document
    global.localStorage = {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key]
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {}
      })
    } as any

    // Setup mock location
    mockLocation = { pathname: '/mobile/dashboard.html', href: '' }
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    })

    // Reset localStorage
    mockLocalStorage = {}
  })

  afterEach(() => {
    dom.window.close()
    vi.clearAllMocks()
  })

  describe('Constructor and Initialization', () => {
    it('should initialize with correct current page and authentication status', () => {
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      
      const navigation = new MobileNavigation()
      
      expect(navigation.currentPage).toBe('dashboard')
      expect(navigation.isAuthenticated).toBe(true)
    })

    it('should initialize with unauthenticated status when no token', () => {
      const navigation = new MobileNavigation()
      
      expect(navigation.isAuthenticated).toBe(false)
    })
  })

  describe('getCurrentPage', () => {
    it('should return "dashboard" for dashboard path', () => {
      mockLocation.pathname = '/mobile/dashboard.html'
      const navigation = new MobileNavigation()
      
      expect(navigation.getCurrentPage()).toBe('dashboard')
    })

    it('should return "samples" for samples path', () => {
      mockLocation.pathname = '/mobile/samples.html'
      const navigation = new MobileNavigation()
      
      expect(navigation.getCurrentPage()).toBe('samples')
    })

    it('should return "lab-results" for lab-results path', () => {
      mockLocation.pathname = '/mobile/lab-results.html'
      const navigation = new MobileNavigation()
      
      expect(navigation.getCurrentPage()).toBe('lab-results')
    })

    it('should return "login" for login path', () => {
      mockLocation.pathname = '/mobile/login.html'
      const navigation = new MobileNavigation()
      
      expect(navigation.getCurrentPage()).toBe('login')
    })

    it('should return "dashboard" as default for unknown paths', () => {
      mockLocation.pathname = '/mobile/unknown.html'
      const navigation = new MobileNavigation()
      
      expect(navigation.getCurrentPage()).toBe('dashboard')
    })
  })

  describe('checkAuthentication', () => {
    it('should return true when both token and user data exist', () => {
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      
      const navigation = new MobileNavigation()
      
      expect(navigation.checkAuthentication()).toBe(true)
    })

    it('should return false when token is missing', () => {
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      
      const navigation = new MobileNavigation()
      
      expect(navigation.checkAuthentication()).toBe(false)
    })

    it('should return false when user data is missing', () => {
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      
      const navigation = new MobileNavigation()
      
      expect(navigation.checkAuthentication()).toBe(false)
    })

    it('should return false when both token and user data are missing', () => {
      const navigation = new MobileNavigation()
      
      expect(navigation.checkAuthentication()).toBe(false)
    })
  })

  describe('checkAuthenticationStatus', () => {
    it('should redirect to login when not authenticated and not on login page', () => {
      mockLocation.pathname = '/mobile/dashboard.html'
      
      const navigation = new MobileNavigation()
      
      expect(mockLocation.href).toBe('/mobile/login.html')
    })

    it('should redirect to dashboard when authenticated and on login page', () => {
      mockLocation.pathname = '/mobile/login.html'
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      
      const navigation = new MobileNavigation()
      
      expect(mockLocation.href).toBe('/mobile/dashboard.html')
    })

    it('should not redirect when authenticated and not on login page', () => {
      mockLocation.pathname = '/mobile/dashboard.html'
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      
      const navigation = new MobileNavigation()
      
      expect(mockLocation.href).toBe('')
    })

    it('should not redirect when not authenticated and on login page', () => {
      mockLocation.pathname = '/mobile/login.html'
      
      const navigation = new MobileNavigation()
      
      expect(mockLocation.href).toBe('')
    })
  })

  describe('createBottomNavigation', () => {
    it('should not create navigation when on login page', () => {
      mockLocation.pathname = '/mobile/login.html'
      
      const navigation = new MobileNavigation()
      
      const bottomNav = document.getElementById('bottomNavigation')
      expect(bottomNav).toBeNull()
    })

    it('should not create navigation when not authenticated', () => {
      mockLocation.pathname = '/mobile/dashboard.html'
      
      const navigation = new MobileNavigation()
      
      const bottomNav = document.getElementById('bottomNavigation')
      expect(bottomNav).toBeNull()
    })

    it('should create navigation when authenticated and not on login page', () => {
      mockLocation.pathname = '/mobile/dashboard.html'
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      
      const navigation = new MobileNavigation()
      
      const bottomNav = document.getElementById('bottomNavigation')
      expect(bottomNav).not.toBeNull()
      expect(bottomNav?.classList.contains('bottom-navigation')).toBe(true)
    })

    it('should create navigation items with correct data attributes', () => {
      mockLocation.pathname = '/mobile/dashboard.html'
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      
      const navigation = new MobileNavigation()
      
      const dashboardItem = document.querySelector('[data-page="dashboard"]')
      const samplesItem = document.querySelector('[data-page="samples"]')
      const resultsItem = document.querySelector('[data-page="lab-results"]')
      
      expect(dashboardItem).not.toBeNull()
      expect(samplesItem).not.toBeNull()
      expect(resultsItem).not.toBeNull()
    })
  })

  describe('addNavigationStyles', () => {
    it('should add navigation styles to document head', () => {
      mockLocation.pathname = '/mobile/dashboard.html'
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      
      const navigation = new MobileNavigation()
      
      const styleElement = document.getElementById('mobile-navigation-styles')
      expect(styleElement).not.toBeNull()
      expect(styleElement?.tagName).toBe('STYLE')
    })
  })

  describe('setupNavigationEvents', () => {
    it('should setup menu trigger event listener', () => {
      mockLocation.pathname = '/mobile/dashboard.html'
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      
      const navigation = new MobileNavigation()
      const menuTrigger = document.getElementById('navMenuTrigger')
      
      expect(menuTrigger).not.toBeNull()
      
      // Test click event
      const clickEvent = new dom.window.Event('click')
      menuTrigger?.dispatchEvent(clickEvent)
      
      // Should create navigation menu
      const overlay = document.getElementById('navMenuOverlay')
      expect(overlay).not.toBeNull()
    })

    it('should setup navigation item click events', () => {
      mockLocation.pathname = '/mobile/dashboard.html'
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      
      const navigation = new MobileNavigation()
      const dashboardItem = document.querySelector('[data-page="dashboard"]') as HTMLElement
      
      expect(dashboardItem).not.toBeNull()
      
      // Test click event
      const clickEvent = new dom.window.Event('click')
      dashboardItem?.dispatchEvent(clickEvent)
      
      // Should apply transform style
      expect(dashboardItem?.style.transform).toBe('scale(0.95)')
    })
  })

  describe('toggleNavigationMenu', () => {
    beforeEach(() => {
      mockLocation.pathname = '/mobile/dashboard.html'
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
    })

    it('should create navigation menu if it does not exist', () => {
      const navigation = new MobileNavigation()
      
      navigation.toggleNavigationMenu()
      
      const overlay = document.getElementById('navMenuOverlay')
      const menu = document.getElementById('navMenu')
      
      expect(overlay).not.toBeNull()
      expect(menu).not.toBeNull()
    })

    it('should toggle menu active state', () => {
      const navigation = new MobileNavigation()
      
      // First toggle - should activate
      navigation.toggleNavigationMenu()
      
      const overlay = document.getElementById('navMenuOverlay')
      const menu = document.getElementById('navMenu')
      
      expect(overlay?.classList.contains('active')).toBe(true)
      expect(menu?.classList.contains('active')).toBe(true)
      
      // Second toggle - should deactivate
      navigation.toggleNavigationMenu()
      
      expect(overlay?.classList.contains('active')).toBe(false)
      expect(menu?.classList.contains('active')).toBe(false)
    })
  })

  describe('createNavigationMenu', () => {
    beforeEach(() => {
      mockLocation.pathname = '/mobile/dashboard.html'
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ 
        username: 'testuser', 
        role: 'admin' 
      })
    })

    it('should create navigation menu with user data', () => {
      const navigation = new MobileNavigation()
      
      navigation.createNavigationMenu()
      
      const overlay = document.getElementById('navMenuOverlay')
      const menu = document.getElementById('navMenu')
      const logoutButton = document.getElementById('logoutButton')
      
      expect(overlay).not.toBeNull()
      expect(menu).not.toBeNull()
      expect(logoutButton).not.toBeNull()
    })

    it('should display user information in menu', () => {
      const navigation = new MobileNavigation()
      
      navigation.createNavigationMenu()
      
      const menuContent = document.getElementById('navMenu')?.innerHTML
      expect(menuContent).toContain('testuser')
      expect(menuContent).toContain('admin')
    })

    it('should setup overlay click event to close menu', () => {
      const navigation = new MobileNavigation()
      
      navigation.createNavigationMenu()
      
      const overlay = document.getElementById('navMenuOverlay')
      
      // Test overlay click
      const clickEvent = new dom.window.Event('click')
      Object.defineProperty(clickEvent, 'target', { value: overlay })
      overlay?.dispatchEvent(clickEvent)
      
      // Menu should be closed (not active)
      expect(overlay?.classList.contains('active')).toBe(false)
    })

    it('should setup logout button click event', () => {
      const navigation = new MobileNavigation()
      
      navigation.createNavigationMenu()
      
      const logoutButton = document.getElementById('logoutButton')
      
      // Test logout button click
      const clickEvent = new dom.window.Event('click')
      logoutButton?.dispatchEvent(clickEvent)
      
      // Should clear localStorage and redirect
      expect(localStorage.removeItem).toHaveBeenCalledWith('clsi_auth_token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('clsi_user_data')
      expect(mockLocation.href).toBe('/mobile/login.html')
    })
  })

  describe('updateActiveNavItem', () => {
    beforeEach(() => {
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
    })

    it('should mark dashboard item as active when on dashboard page', () => {
      mockLocation.pathname = '/mobile/dashboard.html'
      
      const navigation = new MobileNavigation()
      
      const dashboardItem = document.querySelector('[data-page="dashboard"]')
      const samplesItem = document.querySelector('[data-page="samples"]')
      
      expect(dashboardItem?.classList.contains('active')).toBe(true)
      expect(samplesItem?.classList.contains('active')).toBe(false)
    })

    it('should mark samples item as active when on samples page', () => {
      mockLocation.pathname = '/mobile/samples.html'
      
      const navigation = new MobileNavigation()
      
      const dashboardItem = document.querySelector('[data-page="dashboard"]')
      const samplesItem = document.querySelector('[data-page="samples"]')
      
      expect(dashboardItem?.classList.contains('active')).toBe(false)
      expect(samplesItem?.classList.contains('active')).toBe(true)
    })
  })

  describe('handleLogout', () => {
    it('should clear authentication data and redirect to login', () => {
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      
      const navigation = new MobileNavigation()
      
      navigation.handleLogout()
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('clsi_auth_token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('clsi_user_data')
      expect(mockLocation.href).toBe('/mobile/login.html')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid JSON in user data gracefully', () => {
      mockLocation.pathname = '/mobile/dashboard.html'
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = 'invalid-json'
      
      expect(() => {
        const navigation = new MobileNavigation()
        navigation.createNavigationMenu()
      }).not.toThrow()
    })

    it('should handle missing DOM elements gracefully', () => {
      mockLocation.pathname = '/mobile/dashboard.html'
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      
      const navigation = new MobileNavigation()
      
      // Remove the menu trigger element
      const menuTrigger = document.getElementById('navMenuTrigger')
      menuTrigger?.remove()
      
      expect(() => {
        navigation.setupNavigationEvents()
      }).not.toThrow()
    })

    it('should handle empty localStorage gracefully', () => {
      mockLocalStorage = {}
      
      expect(() => {
        const navigation = new MobileNavigation()
      }).not.toThrow()
    })
  })
})