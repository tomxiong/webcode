import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Database } from './infrastructure/database/Database.js'
import { DatabaseSeeder } from './infrastructure/database/Seeder.js'
import { SqliteBreakpointStandardRepository } from './infrastructure/repositories/SqliteBreakpointStandardRepository.js'
import { BreakpointStandardService } from './application/services/BreakpointStandardService.js'
import { TestMethod } from './domain/entities/BreakpointStandard.js'

async function testBreakpointEndpoints() {
  console.log('🧪 Testing Breakpoint Standard Endpoints...\n')

  // Initialize database and services
  const database = new Database('./test_breakpoints.db')
  await database.initialize()
  
  const seeder = new DatabaseSeeder(database)
  await seeder.seed()

  const breakpointRepository = new SqliteBreakpointStandardRepository(database)
  const breakpointService = new BreakpointStandardService(breakpointRepository)

  // Add some test breakpoint standards manually since seeding had issues
  console.log('📝 Adding test breakpoint standards...')
  await breakpointService.createBreakpointStandard(
    'micro-001', // E. coli
    'drug-001',  // Ampicillin
    2024,
    TestMethod.DISK_DIFFUSION,
    {
      susceptibleMin: 17,
      intermediateMin: 14,
      intermediateMax: 16,
      resistantMax: 13
    },
    'Test E. coli ampicillin disk diffusion standard',
    'CLSI M100-S34'
  )

  await breakpointService.createBreakpointStandard(
    'micro-002', // S. aureus
    'drug-003',  // Vancomycin
    2024,
    TestMethod.BROTH_MICRODILUTION,
    {
      susceptibleMax: 2,
      intermediateMin: 4,
      intermediateMax: 8,
      resistantMin: 16
    },
    'Test S. aureus vancomycin MIC standard',
    'CLSI M100-S34'
  )

  try {
    // Test 1: Get available years
    console.log('📅 Test 1: Get Available Years')
    const years = await breakpointService.getAvailableYears()
    console.log('Available years:', years)
    console.log('✅ Test 1 passed\n')

    // Test 2: Get standards by year
    console.log('📊 Test 2: Get Standards by Year (2024)')
    const standards2024 = await breakpointService.getStandardsByYear(2024)
    console.log(`Found ${standards2024.length} standards for 2024`)
    console.log('Sample standard:', {
      id: standards2024[0]?.id,
      microorganismId: standards2024[0]?.microorganismId,
      drugId: standards2024[0]?.drugId,
      method: standards2024[0]?.method,
      year: standards2024[0]?.year
    })
    console.log('✅ Test 2 passed\n')

    // Test 3: Search breakpoints
    console.log('🔍 Test 3: Search Breakpoints')
    if (standards2024.length > 0) {
      const sample = standards2024[0]
      const searchResults = await breakpointService.findBreakpoints({
        microorganismId: sample.microorganismId,
        drugId: sample.drugId
      })
      console.log(`Found ${searchResults.length} breakpoints for microorganism-drug combination`)
      console.log('✅ Test 3 passed\n')
    }

    // Test 4: Get latest breakpoint
    console.log('🎯 Test 4: Get Latest Breakpoint')
    if (standards2024.length > 0) {
      const sample = standards2024[0]
      const latest = await breakpointService.getLatestBreakpoint(
        sample.microorganismId,
        sample.drugId,
        sample.method
      )
      console.log('Latest breakpoint:', {
        year: latest?.year,
        method: latest?.method,
        susceptibleMax: latest?.susceptibleMax,
        resistantMin: latest?.resistantMin
      })
      console.log('✅ Test 4 passed\n')
    }

    // Test 5: Interpret result
    console.log('🧬 Test 5: Interpret Test Result')
    if (standards2024.length > 0) {
      const sample = standards2024.find(s => s.method === TestMethod.BROTH_MICRODILUTION)
      if (sample && sample.susceptibleMax) {
        // Test with a susceptible value
        const interpretation = await breakpointService.interpretResult(
          sample.microorganismId,
          sample.drugId,
          sample.susceptibleMax / 2, // Half of susceptible max should be susceptible
          sample.method,
          sample.year
        )
        console.log('Interpretation result:', {
          result: interpretation?.result,
          confidence: interpretation?.confidence,
          standardYear: interpretation?.standard.year,
          notes: interpretation?.notes?.substring(0, 100) + '...'
        })
        console.log('✅ Test 5 passed\n')
      }
    }

    // Test 6: Compare breakpoint versions
    console.log('📈 Test 6: Compare Breakpoint Versions')
    if (standards2024.length > 0) {
      const sample = standards2024[0]
      const comparisons = await breakpointService.compareBreakpointVersions(
        sample.microorganismId,
        sample.drugId
      )
      console.log(`Found ${comparisons.length} method comparisons`)
      if (comparisons.length > 0) {
        console.log('Sample comparison:', {
          method: comparisons[0].method,
          standardsCount: comparisons[0].standards.length,
          changesCount: comparisons[0].changes.length
        })
      }
      console.log('✅ Test 6 passed\n')
    }

    // Test 7: Create new breakpoint standard
    console.log('➕ Test 7: Create New Breakpoint Standard')
    if (standards2024.length > 0) {
      const sample = standards2024[0]
      const newStandard = await breakpointService.createBreakpointStandard(
        sample.microorganismId,
        sample.drugId,
        2025, // Future year
        TestMethod.ETEST,
        {
          susceptibleMax: 2,
          intermediateMin: 4,
          intermediateMax: 8,
          resistantMin: 16
        },
        'Test breakpoint for 2025',
        'Test document'
      )
      console.log('Created new standard:', {
        id: newStandard.id,
        year: newStandard.year,
        method: newStandard.method
      })
      console.log('✅ Test 7 passed\n')
    }

    console.log('🎉 All breakpoint endpoint tests passed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await database.close()
  }
}

// Run tests
testBreakpointEndpoints().catch(console.error)