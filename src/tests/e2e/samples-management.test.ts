import { describe, it, expect, beforeAll } from 'vitest'

describe('Samples Management Interface E2E Tests', () => {
  let authToken: string
  const baseUrl = 'http://localhost:3000'
  
  beforeAll(async () => {
    // 登录获取认证令牌
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    })
    
    expect(loginResponse.ok).toBe(true)
    const loginData = await loginResponse.json()
    authToken = loginData.token
    expect(authToken).toBeDefined()
  })

  it('should load samples management page successfully', async () => {
    const response = await fetch(`${baseUrl}/samples.html`)
    expect(response.ok).toBe(true)
    expect(response.headers.get('content-type')).toContain('text/html')
  })

  it('should fetch samples list via API', async () => {
    const response = await fetch(`${baseUrl}/api/samples`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('should fetch samples statistics via API', async () => {
    const response = await fetch(`${baseUrl}/api/samples/statistics`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
  })

  it('should create new sample via API', async () => {
    const newSample = {
      patientId: `patient_${Date.now()}`,
      sampleType: 'blood',
      collectionDate: new Date().toISOString(),
      priority: 'routine'
    }

    const response = await fetch(`${baseUrl}/api/samples`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newSample)
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.patientId).toBe(newSample.patientId)
  })

  it('should handle authentication for protected endpoints', async () => {
    const response = await fetch(`${baseUrl}/api/samples`)
    expect(response.status).toBe(401)
  })
})