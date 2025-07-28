import { Database } from '../database/Database.js'
import { LabResultRepository } from '../../domain/repositories/LabResultRepository.js'
import { LabResult, LabResultEntity, CreateLabResultRequest, UpdateLabResultRequest, ValidationRequest, ValidationStatus, TestMethod, ResultInterpretation } from '../../domain/entities/LabResult.js'

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

  async save(labResult: CreateLabResultRequest): Promise<LabResultEntity> {
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
      id,
      labResult.sampleId,
      labResult.microorganismId,
      labResult.drugId,
      labResult.testMethod,
      labResult.rawResult.toString(),
      ResultInterpretation.NOT_TESTED, // Will be determined by validation
      ValidationStatus.PENDING,
      labResult.technician,
      labResult.testDate.toISOString(),
      labResult.instrumentId || null,
      false, // Will be set during validation
      labResult.comments || null,
      now.toISOString(),
      now.toISOString()
    ])

    const created = await this.findById(id)
    if (!created) {
      throw new Error('Failed to create lab result')
    }
    return created
  }

  async update(id: string, labResult: UpdateLabResultRequest): Promise<LabResultEntity | null> {
    const existing = await this.findById(id)
    if (!existing) {
      return null
    }

    const updates: string[] = []
    const values: any[] = []

    if (labResult.testMethod !== undefined) {
      updates.push('test_method = ?')
      values.push(labResult.testMethod)
    }
    if (labResult.rawResult !== undefined) {
      updates.push('raw_result = ?')
      values.push(labResult.rawResult.toString())
    }
    if (labResult.interpretation !== undefined) {
      updates.push('interpretation = ?')
      values.push(labResult.interpretation)
    }
    if (labResult.validationStatus !== undefined) {
      updates.push('validation_status = ?')
      values.push(labResult.validationStatus)
    }
    if (labResult.validationComments !== undefined) {
      updates.push('validation_comments = ?')
      values.push(labResult.validationComments)
    }
    if (labResult.reviewedBy !== undefined) {
      updates.push('reviewed_by = ?')
      values.push(labResult.reviewedBy)
    }
    if (labResult.reportDate !== undefined) {
      updates.push('report_date = ?')
      values.push(labResult.reportDate.toISOString())
    }
    if (labResult.qualityControlPassed !== undefined) {
      updates.push('quality_control_passed = ?')
      values.push(labResult.qualityControlPassed ? 1 : 0)
    }
    if (labResult.comments !== undefined) {
      updates.push('comments = ?')
      values.push(labResult.comments)
    }

    if (updates.length === 0) {
      return existing
    }

    updates.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    const query = `UPDATE lab_results SET ${updates.join(', ')} WHERE id = ?`
    await this.database.run(query, values)

    return await this.findById(id)
  }

  async validate(validation: ValidationRequest): Promise<LabResultEntity | null> {
    const updateData: UpdateLabResultRequest = {
      interpretation: validation.interpretation,
      validationStatus: ValidationStatus.VALIDATED,
      validationComments: validation.validationComments,
      reviewedBy: validation.reviewedBy,
      reportDate: new Date(),
      qualityControlPassed: true
    }

    return await this.update(validation.labResultId, updateData)
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM lab_results WHERE id = ?'
    const result = await this.database.run(query, [id])
    return result.changes > 0
  }

  async getStatistics(): Promise<{
    totalResults: number
    resultsByMethod: Record<string, number>
    resultsByInterpretation: Record<string, number>
    validationStats: Record<string, number>
    qualityControlStats: {
      passed: number
      failed: number
      percentage: number
    }
  }> {
    const totalQuery = 'SELECT COUNT(*) as count FROM lab_results'
    const totalResult = await this.database.get(totalQuery)
    
    const methodQuery = 'SELECT test_method, COUNT(*) as count FROM lab_results GROUP BY test_method'
    const methodResults = await this.database.all(methodQuery)
    
    const interpretationQuery = 'SELECT interpretation, COUNT(*) as count FROM lab_results GROUP BY interpretation'
    const interpretationResults = await this.database.all(interpretationQuery)
    
    const validationQuery = 'SELECT validation_status, COUNT(*) as count FROM lab_results GROUP BY validation_status'
    const validationResults = await this.database.all(validationQuery)
    
    const qcQuery = `
      SELECT 
        SUM(CASE WHEN quality_control_passed = 1 THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN quality_control_passed = 0 THEN 1 ELSE 0 END) as failed,
        COUNT(*) as total
      FROM lab_results
    `
    const qcResult = await this.database.get(qcQuery)

    const qcPassed = qcResult.passed || 0
    const qcFailed = qcResult.failed || 0
    const qcTotal = qcResult.total || 1

    return {
      totalResults: totalResult.count,
      resultsByMethod: methodResults.reduce((acc: any, row: any) => {
        acc[row.test_method] = row.count
        return acc
      }, {}),
      resultsByInterpretation: interpretationResults.reduce((acc: any, row: any) => {
        acc[row.interpretation] = row.count
        return acc
      }, {}),
      validationStats: validationResults.reduce((acc: any, row: any) => {
        acc[row.validation_status] = row.count
        return acc
      }, {}),
      qualityControlStats: {
        passed: qcPassed,
        failed: qcFailed,
        percentage: Math.round((qcPassed / qcTotal) * 100)
      }
    }
  }

  private mapRowToEntity(row: any): LabResultEntity {
    return {
      id: row.id,
      sampleId: row.sample_id,
      microorganismId: row.microorganism_id,
      drugId: row.drug_id,
      testMethod: row.test_method as TestMethod,
      rawResult: row.raw_result,
      interpretation: row.interpretation as ResultInterpretation,
      breakpointUsed: row.breakpoint_used,
      expertRuleApplied: row.expert_rule_applied ? JSON.parse(row.expert_rule_applied) : undefined,
      validationStatus: row.validation_status as ValidationStatus,
      validationComments: row.validation_comments,
      technician: row.technician,
      reviewedBy: row.reviewed_by,
      testDate: new Date(row.test_date),
      reportDate: row.report_date ? new Date(row.report_date) : undefined,
      instrumentId: row.instrument_id,
      qualityControlPassed: Boolean(row.quality_control_passed),
      comments: row.comments,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }
}