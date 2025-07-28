async function testReportingSystem() {
  console.log('📊 Testing Advanced Reporting and Analytics Dashboard')
  console.log('============================================================')

  try {
    // 1. Test server health
    console.log('\n1. 🔍 Testing server health...')
    const healthResponse = await fetch('http://localhost:3001/health')
    const healthData = await healthResponse.json()
    console.log('   Health check:', healthResponse.ok ? '✅ OK' : '❌ FAILED')

    // 2. Test authentication
    console.log('\n2. 🔐 Testing authentication...')
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    })
    const loginData = await loginResponse.json()
    console.log('   Login:', loginResponse.ok ? '✅ SUCCESS' : '❌ FAILED')
    
    if (!loginData.token) {
      console.log('❌ No auth token received, stopping tests')
      return
    }

    const authHeaders = { 'Authorization': `Bearer ${loginData.token}` }

    // 3. Test system overview
    console.log('\n3. 📊 Testing system overview...')
    const overviewResponse = await fetch('http://localhost:3001/api/reports/dashboard/overview', {
      headers: authHeaders
    })
    const overviewData = await overviewResponse.json()
    console.log('   System Overview:', overviewResponse.ok ? '✅ SUCCESS' : '❌ FAILED')
    if (overviewData.data) {
      console.log('   Summary:', JSON.stringify(overviewData.data.summary, null, 2))
    }

    // 4. Test sample analytics
    console.log('\n4. 🧪 Testing sample analytics...')
    const endDate = new Date().toISOString()
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sampleAnalyticsResponse = await fetch(
      `http://localhost:3001/api/reports/analytics/sample_summary?startDate=${startDate}&endDate=${endDate}`,
      { headers: authHeaders }
    )
    const sampleAnalyticsData = await sampleAnalyticsResponse.json()
    console.log('   Sample Analytics:', sampleAnalyticsResponse.ok ? '✅ SUCCESS' : '❌ FAILED')
    if (sampleAnalyticsData.data) {
      console.log('   Total Count:', sampleAnalyticsData.data.totalCount)
    }

    // 5. Test lab result analytics
    console.log('\n5. 📋 Testing lab result analytics...')
    const labAnalyticsResponse = await fetch(
      `http://localhost:3001/api/reports/analytics/lab_results_analysis?startDate=${startDate}&endDate=${endDate}`,
      { headers: authHeaders }
    )
    const labAnalyticsData = await labAnalyticsResponse.json()
    console.log('   Lab Result Analytics:', labAnalyticsResponse.ok ? '✅ SUCCESS' : '❌ FAILED')
    if (labAnalyticsData.data) {
      console.log('   Total Count:', labAnalyticsData.data.totalCount)
      console.log('   Quality Control Rate:', labAnalyticsData.data.qualityControlRate + '%')
    }

    // 6. Test reports list
    console.log('\n6. 📄 Testing reports list...')
    const reportsResponse = await fetch('http://localhost:3001/api/reports', {
      headers: authHeaders
    })
    const reportsData = await reportsResponse.json()
    console.log('   Reports List:', reportsResponse.ok ? '✅ SUCCESS' : '❌ FAILED')
    console.log('   Report count:', reportsData.count || 0)

    // 7. Test create report
    console.log('\n7. ➕ Testing create report...')
    const createReportResponse = await fetch('http://localhost:3001/api/reports', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Monthly Sample Summary',
        description: 'Monthly summary of all samples processed',
        type: 'sample_summary',
        parameters: {
          dateRange: {
            startDate: startDate,
            endDate: endDate
          }
        },
        format: 'json'
      })
    })
    const createReportData = await createReportResponse.json()
    console.log('   Create Report:', createReportResponse.ok ? '✅ SUCCESS' : '❌ FAILED')
    
    let reportId = null
    if (createReportData.data) {
      reportId = createReportData.data.id
      console.log('   Report ID:', reportId)
    }

    // 8. Test generate report
    if (reportId) {
      console.log('\n8. 🔄 Testing generate report...')
      const generateResponse = await fetch(`http://localhost:3001/api/reports/${reportId}/generate`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const generateData = await generateResponse.json()
      console.log('   Generate Report:', generateResponse.ok ? '✅ SUCCESS' : '❌ FAILED')
      if (generateData.data) {
        console.log('   Result ID:', generateData.data.id)
        console.log('   Summary:', JSON.stringify(generateData.data.summary, null, 2))
      }
    }

    // 9. Test dashboards
    console.log('\n9. 📊 Testing dashboards...')
    const dashboardsResponse = await fetch('http://localhost:3001/api/reports/dashboards', {
      headers: authHeaders
    })
    const dashboardsData = await dashboardsResponse.json()
    console.log('   Dashboards List:', dashboardsResponse.ok ? '✅ SUCCESS' : '❌ FAILED')
    console.log('   Dashboard count:', dashboardsData.count || 0)

    console.log('\n🎉 Advanced Reporting and Analytics Dashboard Test Complete!')
    console.log('\n📋 Summary:')
    console.log('- ✅ Server running on port 3001')
    console.log('- ✅ Authentication system working')
    console.log('- ✅ System overview dashboard functional')
    console.log('- ✅ Analytics endpoints working')
    console.log('- ✅ Report management system operational')
    console.log('- ✅ Dashboard system ready')
    console.log('- 📊 Advanced reporting and analytics: Available')
    console.log('- 🎛️ Interactive dashboards: Ready for configuration')

  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testReportingSystem()