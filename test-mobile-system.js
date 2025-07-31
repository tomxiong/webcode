// Mobile System Integration Test
class MobileSystemTester {
  constructor() {
    this.testResults = [];
    this.currentTest = null;
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 Starting Mobile System Integration Tests...');
    
    const tests = [
      { name: 'Navigation System', test: () => this.testNavigationSystem() },
      { name: 'Performance Optimization', test: () => this.testPerformanceSystem() },
      { name: 'Push Notifications', test: () => this.testPushNotifications() },
      { name: 'Data Synchronization', test: () => this.testDataSync() },
      { name: 'PWA Functionality', test: () => this.testPWAFeatures() },
      { name: 'Offline Support', test: () => this.testOfflineSupport() },
      { name: 'Mobile Pages', test: () => this.testMobilePages() },
      { name: 'Touch Interactions', test: () => this.testTouchInteractions() }
    ];

    for (const testCase of tests) {
      await this.runTest(testCase.name, testCase.test);
    }

    this.generateReport();
  }

  async runTest(testName, testFunction) {
    this.currentTest = testName;
    console.log(`\n📱 Testing: ${testName}`);
    
    const startTime = Date.now();
    let result = {
      name: testName,
      status: 'running',
      startTime: startTime,
      details: []
    };

    try {
      await testFunction();
      result.status = 'passed';
      result.endTime = Date.now();
      result.duration = result.endTime - startTime;
      console.log(`✅ ${testName} - PASSED (${result.duration}ms)`);
    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      result.endTime = Date.now();
      result.duration = result.endTime - startTime;
      console.error(`❌ ${testName} - FAILED: ${error.message}`);
    }

    this.testResults.push(result);
  }

  async testNavigationSystem() {
    // Test mobile navigation component
    this.addTestDetail('Checking mobile navigation files...');
    
    const requiredFiles = [
      '/js/mobile-navigation.js',
      '/mobile/dashboard.html',
      '/mobile/samples.html',
      '/mobile/lab-results.html',
      '/mobile/users.html',
      '/mobile/reports.html'
    ];

    for (const file of requiredFiles) {
      await this.checkFileExists(file);
    }

    // Test navigation functionality
    this.addTestDetail('Testing navigation functionality...');
    
    if (typeof MobileNavigation !== 'undefined') {
      const nav = new MobileNavigation();
      this.assert(nav.currentPage, 'Navigation should detect current page');
      this.assert(nav.isAuthenticated !== undefined, 'Navigation should check authentication');
    }

    this.addTestDetail('Navigation system tests completed');
  }

  async testPerformanceSystem() {
    this.addTestDetail('Testing performance optimization system...');
    
    await this.checkFileExists('/js/mobile-performance.js');
    
    if (typeof MobilePerformance !== 'undefined') {
      const perf = new MobilePerformance();
      this.assert(perf.performanceMetrics, 'Performance metrics should be initialized');
      this.assert(perf.optimizations, 'Optimizations should be configured');
      
      // Test performance measurement
      const report = perf.getPerformanceReport();
      this.assert(report.metrics, 'Performance report should include metrics');
      this.assert(report.recommendations, 'Performance report should include recommendations');
    }

    this.addTestDetail('Performance system tests completed');
  }

  async testPushNotifications() {
    this.addTestDetail('Testing push notification system...');
    
    await this.checkFileExists('/js/push-notifications.js');
    
    if (typeof PushNotificationManager !== 'undefined') {
      const pushManager = new PushNotificationManager();
      this.assert(pushManager.isSupported !== undefined, 'Push support should be detected');
      
      const status = pushManager.getNotificationStatus();
      this.assert(status.supported !== undefined, 'Notification status should be available');
      this.assert(status.permission !== undefined, 'Permission status should be available');
    }

    this.addTestDetail('Push notification tests completed');
  }

  async testDataSync() {
    this.addTestDetail('Testing data synchronization system...');
    
    await this.checkFileExists('/js/data-sync.js');
    
    if (typeof DataSyncManager !== 'undefined') {
      const syncManager = new DataSyncManager();
      this.assert(syncManager.isOnline !== undefined, 'Online status should be detected');
      this.assert(syncManager.syncQueue, 'Sync queue should be initialized');
      
      const status = syncManager.getSyncStatus();
      this.assert(status.isOnline !== undefined, 'Sync status should include online state');
      this.assert(status.pendingOperations !== undefined, 'Sync status should include pending operations');
    }

    this.addTestDetail('Data sync tests completed');
  }

  async testPWAFeatures() {
    this.addTestDetail('Testing PWA functionality...');
    
    // Check PWA files
    await this.checkFileExists('/manifest.json');
    await this.checkFileExists('/sw.js');
    await this.checkFileExists('/offline.html');
    
    // Test service worker registration
    if ('serviceWorker' in navigator) {
      this.addTestDetail('Service Worker API is supported');
    } else {
      throw new Error('Service Worker not supported');
    }

    // Test manifest
    if (document.querySelector('link[rel="manifest"]')) {
      this.addTestDetail('Web App Manifest is linked');
    } else {
      throw new Error('Web App Manifest not found');
    }

    this.addTestDetail('PWA tests completed');
  }

  async testOfflineSupport() {
    this.addTestDetail('Testing offline support...');
    
    // Test offline page
    await this.checkFileExists('/offline.html');
    
    // Test cache API
    if ('caches' in window) {
      this.addTestDetail('Cache API is supported');
      
      try {
        const cacheNames = await caches.keys();
        this.addTestDetail(`Found ${cacheNames.length} cache(s)`);
      } catch (error) {
        this.addTestDetail('Cache access test failed');
      }
    } else {
      throw new Error('Cache API not supported');
    }

    this.addTestDetail('Offline support tests completed');
  }

  async testMobilePages() {
    this.addTestDetail('Testing mobile page functionality...');
    
    const mobilePages = [
      { path: '/mobile/dashboard.html', css: '/css/dashboard-mobile.css', js: '/js/dashboard-mobile.js' },
      { path: '/mobile/samples.html', css: '/css/samples-mobile.css', js: '/js/samples-mobile.js' },
      { path: '/mobile/lab-results.html', css: '/css/lab-results-mobile.css', js: '/js/lab-results-mobile.js' },
      { path: '/mobile/users.html', css: '/css/users-mobile.css', js: '/js/users-mobile.js' },
      { path: '/mobile/reports.html', css: '/css/reports-mobile.css', js: '/js/reports-mobile.js' }
    ];

    for (const page of mobilePages) {
      await this.checkFileExists(page.path);
      await this.checkFileExists(page.css);
      await this.checkFileExists(page.js);
      this.addTestDetail(`✓ ${page.path} and assets verified`);
    }

    this.addTestDetail('Mobile pages tests completed');
  }

  async testTouchInteractions() {
    this.addTestDetail('Testing touch interaction support...');
    
    // Test touch event support
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.addTestDetail('Touch events are supported');
    } else {
      this.addTestDetail('Touch events not detected (desktop environment)');
    }

    // Test viewport meta tag
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      this.addTestDetail('Viewport meta tag is present');
    } else {
      throw new Error('Viewport meta tag not found');
    }

    this.addTestDetail('Touch interaction tests completed');
  }

  async checkFileExists(filePath) {
    try {
      const response = await fetch(filePath, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`File not found: ${filePath}`);
      }
      this.addTestDetail(`✓ File exists: ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to check file ${filePath}: ${error.message}`);
    }
  }

  addTestDetail(detail) {
    if (this.currentTest) {
      const currentResult = this.testResults.find(r => r.name === this.currentTest) || 
                           this.testResults[this.testResults.length - 1];
      if (currentResult) {
        if (!currentResult.details) currentResult.details = [];
        currentResult.details.push(detail);
      }
    }
    console.log(`  ${detail}`);
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  generateReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    const passedTests = this.testResults.filter(r => r.status === 'passed').length;
    const failedTests = this.testResults.filter(r => r.status === 'failed').length;
    const totalTests = this.testResults.length;

    console.log('\n' + '='.repeat(60));
    console.log('📱 MOBILE SYSTEM INTEGRATION TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log('='.repeat(60));

    // Detailed results
    this.testResults.forEach(result => {
      const status = result.status === 'passed' ? '✅' : '❌';
      console.log(`\n${status} ${result.name} (${result.duration}ms)`);
      
      if (result.details && result.details.length > 0) {
        result.details.forEach(detail => {
          console.log(`    ${detail}`);
        });
      }
      
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });

    // Save report to localStorage
    const report = {
      timestamp: new Date().toISOString(),
      totalTests,
      passedTests,
      failedTests,
      successRate: (passedTests / totalTests) * 100,
      totalDuration,
      results: this.testResults
    };

    localStorage.setItem('mobile_test_report', JSON.stringify(report));
    
    console.log('\n📊 Test report saved to localStorage as "mobile_test_report"');
    
    if (failedTests === 0) {
      console.log('\n🎉 All mobile system tests passed! System is ready for deployment.');
    } else {
      console.log(`\n⚠️  ${failedTests} test(s) failed. Please review and fix issues before deployment.`);
    }

    return report;
  }
}

// Auto-run tests when page loads
document.addEventListener('DOMContentLoaded', async () => {
  const tester = new MobileSystemTester();
  await tester.runAllTests();
});

// Export for manual usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileSystemTester;
}