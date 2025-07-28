import { DrugEntity, DrugCategory } from '../../domain/entities/Drug.js'
import { DrugRepository } from '../../domain/repositories/DrugRepository.js'
import { Database } from '../database/Database.js'

export interface DrugSearchCriteria {
  name?: string
  code?: string
  category?: DrugCategory
  isActive?: boolean
  limit?: number
  offset?: number
}

export class SqliteDrugRepository implements DrugRepository {
  constructor(private db: Database) {}

  async save(drug: DrugEntity): Promise<void> {
    await this.db.run(
      `INSERT OR REPLACE INTO drugs 
       (id, name, code, category, description, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        drug.id,
        drug.name,
        drug.code,
        drug.category,
        drug.description,
        drug.isActive ? 1 : 0,
        drug.createdAt.toISOString(),
        drug.updatedAt.toISOString()
      ]
    )
  }

  async update(drug: DrugEntity): Promise<DrugEntity> {
    await this.db.run(
      `UPDATE drugs SET 
       name = ?, code = ?, category = ?, description = ?, 
       is_active = ?, updated_at = ?
       WHERE id = ?`,
      [
        drug.name,
        drug.code,
        drug.category,
        drug.description,
        drug.isActive ? 1 : 0,
        drug.updatedAt.toISOString(),
        drug.id
      ]
    )
    return drug
  }

  async findById(id: string): Promise<DrugEntity | null> {
    const row = await this.db.get<any>(
      'SELECT * FROM drugs WHERE id = ?',
      [id]
    )

    if (!row) return null

    return new DrugEntity(
      row.id,
      row.name,
      row.code,
      row.category as DrugCategory,
      row.description,
      Boolean(row.is_active),
      new Date(row.created_at),
      new Date(row.updated_at)
    )
  }

  async findByCode(code: string): Promise<DrugEntity | null> {
    const row = await this.db.get<any>(
      'SELECT * FROM drugs WHERE code = ?',
      [code]
    )

    if (!row) return null

    return new DrugEntity(
      row.id,
      row.name,
      row.code,
      row.category as DrugCategory,
      row.description,
      Boolean(row.is_active),
      new Date(row.created_at),
      new Date(row.updated_at)
    )
  }

  async findByName(name: string): Promise<DrugEntity | null> {
    const row = await this.db.get<any>(
      'SELECT * FROM drugs WHERE name = ?',
      [name]
    )

    if (!row) return null

    return new DrugEntity(
      row.id,
      row.name,
      row.code,
      row.category as DrugCategory,
      row.description,
      Boolean(row.is_active),
      new Date(row.created_at),
      new Date(row.updated_at)
    )
  }

  async findByCategory(category: DrugCategory): Promise<DrugEntity[]> {
    const rows = await this.db.all<any>(
      'SELECT * FROM drugs WHERE category = ? AND is_active = 1 ORDER BY name',
      [category]
    )

    return rows.map(row => new DrugEntity(
      row.id,
      row.name,
      row.code,
      row.category as DrugCategory,
      row.description,
      Boolean(row.is_active),
      new Date(row.created_at),
      new Date(row.updated_at)
    ))
  }

  async findAll(): Promise<DrugEntity[]> {
    const rows = await this.db.all<any>(
      'SELECT * FROM drugs WHERE is_active = 1 ORDER BY name'
    )

    return rows.map(row => new DrugEntity(
      row.id,
      row.name,
      row.code,
      row.category as DrugCategory,
      row.description,
      Boolean(row.is_active),
      new Date(row.created_at),
      new Date(row.updated_at)
    ))
  }

  async search(criteria: DrugSearchCriteria): Promise<DrugEntity[]> {
    let sql = 'SELECT * FROM drugs WHERE 1=1'
    const params: any[] = []

    if (criteria.name) {
      sql += ' AND name LIKE ?'
      params.push(`%${criteria.name}%`)
    }

    if (criteria.code) {
      sql += ' AND code LIKE ?'
      params.push(`%${criteria.code}%`)
    }

    if (criteria.category) {
      sql += ' AND category = ?'
      params.push(criteria.category)
    }

    if (criteria.isActive !== undefined) {
      sql += ' AND is_active = ?'
      params.push(criteria.isActive ? 1 : 0)
    }

    sql += ' ORDER BY name'

    if (criteria.limit) {
      sql += ' LIMIT ?'
      params.push(criteria.limit)
      
      if (criteria.offset) {
        sql += ' OFFSET ?'
        params.push(criteria.offset)
      }
    }

    const rows = await this.db.all<any>(sql, params)

    return rows.map(row => new DrugEntity(
      row.id,
      row.name,
      row.code,
      row.category as DrugCategory,
      row.description,
      Boolean(row.is_active),
      new Date(row.created_at),
      new Date(row.updated_at)
    ))
  }

  async delete(id: string): Promise<void> {
    await this.db.run('DELETE FROM drugs WHERE id = ?', [id])
  }

  async count(): Promise<number> {
    const result = await this.db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM drugs WHERE is_active = 1'
    )
    return result?.count || 0
  }
}