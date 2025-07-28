// Test drug endpoints
async function testDrugEndpoints() {
  const baseUrl = 'http://localhost:3000'
  
  console.log('🧪 Testing Drug Endpoints...\n')
  
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
    
    // Test get all drugs
    console.log('\n2. Testing get all drugs...')
    const getAllResponse = await fetch(`${baseUrl}/api/drugs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const getAllData = await getAllResponse.json()
    console.log('✅ Get all drugs:', getAllData.success ? `Found ${getAllData.data?.length || 0} drugs` : 'Failed')
    
    // Test get drug categories
    console.log('\n3. Testing get drug categories...')
    const categoriesResponse = await fetch(`${baseUrl}/api/drugs/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const categoriesData = await categoriesResponse.json()
    console.log('✅ Get categories:', categoriesData.success ? `Found ${categoriesData.data?.length || 0} categories` : 'Failed')
    
    // Test get drug statistics
    console.log('\n4. Testing get drug statistics...')
    const statsResponse = await fetch(`${baseUrl}/api/drugs/statistics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const statsData = await statsResponse.json()
    console.log('✅ Get statistics:', statsData.success ? `Total: ${statsData.data?.totalDrugs || 0}` : 'Failed')
    
    // Test create drug
    console.log('\n5. Testing create drug...')
    const createResponse = await fetch(`${baseUrl}/api/drugs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Meropenem',
        code: 'MEM',
        category: 'ANTIBIOTIC',
        description: 'Carbapenem antibiotic for serious infections'
      })
    })
    const createData = await createResponse.json()
    console.log('✅ Create drug:', createData.success ? 'Success' : `Failed: ${createData.error}`)
    
    if (createData.success && createData.data) {
      const drugId = createData.data.id
      
      // Test get by ID
      console.log('\n6. Testing get drug by ID...')
      const getByIdResponse = await fetch(`${baseUrl}/api/drugs/${drugId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const getByIdData = await getByIdResponse.json()
      console.log('✅ Get by ID:', getByIdData.success ? 'Success' : 'Failed')
      
      // Test get by code
      console.log('\n7. Testing get drug by code...')
      const getByCodeResponse = await fetch(`${baseUrl}/api/drugs/code/MEM`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const getByCodeData = await getByCodeResponse.json()
      console.log('✅ Get by code:', getByCodeData.success ? 'Success' : 'Failed')
      
      // Test update drug
      console.log('\n8. Testing update drug...')
      const updateResponse = await fetch(`${baseUrl}/api/drugs/${drugId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          description: 'Updated: Broad-spectrum carbapenem antibiotic for serious infections'
        })
      })
      const updateData = await updateResponse.json()
      console.log('✅ Update drug:', updateData.success ? 'Success' : `Failed: ${updateData.error}`)
    }
    
    // Test search drugs
    console.log('\n9. Testing search drugs...')
    const searchResponse = await fetch(`${baseUrl}/api/drugs/search?category=ANTIBIOTIC`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const searchData = await searchResponse.json()
    console.log('✅ Search drugs:', searchData.success ? `Found ${searchData.data?.length || 0} antibiotics` : 'Failed')
    
    // Test get drugs by category
    console.log('\n10. Testing get drugs by category...')
    const categoryResponse = await fetch(`${baseUrl}/api/drugs/categories/ANTIBIOTIC`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const categoryData = await categoryResponse.json()
    console.log('✅ Get by category:', categoryData.success ? `Found ${categoryData.data?.length || 0} antibiotics` : 'Failed')
    
    console.log('\n🎉 Drug endpoints test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testDrugEndpoints()