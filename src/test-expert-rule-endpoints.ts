#!/usr/bin/env tsx

/**
 * Expert Rule Endpoints Test Suite
 * Tests all expert rule functionality including validation, CRUD operations, and rule evaluation
 */

interface TestResult {
  endpoint: string
  method: string
  status: number
  success: boolean
  data?: any
  error?: string
}

class ExpertRuleEndpointTester {
  private baseUrl = 'http://localhost:3000'
  private authToken: string | null = null

  async runAllTests(): Promise<void> {
    console.log('🧠 Starting Expert Rule Endpoints Test Suite...\n')

    const results: TestResult[] = []

    try {
      // Step 1: Login to get auth token
      console.log('Step 1: Authentication')
      const loginResult = await this.testLogin()
      results.push(loginResult)
      
      if (!loginResult.success) {
        console.log('❌ Authentication failed, stopping tests')
        return
      }

      // Step 2: Get all expert rules
      console.log('\nStep 2: Get All Expert Rules')
      const getAllResult = await this.testGetAllRules()
      results.push(getAllResult)

      // Step 3: Get rules by type
      console.log('\nStep 3: Get Rules by Type')
      const getByTypeResult = await this.testGetRulesByType()
      results.push(getByTypeResult)

      // Step 4: Validate test result
      console.log('\nStep 4: Validate Test Result')
      const validateResult = await this.testValidateResult()
      results.push(validateResult)

      // Step 5: Get rule statistics
      console.log('\nStep 5: Get Rule Statistics')
      const statsResult = await this.testGetStatistics()
      results.push(statsResult)

      // Step 6: Create new expert rule (Admin only)
      console.log('\nStep 6: Create New Expert Rule')
      const createResult = await this.testCreateRule()
      results.push(createResult)

      // Step 7: Update expert rule (Admin only)
      console.log('\nStep 7: Update Expert Rule')
      const updateResult = await this.testUpdateRule()
      results.push(updateResult)

      // Summary
      this.printSummary(results)

    } catch (error) {
      console.error('❌ Test suite failed:', error)
    }
  }

  private async testLogin(): Promise<TestResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })
      })

      const data = await response.json()
      
      if (response.ok && data.token) {
        this.authToken = data.token
        console.log('✅ Login successful')
        return {
          endpoint: '/api/auth/login',
          method: 'POST',
          status: response.status,
          success: true,
          data: { user: data.user.username, role: data.user.role }
        }
      } else {
        console.log('❌ Login failed:', data.message)
        return {
          endpoint: '/api/auth/login',
          method: 'POST',
          status: response.status,
          success: false,
          error: data.message
        }
      }
    } catch (error) {
      console.log('❌ Login error:', error)
      return {
        endpoint: '/api/auth/login',
        method: 'POST',
        status: 0,
        success: false,
        error: String(error)
      }
    }
  }

  private async testGetAllRules(): Promise<TestResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/expert-rules`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      })

      const data = await response.json()
      
      if (response.ok) {
        console.log(`✅ Retrieved ${data.data?.length || 0} expert rules`)
        console.log('   Sample rules:', data.data?.slice(0, 2).map((r: any) => ({
          name: r.name,
          type: r.ruleType,
          priority: r.priority
        })))
        
        return {
          endpoint: '/api/expert-rules',
          method: 'GET',
          status: response.status,
          success: true,
          data: { count: data.data?.length, sample: data.data?.slice(0, 2) }
        }
      } else {
        console.log('❌ Failed to get rules:', data.message)
        return {
          endpoint: '/api/expert-rules',
          method: 'GET',
          status: response.status,
          success: false,
          error: data.message
        }
      }
    } catch (error) {
      console.log('❌ Get rules error:', error)
      return {
        endpoint: '/api/expert-rules',
        method: 'GET',
        status: 0,
        success: false,
        error: String(error)
      }
    }
  }

  private async testGetRulesByType(): Promise<TestResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/expert-rules/type/intrinsic_resistance`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      })

      const data = await response.json()
      
      if (response.ok) {
        console.log(`✅ Retrieved ${data.data?.length || 0} intrinsic resistance rules`)
        if (data.data?.length > 0) {
          console.log('   Sample rule:', {
            name: data.data[0].name,
            description: data.data[0].description
          })
        }
        
        return {
          endpoint: '/api/expert-rules/type/intrinsic_resistance',
          method: 'GET',
          status: response.status,
          success: true,
          data: { count: data.data?.length, type: 'intrinsic_resistance' }
        }
      } else {
        console.log('❌ Failed to get rules by type:', data.message)
        return {
          endpoint: '/api/expert-rules/type/intrinsic_resistance',
          method: 'GET',
          status: response.status,
          success: false,
          error: data.message
        }
      }
    } catch (error) {
      console.log('❌ Get rules by type error:', error)
      return {
        endpoint: '/api/expert-rules/type/intrinsic_resistance',
        method: 'GET',
        status: 0,
        success: false,
        error: String(error)
      }
    }
  }

  private async testValidateResult(): Promise<TestResult> {
    try {
      // Test validation with a suspicious result
      const testData = {
        microorganismId: 'micro-1', // E. coli
        drugId: 'drug-1', // Ampicillin
        testValue: 12, // Small zone (resistant)
        testMethod: 'disk_diffusion',
        interpretedResult: 'susceptible' // This should trigger expert rule
      }

      const response = await fetch(`${this.baseUrl}/api/expert-rules/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      })

      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ Result validation completed')
        console.log('   Validation result:', {
          isValid: data.data?.isValid,
          confidence: data.data?.confidence,
          flagsCount: data.data?.flags?.length || 0,
          recommendationsCount: data.data?.recommendations?.length || 0
        })
        
        if (data.data?.flags?.length > 0) {
          console.log('   Sample flag:', data.data.flags[0])
        }
        
        return {
          endpoint: '/api/expert-rules/validate',
          method: 'POST',
          status: response.status,
          success: true,
          data: {
            isValid: data.data?.isValid,
            confidence: data.data?.confidence,
            flagsCount: data.data?.flags?.length || 0
          }
        }
      } else {
        console.log('❌ Validation failed:', data.message)
        return {
          endpoint: '/api/expert-rules/validate',
          method: 'POST',
          status: response.status,
          success: false,
          error: data.message
        }
      }
    } catch (error) {
      console.log('❌ Validation error:', error)
      return {
        endpoint: '/api/expert-rules/validate',
        method: 'POST',
        status: 0,
        success: false,
        error: String(error)
      }
    }
  }

  private async testGetStatistics(): Promise<TestResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/expert-rules/statistics`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      })

      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ Statistics retrieved successfully')
        console.log('   Statistics:', {
          totalRules: data.data?.totalRules,
          activeRules: data.data?.activeRules,
          rulesByType: data.data?.rulesByType
        })
        
        return {
          endpoint: '/api/expert-rules/statistics',
          method: 'GET',
          status: response.status,
          success: true,
          data: data.data
        }
      } else {
        console.log('❌ Failed to get statistics:', data.message)
        return {
          endpoint: '/api/expert-rules/statistics',
          method: 'GET',
          status: response.status,
          success: false,
          error: data.message
        }
      }
    } catch (error) {
      console.log('❌ Statistics error:', error)
      return {
        endpoint: '/api/expert-rules/statistics',
        method: 'GET',
        status: 0,
        success: false,
        error: String(error)
      }
    }
  }

  private async testCreateRule(): Promise<TestResult> {
    try {
      const newRule = {
        name: 'Test Expert Rule',
        description: 'Test rule for automated testing',
        ruleType: 'quality_control',
        condition: 'testValue < 10',
        action: 'Verify test procedure and repeat if necessary',
        priority: 5,
        year: 2024,
        notes: 'Created by automated test suite'
      }

      const response = await fetch(`${this.baseUrl}/api/expert-rules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newRule)
      })

      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ Expert rule created successfully')
        console.log('   Created rule:', {
          id: data.data?.id,
          name: data.data?.name,
          type: data.data?.ruleType
        })
        
        return {
          endpoint: '/api/expert-rules',
          method: 'POST',
          status: response.status,
          success: true,
          data: { id: data.data?.id, name: data.data?.name }
        }
      } else {
        console.log('❌ Failed to create rule:', data.message)
        return {
          endpoint: '/api/expert-rules',
          method: 'POST',
          status: response.status,
          success: false,
          error: data.message
        }
      }
    } catch (error) {
      console.log('❌ Create rule error:', error)
      return {
        endpoint: '/api/expert-rules',
        method: 'POST',
        status: 0,
        success: false,
        error: String(error)
      }
    }
  }

  private async testUpdateRule(): Promise<TestResult> {
    try {
      // First get a rule to update
      const getRulesResponse = await fetch(`${this.baseUrl}/api/expert-rules`, {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      })
      
      const getRulesData = await getRulesResponse.json()
      
      if (!getRulesResponse.ok || !getRulesData.data?.length) {
        return {
          endpoint: '/api/expert-rules/:id',
          method: 'PUT',
          status: 404,
          success: false,
          error: 'No rules found to update'
        }
      }

      const ruleToUpdate = getRulesData.data[0]
      const updateData = {
        name: ruleToUpdate.name + ' (Updated)',
        description: ruleToUpdate.description + ' - Updated by test',
        notes: 'Updated by automated test suite'
      }

      const response = await fetch(`${this.baseUrl}/api/expert-rules/${ruleToUpdate.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ Expert rule updated successfully')
        console.log('   Updated rule:', {
          id: data.data?.id,
          name: data.data?.name
        })
        
        return {
          endpoint: `/api/expert-rules/${ruleToUpdate.id}`,
          method: 'PUT',
          status: response.status,
          success: true,
          data: { id: data.data?.id, name: data.data?.name }
        }
      } else {
        console.log('❌ Failed to update rule:', data.message)
        return {
          endpoint: `/api/expert-rules/${ruleToUpdate.id}`,
          method: 'PUT',
          status: response.status,
          success: false,
          error: data.message
        }
      }
    } catch (error) {
      console.log('❌ Update rule error:', error)
      return {
        endpoint: '/api/expert-rules/:id',
        method: 'PUT',
        status: 0,
        success: false,
        error: String(error)
      }
    }
  }

  private printSummary(results: TestResult[]): void {
    console.log('\n' + '='.repeat(60))
    console.log('🧠 EXPERT RULE ENDPOINTS TEST SUMMARY')
    console.log('='.repeat(60))
    
    const passed = results.filter(r => r.success).length
    const total = results.length
    
    console.log(`📊 Overall Result: ${passed}/${total} tests passed`)
    console.log()
    
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌'
      console.log(`${index + 1}. ${status} ${result.method} ${result.endpoint}`)
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
    })
    
    console.log()
    if (passed === total) {
      console.log('🎉 All expert rule tests passed! Expert rule engine is fully functional.')
    } else {
      console.log(`⚠️  ${total - passed} test(s) failed. Please check the implementation.`)
    }
    console.log('='.repeat(60))
  }
}

// Run the tests
const tester = new ExpertRuleEndpointTester()
tester.runAllTests().catch(console.error)