import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { JSDOM } from 'jsdom'

describe('Mobile Navigation E2E Tests', () => {
  let dom: JSDOM
  let mockLocalStorage: { [key: string]: string }

  beforeEach(() => {
    // Setup JSDOM environment with mobile viewport
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CLSI Mobile</title>
        </head>
        <body>
          <div class="main-content">
            <h1>Dashboard</h1>
            <p>Welcome to CLSI Mobile Platform</p>
          </div>
        </body>
      </html>
    `, {
      url: 'http://localhost:3000/mobile/dashboard.html',
      pretendToBeVisual: true,
      resources: 'usable'
    })

    global.window = dom.window as any
    global.document = dom.window.document
    
    // Setup localStorage mock
    mockLocalStorage = {}
    global.localStorage = {
      getItem: (key: string) => mockLocalStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockLocalStorage[key] = value
      },
      removeItem: (key: string) => {
        delete mockLocalStorage[key]
      },
      clear: () => {
        mockLocalStorage = {}
      }
    } as any

    // Setup location mock
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/mobile/dashboard.html',
        href: '',
        assign: (url: string) => {
          window.location.href = url
        }
      },
      writable: true
    })
  })

  afterEach(() => {
    dom.window.close()
  })

  describe('Complete Mobile Navigation Workflow', () => {
    it('should handle complete user authentication and navigation flow', async () => {
      // Step 1: User starts unauthenticated
      const MobileNavigation = await import('../../../public/js/mobile-navigation.js')
      
      // Should redirect to login when not authenticated
      let navigation = new (MobileNavigation as any).default()
      expect(window.location.href).toBe('/mobile/login.html')
      
      // Step 2: User logs in
      mockLocalStorage['clsi_auth_token'] = 'test-token-123'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({
        username: 'testuser',
        role: 'microbiologist',
        id: 1
      })
      
      // Reset location to dashboard
      window.location.pathname = '/mobile/dashboard.html'
      window.location.href = ''
      
      // Step 3: Create authenticated navigation
      navigation = new (MobileNavigation as any).default()
      
      // Should create bottom navigation
      const bottomNav = document.getElementById('bottomNavigation')
      expect(bottomNav).not.toBeNull()
      
      // Step 4: Test navigation interactions
      const menuTrigger = document.getElementById('navMenuTrigger')
      expect(menuTrigger).not.toBeNull()
      
      // Click menu trigger to open menu
      menuTrigger?.click()
      
      const overlay = document.getElementById('navMenuOverlay')
      const menu = document.getElementById('navMenu')
      
      expect(overlay?.classList.contains('active')).toBe(true)
      expect(menu?.classList.contains('active')).toBe(true)
      
      // Step 5: Test logout functionality
      const logoutButton = document.getElementById('logoutButton')
      expect(logoutButton).not.toBeNull()
      
      logoutButton?.click()
      
      // Should clear authentication and redirect
      expect(mockLocalStorage['clsi_auth_token']).toBeUndefined()
      expect(mockLocalStorage['clsi_user_data']).toBeUndefined()
      expect(window.location.href).toBe('/mobile/login.html')
    })

    it('should handle navigation between different pages', async () => {
      // Setup authenticated user
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      
      const MobileNavigation = await import('../../../public/js/mobile-navigation.js')
      
      // Test dashboard page
      window.location.pathname = '/mobile/dashboard.html'
      let navigation = new (MobileNavigation as any).default()
      
      let dashboardItem = document.querySelector('[data-page="dashboard"]')
      expect(dashboardItem?.classList.contains('active')).toBe(true)
      
      // Test samples page
      window.location.pathname = '/mobile/samples.html'
      navigation = new (MobileNavigation as any).default()
      
      let samplesItem = document.querySelector('[data-page="samples"]')
      expect(samplesItem?.classList.contains('active')).toBe(true)
      
      // Test lab results page
      window.location.pathname = '/mobile/lab-results.html'
      navigation = new (MobileNavigation as any).default()
      
      let resultsItem = document.querySelector('[data-page="lab-results"]')
      expect(resultsItem?.classList.contains('active')).toBe(true)
    })

    it('should handle menu overlay interactions', async () => {
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      window.location.pathname = '/mobile/dashboard.html'
      
      const MobileNavigation = await import('../../../public/js/mobile-navigation.js')
      const navigation = new (MobileNavigation as any).default()
      
      // Open menu
      const menuTrigger = document.getElementById('navMenuTrigger')
      menuTrigger?.click()
      
      const overlay = document.getElementById('navMenuOverlay')
      expect(overlay?.classList.contains('active')).toBe(true)
      
      // Click overlay to close menu
      const clickEvent = new dom.window.Event('click')
      Object.defineProperty(clickEvent, 'target', { value: overlay })
      overlay?.dispatchEvent(clickEvent)
      
      expect(overlay?.classList.contains('active')).toBe(false)
    })

    it('should handle navigation item visual feedback', async () => {
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      window.location.pathname = '/mobile/dashboard.html'
      
      const MobileNavigation = await import('../../../public/js/mobile-navigation.js')
      const navigation = new (MobileNavigation as any).default()
      
      const dashboardItem = document.querySelector('[data-page="dashboard"]') as HTMLElement
      expect(dashboardItem).not.toBeNull()
      
      // Click navigation item
      dashboardItem?.click()
      
      // Should apply visual feedback
      expect(dashboardItem?.style.transform).toBe('scale(0.95)')
      
      // Wait for timeout to reset
      await new Promise(resolve => setTimeout(resolve, 200))
      expect(dashboardItem?.style.transform).toBe('')
    })
  })

  describe('Mobile Navigation Accessibility', () => {
    it('should provide proper ARIA labels and keyboard navigation', async () => {
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      window.location.pathname = '/mobile/dashboard.html'
      
      const MobileNavigation = await import('../../../public/js/mobile-navigation.js')
      const navigation = new (MobileNavigation as any).default()
      
      const navItems = document.querySelectorAll('.nav-item')
      expect(navItems.length).toBeGreaterThan(0)
      
      // Check for proper semantic structure
      const bottomNav = document.querySelector('nav.bottom-navigation')
      expect(bottomNav).not.toBeNull()
      
      // Check for proper button elements
      const menuTrigger = document.querySelector('button.nav-menu-trigger')
      expect(menuTrigger).not.toBeNull()
    })

    it('should handle keyboard events for menu navigation', async () => {
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      window.location.pathname = '/mobile/dashboard.html'
      
      const MobileNavigation = await import('../../../public/js/mobile-navigation.js')
      const navigation = new (MobileNavigation as any).default()
      
      const menuTrigger = document.getElementById('navMenuTrigger')
      
      // Test keyboard activation
      const keyEvent = new dom.window.KeyboardEvent('keydown', { key: 'Enter' })
      menuTrigger?.dispatchEvent(keyEvent)
      
      // Menu should be accessible via keyboard
      expect(menuTrigger?.getAttribute('tabindex')).not.toBe('-1')
    })
  })

  describe('Mobile Navigation Performance', () => {
    it('should initialize quickly and efficiently', async () => {
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      window.location.pathname = '/mobile/dashboard.html'
      
      const startTime = performance.now()
      
      const MobileNavigation = await import('../../../public/js/mobile-navigation.js')
      const navigation = new (MobileNavigation as any).default()
      
      const endTime = performance.now()
      const initTime = endTime - startTime
      
      // Should initialize within reasonable time (< 100ms)
      expect(initTime).toBeLessThan(100)
      
      // Should create necessary DOM elements
      expect(document.getElementById('bottomNavigation')).not.toBeNull()
      expect(document.getElementById('mobile-navigation-styles')).not.toBeNull()
    })

    it('should handle rapid menu toggles without issues', async () => {
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      window.location.pathname = '/mobile/dashboard.html'
      
      const MobileNavigation = await import('../../../public/js/mobile-navigation.js')
      const navigation = new (MobileNavigation as any).default()
      
      const menuTrigger = document.getElementById('navMenuTrigger')
      
      // Rapidly toggle menu multiple times
      for (let i = 0; i < 10; i++) {
        menuTrigger?.click()
      }
      
      // Should still be in a consistent state
      const overlay = document.getElementById('navMenuOverlay')
      expect(overlay?.classList.contains('active')).toBe(false) // Even number of clicks
    })
  })

  describe('Mobile Navigation Error Handling', () => {
    it('should handle corrupted localStorage gracefully', async () => {
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = 'invalid-json-data'
      window.location.pathname = '/mobile/dashboard.html'
      
      expect(() => {
        const MobileNavigation = require('../../../public/js/mobile-navigation.js')
        const navigation = new MobileNavigation.default()
      }).not.toThrow()
    })

    it('should handle missing DOM elements gracefully', async () => {
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      window.location.pathname = '/mobile/dashboard.html'
      
      const MobileNavigation = await import('../../../public/js/mobile-navigation.js')
      const navigation = new (MobileNavigation as any).default()
      
      // Remove critical elements
      document.getElementById('navMenuTrigger')?.remove()
      
      expect(() => {
        navigation.setupNavigationEvents()
      }).not.toThrow()
    })

    it('should handle network connectivity issues', async () => {
      mockLocalStorage['clsi_auth_token'] = 'test-token'
      mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
      window.location.pathname = '/mobile/dashboard.html'
      
      // Simulate offline condition
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })
      
      const MobileNavigation = await import('../../../public/js/mobile-navigation.js')
      const navigation = new (MobileNavigation as any).default()
      
      // Should still create navigation
      expect(document.getElementById('bottomNavigation')).not.toBeNull()
    })
  })

  describe('Mobile Navigation Cross-Browser Compatibility', () => {
    it('should work with different user agent strings', async () => {
      // Simulate different mobile browsers
      const userAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
        'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
      ]
      
      for (const userAgent of userAgents) {
        Object.defineProperty(navigator, 'userAgent', {
          value: userAgent,
          configurable: true
        })
        
        mockLocalStorage['clsi_auth_token'] = 'test-token'
        mockLocalStorage['clsi_user_data'] = JSON.stringify({ username: 'testuser' })
        window.location.pathname = '/mobile/dashboard.html'
        
        const MobileNavigation = await import('../../../public/js/mobile-navigation.js')
        const navigation = new (MobileNavigation as any).default()
        
        expect(document.getElementById('bottomNavigation')).not.toBeNull()
        
        // Clean up for next iteration
        document.body.innerHTML = '<div class="main-content"><h1>Dashboard</h1></div>'
      }
    })
  })
})
