import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('Users Management Interface E2E Tests', () => {
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

  it('should load users management page successfully', async () => {
    const response = await fetch(`${baseUrl}/users.html`)
    expect(response.ok).toBe(true)
    expect(response.headers.get('content-type')).toContain('text/html')
  })

  it('should fetch users list via API', async () => {
    const response = await fetch(`${baseUrl}/api/users`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.data.length).toBeGreaterThan(0)
  })

  it('should fetch user statistics via API', async () => {
    const response = await fetch(`${baseUrl}/api/users/statistics`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    expect(typeof data.data.total).toBe('number')
  })

  it('should create new user via API', async () => {
    const newUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpass123',
      role: 'viewer'
    }

    const response = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newUser)
    })
    
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.username).toBe(newUser.username)
  })

  it('should handle authentication for protected endpoints', async () => {
    const response = await fetch(`${baseUrl}/api/users`)
    expect(response.status).toBe(401)
  })
})