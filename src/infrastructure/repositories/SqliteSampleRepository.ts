import { Database } from '../database/Database.js'
import { SampleRepository } from '../../domain/repositories/SampleRepository.js'
import { Sample, SampleEntity, CreateSampleRequest, UpdateSampleRequest, SampleStatus, SampleType } from '../../domain/entities/Sample.js'

export class SqliteSampleRepository implements SampleRepository {
  constructor(private database: Database) {}

  async findAll(): Promise<SampleEntity[]> {
    const query = `
      SELECT s.*, 
             COUNT(lr.id) as result_count
      FROM samples s
      LEFT JOIN lab_results lr ON s.id = lr.sample_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `
    const rows = await this.database.all(query)
    return rows.map(row => this.mapRowToEntity(row))
  }

  async findById(id: string): Promise<SampleEntity | null> {
    const query = `
      SELECT s.*,
             COUNT(lr.id) as result_count
      FROM samples s
      LEFT JOIN lab_results lr ON s.id = lr.sample_id
      WHERE s.id = ?
      GROUP BY s.id
    `
    const row = await this.database.get(query, [id])
    return row ? this.mapRowToEntity(row) : null
  }

  async findByPatientId(patientId: string): Promise<SampleEntity[]> {
    const query = `
      SELECT s.*,
             COUNT(lr.id) as result_count
      FROM samples s
      LEFT JOIN lab_results lr ON s.id = lr.sample_id
      WHERE s.patient_id = ?
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `
    const rows = await this.database.all(query, [patientId])
    return rows.map(row => this.mapRowToEntity(row))
  }

  async findByStatus(status: SampleStatus): Promise<SampleEntity[]> {
    const query = `
      SELECT s.*,
             COUNT(lr.id) as result_count
      FROM samples s
      LEFT JOIN lab_results lr ON s.id = lr.sample_id
      WHERE s.status = ?
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `
    const rows = await this.database.all(query, [status])
    return rows.map(row => this.mapRowToEntity(row))
  }

  async findByType(sampleType: SampleType): Promise<SampleEntity[]> {
    const query = `
      SELECT s.*,
             COUNT(lr.id) as result_count
      FROM samples s
      LEFT JOIN lab_results lr ON s.id = lr.sample_id
      WHERE s.sample_type = ?
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `
    const rows = await this.database.all(query, [sampleType])
    return rows.map(row => this.mapRowToEntity(row))
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<SampleEntity[]> {
    const query = `
      SELECT s.*,
             COUNT(lr.id) as result_count
      FROM samples s
      LEFT JOIN lab_results lr ON s.id = lr.sample_id
      WHERE s.collection_date BETWEEN ? AND ?
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `
    const rows = await this.database.all(query, [startDate.toISOString(), endDate.toISOString()])
    return rows.map(row => this.mapRowToEntity(row))
  }

  async save(sample: CreateSampleRequest): Promise<SampleEntity> {
    const id = `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    
    const query = `
      INSERT INTO samples (
        id, patient_id, sample_type, collection_date, received_date,
        specimen_source, clinical_info, requesting_physician, priority,
        status, barcode_id, comments, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    await this.database.run(query, [
      id,
      sample.patientId,
      sample.sampleType,
      sample.collectionDate.toISOString(),
      now.toISOString(),
      sample.specimenSource,
      sample.clinicalInfo || null,
      sample.requestingPhysician || null,
      sample.priority,
      SampleStatus.RECEIVED,
      sample.barcodeId || null,
      sample.comments || null,
      now.toISOString(),
      now.toISOString()
    ])

    const created = await this.findById(id)
    if (!created) {
      throw new Error('Failed to create sample')
    }
    return created
  }

  async update(id: string, sample: UpdateSampleRequest): Promise<SampleEntity | null> {
    const existing = await this.findById(id)
    if (!existing) {
      return null
    }

    const updates: string[] = []
    const values: any[] = []

    if (sample.sampleType !== undefined) {
      updates.push('sample_type = ?')
      values.push(sample.sampleType)
    }
    if (sample.specimenSource !== undefined) {
      updates.push('specimen_source = ?')
      values.push(sample.specimenSource)
    }
    if (sample.clinicalInfo !== undefined) {
      updates.push('clinical_info = ?')
      values.push(sample.clinicalInfo)
    }
    if (sample.requestingPhysician !== undefined) {
      updates.push('requesting_physician = ?')
      values.push(sample.requestingPhysician)
    }
    if (sample.priority !== undefined) {
      updates.push('priority = ?')
      values.push(sample.priority)
    }
    if (sample.status !== undefined) {
      updates.push('status = ?')
      values.push(sample.status)
    }
    if (sample.comments !== undefined) {
      updates.push('comments = ?')
      values.push(sample.comments)
    }

    if (updates.length === 0) {
      return existing
    }

    updates.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    const query = `UPDATE samples SET ${updates.join(', ')} WHERE id = ?`
    await this.database.run(query, values)

    return await this.findById(id)
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM samples WHERE id = ?'
    const result = await this.database.run(query, [id])
    return result.changes > 0
  }

  async getStatistics(): Promise<{
    totalSamples: number
    samplesByType: Record<string, number>
    samplesByStatus: Record<string, number>
    samplesByPriority: Record<string, number>
    averageProcessingTime: number
  }> {
    const totalQuery = 'SELECT COUNT(*) as count FROM samples'
    const totalResult = await this.database.get(totalQuery)
    
    const typeQuery = 'SELECT sample_type, COUNT(*) as count FROM samples GROUP BY sample_type'
    const typeResults = await this.database.all(typeQuery)
    
    const statusQuery = 'SELECT status, COUNT(*) as count FROM samples GROUP BY status'
    const statusResults = await this.database.all(statusQuery)
    
    const priorityQuery = 'SELECT priority, COUNT(*) as count FROM samples GROUP BY priority'
    const priorityResults = await this.database.all(priorityQuery)
    
    const processingTimeQuery = `
      SELECT AVG(
        CASE 
          WHEN status = 'completed' 
          THEN (julianday(updated_at) - julianday(received_date)) * 24 
          ELSE NULL 
        END
      ) as avg_hours
      FROM samples
    `
    const processingResult = await this.database.get(processingTimeQuery)

    return {
      totalSamples: totalResult.count,
      samplesByType: typeResults.reduce((acc: any, row: any) => {
        acc[row.sample_type] = row.count
        return acc
      }, {}),
      samplesByStatus: statusResults.reduce((acc: any, row: any) => {
        acc[row.status] = row.count
        return acc
      }, {}),
      samplesByPriority: priorityResults.reduce((acc: any, row: any) => {
        acc[row.priority] = row.count
        return acc
      }, {}),
      averageProcessingTime: processingResult.avg_hours || 0
    }
  }

  private mapRowToEntity(row: any): SampleEntity {
    return {
      id: row.id,
      patientId: row.patient_id,
      sampleType: row.sample_type as SampleType,
      collectionDate: new Date(row.collection_date),
      receivedDate: new Date(row.received_date),
      specimenSource: row.specimen_source,
      clinicalInfo: row.clinical_info,
      requestingPhysician: row.requesting_physician,
      priority: row.priority,
      status: row.status as SampleStatus,
      barcodeId: row.barcode_id,
      comments: row.comments,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }
}