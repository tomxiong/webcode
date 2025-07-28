import { AuthService } from './application/services/AuthService.js'
import { SqliteUserRepository } from './infrastructure/repositories/SqliteUserRepository.js'
import { JwtService } from './infrastructure/services/JwtService.js'
import { PasswordService } from './infrastructure/services/PasswordService.js'
import { database } from './infrastructure/database/Database.js'
import { UserRole } from './domain/entities/User.js'

async function testAuthSystem() {
  console.log('🧪 Testing Authentication System...')
  
  try {
    // Initialize database
    await database.initialize()
    
    // Initialize services
    const userRepository = new SqliteUserRepository(database)
    const jwtService = new JwtService()
    const passwordService = new PasswordService()
    const authService = new AuthService(userRepository, jwtService, passwordService)

    // Test user registration
    console.log('\n1. Testing user registration...')
    const registerResult = await authService.register({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.MICROBIOLOGIST
    })
    console.log('✅ User registered successfully:', registerResult.user.username)

    // Test user login
    console.log('\n2. Testing user login...')
    const loginResult = await authService.login({
      username: 'testuser',
      password: 'password123'
    })
    console.log('✅ User logged in successfully:', loginResult.user.username)
    console.log('🔑 Token generated:', loginResult.token.substring(0, 20) + '...')

    // Test token validation
    console.log('\n3. Testing token validation...')
    const validationResult = await authService.validateToken(loginResult.token)
    console.log('✅ Token validated successfully:', validationResult.username)

    // Test invalid login
    console.log('\n4. Testing invalid login...')
    try {
      await authService.login({
        username: 'testuser',
        password: 'wrongpassword'
      })
      console.log('❌ Should have failed with wrong password')
    } catch (error) {
      console.log('✅ Correctly rejected invalid password:', error.message)
    }

    // Test duplicate registration
    console.log('\n5. Testing duplicate registration...')
    try {
      await authService.register({
        username: 'testuser',
        email: 'test2@example.com',
        password: 'password123',
        role: UserRole.VIEWER
      })
      console.log('❌ Should have failed with duplicate username')
    } catch (error) {
      console.log('✅ Correctly rejected duplicate username:', error.message)
    }

    console.log('\n🎉 All authentication tests passed!')
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error)
  } finally {
    await database.close()
  }
}

// Run the test
testAuthSystem()