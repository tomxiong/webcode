// Test authentication endpoints
async function testAuthEndpoints() {
  const baseUrl = 'http://localhost:3000'
  
  console.log('🧪 Testing Authentication Endpoints...\n')
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...')
    const healthResponse = await fetch(`${baseUrl}/health`)
    const healthData = await healthResponse.json()
    console.log('✅ Health check:', healthData)
    
    // Test register endpoint
    console.log('\n2. Testing user registration...')
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'MICROBIOLOGIST'
      })
    })
    
    const registerData = await registerResponse.json()
    console.log('✅ Registration response:', registerData)
    
    // Test login endpoint
    console.log('\n3. Testing user login...')
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
      })
    })
    
    const loginData = await loginResponse.json()
    console.log('✅ Login response:', loginData)
    
    if (loginData.token) {
      // Test protected endpoint
      console.log('\n4. Testing protected endpoint...')
      const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      })
      
      const meData = await meResponse.json()
      console.log('✅ Protected endpoint response:', meData)
    }
    
    console.log('\n🎉 Authentication system test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testAuthEndpoints()