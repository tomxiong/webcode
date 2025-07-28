import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawn, ChildProcess } from 'child_process'
import fetch from 'node-fetch'

describe('Complete Workflow E2E Tests', () => {
  let serverProcess: ChildProcess
  const baseUrl = 'http://localhost:3002'
  let authToken: string

  beforeAll(async () => {
    // Start server on different port for E2E tests
    serverProcess = spawn('tsx', ['src/server.ts'], {
      env: { ...process.env, PORT: '3002' },
      stdio: 'pipe'
    })

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Login to get auth token
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    })

    const loginData = await loginResponse.json() as any
    authToken = loginData.token
  }, 10000)

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill()
    }
  })

  describe('Complete Laboratory Workflow', () => {
    let microorganismId: string
    let drugId: string
    let sampleId: string
    let labResultId: string

    it('should complete full laboratory workflow', async () => {
      // 1. Create microorganism
      const microResponse = await fetch(`${baseUrl}/api/microorganisms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          genus: 'Escherichia',
          species: 'coli',
          gramStain: 'negative',
          morphology: 'rod',
          oxygenRequirement: 'facultative',
          catalaseTest: true,
          oxidaseTest: false
        })
      })

      expect(microResponse.status).toBe(201)
      const microData = await microResponse.json() as any
      microorganismId = microData.id

      // 2. Create drug
      const drugResponse = await fetch(`${baseUrl}/api/drugs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Ampicillin',
          code: 'AMP',
          category: 'Beta-lactam',
          mechanism: 'Cell wall synthesis inhibitor'
        })
      })

      expect(drugResponse.status).toBe(201)
      const drugData = await drugResponse.json() as any
      drugId = drugData.id

      // 3. Create sample
      const sampleResponse = await fetch(`${baseUrl}/api/samples`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          patientId: 'P001',
          sampleType: 'urine',
          collectionDate: new Date().toISOString(),
          status: 'received'
        })
      })

      expect(sampleResponse.status).toBe(201)
      const sampleData = await sampleResponse.json() as any
      sampleId = sampleData.id

      // 4. Create lab result
      const resultResponse = await fetch(`${baseUrl}/api/lab-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          sampleId,
          microorganismId,
          drugId,
          testMethod: 'disk_diffusion',
          rawValue: 18,
          unit: 'mm',
          interpretation: 'S'
        })
      })

      expect(resultResponse.status).toBe(201)
      const resultData = await resultResponse.json() as any
      labResultId = resultData.id

      // 5. Validate result with expert rules
      const validateResponse = await fetch(`${baseUrl}/api/lab-results/${labResultId}/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(validateResponse.status).toBe(200)
      const validateData = await validateResponse.json() as any
      expect(validateData.success).toBe(true)

      // 6. Generate report
      const reportResponse = await fetch(`${baseUrl}/api/reports/system-overview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(reportResponse.status).toBe(200)
      const reportData = await reportResponse.json() as any
      expect(reportData.success).toBe(true)
      expect(reportData.data).toHaveProperty('totalSamples')
      expect(reportData.data).toHaveProperty('totalResults')
    })
  })

  describe('Multi-language Support E2E', () => {
    it('should support multiple languages', async () => {
      // 1. Get supported languages
      const langResponse = await fetch(`${baseUrl}/api/localization/languages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(langResponse.status).toBe(200)
      const langData = await langResponse.json() as any
      expect(langData.success).toBe(true)

      // 2. Create translation
      const translationResponse = await fetch(`${baseUrl}/api/localization/translations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          key: 'test.message',
          language: 'zh-CN',
          value: '测试消息',
          category: 'ui'
        })
      })

      expect(translationResponse.status).toBe(201)
      const translationData = await translationResponse.json() as any
      expect(translationData.success).toBe(true)

      // 3. Get translation
      const getTranslationResponse = await fetch(`${baseUrl}/api/localization/translations/test.message?language=zh-CN`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(getTranslationResponse.status).toBe(200)
      const getTranslationData = await getTranslationResponse.json() as any
      expect(getTranslationData.success).toBe(true)
      expect(getTranslationData.data.value).toBe('测试消息')
    })
  })

  describe('Export/Import E2E', () => {
    it('should export and import data', async () => {
      // 1. Create export request
      const exportResponse = await fetch(`${baseUrl}/api/export-import/exports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          type: 'microorganisms',
          format: 'json',
          filters: {},
          options: {}
        })
      })

      expect(exportResponse.status).toBe(200)
      const exportData = await exportResponse.json() as any
      expect(exportData.success).toBe(true)
      expect(exportData.data.id).toBeDefined()

      // 2. Get export statistics
      const statsResponse = await fetch(`${baseUrl}/api/export-import/statistics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(statsResponse.status).toBe(200)
      const statsData = await statsResponse.json() as any
      expect(statsData.success).toBe(true)
      expect(statsData.data).toHaveProperty('totalExports')
      expect(statsData.data).toHaveProperty('totalImports')
    })
  })

  describe('System Health and Performance', () => {
    it('should check system health', async () => {
      const healthResponse = await fetch(`${baseUrl}/health`)
      
      expect(healthResponse.status).toBe(200)
      const healthData = await healthResponse.json() as any
      expect(healthData.status).toBe('ok')
      expect(healthData.timestamp).toBeDefined()
    })

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        fetch(`${baseUrl}/api/microorganisms`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
      )

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })

    it('should maintain data consistency', async () => {
      // Create multiple resources and verify relationships
      const microResponse = await fetch(`${baseUrl}/api/microorganisms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          genus: 'Staphylococcus',
          species: 'aureus',
          gramStain: 'positive',
          morphology: 'cocci',
          oxygenRequirement: 'facultative',
          catalaseTest: true,
          oxidaseTest: false
        })
      })

      const microData = await microResponse.json() as any
      const microId = microData.id

      // Verify the microorganism exists in statistics
      const statsResponse = await fetch(`${baseUrl}/api/microorganisms/statistics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      const statsData = await statsResponse.json() as any
      expect(statsData.data.totalCount).toBeGreaterThan(0)
    })
  })
})