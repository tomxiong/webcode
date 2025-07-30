// Dashboard Mobile JavaScript
class DashboardMobile extends MobileBase {
  constructor() {
    super();
    this.initDashboard();
  }

  initDashboard() {
    this.loadStats();
    this.loadRecentActivity();
    this.loadAlerts();
    this.setupNotifications();
    this.setupRefresh();
  }

  async loadStats() {
    try {
      const stats = await this.fetchDashboardStats();
      this.updateStatsDisplay(stats);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      this.showToast('Failed to load dashboard statistics', 'error');
    }
  }

  async fetchDashboardStats() {
    // Mock data for demonstration - replace with actual API calls
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalSamples: 1247,
          totalResults: 892,
          pendingValidation: 23,
          qcPassRate: '98.5%',
          samplesChange: '+12%',
          resultsChange: '+8%',
          pendingChange: '-5%',
          qcChange: '+2%'
        });
      }, 1000);
    });
  }

  updateStatsDisplay(stats) {
    const elements = {
      totalSamples: document.getElementById('totalSamples'),
      totalResults: document.getElementById('totalResults'),
      pendingValidation: document.getElementById('pendingValidation'),
      qcPassRate: document.getElementById('qcPassRate'),
      samplesChange: document.getElementById('samplesChange'),
      resultsChange: document.getElementById('resultsChange'),
      pendingChange: document.getElementById('pendingChange'),
      qcChange: document.getElementById('qcChange')
    };

    Object.keys(elements).forEach(key => {
      if (elements[key] && stats[key]) {
        elements[key].textContent = stats[key];
      }
    });

    // Hide loading spinner
    this.showLoading(false);
  }

  async loadRecentActivity() {
    try {
      const activities = await this.fetchRecentActivity();
      this.displayRecentActivity(activities);
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    }
  }

  async fetchRecentActivity() {
    // Mock data for demonstration
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            type: 'sample',
            title: 'New sample registered',
            description: 'Sample ID: S-2024-001247',
            time: new Date(Date.now() - 5 * 60000),
            icon: 'samples'
          },
          {
            id: 2,
            type: 'result',
            title: 'Lab result completed',
            description: 'E. coli sensitivity test',
            time: new Date(Date.now() - 15 * 60000),
            icon: 'results'
          },
          {
            id: 3,
            type: 'validation',
            title: 'Result validated',
            description: 'Expert rule applied successfully',
            time: new Date(Date.now() - 30 * 60000),
            icon: 'validation'
          },
          {
            id: 4,
            type: 'qc',
            title: 'QC check passed',
            description: 'Daily quality control completed',
            time: new Date(Date.now() - 60 * 60000),
            icon: 'qc'
          }
        ]);
      }, 800);
    });
  }

  displayRecentActivity(activities) {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    const activityHTML = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon ${activity.icon}-icon">
          ${this.getActivityIcon(activity.type)}
        </div>
        <div class="activity-content">
          <div class="activity-title">${activity.title}</div>
          <div class="activity-description">${activity.description}</div>
        </div>
        <div class="activity-time">${this.formatRelativeTime(activity.time)}</div>
      </div>
    `).join('');

    activityList.innerHTML = activityHTML;
  }

  getActivityIcon(type) {
    const icons = {
      sample: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>',
      result: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>',
      validation: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
      qc: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
    };
    return icons[type] || icons.sample;
  }

  async loadAlerts() {
    try {
      const alerts = await this.fetchAlerts();
      this.displayAlerts(alerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  }

  async fetchAlerts() {
    // Mock data for demonstration
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            type: 'warning',
            title: 'QC Control Expiring',
            description: 'Quality control materials will expire in 3 days. Please order replacements.'
          },
          {
            id: 2,
            type: 'info',
            title: 'System Update Available',
            description: 'A new version of the CLSI platform is available for installation.'
          }
        ]);
      }, 600);
    });
  }

  displayAlerts(alerts) {
    const alertsList = document.getElementById('alertsList');
    if (!alertsList) return;

    if (alerts.length === 0) {
      alertsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: var(--spacing-lg);">No alerts at this time</p>';
      return;
    }

    const alertsHTML = alerts.map(alert => `
      <div class="alert-item ${alert.type}">
        <svg class="alert-icon ${alert.type}" viewBox="0 0 24 24">
          ${this.getAlertIcon(alert.type)}
        </svg>
        <div class="alert-content">
          <div class="alert-title">${alert.title}</div>
          <div class="alert-description">${alert.description}</div>
        </div>
      </div>
    `).join('');

    alertsList.innerHTML = alertsHTML;
  }

  getAlertIcon(type) {
    const icons = {
      warning: '<path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
      error: '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
      info: '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>'
    };
    return icons[type] || icons.info;
  }

  setupNotifications() {
    const notificationsToggle = document.getElementById('notificationsToggle');
    const notificationsPanel = document.getElementById('notificationsPanel');
    const closeNotifications = document.getElementById('closeNotifications');

    if (notificationsToggle && notificationsPanel) {
      notificationsToggle.addEventListener('click', () => {
        notificationsPanel.classList.toggle('active');
        this.toggleOverlay(notificationsPanel.classList.contains('active'));
        
        if (notificationsPanel.classList.contains('active')) {
          this.loadNotifications();
        }
      });
    }

    if (closeNotifications) {
      closeNotifications.addEventListener('click', () => {
        notificationsPanel.classList.remove('active');
        this.toggleOverlay(false);
      });
    }
  }

  async loadNotifications() {
    const notificationsContent = document.getElementById('notificationsContent');
    if (!notificationsContent) return;

    notificationsContent.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading notifications...</p></div>';

    try {
      const notifications = await this.fetchNotifications();
      this.displayNotifications(notifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      notificationsContent.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Failed to load notifications</p>';
    }
  }

  async fetchNotifications() {
    // Mock data for demonstration
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            title: 'New sample received',
            message: 'Sample S-2024-001247 has been registered',
            time: new Date(Date.now() - 10 * 60000),
            read: false
          },
          {
            id: 2,
            title: 'QC check completed',
            message: 'Daily quality control has passed all tests',
            time: new Date(Date.now() - 2 * 60 * 60000),
            read: true
          },
          {
            id: 3,
            title: 'Expert rule triggered',
            message: 'Automatic validation applied to result R-2024-000892',
            time: new Date(Date.now() - 4 * 60 * 60000),
            read: true
          }
        ]);
      }, 1000);
    });
  }

  displayNotifications(notifications) {
    const notificationsContent = document.getElementById('notificationsContent');
    if (!notificationsContent) return;

    if (notifications.length === 0) {
      notificationsContent.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: var(--spacing-lg);">No notifications</p>';
      return;
    }

    const notificationsHTML = notifications.map(notification => `
      <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
        <div class="notification-content">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-message">${notification.message}</div>
          <div class="notification-time">${this.formatRelativeTime(notification.time)}</div>
        </div>
        ${!notification.read ? '<div class="notification-dot"></div>' : ''}
      </div>
    `).join('');

    notificationsContent.innerHTML = notificationsHTML;

    // Add click handlers for notifications
    notificationsContent.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', () => {
        this.markNotificationAsRead(item.dataset.id);
      });
    });
  }

  markNotificationAsRead(notificationId) {
    // Implementation for marking notification as read
    console.log('Marking notification as read:', notificationId);
  }

  setupRefresh() {
    // Auto-refresh dashboard data every 5 minutes
    setInterval(() => {
      this.loadStats();
      this.loadRecentActivity();
      this.loadAlerts();
    }, 5 * 60 * 1000);

    // Pull-to-refresh functionality
    let startY = 0;
    let currentY = 0;
    let isRefreshing = false;

    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0 && !isRefreshing) {
        startY = e.touches[0].clientY;
      }
    });

    document.addEventListener('touchmove', (e) => {
      if (startY > 0 && !isRefreshing) {
        currentY = e.touches[0].clientY;
        const pullDistance = currentY - startY;
        
        if (pullDistance > 100) {
          this.triggerRefresh();
          isRefreshing = true;
          startY = 0;
        }
      }
    });

    document.addEventListener('touchend', () => {
      startY = 0;
      currentY = 0;
    });
  }

  async triggerRefresh() {
    this.showToast('Refreshing dashboard...', 'info');
    
    try {
      await Promise.all([
        this.loadStats(),
        this.loadRecentActivity(),
        this.loadAlerts()
      ]);
      
      this.showToast('Dashboard refreshed', 'success');
    } catch (error) {
      this.showToast('Failed to refresh dashboard', 'error');
    }
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DashboardMobile();
});