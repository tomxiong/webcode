import { describe, it, expect, beforeAll } from 'vitest'

describe('Microorganisms Management Interface E2E Tests', () => {
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

  it('should load microorganisms management page successfully', async () => {
    const response = await fetch(`${baseUrl}/microorganisms.html`)
    expect(response.ok).toBe(true)
    expect(response.headers.get('content-type')).toContain('text/html')
  })

  it('should fetch microorganisms list via API', async () => {
    const response = await fetch(`${baseUrl}/api/microorganisms`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.data.length).toBeGreaterThan(0)
  })

  it('should fetch microorganisms statistics via API', async () => {
    const response = await fetch(`${baseUrl}/api/microorganisms/statistics`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    expect(typeof data.data.total).toBe('number')
  })

  it('should filter microorganisms by genus', async () => {
    const response = await fetch(`${baseUrl}/api/microorganisms?genus=Escherichia`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    
    // 验证所有返回的微生物都是指定属
    data.data.forEach((microorganism: any) => {
      expect(microorganism.genus).toBe('Escherichia')
    })
  })

  it('should search microorganisms by genus name', async () => {
    const response = await fetch(`${baseUrl}/api/microorganisms?search=Staphylococcus`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    
    // 验证搜索结果包含搜索关键词
    data.data.forEach((microorganism: any) => {
      expect(microorganism.genus.toLowerCase()).toContain('staphylococcus')
    })
  })

  it('should handle authentication for protected endpoints', async () => {
    const response = await fetch(`${baseUrl}/api/microorganisms`)
    expect(response.status).toBe(401)
  })
})