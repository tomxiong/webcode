import { UserEntity, UserRole } from '../entities/User.js'

export interface UserRepository {
  findById(id: string): Promise<UserEntity | null>
  findByUsername(username: string): Promise<UserEntity | null>
  findByEmail(email: string): Promise<UserEntity | null>
  save(user: UserEntity): Promise<void>
  update(user: UserEntity): Promise<UserEntity>
  delete(id: string): Promise<void>
  findAll(): Promise<UserEntity[]>
  findByRole(role: UserRole): Promise<UserEntity[]>
  count(): Promise<number>
}
