import { describe, it, expect, beforeAll } from 'vitest'

describe('Expert Rules Management Interface E2E Tests', () => {
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

  it('should load expert rules management page successfully', async () => {
    const response = await fetch(`${baseUrl}/expert-rules.html`)
    expect(response.ok).toBe(true)
    expect(response.headers.get('content-type')).toContain('text/html')
  })

  it('should fetch expert rules list via API', async () => {
    const response = await fetch(`${baseUrl}/api/expert-rules`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.data.length).toBeGreaterThan(0)
  })

  it('should fetch expert rules statistics via API', async () => {
    const response = await fetch(`${baseUrl}/api/expert-rules/statistics`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    expect(typeof data.data.total).toBe('number')
  })

  it('should filter expert rules by type', async () => {
    const response = await fetch(`${baseUrl}/api/expert-rules?type=intrinsic`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    
    // 验证所有返回的规则都是指定类型
    data.data.forEach((rule: any) => {
      expect(rule.ruleType).toBe('intrinsic')
    })
  })

  it('should test individual expert rule', async () => {
    // 先获取一个规则ID
    const rulesResponse = await fetch(`${baseUrl}/api/expert-rules`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    const rulesData = await rulesResponse.json()
    if (rulesData.data && rulesData.data.length > 0) {
      const ruleId = rulesData.data[0].id
      
      const response = await fetch(`${baseUrl}/api/expert-rules/${ruleId}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      
      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.success).toBe(true)
    }
  })

  it('should handle authentication for protected endpoints', async () => {
    const response = await fetch(`${baseUrl}/api/expert-rules`)
    expect(response.status).toBe(401)
  })
})