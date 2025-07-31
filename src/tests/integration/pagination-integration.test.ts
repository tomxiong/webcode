// Pagination Integration Tests
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../server';
import { Database } from '../../infrastructure/database/Database';

describe('Pagination Integration Tests', () => {
  let db: Database;

  beforeEach(async () => {
    db = Database.getInstance();
    await db.initialize();
    
    // Clear and seed test data
    await db.run('DELETE FROM samples');
    await db.run('DELETE FROM lab_results');
    await db.run('DELETE FROM expert_rules');
    
    // Insert test samples
    for (let i = 1; i <= 50; i++) {
      await db.run(`
        INSERT INTO samples (id, type, status, priority, patient_id, patient_name, 
                           collection_date, received_date, location, physician, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `S-2024-${i.toString().padStart(6, '0')}`,
        i % 4 === 0 ? 'Blood Culture' : i % 3 === 0 ? 'Urine Culture' : i % 2 === 0 ? 'Wound Swab' : 'Sputum Culture',
        i % 4 === 0 ? 'urgent' : i % 3 === 0 ? 'processing' : i % 2 === 0 ? 'completed' : 'received',
        i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low',
        `P-2024-${i}`,
        `Patient ${i}`,
        new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() - (i - 1) * 60 * 60 * 1000).toISOString(),
        `Ward ${Math.ceil(i / 10)}`,
        `Dr. ${String.fromCharCode(65 + (i % 26))}`,
        `Test sample ${i}`
      ]);
    }
  });

  afterEach(async () => {
    await db.close();
  });

  describe('Samples Pagination', () => {
    it('should return paginated samples with default parameters', async () => {
      const response = await request(app)
        .get('/api/samples')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pageSize');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('hasMore');

      expect(response.body.data).toHaveLength(20); // Default page size
      expect(response.body.total).toBe(50);
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(20);
      expect(response.body.totalPages).toBe(3);
      expect(response.body.hasMore).toBe(true);
    });

    it('should return specific page with custom page size', async () => {
      const response = await request(app)
        .get('/api/samples')
        .query({ page: 2, pageSize: 10 })
        .expect(200);

      expect(response.body.data).toHaveLength(10);
      expect(response.body.page).toBe(2);
      expect(response.body.pageSize).toBe(10);
      expect(response.body.totalPages).toBe(5);
      expect(response.body.hasMore).toBe(true);
    });

    it('should return last page correctly', async () => {
      const response = await request(app)
        .get('/api/samples')
        .query({ page: 3, pageSize: 20 })
        .expect(200);

      expect(response.body.data).toHaveLength(10); // Remaining items
      expect(response.body.page).toBe(3);
      expect(response.body.hasMore).toBe(false);
    });

    it('should handle page beyond available data', async () => {
      const response = await request(app)
        .get('/api/samples')
        .query({ page: 10, pageSize: 20 })
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.page).toBe(10);
      expect(response.body.hasMore).toBe(false);
    });

    it('should support search with pagination', async () => {
      const response = await request(app)
        .get('/api/samples')
        .query({ 
          search: 'Blood Culture',
          page: 1,
          pageSize: 5
        })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
      expect(response.body.data.every((sample: any) => 
        sample.type === 'Blood Culture'
      )).toBe(true);
    });

    it('should support filtering with pagination', async () => {
      const response = await request(app)
        .get('/api/samples')
        .query({ 
          status: 'urgent',
          page: 1,
          pageSize: 10
        })
        .expect(200);

      expect(response.body.data.every((sample: any) => 
        sample.status === 'urgent'
      )).toBe(true);
    });

    it('should support sorting with pagination', async () => {
      const response = await request(app)
        .get('/api/samples')
        .query({ 
          sortBy: 'receivedDate',
          sortOrder: 'desc',
          page: 1,
          pageSize: 10
        })
        .expect(200);

      const dates = response.body.data.map((sample: any) => 
        new Date(sample.receivedDate).getTime()
      );
      
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
      }
    });

    it('should validate pagination parameters', async () => {
      // Invalid page number
      await request(app)
        .get('/api/samples')
        .query({ page: 0 })
        .expect(400);

      // Invalid page size
      await request(app)
        .get('/api/samples')
        .query({ pageSize: 0 })
        .expect(400);

      // Page size too large
      await request(app)
        .get('/api/samples')
        .query({ pageSize: 1000 })
        .expect(400);
    });
  });

  describe('Lab Results Pagination', () => {
    beforeEach(async () => {
      // Insert test lab results
      for (let i = 1; i <= 30; i++) {
        await db.run(`
          INSERT INTO lab_results (id, sample_id, test_date, organism, drug, 
                                 method, result, interpretation, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          `LR-2024-${i.toString().padStart(6, '0')}`,
          `S-2024-${i.toString().padStart(6, '0')}`,
          new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
          i % 3 === 0 ? 'E. coli' : i % 2 === 0 ? 'S. aureus' : 'P. aeruginosa',
          i % 4 === 0 ? 'Ciprofloxacin' : i % 3 === 0 ? 'Vancomycin' : i % 2 === 0 ? 'Oxacillin' : 'Ceftazidime',
          i % 2 === 0 ? 'disk' : 'mic',
          i % 3 === 0 ? '≤1' : i % 2 === 0 ? '≥32' : '16',
          i % 3 === 0 ? 'Susceptible' : i % 2 === 0 ? 'Resistant' : 'Intermediate',
          `Test result ${i}`
        ]);
      }
    });

    it('should return paginated lab results', async () => {
      const response = await request(app)
        .get('/api/lab-results')
        .query({ page: 1, pageSize: 15 })
        .expect(200);

      expect(response.body.data).toHaveLength(15);
      expect(response.body.total).toBe(30);
      expect(response.body.totalPages).toBe(2);
    });

    it('should filter lab results by organism with pagination', async () => {
      const response = await request(app)
        .get('/api/lab-results')
        .query({ 
          organism: 'E. coli',
          page: 1,
          pageSize: 5
        })
        .expect(200);

      expect(response.body.data.every((result: any) => 
        result.organism === 'E. coli'
      )).toBe(true);
    });
  });

  describe('Expert Rules Pagination', () => {
    beforeEach(async () => {
      // Insert test expert rules
      for (let i = 1; i <= 25; i++) {
        await db.run(`
          INSERT INTO expert_rules (id, title, type, description, conditions, 
                                  action, priority, status, explanation, references)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          `ER-${i.toString().padStart(3, '0')}`,
          `Expert Rule ${i}`,
          i % 4 === 0 ? 'intrinsic' : i % 3 === 0 ? 'quality' : i % 2 === 0 ? 'acquired' : 'phenotype',
          `Description for rule ${i}`,
          JSON.stringify([`Condition ${i}A`, `Condition ${i}B`]),
          `Action ${i}`,
          i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low',
          i % 5 === 0 ? 'inactive' : 'active',
          `Explanation for rule ${i}`,
          JSON.stringify([`Reference ${i}`])
        ]);
      }
    });

    it('should return paginated expert rules', async () => {
      const response = await request(app)
        .get('/api/expert-rules')
        .query({ page: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.data).toHaveLength(10);
      expect(response.body.total).toBe(25);
      expect(response.body.totalPages).toBe(3);
    });

    it('should filter expert rules by type with pagination', async () => {
      const response = await request(app)
        .get('/api/expert-rules')
        .query({ 
          type: 'intrinsic',
          page: 1,
          pageSize: 5
        })
        .expect(200);

      expect(response.body.data.every((rule: any) => 
        rule.type === 'intrinsic'
      )).toBe(true);
    });

    it('should search expert rules with pagination', async () => {
      const response = await request(app)
        .get('/api/expert-rules')
        .query({ 
          search: 'Rule 1',
          page: 1,
          pageSize: 10
        })
        .expect(200);

      expect(response.body.data.every((rule: any) => 
        rule.title.includes('Rule 1') || rule.description.includes('Rule 1')
      )).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    beforeEach(async () => {
      // Insert large dataset for performance testing
      const batchSize = 100;
      for (let batch = 0; batch < 10; batch++) {
        const values = [];
        for (let i = 1; i <= batchSize; i++) {
          const id = batch * batchSize + i;
          values.push(`(
            'PERF-${id.toString().padStart(6, '0')}',
            'Performance Test ${id}',
            'Blood Culture',
            'received',
            'medium',
            'P-PERF-${id}',
            'Patient ${id}',
            '${new Date(Date.now() - id * 60 * 1000).toISOString()}',
            '${new Date(Date.now() - (id - 1) * 60 * 1000).toISOString()}',
            'Performance Ward',
            'Dr. Performance',
            'Performance test sample ${id}'
          )`);
        }
        
        await db.run(`
          INSERT INTO samples (id, type, status, priority, patient_id, patient_name, 
                             collection_date, received_date, location, physician, notes)
          VALUES ${values.join(', ')}
        `);
      }
    });

    it('should handle large dataset pagination efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/samples')
        .query({ page: 50, pageSize: 20 })
        .expect(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
      expect(response.body.data).toHaveLength(20);
      expect(response.body.page).toBe(50);
    });

    it('should handle concurrent pagination requests', async () => {
      const requests = [];
      
      for (let i = 1; i <= 10; i++) {
        requests.push(
          request(app)
            .get('/api/samples')
            .query({ page: i, pageSize: 10 })
        );
      }
      
      const responses = await Promise.all(requests);
      
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.page).toBe(index + 1);
        expect(response.body.data).toHaveLength(10);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty dataset', async () => {
      await db.run('DELETE FROM samples');
      
      const response = await request(app)
        .get('/api/samples')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.total).toBe(0);
      expect(response.body.totalPages).toBe(0);
      expect(response.body.hasMore).toBe(false);
    });

    it('should handle very large page size', async () => {
      const response = await request(app)
        .get('/api/samples')
        .query({ pageSize: 100 })
        .expect(400);

      expect(response.body.error).toContain('Page size too large');
    });

    it('should handle negative page numbers', async () => {
      const response = await request(app)
        .get('/api/samples')
        .query({ page: -1 })
        .expect(400);

      expect(response.body.error).toContain('Invalid page number');
    });

    it('should handle non-numeric pagination parameters', async () => {
      const response = await request(app)
        .get('/api/samples')
        .query({ page: 'invalid', pageSize: 'invalid' })
        .expect(400);

      expect(response.body.error).toContain('Invalid pagination parameters');
    });
  });
});