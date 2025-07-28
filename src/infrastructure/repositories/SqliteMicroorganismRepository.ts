import { MicroorganismEntity } from '../../domain/entities/Microorganism.js'
import { MicroorganismRepository } from '../../domain/repositories/MicroorganismRepository.js'
import { Database } from '../database/Database.js'

export interface MicroorganismSearchCriteria {
  genus?: string
  groupName?: string
  species?: string
  commonName?: string
  isActive?: boolean
  limit?: number
  offset?: number
}

export class SqliteMicroorganismRepository implements MicroorganismRepository {
  constructor(private db: Database) {}

  async save(microorganism: MicroorganismEntity): Promise<void> {
    await this.db.run(
      `INSERT OR REPLACE INTO microorganisms 
       (id, genus, group_name, species, common_name, description, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        microorganism.id,
        microorganism.genus,
        microorganism.groupName,
        microorganism.species,
        microorganism.commonName,
        microorganism.description,
        microorganism.isActive ? 1 : 0,
        microorganism.createdAt.toISOString(),
        microorganism.updatedAt.toISOString()
      ]
    )
  }

  async update(microorganism: MicroorganismEntity): Promise<MicroorganismEntity> {
    await this.db.run(
      `UPDATE microorganisms SET 
       genus = ?, group_name = ?, species = ?, common_name = ?, 
       description = ?, is_active = ?, updated_at = ?
       WHERE id = ?`,
      [
        microorganism.genus,
        microorganism.groupName,
        microorganism.species,
        microorganism.commonName,
        microorganism.description,
        microorganism.isActive ? 1 : 0,
        microorganism.updatedAt.toISOString(),
        microorganism.id
      ]
    )
    return microorganism
  }

  async findById(id: string): Promise<MicroorganismEntity | null> {
    const row = await this.db.get<any>(
      'SELECT * FROM microorganisms WHERE id = ?',
      [id]
    )

    if (!row) return null

    return new MicroorganismEntity(
      row.id,
      row.genus,
      row.group_name,
      row.species,
      row.common_name,
      row.description,
      Boolean(row.is_active),
      new Date(row.created_at),
      new Date(row.updated_at)
    )
  }

  async findByGenusAndSpecies(genus: string, species: string): Promise<MicroorganismEntity | null> {
    const row = await this.db.get<any>(
      'SELECT * FROM microorganisms WHERE genus = ? AND species = ?',
      [genus, species]
    )

    if (!row) return null

    return new MicroorganismEntity(
      row.id,
      row.genus,
      row.group_name,
      row.species,
      row.common_name,
      row.description,
      Boolean(row.is_active),
      new Date(row.created_at),
      new Date(row.updated_at)
    )
  }

  async findByGenus(genus: string): Promise<MicroorganismEntity[]> {
    const rows = await this.db.all<any>(
      'SELECT * FROM microorganisms WHERE genus = ? AND is_active = 1 ORDER BY species',
      [genus]
    )

    return rows.map(row => new MicroorganismEntity(
      row.id,
      row.genus,
      row.group_name,
      row.species,
      row.common_name,
      row.description,
      Boolean(row.is_active),
      new Date(row.created_at),
      new Date(row.updated_at)
    ))
  }

  async findAll(): Promise<MicroorganismEntity[]> {
    const rows = await this.db.all<any>(
      'SELECT * FROM microorganisms WHERE is_active = 1 ORDER BY genus, species'
    )

    return rows.map(row => new MicroorganismEntity(
      row.id,
      row.genus,
      row.group_name,
      row.species,
      row.common_name,
      row.description,
      Boolean(row.is_active),
      new Date(row.created_at),
      new Date(row.updated_at)
    ))
  }

  async search(criteria: MicroorganismSearchCriteria): Promise<MicroorganismEntity[]> {
    let sql = 'SELECT * FROM microorganisms WHERE 1=1'
    const params: any[] = []

    if (criteria.genus) {
      sql += ' AND genus LIKE ?'
      params.push(`%${criteria.genus}%`)
    }

    if (criteria.groupName) {
      sql += ' AND group_name LIKE ?'
      params.push(`%${criteria.groupName}%`)
    }

    if (criteria.species) {
      sql += ' AND species LIKE ?'
      params.push(`%${criteria.species}%`)
    }

    if (criteria.commonName) {
      sql += ' AND common_name LIKE ?'
      params.push(`%${criteria.commonName}%`)
    }

    if (criteria.isActive !== undefined) {
      sql += ' AND is_active = ?'
      params.push(criteria.isActive ? 1 : 0)
    }

    sql += ' ORDER BY genus, species'

    if (criteria.limit) {
      sql += ' LIMIT ?'
      params.push(criteria.limit)
      
      if (criteria.offset) {
        sql += ' OFFSET ?'
        params.push(criteria.offset)
      }
    }

    const rows = await this.db.all<any>(sql, params)

    return rows.map(row => new MicroorganismEntity(
      row.id,
      row.genus,
      row.group_name,
      row.species,
      row.common_name,
      row.description,
      Boolean(row.is_active),
      new Date(row.created_at),
      new Date(row.updated_at)
    ))
  }

  async getDistinctGenera(): Promise<string[]> {
    const rows = await this.db.all<{ genus: string }>(
      'SELECT DISTINCT genus FROM microorganisms WHERE is_active = 1 ORDER BY genus'
    )
    return rows.map(row => row.genus)
  }

  async getSpeciesByGenus(genus: string): Promise<string[]> {
    const rows = await this.db.all<{ species: string }>(
      'SELECT DISTINCT species FROM microorganisms WHERE genus = ? AND is_active = 1 ORDER BY species',
      [genus]
    )
    return rows.map(row => row.species)
  }

  async delete(id: string): Promise<void> {
    await this.db.run('DELETE FROM microorganisms WHERE id = ?', [id])
  }

  async count(): Promise<number> {
    const result = await this.db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM microorganisms WHERE is_active = 1'
    )
    return result?.count || 0
  }
}