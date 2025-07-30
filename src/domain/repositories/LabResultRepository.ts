import { LabResultEntity, ValidationStatus, TestMethod, SensitivityResult } from '../entities/LabResult.js'

export interface LabResultSearchCriteria {
  sampleId?: string
  microorganismId?: string
  drugId?: string
  testMethod?: TestMethod
  interpretation?: SensitivityResult
  validationStatus?: ValidationStatus
  technician?: string
  reviewedBy?: string
  startDate?: Date
  endDate?: Date
  qualityControlPassed?: boolean
  limit?: number
  offset?: number
}

export interface LabResultRepository {
  findAll(): Promise<LabResultEntity[]>
  findById(id: string): Promise<LabResultEntity | null>
  findBySampleId(sampleId: string): Promise<LabResultEntity[]>
  findByMicroorganismId(microorganismId: string): Promise<LabResultEntity[]>
  findByDrugId(drugId: string): Promise<LabResultEntity[]>
  findByValidationStatus(status: ValidationStatus): Promise<LabResultEntity[]>
  findByDateRange(startDate: Date, endDate: Date): Promise<LabResultEntity[]>
  search(criteria: LabResultSearchCriteria): Promise<LabResultEntity[]>
  save(labResult: LabResultEntity): Promise<LabResultEntity>
  update(id: string, labResult: LabResultEntity): Promise<LabResultEntity>
  delete(id: string): Promise<boolean>
  count(): Promise<number>
}