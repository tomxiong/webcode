import { LabResult, LabResultEntity, CreateLabResultRequest, UpdateLabResultRequest, ValidationRequest, ValidationStatus, TestMethod } from '../entities/LabResult.js'

export interface LabResultRepository {
  findAll(): Promise<LabResultEntity[]>
  findById(id: string): Promise<LabResultEntity | null>
  findBySampleId(sampleId: string): Promise<LabResultEntity[]>
  findByMicroorganismId(microorganismId: string): Promise<LabResultEntity[]>
  findByValidationStatus(status: ValidationStatus): Promise<LabResultEntity[]>
  findByDateRange(startDate: Date, endDate: Date): Promise<LabResultEntity[]>
  save(labResult: CreateLabResultRequest): Promise<LabResultEntity>
  update(id: string, labResult: UpdateLabResultRequest): Promise<LabResultEntity | null>
  validate(validation: ValidationRequest): Promise<LabResultEntity | null>
  delete(id: string): Promise<boolean>
  getStatistics(): Promise<{
    totalResults: number
    resultsByMethod: Record<string, number>
    resultsByInterpretation: Record<string, number>
    validationStats: Record<string, number>
    qualityControlStats: {
      passed: number
      failed: number
      percentage: number
    }
  }>
}