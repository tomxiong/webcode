import { Database } from '../database/Database.js'
import { ExpertRuleRepository } from '../../domain/repositories/ExpertRuleRepository.js'
import { ExpertRuleEntity, ExpertRuleType } from '../../domain/entities/ExpertRule.js'

export class SqliteExpertRuleRepository implements ExpertRuleRepository {
  constructor(private database: Database) {}

  async findById(id: string): Promise<ExpertRuleEntity | null> {
    const row = await this.database.get(`
      SELECT * FROM expert_rules WHERE id = ?
    `, [id])

    return row ? this.mapRowToEntity(row) : null
  }

  async findByMicroorganismAndDrug(
    microorganismId: string,
    drugId: string,
    year?: number
  ): Promise<ExpertRuleEntity[]> {
    let query = `
      SELECT * FROM expert_rules 
      WHERE microorganism_id = ? AND drug_id = ? AND is_active = 1
    `
    const params: any[] = [microorganismId, drugId]
    
    if (year) {
      query += ` AND year = ?`
      params.push(year.toString())
    }
    
    query += ` ORDER BY priority DESC, created_at DESC`
    
    const rows = await this.database.all(query, params)
    return rows.map(row => this.mapRowToEntity(row))
  }

  async findByMicroorganism(microorganismId: string): Promise<ExpertRuleEntity[]> {
    const rows = await this.database.all(`
      SELECT * FROM expert_rules 
      WHERE microorganism_id = ? AND drug_id IS NULL AND is_active = 1
      ORDER BY priority DESC, created_at DESC
    `, [microorganismId])

    return rows.map(row => this.mapRowToEntity(row))
  }

  async findByDrug(drugId: string): Promise<ExpertRuleEntity[]> {
    const rows = await this.database.all(`
      SELECT * FROM expert_rules 
      WHERE drug_id = ? AND microorganism_id IS NULL AND is_active = 1
      ORDER BY priority DESC, created_at DESC
    `, [drugId])

    return rows.map(row => this.mapRowToEntity(row))
  }

  async findByType(ruleType: ExpertRuleType, year?: number): Promise<ExpertRuleEntity[]> {
    let query = `
      SELECT * FROM expert_rules 
      WHERE rule_type = ? AND is_active = 1
    `
    const params: any[] = [ruleType]
    
    if (year) {
      query += ` AND year = ?`
      params.push(year.toString())
    }
    
    query += ` ORDER BY priority DESC, created_at DESC`
    
    const rows = await this.database.all(query, params)
    return rows.map(row => this.mapRowToEntity(row))
  }

  async findByYear(year: number): Promise<ExpertRuleEntity[]> {
    const rows = await this.database.all(`
      SELECT * FROM expert_rules 
      WHERE year = ? AND is_active = 1
      ORDER BY priority DESC, rule_type, created_at DESC
    `, [year.toString()])

    return rows.map(row => this.mapRowToEntity(row))
  }

  async save(rule: ExpertRuleEntity): Promise<ExpertRuleEntity> {
    await this.database.run(`
      INSERT INTO expert_rules (
        id, name, description, rule_type, microorganism_id, drug_id,
        condition_expr, action_expr, priority, year, source_reference,
        notes, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      rule.id,
      rule.name,
      rule.description,
      rule.ruleType,
      rule.microorganismId,
      rule.drugId,
      rule.condition,
      rule.action,
      (rule.priority || 0).toString(),
      (rule.year || new Date().getFullYear()).toString(),
      rule.sourceReference,
      rule.notes,
      rule.isActive ? 1 : 0,
      rule.createdAt.toISOString(),
      rule.updatedAt.toISOString()
    ])

    return rule
  }

  async update(rule: ExpertRuleEntity): Promise<ExpertRuleEntity> {
    const updatedRule = new ExpertRuleEntity(
      rule.id,
      rule.name,
      rule.description,
      rule.ruleType,
      rule.condition,
      rule.action,
      rule.priority,
      rule.year,
      rule.microorganismId,
      rule.drugId,
      rule.sourceReference,
      rule.notes,
      rule.isActive,
      rule.createdAt,
      new Date()
    )

    await this.database.run(`
      UPDATE expert_rules SET
        name = ?, description = ?, rule_type = ?, microorganism_id = ?, drug_id = ?,
        condition_expr = ?, action_expr = ?, priority = ?, year = ?, source_reference = ?,
        notes = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `, [
      updatedRule.name,
      updatedRule.description,
      updatedRule.ruleType,
      updatedRule.microorganismId,
      updatedRule.drugId,
      updatedRule.condition,
      updatedRule.action,
      (updatedRule.priority || 0).toString(),
      (updatedRule.year || new Date().getFullYear()).toString(),
      updatedRule.sourceReference,
      updatedRule.notes,
      updatedRule.isActive ? 1 : 0,
      updatedRule.updatedAt.toISOString(),
      updatedRule.id
    ])

    return updatedRule
  }

  async delete(id: string): Promise<void> {
    await this.database.run('UPDATE expert_rules SET is_active = 0 WHERE id = ?', [id])
  }

  async findAll(): Promise<ExpertRuleEntity[]> {
    const rows = await this.database.all(`
      SELECT * FROM expert_rules 
      WHERE is_active = 1
      ORDER BY priority DESC, rule_type, year DESC, created_at DESC
    `)

    return rows.map(row => this.mapRowToEntity(row))
  }

  private mapRowToEntity(row: any): ExpertRuleEntity {
    return new ExpertRuleEntity(
      row.id,
      row.name,
      row.description,
      row.rule_type as ExpertRuleType,
      row.condition_expr,
      row.action_expr,
      parseInt(row.priority),
      parseInt(row.year),
      row.microorganism_id,
      row.drug_id,
      row.source_reference,
      row.notes,
      Boolean(row.is_active),
      new Date(row.created_at),
      new Date(row.updated_at)
    )
  }
}