// Mobile Navigation Component
class MobileNavigation {
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
      // Redirect to login if not authenticated
      window.location.href = '/mobile/login.html';
      return;
    }
    
    if (this.isAuthenticated && this.currentPage === 'login') {
      // Redirect to dashboard if already authenticated
      window.location.href = '/mobile/dashboard.html';
      return;
    }
  }

  createBottomNavigation() {
    // Don't show navigation on login page
    if (this.currentPage === 'login' || !this.isAuthenticated) {
      return;
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
              <path fill="currentColor" d="m2.845 16.136 1 1.73c.531-.312 1.175-.518 1.85-.518.676 0 1.319.206 1.85.518l1-1.73C7.644 15.761 6.846 15.4 6.003 15.4s-1.641.361-2.542.736zM15.295 16.136l1 1.73c.531-.312 1.174-.518 1.849-.518s1.318.206 1.849.518l1-1.73C20.092 15.761 19.294 15.4 18.451 15.4s-1.641.361-2.542.736zM8.862 8.688l1.731-1c-.312-.531-.518-1.174-.518-1.849 0-.676.206-1.318.518-1.849l-1.731-1C7.487 3.891 7.126 4.689 7.126 5.532c0 .842.361 1.641.736 2.542zM15.138 8.688c.375-.901.736-1.7.736-2.542 0-.843-.361-1.641-.736-2.542l-1.731 1c.312.531.518 1.173.518 1.849 0 .675-.206 1.318-.518 1.849l1.731 1z"/>
            </svg>
            <span class="nav-label">More</span>
          </button>
        </div>
      </nav>
    `;

    // Insert navigation at the end of body
    document.body.insertAdjacentHTML('beforeend', navHTML);

    // Add navigation styles
    this.addNavigationStyles();
  }

  addNavigationStyles() {
    const styles = `
      <style id="mobile-navigation-styles">
        .bottom-navigation {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--surface-color);
          border-top: 1px solid var(--border-color);
          padding: var(--spacing-sm) 0;
          z-index: 1000;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .nav-items {
          display: flex;
          justify-content: space-around;
          align-items: center;
          max-width: 500px;
          margin: 0 auto;
          padding: 0 var(--spacing-md);
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm);
          border-radius: var(--radius-md);
          text-decoration: none;
          color: var(--text-secondary);
          transition: all 0.2s;
          min-width: 60px;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
        }

        .nav-item:hover,
        .nav-item:focus {
          color: var(--primary-color);
          background: rgba(37, 99, 235, 0.1);
        }

        .nav-item.active {
          color: var(--primary-color);
        }

        .nav-item.active .nav-icon {
          transform: scale(1.1);
        }

        .nav-icon {
          transition: transform 0.2s;
        }

        .nav-label {
          font-size: 0.75rem;
          font-weight: 500;
          text-align: center;
        }

        /* Add bottom padding to main content to account for navigation */
        .main-content,
        .page-container,
        .container {
          padding-bottom: 80px;
        }

        /* Navigation Menu Overlay */
        .nav-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1001;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s;
          backdrop-filter: blur(4px);
        }

        .nav-menu-overlay.active {
          opacity: 1;
          visibility: visible;
        }

        .nav-menu {
          position: fixed;
          bottom: 80px;
          right: var(--spacing-md);
          background: var(--surface-color);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          padding: var(--spacing-md);
          min-width: 200px;
          transform: translateY(20px) scale(0.9);
          opacity: 0;
          transition: all 0.3s;
          z-index: 1002;
        }

        .nav-menu.active {
          transform: translateY(0) scale(1);
          opacity: 1;
        }

        .nav-menu-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          text-decoration: none;
          color: var(--text-primary);
          transition: all 0.2s;
          border: none;
          background: none;
          width: 100%;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.875rem;
        }

        .nav-menu-item:hover {
          background: var(--background-color);
        }

        .nav-menu-item svg {
          width: 20px;
          height: 20px;
          color: var(--text-secondary);
        }

        .nav-menu-divider {
          height: 1px;
          background: var(--border-color);
          margin: var(--spacing-sm) 0;
        }

        @media (max-width: 480px) {
          .nav-items {
            padding: 0 var(--spacing-sm);
          }
          
          .nav-item {
            min-width: 50px;
            padding: var(--spacing-xs);
          }
          
          .nav-label {
            font-size: 0.6875rem;
          }
        }
      </style>
    `;

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

    // Handle navigation item clicks
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        // Let the default navigation happen
        // but add some visual feedback
        item.style.transform = 'scale(0.95)';
        setTimeout(() => {
          item.style.transform = '';
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

    const isActive = overlay.classList.contains('active');
    
    if (isActive) {
      overlay.classList.remove('active');
      menu.classList.remove('active');
    } else {
      overlay.classList.add('active');
      menu.classList.add('active');
    }
  }

  createNavigationMenu() {
    const userData = JSON.parse(localStorage.getItem('clsi_user_data') || '{}');
    
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
          
          <a href="/mobile/dashboard.html" class="nav-menu-item">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M13 3v6h8V3m-8 18h8V11h-8M3 21h8v-6H3m0-2h8V3H3v10Z"/>
            </svg>
            Dashboard
          </a>
          
          <a href="/mobile/samples.html" class="nav-menu-item">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M7 2v2h1v14a4 4 0 0 0 4 4 4 4 0 0 0 4-4V4h1V2H7M9 4h6v14a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4Z"/>
            </svg>
            Samples
          </a>
          
          <a href="/mobile/lab-results.html" class="nav-menu-item">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            Lab Results
          </a>
          
          <a href="/mobile/users.html" class="nav-menu-item">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2M4 18v-6h3v-2c0-1.1.9-2 2-2h3.5c1.1 0 2 .9 2 2v2H18v6H4Z"/>
            </svg>
            Users
          </a>
          
          <div class="nav-menu-divider"></div>
          
          <button class="nav-menu-item" onclick="window.open('/dashboard.html', '_blank')">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M14 3v2h2.59l-9.83 9.83 1.41 1.41L18 6.41V9h2V3m-2 16H4V5h7V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-7h-2v7Z"/>
            </svg>
            Desktop Version
          </button>
          
          <button class="nav-menu-item" id="logoutButton">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 0 1 2 2v2h-2V4H4v16h10v-2h2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10Z"/>
            </svg>
            Logout
          </button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', menuHTML);

    // Setup menu events
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
      if (item.dataset.page === this.currentPage) {
        item.classList.add('active');
      }
    });
  }

  handleLogout() {
    // Clear authentication data
    localStorage.removeItem('clsi_auth_token');
    localStorage.removeItem('clsi_user_data');
    
    // Redirect to login
    window.location.href = '/mobile/login.html';
  }
}

// Auto-initialize navigation
document.addEventListener('DOMContentLoaded', () => {
  new MobileNavigation();
});