import { randomUUID } from 'node:crypto'

export interface User {
  id: string
  username: string
  email: string
  passwordHash: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export enum UserRole {
  ADMIN = 'admin',
  MICROBIOLOGIST = 'microbiologist',
  LAB_TECHNICIAN = 'lab_technician',
  VIEWER = 'viewer'
}

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly role: UserRole,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    username: string,
    email: string,
    passwordHash: string,
    role: UserRole
  ): UserEntity {
    return new UserEntity(
      randomUUID(),
      username,
      email,
      passwordHash,
      role
    )
  }

  updateRole(newRole: UserRole): UserEntity {
    return new UserEntity(
      this.id,
      this.username,
      this.email,
      this.passwordHash,
      newRole,
      this.isActive,
      this.createdAt,
      new Date()
    )
  }

  deactivate(): UserEntity {
    return new UserEntity(
      this.id,
      this.username,
      this.email,
      this.passwordHash,
      this.role,
      false,
      this.createdAt,
      new Date()
    )
  }
}