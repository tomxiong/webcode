export interface Drug {
  id: string
  name: string
  code: string
  category: DrugCategory
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export enum DrugCategory {
  ANTIBIOTIC = 'antibiotic',
  ANTIFUNGAL = 'antifungal',
  ANTIVIRAL = 'antiviral',
  ANTIMYCOBACTERIAL = 'antimycobacterial'
}

export class DrugEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly code: string,
    public readonly category: DrugCategory,
    public readonly description?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    name: string,
    code: string,
    category: DrugCategory,
    description?: string
  ): DrugEntity {
    return new DrugEntity(
      `drug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      code,
      category,
      description
    )
  }

  update(updates: Partial<Pick<Drug, 'name' | 'code' | 'category' | 'description'>>): DrugEntity {
    return new DrugEntity(
      this.id,
      updates.name ?? this.name,
      updates.code ?? this.code,
      updates.category ?? this.category,
      updates.description ?? this.description,
      this.isActive,
      this.createdAt,
      new Date()
    )
  }
}