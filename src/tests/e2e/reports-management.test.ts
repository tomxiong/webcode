import { describe, it, expect, beforeAll } from 'vitest'

describe('Reports Management Interface E2E Tests', () => {
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

  it('should load reports management page successfully', async () => {
    const response = await fetch(`${baseUrl}/reports.html`)
    expect(response.ok).toBe(true)
    expect(response.headers.get('content-type')).toContain('text/html')
  })

  it('should fetch system overview report via API', async () => {
    const response = await fetch(`${baseUrl}/api/reports/system-overview`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
  })

  it('should generate microorganism distribution report', async () => {
    const response = await fetch(`${baseUrl}/api/reports/generate/microorganism-distribution`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('should generate antimicrobial susceptibility report', async () => {
    const response = await fetch(`${baseUrl}/api/reports/generate/antimicrobial-susceptibility`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('should fetch reports statistics via API', async () => {
    const response = await fetch(`${baseUrl}/api/reports/statistics`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
  })

  it('should handle authentication for protected endpoints', async () => {
    const response = await fetch(`${baseUrl}/api/reports/system-overview`)
    expect(response.status).toBe(401)
  })
})