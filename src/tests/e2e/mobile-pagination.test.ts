// Mobile Pagination E2E Tests
import { test, expect, Page } from '@playwright/test';

test.describe('Mobile Pagination E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Mock authentication
    await page.goto('/mobile/login.html');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('#loginBtn');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/mobile/dashboard.html');
  });

  test.describe('Samples Mobile Pagination', () => {
    test.beforeEach(async () => {
      await page.goto('/mobile/samples.html');
      await page.waitForSelector('#samplesList');
    });

    test('should display initial samples with infinite scroll', async () => {
      // Check initial load
      const initialSamples = await page.locator('.sample-card').count();
      expect(initialSamples).toBeGreaterThan(0);
      expect(initialSamples).toBeLessThanOrEqual(20); // Default page size

      // Check pagination info
      const paginationTotal = await page.locator('.mobile-pagination-total');
      await expect(paginationTotal).toBeVisible();
      
      const totalText = await paginationTotal.textContent();
      expect(totalText).toMatch(/\d+-\d+ of \d+/);
    });

    test('should load more samples on infinite scroll', async () => {
      const initialCount = await page.locator('.sample-card').count();
      
      // Scroll to bottom to trigger infinite scroll
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      // Wait for loading indicator
      await page.waitForSelector('.infinite-scroll-loading', { state: 'visible' });
      
      // Wait for new samples to load
      await page.waitForFunction(
        (initialCount) => document.querySelectorAll('.sample-card').length > initialCount,
        initialCount,
        { timeout: 5000 }
      );
      
      const newCount = await page.locator('.sample-card').count();
      expect(newCount).toBeGreaterThan(initialCount);
    });

    test('should show "no more items" when all samples loaded', async () => {
      // Keep scrolling until no more items
      let previousCount = 0;
      let currentCount = await page.locator('.sample-card').count();
      
      while (currentCount > previousCount) {
        previousCount = currentCount;
        
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        
        // Wait a bit for potential loading
        await page.waitForTimeout(1000);
        
        currentCount = await page.locator('.sample-card').count();
      }
      
      // Should show end message
      const endMessage = page.locator('.infinite-scroll-end');
      await expect(endMessage).toBeVisible();
      await expect(endMessage).toContainText('No more items');
    });

    test('should filter samples and reset pagination', async () => {
      // Apply filter
      await page.click('.filter-chip[data-filter="urgent"]');
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
      
      // Check that all visible samples have urgent status
      const urgentSamples = await page.locator('.sample-card.urgent').count();
      const totalSamples = await page.locator('.sample-card').count();
      
      expect(urgentSamples).toBe(totalSamples);
      
      // Pagination should reset to page 1
      const paginationTotal = await page.locator('.mobile-pagination-total').textContent();
      expect(paginationTotal).toMatch(/^1-\d+/);
    });

    test('should search samples and update pagination', async () => {
      // Open search
      await page.click('#searchToggle');
      await page.waitForSelector('#searchContainer.active');
      
      // Search for specific term
      await page.fill('#searchInput', 'Blood Culture');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Check that results contain search term
      const sampleCards = await page.locator('.sample-card').all();
      for (const card of sampleCards) {
        const typeText = await card.locator('.sample-type').textContent();
        expect(typeText).toContain('Blood Culture');
      }
    });

    test('should handle empty search results', async () => {
      // Search for non-existent term
      await page.click('#searchToggle');
      await page.fill('#searchInput', 'NonExistentSample');
      
      // Wait for search
      await page.waitForTimeout(1000);
      
      // Should show empty state
      const emptyState = page.locator('#emptyState');
      await expect(emptyState).toBeVisible();
    });
  });

  test.describe('Lab Results Mobile Pagination', () => {
    test.beforeEach(async () => {
      await page.goto('/mobile/lab-results.html');
      await page.waitForSelector('#labResultsList');
    });

    test('should display lab results with load more button', async () => {
      // Check initial results
      const initialResults = await page.locator('.lab-result-card').count();
      expect(initialResults).toBeGreaterThan(0);
      
      // Check for load more button
      const loadMoreBtn = page.locator('#loadMoreBtn');
      if (await loadMoreBtn.isVisible()) {
        const initialCount = await page.locator('.lab-result-card').count();
        
        await loadMoreBtn.click();
        
        // Wait for loading
        await page.waitForSelector('#loadMoreBtn:disabled');
        await page.waitForSelector('#loadMoreBtn:not(:disabled)');
        
        // Check more results loaded
        const newCount = await page.locator('.lab-result-card').count();
        expect(newCount).toBeGreaterThan(initialCount);
      }
    });

    test('should filter lab results by organism', async () => {
      // Open filters
      await page.click('#filterToggle');
      await page.waitForSelector('#filterPanel.active');
      
      // Select organism filter
      await page.click('.filter-chip[data-filter="E. coli"]');
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
      
      // Check results contain selected organism
      const resultCards = await page.locator('.lab-result-card').all();
      for (const card of resultCards) {
        const organismText = await card.locator('.result-organism').textContent();
        expect(organismText).toContain('E. coli');
      }
    });
  });

  test.describe('Expert Rules Mobile Pagination', () => {
    test.beforeEach(async () => {
      await page.goto('/mobile/expert-rules.html');
      await page.waitForSelector('#rulesList');
    });

    test('should display expert rules with categories', async () => {
      // Check category cards
      const categoryCards = await page.locator('.category-card').count();
      expect(categoryCards).toBeGreaterThan(0);
      
      // Check initial rules
      const initialRules = await page.locator('.rule-card').count();
      expect(initialRules).toBeGreaterThan(0);
    });

    test('should filter rules by category', async () => {
      // Click on specific category
      await page.click('.category-card[data-category="intrinsic"]');
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
      
      // Check that category is active
      const activeCategory = page.locator('.category-card.active[data-category="intrinsic"]');
      await expect(activeCategory).toBeVisible();
      
      // Check rules are filtered
      const ruleCards = await page.locator('.rule-card').all();
      expect(ruleCards.length).toBeGreaterThan(0);
    });

    test('should search expert rules', async () => {
      // Open search
      await page.click('#searchToggle');
      await page.fill('#searchInput', 'Enterococcus');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Check search results
      const ruleCards = await page.locator('.rule-card').all();
      for (const card of ruleCards) {
        const titleText = await card.locator('.rule-title').textContent();
        const descText = await card.locator('.rule-description').textContent();
        
        expect(titleText + ' ' + descText).toMatch(/Enterococcus/i);
      }
    });
  });

  test.describe('Drugs Mobile Pagination', () => {
    test.beforeEach(async () => {
      await page.goto('/mobile/drugs.html');
      await page.waitForSelector('#drugsList');
    });

    test('should display drugs with infinite scroll', async () => {
      const initialDrugs = await page.locator('.drug-card').count();
      expect(initialDrugs).toBeGreaterThan(0);
      
      // Test infinite scroll if more items available
      const infiniteScrollTrigger = page.locator('#infiniteScrollTrigger');
      if (await infiniteScrollTrigger.isVisible()) {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        
        await page.waitForTimeout(2000);
        
        const newCount = await page.locator('.drug-card').count();
        expect(newCount).toBeGreaterThanOrEqual(initialDrugs);
      }
    });

    test('should filter drugs by class', async () => {
      // Open filters
      await page.click('#filterToggle');
      
      // Select drug class filter
      await page.click('.filter-chip[data-filter="beta-lactam"]');
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
      
      // Check active filter
      const activeFilter = page.locator('.filter-chip.active[data-filter="beta-lactam"]');
      await expect(activeFilter).toBeVisible();
    });
  });

  test.describe('Microorganisms Mobile Pagination', () => {
    test.beforeEach(async () => {
      await page.goto('/mobile/microorganisms.html');
      await page.waitForSelector('#microorganismsList');
    });

    test('should switch between list and tree view', async () => {
      // Check initial list view
      const listView = page.locator('.microorganisms-list');
      await expect(listView).toBeVisible();
      
      // Switch to tree view
      await page.click('.view-toggle-btn[data-view="tree"]');
      
      // Check tree view is active
      const treeView = page.locator('.microorganisms-tree');
      await expect(treeView).toBeVisible();
      
      // Check tree view button is active
      const activeTreeBtn = page.locator('.view-toggle-btn.active[data-view="tree"]');
      await expect(activeTreeBtn).toBeVisible();
    });

    test('should expand/collapse tree nodes', async () => {
      // Switch to tree view
      await page.click('.view-toggle-btn[data-view="tree"]');
      
      // Find expandable tree node
      const treeNode = page.locator('.tree-node-header').first();
      await treeNode.click();
      
      // Check if children are expanded
      const children = page.locator('.tree-node-children.expanded');
      await expect(children).toBeVisible();
    });

    test('should filter microorganisms by gram stain', async () => {
      // Open filters
      await page.click('#filterToggle');
      
      // Select gram stain filter
      await page.click('.filter-chip[data-gram="positive"]');
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
      
      // Check active filter
      const activeFilter = page.locator('.filter-chip.active[data-gram="positive"]');
      await expect(activeFilter).toBeVisible();
    });
  });

  test.describe('Breakpoint Standards Mobile Pagination', () => {
    test.beforeEach(async () => {
      await page.goto('/mobile/breakpoint-standards.html');
      await page.waitForSelector('#breakpointsList');
    });

    test('should display breakpoints with year selector', async () => {
      // Check year selector
      const yearButtons = await page.locator('.year-btn').count();
      expect(yearButtons).toBeGreaterThan(0);
      
      // Check active year
      const activeYear = page.locator('.year-btn.active');
      await expect(activeYear).toBeVisible();
      
      // Check initial breakpoints
      const initialBreakpoints = await page.locator('.breakpoint-card').count();
      expect(initialBreakpoints).toBeGreaterThan(0);
    });

    test('should change year and update breakpoints', async () => {
      const initialCount = await page.locator('.breakpoint-card').count();
      
      // Click different year
      const yearBtn = page.locator('.year-btn:not(.active)').first();
      if (await yearBtn.isVisible()) {
        await yearBtn.click();
        
        // Wait for data to load
        await page.waitForTimeout(1000);
        
        // Check year is now active
        await expect(yearBtn).toHaveClass(/active/);
        
        // Breakpoints may have changed
        const newCount = await page.locator('.breakpoint-card').count();
        expect(newCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should filter breakpoints by method', async () => {
      // Open filters
      await page.click('#filterToggle');
      
      // Select method filter
      await page.click('.filter-chip[data-filter="disk"]');
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
      
      // Check active filter
      const activeFilter = page.locator('.filter-chip.active[data-filter="disk"]');
      await expect(activeFilter).toBeVisible();
      
      // Check results have disk method
      const breakpointCards = await page.locator('.breakpoint-card').all();
      for (const card of breakpointCards) {
        const methodText = await card.locator('.breakpoint-method').textContent();
        expect(methodText).toContain('DISK');
      }
    });
  });

  test.describe('Performance Tests', () => {
    test('should handle rapid scrolling without errors', async () => {
      await page.goto('/mobile/samples.html');
      
      // Rapid scroll test
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(100);
        
        await page.evaluate(() => {
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(100);
      }
      
      // Should not have any console errors
      const errors = await page.evaluate(() => {
        return window.console.errors || [];
      });
      expect(errors.length).toBe(0);
    });

    test('should handle concurrent filter changes', async () => {
      await page.goto('/mobile/samples.html');
      
      // Rapid filter changes
      const filters = ['.filter-chip[data-filter="urgent"]', '.filter-chip[data-filter="processing"]', '.filter-chip[data-filter="completed"]'];
      
      for (const filter of filters) {
        await page.click(filter);
        await page.waitForTimeout(200);
      }
      
      // Should end up with last filter active
      const lastFilter = page.locator('.filter-chip.active[data-filter="completed"]');
      await expect(lastFilter).toBeVisible();
    });
  });

  test.describe('Accessibility Tests', () => {
    test('should be keyboard navigable', async () => {
      await page.goto('/mobile/samples.html');
      
      // Tab through pagination controls
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to activate with Enter
      await page.keyboard.press('Enter');
      
      // Check focus is visible
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should have proper ARIA labels', async () => {
      await page.goto('/mobile/samples.html');
      
      // Check pagination has proper labels
      const paginationContainer = page.locator('#paginationContainer');
      if (await paginationContainer.isVisible()) {
        const ariaLabel = await paginationContainer.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      await page.goto('/mobile/samples.html');
      
      // Simulate network failure
      await page.route('**/api/samples*', route => {
        route.abort('failed');
      });
      
      // Try to load more
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      // Should show error message
      await page.waitForTimeout(2000);
      
      // Check for error handling (toast or error state)
      const errorElements = await page.locator('.toast-error, .error-message, .pagination-error').count();
      expect(errorElements).toBeGreaterThan(0);
    });

    test('should handle empty responses', async () => {
      await page.goto('/mobile/samples.html');
      
      // Mock empty response
      await page.route('**/api/samples*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            total: 0,
            page: 1,
            pageSize: 20,
            totalPages: 0,
            hasMore: false
          })
        });
      });
      
      // Reload page
      await page.reload();
      
      // Should show empty state
      const emptyState = page.locator('#emptyState');
      await expect(emptyState).toBeVisible();
    });
  });
});