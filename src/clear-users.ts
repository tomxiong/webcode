import { Database } from './infrastructure/database/Database.js'

async function clearUsers() {
  console.log('🗑️ Clearing users table...')
  
  const database = new Database()
  await database.initialize()
  
  // Clear existing users
  await database.run('DELETE FROM users')
  console.log('✅ Users table cleared')
  
  // Re-seed users with correct hash
  const correctHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
  
  const users: string[][] = [
    ['admin-001', 'admin', 'admin@clsi-platform.com', correctHash, 'admin'],
    ['microbiologist-001', 'microbiologist', 'micro@clsi-platform.com', correctHash, 'microbiologist'],
    ['technician-001', 'technician', 'tech@clsi-platform.com', correctHash, 'lab_technician'],
    ['viewer-001', 'viewer', 'viewer@clsi-platform.com', correctHash, 'viewer']
  ]
  
  for (const [id, username, email, hash, role] of users) {
    await database.run(`
      INSERT INTO users (id, username, email, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `, [id, username, email, hash, role])
  }
  
  console.log('✅ Users re-seeded with correct password hashes')
  
  // Verify the admin user
  const admin = await database.get('SELECT * FROM users WHERE username = ?', ['admin']) as any
  console.log('Admin user:', {
    id: admin?.id,
    username: admin?.username,
    passwordHash: admin?.password_hash
  })
  
  await database.close()
}

clearUsers().catch(console.error)