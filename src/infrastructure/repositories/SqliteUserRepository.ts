import { UserEntity, UserRole } from '../../domain/entities/User.js'
import { UserRepository } from '../../domain/repositories/UserRepository.js'
import { Database } from '../database/Database.js'

export class SqliteUserRepository implements UserRepository {
  constructor(private db: Database) {}

  async save(user: UserEntity): Promise<void> {
    await this.db.run(
      `INSERT OR REPLACE INTO users 
       (id, username, email, password_hash, role, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.username,
        user.email,
        user.passwordHash,
        user.role,
        user.isActive ? 1 : 0,
        user.createdAt.toISOString(),
        user.updatedAt.toISOString()
      ]
    )
  }

  async update(user: UserEntity): Promise<UserEntity> {
    await this.db.run(
      `UPDATE users SET 
       username = ?, email = ?, password_hash = ?, role = ?, 
       is_active = ?, updated_at = ?
       WHERE id = ?`,
      [
        user.username,
        user.email,
        user.passwordHash,
        user.role,
        user.isActive ? 1 : 0,
        user.updatedAt.toISOString(),
        user.id
      ]
    )
    return user
  }

  async findById(id: string): Promise<UserEntity | null> {
    const row = await this.db.get<any>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    )

    if (!row) return null

    return new UserEntity(
      row.id,
      row.username,
      row.email,
      row.password_hash,
      row.role as UserRole,
      Boolean(row.is_active),
      new Date(row.created_at),
      new Date(row.updated_at)
    )
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const row = await this.db.get<any>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    )

    if (!row) return null

    return new UserEntity(
      row.id,
      row.username,
      row.email,
      row.password_hash,
      row.role as UserRole,
      Boolean(row.is_active),
      new Date(row.created_at),
      new Date(row.updated_at)
    )
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const row = await this.db.get<any>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )

    if (!row) return null

    return new UserEntity(
      row.id,
      row.username,
      row.email,
      row.password_hash,
      row.role as UserRole,
      Boolean(row.is_active),
      new Date(row.created_at),
      new Date(row.updated_at)
    )
  }

  async findAll(): Promise<UserEntity[]> {
    const rows = await this.db.all<any>(
      'SELECT * FROM users ORDER BY created_at DESC'
    )

    return rows.map(row => new UserEntity(
      row.id,
      row.username,
      row.email,
      row.password_hash,
      row.role as UserRole,
      Boolean(row.is_active),
      new Date(row.created_at),
      new Date(row.updated_at)
    ))
  }

  async findByRole(role: UserRole): Promise<UserEntity[]> {
    const rows = await this.db.all<any>(
      'SELECT * FROM users WHERE role = ? ORDER BY created_at DESC',
      [role]
    )

    return rows.map(row => new UserEntity(
      row.id,
      row.username,
      row.email,
      row.password_hash,
      row.role as UserRole,
      Boolean(row.is_active),
      new Date(row.created_at),
      new Date(row.updated_at)
    ))
  }

  async delete(id: string): Promise<void> {
    await this.db.run('DELETE FROM users WHERE id = ?', [id])
  }

  async count(): Promise<number> {
    const result = await this.db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM users'
    )
    return result?.count || 0
  }
}