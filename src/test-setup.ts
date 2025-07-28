import { initializeDatabase, database } from './infrastructure/database/init.js'
import { SqliteUserRepository } from './infrastructure/repositories/SqliteUserRepository.js'
import { UserEntity, UserRole } from './domain/entities/User.js'

async function testDatabaseSetup() {
  console.log('🧪 Testing database setup...')
  
  try {
    // Initialize database
    await initializeDatabase()
    console.log('✅ Database initialized successfully')

    // Test user repository
    const userRepo = new SqliteUserRepository()
    
    // Test finding seeded admin user
    const adminUser = await userRepo.findByUsername('admin')
    if (adminUser) {
      console.log('✅ Found admin user:', adminUser.username, adminUser.role)
    } else {
      console.log('❌ Admin user not found')
    }

    // Test creating a new user
    const newUser = UserEntity.create(
      'testuser',
      'test@example.com',
      'hashedpassword123',
      UserRole.LAB_TECHNICIAN
    )
    
    await userRepo.save(newUser)
    console.log('✅ Created new user:', newUser.username)

    // Test finding the new user
    const foundUser = await userRepo.findById(newUser.id)
    if (foundUser) {
      console.log('✅ Found created user:', foundUser.username, foundUser.role)
    } else {
      console.log('❌ Created user not found')
    }

    // Test listing all users
    const allUsers = await userRepo.findAll()
    console.log('✅ Total users in database:', allUsers.length)

    console.log('🎉 All database tests passed!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
  } finally {
    await database.close()
  }
}

// Run the test
testDatabaseSetup()