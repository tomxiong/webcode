import { randomUUID } from 'node:crypto'

export interface Microorganism {
  id: string
  genus: string
  group?: string
  species: string
  commonName?: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class MicroorganismEntity {
  constructor(
    public readonly id: string,
    public readonly genus: string,
    public readonly species: string,
    public readonly group?: string,
    public readonly commonName?: string,
    public readonly description?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    genus: string,
    species: string,
    group?: string,
    commonName?: string,
    description?: string
  ): MicroorganismEntity {
    return new MicroorganismEntity(
      randomUUID(),
      genus,
      species,
      group,
      commonName,
      description
    )
  }

  getFullName(): string {
    return this.group 
      ? `${this.genus} ${this.group} ${this.species}`
      : `${this.genus} ${this.species}`
  }

  update(updates: Partial<Pick<Microorganism, 'genus' | 'species' | 'group' | 'commonName' | 'description'>>): MicroorganismEntity {
    return new MicroorganismEntity(
      this.id,
      updates.genus ?? this.genus,
      updates.species ?? this.species,
      updates.group ?? this.group,
      updates.commonName ?? this.commonName,
      updates.description ?? this.description,
      this.isActive,
      this.createdAt,
      new Date()
    )
  }
}