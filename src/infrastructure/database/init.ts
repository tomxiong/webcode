import { database } from './Database.js'
import { DatabaseSeeder } from './Seeder.js'

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database...')
    await database.initialize()
    console.log('Database tables created successfully')

    console.log('Seeding initial data...')
    const seeder = new DatabaseSeeder()
    await seeder.seed()
    console.log('Database seeded successfully')

    console.log('Database initialization completed')
  } catch (error) {
    console.error('Database initialization failed:', error)
    throw error
  }
}

export { database }