import { Database } from './infrastructure/database/Database.js'
import { SqliteUserRepository } from './infrastructure/repositories/SqliteUserRepository.js'
import { AuthService } from './application/services/AuthService.js'
import { JwtService } from './infrastructure/services/JwtService.js'
import { PasswordService } from './infrastructure/services/PasswordService.js'

async function testLogin() {
  console.log('🔐 Testing direct login...')
  
  const database = new Database()
  await database.initialize()
  
  const userRepository = new SqliteUserRepository(database)
  const jwtService = new JwtService()
  const passwordService = new PasswordService()
  const authService = new AuthService(userRepository, jwtService, passwordService)
  
  try {
    const result = await authService.login({
      username: 'admin',
      password: 'admin123'
    })
    
    console.log('✅ Login successful:', {
      userId: result.user.id,
      username: result.user.username,
      role: result.user.role,
      hasToken: !!result.token
    })
  } catch (error) {
    console.log('❌ Login failed:', error.message)
    
    // Check if user exists
    const user = await userRepository.findByUsername('admin')
    if (user) {
      console.log('User found:', {
        id: user.id,
        username: user.username,
        passwordHash: user.passwordHash,
        isActive: user.isActive
      })
      
      // Test password verification
      const isValid = passwordService.simpleVerify('admin123', user.passwordHash)
      console.log('Password verification:', isValid)
    } else {
      console.log('User not found!')
    }
  }
  
  await database.close()
}

testLogin().catch(console.error)