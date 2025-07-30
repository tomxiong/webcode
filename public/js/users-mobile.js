// Users Mobile JavaScript
class UsersMobile extends MobileBase {
  constructor() {
    super();
    this.currentPage = 1;
    this.pageSize = 20;
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.users = [];
    this.isLoading = false;
    this.hasMore = true;
    this.userStats = {};
    
    this.initUsers();
  }

  initUsers() {
    this.setupSearch();
    this.setupFilters();
    this.setupBottomSheet();
    this.setupFAB();
    this.setupInfiniteScroll();
    this.loadUsers();
    this.loadUserStats();
  }

  setupSearch() {
    const searchToggle = document.getElementById('searchToggle');
    const searchContainer = document.getElementById('searchContainer');
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');

    if (searchToggle) {
      searchToggle.addEventListener('click', () => {
        const isVisible = searchContainer.style.display !== 'none';
        searchContainer.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
          searchInput.focus();
        }
      });
    }

    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.searchQuery = e.target.value.trim();
          this.resetPagination();
          this.loadUsers();
        }, 300);
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        this.searchQuery = '';
        this.resetPagination();
        this.loadUsers();
      });
    }
  }

  setupFilters() {
    const filterToggle = document.getElementById('filterToggle');
    const filterSection = document.getElementById('filterSection');
    const filterChips = document.querySelectorAll('.filter-chip');

    if (filterToggle) {
      filterToggle.addEventListener('click', () => {
        const isVisible = filterSection.style.display !== 'none';
        filterSection.style.display = isVisible ? 'none' : 'flex';
      });
    }

    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        // Remove active class from all chips
        filterChips.forEach(c => c.classList.remove('active'));
        // Add active class to clicked chip
        chip.classList.add('active');
        
        this.currentFilter = chip.dataset.filter;
        this.resetPagination();
        this.loadUsers();
      });
    });

    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.currentFilter = 'all';
        this.searchQuery = '';
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        
        filterChips.forEach(c => c.classList.remove('active'));
        filterChips[0].classList.add('active'); // Activate "All Users"
        
        this.resetPagination();
        this.loadUsers();
      });
    }
  }

  setupBottomSheet() {
    const closeBtn = document.getElementById('closeBottomSheet');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideBottomSheet();
      });
    }
  }

  setupFAB() {
    const fab = document.getElementById('addUserFab');
    if (fab) {
      fab.addEventListener('click', () => {
        this.showAddUserForm();
      });
    }
  }

  setupInfiniteScroll() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        this.loadMoreUsers();
      });
    }

    // Intersection Observer for automatic loading
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.hasMore && !this.isLoading) {
        this.loadMoreUsers();
      }
    }, { threshold: 0.1 });

    if (loadMoreBtn) {
      observer.observe(loadMoreBtn);
    }
  }

  resetPagination() {
    this.currentPage = 1;
    this.users = [];
    this.hasMore = true;
  }

  async loadUsers() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: this.currentPage,
        limit: this.pageSize,
        filter: this.currentFilter,
        search: this.searchQuery
      });

      const response = await this.get(`/api/users?${params}`);
      
      if (this.currentPage === 1) {
        this.users = response.data;
      } else {
        this.users = [...this.users, ...response.data];
      }
      
      this.hasMore = response.data.length === this.pageSize;
      this.renderUsers();
      
    } catch (error) {
      console.error('Failed to load users:', error);
      this.showToast('Failed to load users', 'error');
    } finally {
      this.isLoading = false;
      this.showLoading(false);
    }
  }

  async loadMoreUsers() {
    if (!this.hasMore || this.isLoading) return;
    
    this.currentPage++;
    await this.loadUsers();
  }

  async loadUserStats() {
    try {
      const response = await this.get('/api/users/stats');
      this.userStats = response.data;
      this.updateFilterCounts();
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  }

  updateFilterCounts() {
    const counts = {
      all: this.userStats.total || 0,
      admin: this.userStats.byRole?.ADMIN || 0,
      labTech: this.userStats.byRole?.LAB_TECH || 0,
      viewer: this.userStats.byRole?.VIEWER || 0,
      active: this.userStats.active || 0
    };

    Object.entries(counts).forEach(([key, count]) => {
      const element = document.getElementById(`${key}Count`);
      if (element) {
        element.textContent = count;
      }
    });
  }

  renderUsers() {
    const usersList = document.getElementById('usersList');
    const emptyState = document.getElementById('emptyState');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (!usersList) return;
    
    if (this.users.length === 0) {
      usersList.innerHTML = '';
      emptyState.style.display = 'block';
      loadMoreBtn.style.display = 'none';
      return;
    }
    
    emptyState.style.display = 'none';
    loadMoreBtn.style.display = this.hasMore ? 'block' : 'none';
    
    if (this.currentPage === 1) {
      usersList.innerHTML = '';
    }
    
    const newUsers = this.currentPage === 1 ? this.users : 
      this.users.slice((this.currentPage - 1) * this.pageSize);
    
    newUsers.forEach(user => {
      const userCard = this.createUserCard(user);
      usersList.appendChild(userCard);
    });
  }

  createUserCard(user) {
    const card = document.createElement('div');
    card.className = `user-card ${user.role.toLowerCase().replace('_', '-')}`;
    card.dataset.userId = user.id;
    
    const initials = this.getUserInitials(user.username);
    const roleClass = user.role.toLowerCase().replace('_', '-');
    const statusClass = user.isActive ? 'active' : 'inactive';
    
    card.innerHTML = `
      <div class="user-header">
        <div class="user-avatar ${roleClass}">${initials}</div>
        <div class="user-info">
          <div class="user-name">
            ${user.username}
            ${user.isActive ? '' : '<span style="opacity: 0.5;">●</span>'}
          </div>
          <div class="user-email">${user.email}</div>
          <div class="user-meta">
            <span class="user-role role-${roleClass}">
              ${this.formatRole(user.role)}
            </span>
            <span class="user-status status-${statusClass}">
              <span class="status-dot"></span>
              ${user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
      
      <div class="user-actions">
        <div class="user-last-login">
          Last login: ${user.lastLoginAt ? this.formatDate(user.lastLoginAt) : 'Never'}
        </div>
        <button class="user-menu-btn" data-action="menu">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
      </div>
      
      <div class="swipe-actions">
        <div class="swipe-action edit" data-action="edit">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          Edit
        </div>
        <div class="swipe-action delete" data-action="delete">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          Delete
        </div>
      </div>
    `;
    
    // Add click event for details
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.swipe-action') && !e.target.closest('.user-menu-btn')) {
        this.showUserDetails(user);
      }
    });
    
    // Add swipe action events
    const swipeActions = card.querySelectorAll('.swipe-action');
    swipeActions.forEach(action => {
      action.addEventListener('click', (e) => {
        e.stopPropagation();
        const actionType = action.dataset.action;
        if (actionType === 'edit') {
          this.editUser(user);
        } else if (actionType === 'delete') {
          this.deleteUser(user);
        }
      });
    });
    
    // Add menu button event
    const menuBtn = card.querySelector('.user-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showUserMenu(user, menuBtn);
      });
    }
    
    return card;
  }

  getUserInitials(username) {
    return username.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2);
  }

  formatRole(role) {
    const roleMap = {
      'ADMIN': 'Admin',
      'LAB_TECH': 'Lab Tech',
      'VIEWER': 'Viewer'
    };
    return roleMap[role] || role;
  }

  showUserDetails(user) {
    const content = `
      <div class="user-details">
        <div class="detail-section">
          <div class="detail-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            Basic Information
          </div>
          <div class="detail-grid">
            <div class="detail-item">
              <div class="detail-label">User ID</div>
              <div class="detail-value highlight">${user.id}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Username</div>
              <div class="detail-value">${user.username}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Email</div>
              <div class="detail-value">${user.email}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Role</div>
              <div class="detail-value">
                <span class="user-role role-${user.role.toLowerCase().replace('_', '-')}">
                  ${this.formatRole(user.role)}
                </span>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Status</div>
              <div class="detail-value">
                <span class="user-status status-${user.isActive ? 'active' : 'inactive'}">
                  <span class="status-dot"></span>
                  ${user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Created</div>
              <div class="detail-value">${this.formatDate(user.createdAt)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Last Login</div>
              <div class="detail-value">${user.lastLoginAt ? this.formatDate(user.lastLoginAt) : 'Never'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Updated</div>
              <div class="detail-value">${this.formatDate(user.updatedAt)}</div>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <div class="detail-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            Permissions & Access
          </div>
          <div class="permissions-grid">
            ${this.renderUserPermissions(user)}
          </div>
        </div>
        
        <div class="detail-section">
          <div class="detail-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/>
            </svg>
            Recent Activity
          </div>
          <div class="activity-timeline">
            ${this.renderUserActivity(user)}
          </div>
        </div>
      </div>
    `;
    
    this.showBottomSheet('User Details', content);
  }

  renderUserPermissions(user) {
    const permissions = this.getUserPermissions(user.role);
    return permissions.map(permission => `
      <div class="permission-item">
        <div class="permission-info">
          <div class="permission-name">${permission.name}</div>
          <div class="permission-description">${permission.description}</div>
        </div>
        <div class="permission-toggle ${permission.granted ? 'active' : ''}"></div>
      </div>
    `).join('');
  }

  getUserPermissions(role) {
    const allPermissions = [
      { name: 'View Dashboard', description: 'Access to main dashboard', granted: true },
      { name: 'Manage Samples', description: 'Create and edit samples', granted: role !== 'VIEWER' },
      { name: 'Manage Lab Results', description: 'Create and edit lab results', granted: role !== 'VIEWER' },
      { name: 'Manage Users', description: 'Create and edit user accounts', granted: role === 'ADMIN' },
      { name: 'Manage Expert Rules', description: 'Create and edit expert rules', granted: role === 'ADMIN' },
      { name: 'Generate Reports', description: 'Generate and export reports', granted: true },
      { name: 'System Configuration', description: 'Access system settings', granted: role === 'ADMIN' }
    ];
    
    return allPermissions;
  }

  renderUserActivity(user) {
    // Mock activity data - in real app, this would come from API
    const activities = [
      {
        icon: '👤',
        title: 'Account Created',
        description: 'User account was created',
        time: user.createdAt
      },
      {
        icon: '🔑',
        title: 'Last Login',
        description: 'User logged into the system',
        time: user.lastLoginAt || user.createdAt
      },
      {
        icon: '✏️',
        title: 'Profile Updated',
        description: 'User profile information was updated',
        time: user.updatedAt
      }
    ];
    
    return activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon">${activity.icon}</div>
        <div class="activity-content">
          <div class="activity-title">${activity.title}</div>
          <div class="activity-description">${activity.description}</div>
          <div class="activity-time">${this.formatDate(activity.time)}</div>
        </div>
      </div>
    `).join('');
  }

  showAddUserForm() {
    const content = `
      <form class="user-form" id="addUserForm">
        <div class="form-section">
          <div class="form-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            Basic Information
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required" for="newUsername">Username</label>
              <input type="text" id="newUsername" class="form-input" required>
              <div class="form-error" id="usernameError"></div>
            </div>
            <div class="form-group">
              <label class="form-label required" for="newEmail">Email</label>
              <input type="email" id="newEmail" class="form-input" required>
              <div class="form-error" id="emailError"></div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required" for="newPassword">Password</label>
              <input type="password" id="newPassword" class="form-input" required>
              <div class="form-error" id="passwordError"></div>
            </div>
            <div class="form-group">
              <label class="form-label required" for="confirmPassword">Confirm Password</label>
              <input type="password" id="confirmPassword" class="form-input" required>
              <div class="form-error" id="confirmPasswordError"></div>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <div class="form-section-title">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            Role & Permissions
          </div>
          
          <div class="form-row full-width">
            <div class="form-group">
              <label class="form-label required" for="newRole">Role</label>
              <select id="newRole" class="form-select" required>
                <option value="">Select a role</option>
                <option value="ADMIN">Administrator</option>
                <option value="LAB_TECH">Laboratory Technician</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <div class="form-error" id="roleError"></div>
            </div>
          </div>
          
          <div class="form-row full-width">
            <div class="form-group">
              <div class="form-checkbox-group">
                <input type="checkbox" id="newIsActive" class="form-checkbox" checked>
                <label for="newIsActive" class="form-label">Active User</label>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" id="cancelAddUser">Cancel</button>
          <button type="submit" class="btn btn-primary">Create User</button>
        </div>
      </form>
    `;
    
    this.showBottomSheet('Add New User', content);
    
    // Setup form events
    const form = document.getElementById('addUserForm');
    const cancelBtn = document.getElementById('cancelAddUser');
    
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddUser();
      });
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.hideBottomSheet();
      });
    }
  }

  async handleAddUser() {
    const formData = {
      username: document.getElementById('newUsername').value.trim(),
      email: document.getElementById('newEmail').value.trim(),
      password: document.getElementById('newPassword').value,
      confirmPassword: document.getElementById('confirmPassword').value,
      role: document.getElementById('newRole').value,
      isActive: document.getElementById('newIsActive').checked
    };
    
    // Validate form
    if (!this.validateUserForm(formData)) {
      return;
    }
    
    try {
      this.showLoading(true);
      
      const response = await this.post('/api/users', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        isActive: formData.isActive
      });
      
      this.showToast('User created successfully', 'success');
      this.hideBottomSheet();
      this.resetPagination();
      this.loadUsers();
      this.loadUserStats();
      
    } catch (error) {
      console.error('Failed to create user:', error);
      this.showToast(error.message || 'Failed to create user', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  validateUserForm(formData) {
    let isValid = true;
    
    // Clear previous errors
    document.querySelectorAll('.form-error').forEach(error => error.textContent = '');
    
    // Username validation
    if (!formData.username) {
      document.getElementById('usernameError').textContent = 'Username is required';
      isValid = false;
    } else if (formData.username.length < 3) {
      document.getElementById('usernameError').textContent = 'Username must be at least 3 characters';
      isValid = false;
    }
    
    // Email validation
    if (!formData.email) {
      document.getElementById('emailError').textContent = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      document.getElementById('emailError').textContent = 'Please enter a valid email address';
      isValid = false;
    }
    
    // Password validation
    if (!formData.password) {
      document.getElementById('passwordError').textContent = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      document.getElementById('passwordError').textContent = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
      isValid = false;
    }
    
    // Role validation
    if (!formData.role) {
      document.getElementById('roleError').textContent = 'Please select a role';
      isValid = false;
    }
    
    return isValid;
  }

  async editUser(user) {
    // Implementation for editing user
    this.showToast('Edit user functionality coming soon', 'info');
  }

  async deleteUser(user) {
    const confirmed = await this.showConfirmDialog(
      'Delete User',
      `Are you sure you want to delete user "${user.username}"? This action cannot be undone.`,
      'Delete',
      'Cancel'
    );
    
    if (!confirmed) return;
    
    try {
      this.showLoading(true);
      
      await this.delete(`/api/users/${user.id}`);
      
      this.showToast('User deleted successfully', 'success');
      this.resetPagination();
      this.loadUsers();
      this.loadUserStats();
      
    } catch (error) {
      console.error('Failed to delete user:', error);
      this.showToast(error.message || 'Failed to delete user', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  showUserMenu(user, triggerElement) {
    // Implementation for user context menu
    this.showToast('User menu functionality coming soon', 'info');
  }
}

// Auto-initialize users mobile
document.addEventListener('DOMContentLoaded', () => {
  new UsersMobile();
});
