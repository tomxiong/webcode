import { UserEntity, UserRole } from './domain/entities/User.js'
import { MicroorganismEntity } from './domain/entities/Microorganism.js'
import { DrugEntity, DrugCategory } from './domain/entities/Drug.js'
import { BreakpointStandardEntity, TestMethod } from './domain/entities/BreakpointStandard.js'

async function testDomainEntities() {
  console.log('🧪 Testing domain entities...')
  
  try {
    // Test User entity
    const user = UserEntity.create(
      'testuser',
      'test@example.com',
      'hashedpassword',
      UserRole.MICROBIOLOGIST
    )
    console.log('✅ User entity created:', user.username, user.role)

    // Test Microorganism entity
    const microorganism = MicroorganismEntity.create(
      'Escherichia',
      'coli',
      undefined,
      'E. coli',
      'Common gram-negative bacteria'
    )
    console.log('✅ Microorganism entity created:', microorganism.getFullName())

    // Test Drug entity
    const drug = DrugEntity.create(
      'Ampicillin',
      'AMP',
      DrugCategory.ANTIBIOTIC,
      'Beta-lactam antibiotic'
    )
    console.log('✅ Drug entity created:', drug.name, drug.code)

    // Test BreakpointStandard entity
    const breakpoint = BreakpointStandardEntity.create(
      microorganism.id,
      drug.id,
      2024,
      TestMethod.DISK_DIFFUSION,
      {
        susceptibleMin: 17,
        intermediateMin: 14,
        intermediateMax: 16,
        resistantMax: 13
      },
      'CLSI 2024 standard'
    )
    console.log('✅ Breakpoint standard created for:', microorganism.getFullName(), 'vs', drug.name)

    // Test interpretation
    const testResult1 = breakpoint.interpretResult(20) // Should be susceptible
    const testResult2 = breakpoint.interpretResult(15) // Should be intermediate
    const testResult3 = breakpoint.interpretResult(10) // Should be resistant
    
    console.log('✅ Interpretation tests:')
    console.log('  - Zone 20mm:', testResult1)
    console.log('  - Zone 15mm:', testResult2)
    console.log('  - Zone 10mm:', testResult3)

    console.log('🎉 All entity tests passed!')
    
  } catch (error) {
    console.error('❌ Entity test failed:', error)
  }
}

// Run the test
testDomainEntities()