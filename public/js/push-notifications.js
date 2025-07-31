// Push Notifications System for Mobile
class PushNotificationManager {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.isSubscribed = false;
    this.subscription = null;
    this.vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI6YUavgOiHkAGfxaUpk3jHyI7y5kkpbI7L9YJBHVJVTnhFhMXfbkHkZFA'; // Demo key
    
    this.init();
  }

  async init() {
    if (!this.isSupported) {
      console.log('Push notifications not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      this.registration = registration;
      
      // Check if already subscribed
      this.subscription = await registration.pushManager.getSubscription();
      this.isSubscribed = !(this.subscription === null);
      
      this.updateUI();
      this.setupEventListeners();
      
      // Auto-request permission for lab notifications
      if (this.shouldAutoRequestPermission()) {
        await this.requestPermission();
      }
      
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  shouldAutoRequestPermission() {
    // Auto-request for lab staff roles
    const userData = JSON.parse(localStorage.getItem('clsi_user_data') || '{}');
    const labRoles = ['Admin', 'Microbiologist', 'Lab Technician'];
    return labRoles.includes(userData.role);
  }

  async requestPermission() {
    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      this.showPermissionDeniedMessage();
      return false;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      await this.subscribeUser();
      this.showPermissionGrantedMessage();
      return true;
    } else {
      this.showPermissionDeniedMessage();
      return false;
    }
  }

  async subscribeUser() {
    try {
      const applicationServerKey = this.urlB64ToUint8Array(this.vapidPublicKey);
      
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      this.isSubscribed = true;
      
      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);
      
      this.updateUI();
      
      // Send welcome notification
      this.sendLocalNotification(
        'CLSI Platform Notifications Enabled',
        'You will now receive important lab updates and alerts.',
        '/mobile/dashboard.html'
      );
      
    } catch (error) {
      console.error('Failed to subscribe user:', error);
      this.showSubscriptionError();
    }
  }

  async unsubscribeUser() {
    try {
      await this.subscription.unsubscribe();
      this.isSubscribed = false;
      this.subscription = null;
      
      // Remove subscription from server
      await this.removeSubscriptionFromServer();
      
      this.updateUI();
      
    } catch (error) {
      console.error('Failed to unsubscribe user:', error);
    }
  }

  async sendSubscriptionToServer(subscription) {
    // In a real implementation, send to your server
    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: this.arrayBufferToBase64(subscription.getKey('auth'))
      },
      userId: JSON.parse(localStorage.getItem('clsi_user_data') || '{}').id,
      timestamp: Date.now()
    };

    // Store locally for demo
    const subscriptions = JSON.parse(localStorage.getItem('push_subscriptions') || '[]');
    subscriptions.push(subscriptionData);
    localStorage.setItem('push_subscriptions', JSON.stringify(subscriptions));

    console.log('Subscription sent to server:', subscriptionData);
  }

  async removeSubscriptionFromServer() {
    // Remove from local storage for demo
    const subscriptions = JSON.parse(localStorage.getItem('push_subscriptions') || '[]');
    const userId = JSON.parse(localStorage.getItem('clsi_user_data') || '{}').id;
    const filteredSubscriptions = subscriptions.filter(sub => sub.userId !== userId);
    localStorage.setItem('push_subscriptions', JSON.stringify(filteredSubscriptions));
  }

  setupEventListeners() {
    // Listen for notification clicks
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
          this.handleNotificationClick(event.data.payload);
        }
      });
    }

    // Setup notification triggers
    this.setupLabNotificationTriggers();
  }

  setupLabNotificationTriggers() {
    // Monitor for urgent samples
    setInterval(() => {
      this.checkUrgentSamples();
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Monitor for completed results
    setInterval(() => {
      this.checkCompletedResults();
    }, 10 * 60 * 1000); // Check every 10 minutes

    // Monitor for quality control alerts
    setInterval(() => {
      this.checkQualityControlAlerts();
    }, 15 * 60 * 1000); // Check every 15 minutes
  }

  async checkUrgentSamples() {
    if (!this.isSubscribed) return;

    try {
      // Mock check for urgent samples - replace with actual API call
      const urgentSamples = await this.fetchUrgentSamples();
      
      if (urgentSamples.length > 0) {
        this.sendLocalNotification(
          `${urgentSamples.length} Urgent Sample${urgentSamples.length > 1 ? 's' : ''}`,
          `High priority samples require immediate attention`,
          '/mobile/samples.html',
          'urgent'
        );
      }
    } catch (error) {
      console.error('Error checking urgent samples:', error);
    }
  }

  async checkCompletedResults() {
    if (!this.isSubscribed) return;

    try {
      // Mock check for completed results - replace with actual API call
      const completedResults = await this.fetchCompletedResults();
      
      if (completedResults.length > 0) {
        this.sendLocalNotification(
          `${completedResults.length} Result${completedResults.length > 1 ? 's' : ''} Ready`,
          `Lab results are ready for review`,
          '/mobile/lab-results.html',
          'results'
        );
      }
    } catch (error) {
      console.error('Error checking completed results:', error);
    }
  }

  async checkQualityControlAlerts() {
    if (!this.isSubscribed) return;

    try {
      // Mock check for QC alerts - replace with actual API call
      const qcAlerts = await this.fetchQualityControlAlerts();
      
      if (qcAlerts.length > 0) {
        this.sendLocalNotification(
          'Quality Control Alert',
          `${qcAlerts.length} QC issue${qcAlerts.length > 1 ? 's' : ''} require attention`,
          '/mobile/dashboard.html',
          'qc-alert'
        );
      }
    } catch (error) {
      console.error('Error checking QC alerts:', error);
    }
  }

  // Mock API calls - replace with actual implementations
  async fetchUrgentSamples() {
    return new Promise(resolve => {
      setTimeout(() => {
        // Simulate urgent samples based on time
        const hour = new Date().getHours();
        const urgentCount = hour >= 9 && hour <= 17 ? Math.floor(Math.random() * 3) : 0;
        resolve(Array(urgentCount).fill({}));
      }, 500);
    });
  }

  async fetchCompletedResults() {
    return new Promise(resolve => {
      setTimeout(() => {
        // Simulate completed results
        const completedCount = Math.floor(Math.random() * 2);
        resolve(Array(completedCount).fill({}));
      }, 500);
    });
  }

  async fetchQualityControlAlerts() {
    return new Promise(resolve => {
      setTimeout(() => {
        // Simulate QC alerts (rare)
        const alertCount = Math.random() < 0.1 ? 1 : 0;
        resolve(Array(alertCount).fill({}));
      }, 500);
    });
  }

  sendLocalNotification(title, body, url, tag = 'default') {
    if (!this.isSubscribed || Notification.permission !== 'granted') {
      return;
    }

    const options = {
      body: body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: tag,
      data: {
        url: url,
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/dismiss-icon.png'
        }
      ],
      requireInteraction: tag === 'urgent' || tag === 'qc-alert',
      silent: false,
      vibrate: tag === 'urgent' ? [200, 100, 200] : [100]
    };

    if ('serviceWorker' in navigator && this.registration) {
      this.registration.showNotification(title, options);
    } else {
      new Notification(title, options);
    }

    // Log notification for analytics
    this.logNotification(title, body, tag);
  }

  handleNotificationClick(payload) {
    if (payload.url) {
      // Open the specified URL
      if ('clients' in self) {
        clients.openWindow(payload.url);
      } else {
        window.open(payload.url, '_blank');
      }
    }
  }

  logNotification(title, body, tag) {
    const notificationLog = {
      title,
      body,
      tag,
      timestamp: Date.now(),
      userId: JSON.parse(localStorage.getItem('clsi_user_data') || '{}').id
    };

    const logs = JSON.parse(localStorage.getItem('notification_logs') || '[]');
    logs.push(notificationLog);
    
    // Keep only last 50 notifications
    if (logs.length > 50) {
      logs.splice(0, logs.length - 50);
    }
    
    localStorage.setItem('notification_logs', JSON.stringify(logs));
  }

  updateUI() {
    // Update notification toggle button if it exists
    const toggleButton = document.getElementById('notificationToggle');
    if (toggleButton) {
      toggleButton.textContent = this.isSubscribed ? 'Disable Notifications' : 'Enable Notifications';
      toggleButton.onclick = () => {
        if (this.isSubscribed) {
          this.unsubscribeUser();
        } else {
          this.requestPermission();
        }
      };
    }

    // Update notification status indicator
    const statusIndicator = document.getElementById('notificationStatus');
    if (statusIndicator) {
      statusIndicator.textContent = this.isSubscribed ? 'Enabled' : 'Disabled';
      statusIndicator.className = this.isSubscribed ? 'status-enabled' : 'status-disabled';
    }
  }

  showPermissionGrantedMessage() {
    if (window.mobileBase && window.mobileBase.showToast) {
      window.mobileBase.showToast('Notifications enabled successfully!', 'success');
    }
  }

  showPermissionDeniedMessage() {
    if (window.mobileBase && window.mobileBase.showToast) {
      window.mobileBase.showToast('Notifications disabled. You can enable them in settings.', 'info');
    }
  }

  showSubscriptionError() {
    if (window.mobileBase && window.mobileBase.showToast) {
      window.mobileBase.showToast('Failed to enable notifications. Please try again.', 'error');
    }
  }

  // Utility functions
  urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Public API
  async enableNotifications() {
    return await this.requestPermission();
  }

  async disableNotifications() {
    return await this.unsubscribeUser();
  }

  getNotificationStatus() {
    return {
      supported: this.isSupported,
      subscribed: this.isSubscribed,
      permission: Notification.permission
    };
  }

  getNotificationLogs() {
    return JSON.parse(localStorage.getItem('notification_logs') || '[]');
  }

  clearNotificationLogs() {
    localStorage.removeItem('notification_logs');
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    window.pushNotificationManager = new PushNotificationManager();
  }
});

// Export for manual usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PushNotificationManager;
}