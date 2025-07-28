// Simple test for Sample and Lab Result endpoints
const BASE_URL = 'http://localhost:3001'

async function simpleTest() {
  console.log('🧪 Simple Sample & Lab Result Test\n')
  
  try {
    // 1. Login
    console.log('1. Testing login...')
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    })
    
    const loginData = await loginRes.json()
    console.log('Login result:', loginData.success ? '✅ SUCCESS' : '❌ FAILED')
    
    if (!loginData.success) return
    
    const token = loginData.token
    
    // 2. Test samples endpoint
    console.log('\n2. Testing samples endpoint...')
    const samplesRes = await fetch(`${BASE_URL}/api/samples`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    const samplesData = await samplesRes.json()
    console.log('Samples result:', samplesData.success ? '✅ SUCCESS' : '❌ FAILED')
    console.log('Sample count:', samplesData.count || 0)
    
    // 3. Test lab results endpoint
    console.log('\n3. Testing lab results endpoint...')
    const labRes = await fetch(`${BASE_URL}/api/lab-results`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    const labData = await labRes.json()
    console.log('Lab results result:', labData.success ? '✅ SUCCESS' : '❌ FAILED')
    console.log('Lab result count:', labData.count || 0)
    
    console.log('\n🎉 Simple test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

simpleTest()