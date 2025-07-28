// Test microorganism endpoints
async function testMicroorganismEndpoints() {
  const baseUrl = 'http://localhost:3000'
  
  console.log('🧪 Testing Microorganism Endpoints...\n')
  
  try {
    // First, login to get a token
    console.log('1. Logging in to get authentication token...')
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
    console.log('✅ Login response:', loginData.success ? 'Success' : 'Failed')
    
    if (!loginData.token) {
      console.log('❌ No token received, cannot continue tests')
      return
    }
    
    const token = loginData.token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
    
    // Test get all microorganisms
    console.log('\n2. Testing get all microorganisms...')
    const getAllResponse = await fetch(`${baseUrl}/api/microorganisms`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const getAllData = await getAllResponse.json()
    console.log('✅ Get all microorganisms:', getAllData.success ? `Found ${getAllData.data?.length || 0} microorganisms` : 'Failed')
    
    // Test get hierarchical data
    console.log('\n3. Testing get hierarchical data...')
    const hierarchyResponse = await fetch(`${baseUrl}/api/microorganisms/hierarchy`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const hierarchyData = await hierarchyResponse.json()
    console.log('✅ Get hierarchy:', hierarchyData.success ? 'Success' : 'Failed')
    
    // Test get genera
    console.log('\n4. Testing get genera...')
    const generaResponse = await fetch(`${baseUrl}/api/microorganisms/genera`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const generaData = await generaResponse.json()
    console.log('✅ Get genera:', generaData.success ? `Found ${generaData.data?.length || 0} genera` : 'Failed')
    
    // Test create microorganism
    console.log('\n5. Testing create microorganism...')
    const createResponse = await fetch(`${baseUrl}/api/microorganisms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        genus: 'Klebsiella',
        species: 'pneumoniae',
        commonName: 'K. pneumoniae',
        description: 'Gram-negative bacterium commonly causing pneumonia'
      })
    })
    const createData = await createResponse.json()
    console.log('✅ Create microorganism:', createData.success ? 'Success' : `Failed: ${createData.error}`)
    
    if (createData.success && createData.data) {
      const microId = createData.data.id
      
      // Test get by ID
      console.log('\n6. Testing get microorganism by ID...')
      const getByIdResponse = await fetch(`${baseUrl}/api/microorganisms/${microId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const getByIdData = await getByIdResponse.json()
      console.log('✅ Get by ID:', getByIdData.success ? 'Success' : 'Failed')
      
      // Test update microorganism
      console.log('\n7. Testing update microorganism...')
      const updateResponse = await fetch(`${baseUrl}/api/microorganisms/${microId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          description: 'Updated: Gram-negative bacterium commonly causing pneumonia and UTIs'
        })
      })
      const updateData = await updateResponse.json()
      console.log('✅ Update microorganism:', updateData.success ? 'Success' : `Failed: ${updateData.error}`)
    }
    
    // Test search
    console.log('\n8. Testing search microorganisms...')
    const searchResponse = await fetch(`${baseUrl}/api/microorganisms/search?genus=Escherichia`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const searchData = await searchResponse.json()
    console.log('✅ Search microorganisms:', searchData.success ? `Found ${searchData.data?.length || 0} results` : 'Failed')
    
    console.log('\n🎉 Microorganism endpoints test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testMicroorganismEndpoints()