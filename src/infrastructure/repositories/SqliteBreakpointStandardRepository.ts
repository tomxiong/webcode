import { Database } from '../database/Database.js'
import { BreakpointStandardRepository } from '../../domain/repositories/BreakpointStandardRepository.js'
import { BreakpointStandardEntity, TestMethod } from '../../domain/entities/BreakpointStandard.js'

export class SqliteBreakpointStandardRepository implements BreakpointStandardRepository {
  constructor(private database: Database) {}

  async findById(id: string): Promise<BreakpointStandardEntity | null> {
    const row = await this.database.get(`
      SELECT * FROM breakpoint_standards WHERE id = ?
    `, [id])

    return row ? this.mapRowToEntity(row) : null
  }

  async findByMicroorganismAndDrug(
    microorganismId: string, 
    drugId: string, 
    year?: number
  ): Promise<BreakpointStandardEntity[]> {
    let query = `
      SELECT * FROM breakpoint_standards 
      WHERE microorganism_id = ? AND drug_id = ? AND is_active = 1
    `
    const params: any[] = [microorganismId, drugId]

    if (year) {
      query += ' AND year = ?'
      params.push(year)
    }

    query += ' ORDER BY year DESC, method ASC'

    const rows = await this.database.all(query, params)
    return rows.map(row => this.mapRowToEntity(row))
  }

  async findByYear(year: number): Promise<BreakpointStandardEntity[]> {
    const rows = await this.database.all(`
      SELECT * FROM breakpoint_standards 
      WHERE year = ? AND is_active = 1
      ORDER BY microorganism_id, drug_id, method
    `, [year])

    return rows.map(row => this.mapRowToEntity(row))
  }

  async findLatestByMicroorganismAndDrug(
    microorganismId: string, 
    drugId: string
  ): Promise<BreakpointStandardEntity | null> {
    const row = await this.database.get(`
      SELECT * FROM breakpoint_standards 
      WHERE microorganism_id = ? AND drug_id = ? AND is_active = 1
      ORDER BY year DESC, updated_at DESC
      LIMIT 1
    `, [microorganismId, drugId])

    return row ? this.mapRowToEntity(row) : null
  }

  async save(standard: BreakpointStandardEntity): Promise<BreakpointStandardEntity> {
    await this.database.run(`
      INSERT INTO breakpoint_standards (
        id, microorganism_id, drug_id, year, method,
        susceptible_min, susceptible_max, intermediate_min, intermediate_max,
        resistant_min, resistant_max, notes, source_document,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      standard.id,
      standard.microorganismId,
      standard.drugId,
      standard.year,
      standard.method,
      standard.susceptibleMin,
      standard.susceptibleMax,
      standard.intermediateMin,
      standard.intermediateMax,
      standard.resistantMin,
      standard.resistantMax,
      standard.notes,
      standard.sourceDocument,
      standard.isActive ? 1 : 0,
      standard.createdAt.toISOString(),
      standard.updatedAt.toISOString()
    ])

    return standard
  }

  async update(standard: BreakpointStandardEntity): Promise<BreakpointStandardEntity> {
    const updatedStandard = new BreakpointStandardEntity(
      standard.id,
      standard.microorganismId,
      standard.drugId,
      standard.year,
      standard.method,
      standard.susceptibleMin,
      standard.susceptibleMax,
      standard.intermediateMin,
      standard.intermediateMax,
      standard.resistantMin,
      standard.resistantMax,
      standard.notes,
      standard.sourceDocument,
      standard.isActive,
      standard.createdAt,
      new Date()
    )

    await this.database.run(`
      UPDATE breakpoint_standards SET
        microorganism_id = ?, drug_id = ?, year = ?, method = ?,
        susceptible_min = ?, susceptible_max = ?, intermediate_min = ?, intermediate_max = ?,
        resistant_min = ?, resistant_max = ?, notes = ?, source_document = ?,
        is_active = ?, updated_at = ?
      WHERE id = ?
    `, [
      updatedStandard.microorganismId,
      updatedStandard.drugId,
      updatedStandard.year,
      updatedStandard.method,
      updatedStandard.susceptibleMin,
      updatedStandard.susceptibleMax,
      updatedStandard.intermediateMin,
      updatedStandard.intermediateMax,
      updatedStandard.resistantMin,
      updatedStandard.resistantMax,
      updatedStandard.notes,
      updatedStandard.sourceDocument,
      updatedStandard.isActive ? 1 : 0,
      updatedStandard.updatedAt.toISOString(),
      updatedStandard.id
    ])

    return updatedStandard
  }

  async delete(id: string): Promise<void> {
    await this.database.run('UPDATE breakpoint_standards SET is_active = 0 WHERE id = ?', [id])
  }

  async findAll(): Promise<BreakpointStandardEntity[]> {
    const rows = await this.database.all(`
      SELECT * FROM breakpoint_standards 
      WHERE is_active = 1
      ORDER BY year DESC, microorganism_id, drug_id, method
    `)

    return rows.map(row => this.mapRowToEntity(row))
  }

  async findByMethod(method: TestMethod): Promise<BreakpointStandardEntity[]> {
    const rows = await this.database.all(`
      SELECT * FROM breakpoint_standards 
      WHERE method = ? AND is_active = 1
      ORDER BY year DESC, microorganism_id, drug_id
    `, [method])

    return rows.map(row => this.mapRowToEntity(row))
  }

  async findHistoricalVersions(
    microorganismId: string, 
    drugId: string
  ): Promise<BreakpointStandardEntity[]> {
    const rows = await this.database.all(`
      SELECT * FROM breakpoint_standards 
      WHERE microorganism_id = ? AND drug_id = ?
      ORDER BY year DESC, method ASC, updated_at DESC
    `, [microorganismId, drugId])

    return rows.map(row => this.mapRowToEntity(row))
  }

  private mapRowToEntity(row: any): BreakpointStandardEntity {
    return new BreakpointStandardEntity(
      row.id,
      row.microorganism_id,
      row.drug_id,
      row.year,
      row.method as TestMethod,
      row.susceptible_min,
      row.susceptible_max,
      row.intermediate_min,
      row.intermediate_max,
      row.resistant_min,
      row.resistant_max,
      row.notes,
      row.source_document,
      Boolean(row.is_active),
      new Date(row.created_at),
      new Date(row.updated_at)
    )
  }
}