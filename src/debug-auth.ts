import { Database } from './infrastructure/database/Database.js'
import { SqliteUserRepository } from './infrastructure/repositories/SqliteUserRepository.js'
import { AuthService } from './application/services/AuthService.js'
import { JwtService } from './infrastructure/services/JwtService.js'
import { PasswordService } from './infrastructure/services/PasswordService.js'

async function debugAuth() {
  console.log('🔍 Debugging authentication...')
  
  // Initialize services
  const database = new Database()
  await database.initialize()
  
  const userRepository = new SqliteUserRepository(database)
  const jwtService = new JwtService()
  const passwordService = new PasswordService()
  const authService = new AuthService(userRepository, jwtService, passwordService)
  
  try {
    // Check if user exists
    console.log('1. Checking if admin user exists...')
    const user = await userRepository.findByUsername('admin')
    if (!user) {
      console.log('❌ Admin user not found!')
      return
    }
    console.log('✅ Admin user found:', { id: user.id, username: user.username, email: user.email })
    console.log('   Password hash:', user.passwordHash)
    console.log('   Is active:', user.isActive)
    
    // Test password verification
    console.log('2. Testing password verification...')
    const testPassword = 'admin123'
    const expectedHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
    
    console.log('   Test password:', testPassword)
    console.log('   Expected hash:', expectedHash)
    console.log('   Stored hash:  ', user.passwordHash)
    console.log('   Hashes match: ', user.passwordHash === expectedHash)
    
    // Test simple verification
    const simpleVerifyResult = passwordService.simpleVerify(testPassword, user.passwordHash)
    console.log('   Simple verify result:', simpleVerifyResult)
    
    // Test PBKDF2 verification
    const pbkdf2VerifyResult = await passwordService.verify(testPassword, user.passwordHash)
    console.log('   PBKDF2 verify result:', pbkdf2VerifyResult)
    
    // Test login
    console.log('3. Testing login...')
    const loginResult = await authService.login({ username: 'admin', password: 'admin123' })
    console.log('✅ Login successful:', loginResult.user)
    
  } catch (error) {
    console.log('❌ Login failed:', error.message)
  }
}

debugAuth().catch(console.error)