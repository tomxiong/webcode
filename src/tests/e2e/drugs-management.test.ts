import { describe, it, expect, beforeAll } from 'vitest'

describe('Drugs Management Interface E2E Tests', () => {
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

  it('should load drugs management page successfully', async () => {
    const response = await fetch(`${baseUrl}/drugs.html`)
    expect(response.ok).toBe(true)
    expect(response.headers.get('content-type')).toContain('text/html')
  })

  it('should fetch drugs list via API', async () => {
    const response = await fetch(`${baseUrl}/api/drugs`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.data.length).toBeGreaterThan(0)
  })

  it('should fetch drugs statistics via API', async () => {
    const response = await fetch(`${baseUrl}/api/drugs/statistics`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    expect(typeof data.data.total).toBe('number')
    expect(typeof data.data.categories).toBe('number')
  })

  it('should filter drugs by category', async () => {
    const response = await fetch(`${baseUrl}/api/drugs?category=Beta-lactam`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    
    // 验证所有返回的药物都属于指定类别
    data.data.forEach((drug: any) => {
      expect(drug.category).toBe('Beta-lactam')
    })
  })

  it('should search drugs by name', async () => {
    const response = await fetch(`${baseUrl}/api/drugs?search=Ampicillin`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    
    // 验证搜索结果包含搜索关键词
    data.data.forEach((drug: any) => {
      expect(drug.name.toLowerCase()).toContain('ampicillin')
    })
  })

  it('should handle authentication for protected endpoints', async () => {
    const response = await fetch(`${baseUrl}/api/drugs`)
    expect(response.status).toBe(401)
  })
})