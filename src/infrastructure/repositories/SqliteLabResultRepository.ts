import { Database } from '../database/Database.js'
import { LabResultRepository, LabResultSearchCriteria } from '../../domain/repositories/LabResultRepository.js'
import { LabResultEntity, ValidationStatus, TestMethod, SensitivityResult } from '../../domain/entities/LabResult.js'

export class SqliteLabResultRepository implements LabResultRepository {
  constructor(private database: Database) {}

  async findAll(): Promise<LabResultEntity[]> {
    const query = `
      SELECT lr.*,
             s.patient_id, s.sample_type, s.specimen_source,
             m.genus as microorganism_genus, m.species as microorganism_species,
             d.name as drug_name, d.code as drug_code, d.category as drug_category
      FROM lab_results lr
      LEFT JOIN samples s ON lr.sample_id = s.id
      LEFT JOIN microorganisms m ON lr.microorganism_id = m.id
      LEFT JOIN drugs d ON lr.drug_id = d.id
      ORDER BY lr.created_at DESC
    `
    const rows = await this.database.all(query)
    return rows.map(row => this.mapRowToEntity(row))
  }

  async findById(id: string): Promise<LabResultEntity | null> {
    const query = `
      SELECT lr.*,
             s.patient_id, s.sample_type, s.specimen_source,
             m.genus as microorganism_genus, m.species as microorganism_species,
             d.name as drug_name, d.code as drug_code, d.category as drug_category
      FROM lab_results lr
      LEFT JOIN samples s ON lr.sample_id = s.id
      LEFT JOIN microorganisms m ON lr.microorganism_id = m.id
      LEFT JOIN drugs d ON lr.drug_id = d.id
      WHERE lr.id = ?
    `
    const row = await this.database.get(query, [id])
    return row ? this.mapRowToEntity(row) : null
  }

  async findBySampleId(sampleId: string): Promise<LabResultEntity[]> {
    const query = `
      SELECT lr.*,
             s.patient_id, s.sample_type, s.specimen_source,
             m.genus as microorganism_genus, m.species as microorganism_species,
             d.name as drug_name, d.code as drug_code, d.category as drug_category
      FROM lab_results lr
      LEFT JOIN samples s ON lr.sample_id = s.id
      LEFT JOIN microorganisms m ON lr.microorganism_id = m.id
      LEFT JOIN drugs d ON lr.drug_id = d.id
      WHERE lr.sample_id = ?
      ORDER BY lr.created_at DESC
    `
    const rows = await this.database.all(query, [sampleId])
    return rows.map(row => this.mapRowToEntity(row))
  }

  async findByMicroorganismId(microorganismId: string): Promise<LabResultEntity[]> {
    const query = `
      SELECT lr.*,
             s.patient_id, s.sample_type, s.specimen_source,
             m.genus as microorganism_genus, m.species as microorganism_species,
             d.name as drug_name, d.code as drug_code, d.category as drug_category
      FROM lab_results lr
      LEFT JOIN samples s ON lr.sample_id = s.id
      LEFT JOIN microorganisms m ON lr.microorganism_id = m.id
      LEFT JOIN drugs d ON lr.drug_id = d.id
      WHERE lr.microorganism_id = ?
      ORDER BY lr.created_at DESC
    `
    const rows = await this.database.all(query, [microorganismId])
    return rows.map(row => this.mapRowToEntity(row))
  }

  async findByValidationStatus(status: ValidationStatus): Promise<LabResultEntity[]> {
    const query = `
      SELECT lr.*,
             s.patient_id, s.sample_type, s.specimen_source,
             m.genus as microorganism_genus, m.species as microorganism_species,
             d.name as drug_name, d.code as drug_code, d.category as drug_category
      FROM lab_results lr
      LEFT JOIN samples s ON lr.sample_id = s.id
      LEFT JOIN microorganisms m ON lr.microorganism_id = m.id
      LEFT JOIN drugs d ON lr.drug_id = d.id
      WHERE lr.validation_status = ?
      ORDER BY lr.created_at DESC
    `
    const rows = await this.database.all(query, [status])
    return rows.map(row => this.mapRowToEntity(row))
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<LabResultEntity[]> {
    const query = `
      SELECT lr.*,
             s.patient_id, s.sample_type, s.specimen_source,
             m.genus as microorganism_genus, m.species as microorganism_species,
             d.name as drug_name, d.code as drug_code, d.category as drug_category
      FROM lab_results lr
      LEFT JOIN samples s ON lr.sample_id = s.id
      LEFT JOIN microorganisms m ON lr.microorganism_id = m.id
      LEFT JOIN drugs d ON lr.drug_id = d.id
      WHERE lr.test_date BETWEEN ? AND ?
      ORDER BY lr.created_at DESC
    `
    const rows = await this.database.all(query, [startDate.toISOString(), endDate.toISOString()])
    return rows.map(row => this.mapRowToEntity(row))
  }

  async save(labResult: LabResultEntity): Promise<LabResultEntity> {
    const id = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    
    const query = `
      INSERT INTO lab_results (
        id, sample_id, microorganism_id, drug_id, test_method,
        raw_result, interpretation, validation_status, technician,
        test_date, instrument_id, quality_control_passed, comments,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    await this.database.run(query, [
      labResult.id,
      labResult.sampleId,
      labResult.microorganismId,
      labResult.drugId,
      labResult.testMethod,
      labResult.rawResult,
      labResult.interpretation,
      labResult.validationStatus,
      labResult.technician,
      labResult.testDate.toISOString(),
      labResult.instrumentId,
      labResult.qualityControlPassed ? 1 : 0,
      labResult.comments,
      labResult.createdAt.toISOString(),
      labResult.updatedAt.toISOString()
    ])

    const created = await this.findById(id)
    if (!created) {
      throw new Error('Failed to create lab result')
    }
    return created
  }

  async findByDrugId(drugId: string): Promise<LabResultEntity[]> {
    const query = `
      SELECT lr.*,
             s.patient_id, s.sample_type, s.specimen_source,
             m.genus as microorganism_genus, m.species as microorganism_species,
             d.name as drug_name, d.code as drug_code, d.category as drug_category
      FROM lab_results lr
      LEFT JOIN samples s ON lr.sample_id = s.id
      LEFT JOIN microorganisms m ON lr.microorganism_id = m.id
      LEFT JOIN drugs d ON lr.drug_id = d.id
      WHERE lr.drug_id = ?
      ORDER BY lr.created_at DESC
    `
    const rows = await this.database.all(query, [drugId])
    return rows.map(row => this.mapRowToEntity(row))
  }

  async search(criteria: LabResultSearchCriteria): Promise<LabResultEntity[]> {
    let query = `
      SELECT lr.*,
             s.patient_id, s.sample_type, s.specimen_source,
             m.genus as microorganism_genus, m.species as microorganism_species,
             d.name as drug_name, d.code as drug_code, d.category as drug_category
      FROM lab_results lr
      LEFT JOIN samples s ON lr.sample_id = s.id
      LEFT JOIN microorganisms m ON lr.microorganism_id = m.id
      LEFT JOIN drugs d ON lr.drug_id = d.id
      WHERE 1=1
    `
    const params: any[] = []

    if (criteria.sampleId) {
      query += ' AND lr.sample_id = ?'
      params.push(criteria.sampleId)
    }
    if (criteria.microorganismId) {
      query += ' AND lr.microorganism_id = ?'
      params.push(criteria.microorganismId)
    }
    if (criteria.drugId) {
      query += ' AND lr.drug_id = ?'
      params.push(criteria.drugId)
    }
    if (criteria.testMethod) {
      query += ' AND lr.test_method = ?'
      params.push(criteria.testMethod)
    }
    if (criteria.interpretation) {
      query += ' AND lr.interpretation = ?'
      params.push(criteria.interpretation)
    }
    if (criteria.validationStatus) {
      query += ' AND lr.validation_status = ?'
      params.push(criteria.validationStatus)
    }
    if (criteria.technician) {
      query += ' AND lr.technician = ?'
      params.push(criteria.technician)
    }
    if (criteria.reviewedBy) {
      query += ' AND lr.reviewed_by = ?'
      params.push(criteria.reviewedBy)
    }
    if (criteria.startDate) {
      query += ' AND lr.test_date >= ?'
      params.push(criteria.startDate.toISOString())
    }
    if (criteria.endDate) {
      query += ' AND lr.test_date <= ?'
      params.push(criteria.endDate.toISOString())
    }
    if (criteria.qualityControlPassed !== undefined) {
      query += ' AND lr.quality_control_passed = ?'
      params.push(criteria.qualityControlPassed ? 1 : 0)
    }

    query += ' ORDER BY lr.created_at DESC'

    if (criteria.limit) {
      query += ' LIMIT ?'
      params.push(criteria.limit)
    }
    if (criteria.offset) {
      query += ' OFFSET ?'
      params.push(criteria.offset)
    }

    const rows = await this.database.all(query, params)
    return rows.map(row => this.mapRowToEntity(row))
  }

  async count(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM lab_results'
    const result = await this.database.get<{count: number}>(query)
    return result?.count || 0
  }

  async update(id: string, labResult: LabResultEntity): Promise<LabResultEntity> {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error('Lab result not found')
    }

    const query = `
      UPDATE lab_results SET 
        raw_result = ?,
        interpretation = ?,
        breakpoint_used = ?,
        expert_rule_applied = ?,
        validation_status = ?,
        validation_comments = ?,
        reviewed_by = ?,
        report_date = ?,
        quality_control_passed = ?,
        comments = ?,
        updated_at = ?
      WHERE id = ?
    `
    
    await this.database.run(query, [
      labResult.rawResult,
      labResult.interpretation,
      labResult.breakpointUsed,
      labResult.expertRuleApplied,
      labResult.validationStatus,
      labResult.validationComments,
      labResult.reviewedBy,
      labResult.reportDate ? labResult.reportDate.toISOString() : null,
      labResult.qualityControlPassed ? 1 : 0,
      labResult.comments,
      labResult.updatedAt.toISOString(),
      id
    ])

    const updated = await this.findById(id)
    if (!updated) {
      throw new Error('Failed to update lab result')
    }
    return updated
  }


  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM lab_results WHERE id = ?'
    const result = await this.database.run(query, [id])
    return result.changes > 0
  }


  private mapRowToEntity(row: any): LabResultEntity {
    return new LabResultEntity(
      row.id,
      row.sample_id,
      row.microorganism_id,
      row.drug_id,
      row.test_method as TestMethod,
      row.raw_result,
      row.interpretation as SensitivityResult,
      row.breakpoint_used,
      row.expert_rule_applied || '[]',
      row.validation_status as ValidationStatus,
      row.validation_comments,
      row.technician,
      row.reviewed_by,
      new Date(row.test_date),
      row.report_date ? new Date(row.report_date) : null,
      row.instrument_id,
      Boolean(row.quality_control_passed),
      row.comments,
      new Date(row.created_at),
      new Date(row.updated_at)
    )
  }
}