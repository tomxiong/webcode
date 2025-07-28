// Debug test to see exact error
const BASE_URL = 'http://localhost:3001'

async function debugTest() {
  console.log('🔍 Debug Test for Lab Results\n')
  
  try {
    // Login first
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    })
    
    const loginData = await loginRes.json()
    if (!loginData.success) {
      console.log('❌ Login failed')
      return
    }
    
    const token = loginData.token
    console.log('✅ Login successful')
    
    // Test lab results endpoint with detailed error
    console.log('\n🔍 Testing lab results endpoint...')
    const labRes = await fetch(`${BASE_URL}/api/lab-results`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    const labData = await labRes.json()
    console.log('Status:', labRes.status)
    console.log('Response:', JSON.stringify(labData, null, 2))
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

debugTest()