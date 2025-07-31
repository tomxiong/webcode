// Mobile Performance Optimization Module
class MobilePerformance {
  constructor() {
    this.performanceMetrics = {
      loadTime: 0,
      renderTime: 0,
      interactionTime: 0,
      memoryUsage: 0
    };
    
    this.optimizations = {
      lazyLoading: true,
      imageCompression: true,
      caching: true,
      prefetching: true
    };
    
    this.init();
  }

  init() {
    this.measurePerformance();
    this.setupLazyLoading();
    this.optimizeImages();
    this.setupPrefetching();
    this.monitorMemoryUsage();
    this.setupPerformanceObserver();
  }

  measurePerformance() {
    // Measure page load performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      this.performanceMetrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      
      // Measure First Contentful Paint
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        this.performanceMetrics.renderTime = fcp.startTime;
      }
      
      this.reportPerformanceMetrics();
    });
  }

  setupLazyLoading() {
    if (!this.optimizations.lazyLoading) return;

    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));

    // Lazy load content sections
    const sections = document.querySelectorAll('.lazy-section');
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('loaded');
        }
      });
    });

    sections.forEach(section => sectionObserver.observe(section));
  }

  optimizeImages() {
    if (!this.optimizations.imageCompression) return;

    const images = document.querySelectorAll('img');
    images.forEach(img => {
      // Add loading="lazy" for native lazy loading
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }

      // Optimize image format based on browser support
      if (this.supportsWebP() && !img.src.includes('.webp')) {
        const webpSrc = img.src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        img.src = webpSrc;
      }
    });
  }

  supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  setupPrefetching() {
    if (!this.optimizations.prefetching) return;

    // Prefetch critical resources
    const criticalResources = [
      '/css/mobile-base.css',
      '/js/mobile-base.js',
      '/js/mobile-navigation.js'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });

    // Prefetch next likely pages based on current page
    this.prefetchLikelyPages();
  }

  prefetchLikelyPages() {
    const currentPage = window.location.pathname;
    let likelyPages = [];

    switch (currentPage) {
      case '/mobile/dashboard.html':
        likelyPages = ['/mobile/samples.html', '/mobile/lab-results.html'];
        break;
      case '/mobile/samples.html':
        likelyPages = ['/mobile/lab-results.html', '/mobile/dashboard.html'];
        break;
      case '/mobile/lab-results.html':
        likelyPages = ['/mobile/reports.html', '/mobile/samples.html'];
        break;
      default:
        likelyPages = ['/mobile/dashboard.html'];
    }

    likelyPages.forEach(page => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = page;
      document.head.appendChild(link);
    });
  }

  monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = performance.memory;
        this.performanceMetrics.memoryUsage = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
        
        // Clean up if memory usage is high
        if (this.performanceMetrics.memoryUsage > 0.8) {
          this.performMemoryCleanup();
        }
      }, 30000); // Check every 30 seconds
    }
  }

  performMemoryCleanup() {
    // Clear old cached data
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('old') || cacheName.includes('temp')) {
            caches.delete(cacheName);
          }
        });
      });
    }

    // Clear old localStorage entries
    const oldEntries = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('temp_') || key.includes('cache_')) {
        const item = localStorage.getItem(key);
        try {
          const data = JSON.parse(item);
          if (data.timestamp && Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
            oldEntries.push(key);
          }
        } catch (e) {
          // Invalid JSON, remove it
          oldEntries.push(key);
        }
      }
    }

    oldEntries.forEach(key => localStorage.removeItem(key));
  }

  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Monitor Long Tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn('Long task detected:', entry.duration + 'ms');
            this.optimizeLongTask(entry);
          }
        });
      });

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.log('Long task observer not supported');
      }

      // Monitor Layout Shifts
      const layoutShiftObserver = new PerformanceObserver((list) => {
        let cumulativeScore = 0;
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            cumulativeScore += entry.value;
          }
        });

        if (cumulativeScore > 0.1) {
          console.warn('High Cumulative Layout Shift:', cumulativeScore);
          this.optimizeLayoutShift();
        }
      });

      try {
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.log('Layout shift observer not supported');
      }
    }
  }

  optimizeLongTask(entry) {
    // Break up long tasks by using setTimeout
    if (entry.name === 'self' && entry.duration > 100) {
      // Defer non-critical operations
      setTimeout(() => {
        this.deferNonCriticalOperations();
      }, 0);
    }
  }

  optimizeLayoutShift() {
    // Add size attributes to images without them
    const images = document.querySelectorAll('img:not([width]):not([height])');
    images.forEach(img => {
      if (img.naturalWidth && img.naturalHeight) {
        img.width = img.naturalWidth;
        img.height = img.naturalHeight;
      }
    });

    // Reserve space for dynamic content
    const dynamicContainers = document.querySelectorAll('.dynamic-content');
    dynamicContainers.forEach(container => {
      if (!container.style.minHeight) {
        container.style.minHeight = '100px';
      }
    });
  }

  deferNonCriticalOperations() {
    // Defer analytics
    if (window.gtag) {
      requestIdleCallback(() => {
        // Analytics operations
      });
    }

    // Defer non-visible content loading
    const belowFoldContent = document.querySelectorAll('.below-fold');
    belowFoldContent.forEach(content => {
      if (!this.isInViewport(content)) {
        requestIdleCallback(() => {
          this.loadBelowFoldContent(content);
        });
      }
    });
  }

  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  loadBelowFoldContent(element) {
    // Load content that's below the fold
    if (element.dataset.src) {
      element.src = element.dataset.src;
    }
    
    if (element.dataset.content) {
      element.innerHTML = element.dataset.content;
    }
  }

  reportPerformanceMetrics() {
    const metrics = {
      ...this.performanceMetrics,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null
    };

    // Store metrics locally
    const existingMetrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
    existingMetrics.push(metrics);
    
    // Keep only last 10 entries
    if (existingMetrics.length > 10) {
      existingMetrics.splice(0, existingMetrics.length - 10);
    }
    
    localStorage.setItem('performance_metrics', JSON.stringify(existingMetrics));

    // Send to analytics if available
    if (window.gtag) {
      gtag('event', 'performance_metrics', {
        custom_parameter: JSON.stringify(metrics)
      });
    }

    console.log('Performance Metrics:', metrics);
  }

  // Public API for manual optimization
  optimizeNow() {
    this.performMemoryCleanup();
    this.deferNonCriticalOperations();
    this.reportPerformanceMetrics();
  }

  getPerformanceReport() {
    return {
      metrics: this.performanceMetrics,
      optimizations: this.optimizations,
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.performanceMetrics.loadTime > 3000) {
      recommendations.push('Consider enabling more aggressive caching');
    }

    if (this.performanceMetrics.memoryUsage > 0.7) {
      recommendations.push('High memory usage detected, consider reducing cached data');
    }

    if (this.performanceMetrics.renderTime > 2000) {
      recommendations.push('Slow rendering detected, consider optimizing CSS and images');
    }

    return recommendations;
  }
}

// Auto-initialize on mobile devices
if (window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  document.addEventListener('DOMContentLoaded', () => {
    window.mobilePerformance = new MobilePerformance();
  });
}

// Export for manual usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobilePerformance;
}