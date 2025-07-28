import { describe, it, expect } from 'vitest'

describe('Live Admin Login Flow E2E Test', () => {
  const baseUrl = 'http://localhost:3000'

  it('should display login page at root route', async () => {
    const response = await fetch(baseUrl)
    expect(response.status).toBe(200)
    
    const html = await response.text()
    expect(html).toContain('CLSI')
    expect(html).toContain('登录') // Chinese login text
  })

  it('should successfully login admin user', async () => {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    })

    expect(loginResponse.status).toBe(200)
    
    const loginData = await loginResponse.json()
    expect(loginData.success).toBe(true)
    expect(loginData.token).toBeDefined()
    expect(loginData.user).toBeDefined()
    expect(loginData.user.username).toBe('admin')
    expect(loginData.user.role).toBe('ADMIN')
    
    console.log('✅ Admin login successful:', {
      username: loginData.user.username,
      role: loginData.user.role,
      tokenLength: loginData.token.length
    })
  })

  it('should verify JWT token structure', async () => {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    })

    const loginData = await loginResponse.json()
    const token = loginData.token

    // Verify JWT structure (header.payload.signature)
    const tokenParts = token.split('.')
    expect(tokenParts).toHaveLength(3)

    // Decode payload (without verification for testing)
    const payload = JSON.parse(atob(tokenParts[1]))
    expect(payload.userId).toBeDefined()
    expect(payload.username).toBe('admin')
    expect(payload.role).toBe('ADMIN')
    expect(payload.exp).toBeDefined() // Expiration time
    expect(payload.iat).toBeDefined() // Issued at time
    
    console.log('✅ JWT token structure verified:', {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
      expiresAt: new Date(payload.exp * 1000).toISOString()
    })
  })

  it('should verify all user accounts can login', async () => {
    const testUsers = [
      { username: 'admin', password: 'admin123', role: 'ADMIN' },
      { username: 'microbiologist', password: 'micro123', role: 'MICROBIOLOGIST' },
      { username: 'technician', password: 'tech123', role: 'LAB_TECHNICIAN' },
      { username: 'viewer', password: 'view123', role: 'VIEWER' }
    ]

    const results = []

    for (const user of testUsers) {
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          password: user.password
        })
      })

      expect(loginResponse.status).toBe(200)
      
      const loginData = await loginResponse.json()
      expect(loginData.success).toBe(true)
      expect(loginData.token).toBeDefined()
      expect(loginData.user.username).toBe(user.username)
      expect(loginData.user.role).toBe(user.role)
      
      results.push({
        username: user.username,
        role: loginData.user.role,
        loginSuccess: true
      })
    }
    
    console.log('✅ All user accounts verified:', results)
  })

  it('should handle invalid login credentials', async () => {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'wrongpassword'
      })
    })

    expect(loginResponse.status).toBe(401)
    
    const loginData = await loginResponse.json()
    expect(loginData.success).toBe(false)
    expect(loginData.message).toContain('Invalid credentials')
    
    console.log('✅ Invalid credentials properly rejected')
  })

  it('should verify dashboard route accessibility', async () => {
    // First login to get token
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    })

    const loginData = await loginResponse.json()
    const token = loginData.token

    // Try to access a protected endpoint
    const protectedResponse = await fetch(`${baseUrl}/api/microorganisms`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    expect(protectedResponse.status).toBe(200)
    
    const microorganismsData = await protectedResponse.json()
    expect(microorganismsData.success).toBe(true)
    expect(microorganismsData.data).toBeDefined()
    
    console.log('✅ Protected route accessible with admin token:', {
      endpoint: '/api/microorganisms',
      dataCount: microorganismsData.data.length
    })
  })

  it('should verify complete admin workflow', async () => {
    console.log('🧪 Starting complete admin workflow test...')
    
    // Step 1: Login
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    })
    
    expect(loginResponse.status).toBe(200)
    const loginData = await loginResponse.json()
    expect(loginData.success).toBe(true)
    
    console.log('✅ Step 1: Admin login successful')
    
    // Step 2: Access microorganisms
    const microResponse = await fetch(`${baseUrl}/api/microorganisms`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    })
    
    expect(microResponse.status).toBe(200)
    const microData = await microResponse.json()
    expect(microData.success).toBe(true)
    
    console.log('✅ Step 2: Microorganisms data accessed')
    
    // Step 3: Access drugs
    const drugResponse = await fetch(`${baseUrl}/api/drugs`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    })
    
    expect(drugResponse.status).toBe(200)
    const drugData = await drugResponse.json()
    expect(drugData.success).toBe(true)
    
    console.log('✅ Step 3: Drugs data accessed')
    
    // Step 4: Access statistics
    const statsResponse = await fetch(`${baseUrl}/api/drugs/statistics`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    })
    
    expect(statsResponse.status).toBe(200)
    const statsData = await statsResponse.json()
    expect(statsData.success).toBe(true)
    
    console.log('✅ Step 4: Statistics accessed')
    
    console.log('🎉 Complete admin workflow test passed!')
    
    // Summary
    const summary = {
      loginSuccess: true,
      tokenValid: true,
      microorganismsCount: microData.data.length,
      drugsCount: drugData.data.length,
      statisticsAvailable: !!statsData.data
    }
    
    console.log('📊 Workflow Summary:', summary)
    
    expect(summary.loginSuccess).toBe(true)
    expect(summary.tokenValid).toBe(true)
    expect(summary.microorganismsCount).toBeGreaterThan(0)
    expect(summary.drugsCount).toBeGreaterThan(0)
  })
})