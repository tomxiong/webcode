import { LabResultRepository, LabResultSearchCriteria } from '../../domain/repositories/LabResultRepository.js'
import { LabResultEntity, TestMethod, SensitivityResult, ValidationStatus } from '../../domain/entities/LabResult.js'

export interface CreateLabResultRequest {
  sampleId: string
  microorganismId: string
  drugId: string
  testMethod: TestMethod
  rawResult: string
  interpretation?: SensitivityResult
  technician: string
  testDate: Date
  breakpointUsed?: string
  expertRuleApplied?: string
  instrumentId?: string
  comments?: string
}

export interface UpdateLabResultRequest {
  id: string
  rawResult?: string
  interpretation?: SensitivityResult
  breakpointUsed?: string
  expertRuleApplied?: string
  validationComments?: string
  qualityControlPassed?: boolean
  comments?: string
}

export interface ValidationRequest {
  id: string
  validationStatus: ValidationStatus
  validationComments?: string
  reviewedBy: string
}

export interface LabResultServiceResult<T> {
  success: boolean
  data?: T
  error?: string
  labResult?: LabResultEntity
}

export class LabResultService {
  constructor(private labResultRepository: LabResultRepository) {}

  async getAllLabResults(): Promise<LabResultEntity[]> {
    return await this.labResultRepository.findAll()
  }

  async getLabResultById(id: string): Promise<LabResultEntity | null> {
    return await this.labResultRepository.findById(id)
  }

  async getLabResultsBySampleId(sampleId: string): Promise<LabResultEntity[]> {
    return await this.labResultRepository.findBySampleId(sampleId)
  }

  async getLabResultsByMicroorganismId(microorganismId: string): Promise<LabResultEntity[]> {
    return await this.labResultRepository.findByMicroorganismId(microorganismId)
  }

  async getLabResultsByDrugId(drugId: string): Promise<LabResultEntity[]> {
    return await this.labResultRepository.findByDrugId(drugId)
  }

  async getLabResultsByValidationStatus(status: ValidationStatus): Promise<LabResultEntity[]> {
    return await this.labResultRepository.findByValidationStatus(status)
  }

  async createLabResult(request: CreateLabResultRequest): Promise<LabResultServiceResult<LabResultEntity>> {
    try {
      // Validate required fields
      if (!request.sampleId) {
        return { success: false, error: 'Sample ID is required' }
      }
      if (!request.microorganismId) {
        return { success: false, error: 'Microorganism ID is required' }
      }
      if (!request.drugId) {
        return { success: false, error: 'Drug ID is required' }
      }
      if (!request.technician) {
        return { success: false, error: 'Technician is required' }
      }
      if (!request.rawResult) {
        return { success: false, error: 'Raw result is required' }
      }

      const labResult = LabResultEntity.create(
        request.sampleId,
        request.microorganismId,
        request.drugId,
        request.testMethod,
        request.rawResult,
        request.technician,
        request.testDate,
        request.interpretation,
        request.breakpointUsed,
        request.expertRuleApplied,
        request.instrumentId,
        request.comments
      )

      const savedResult = await this.labResultRepository.save(labResult)
      return { success: true, labResult: savedResult }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async updateLabResult(request: UpdateLabResultRequest): Promise<LabResultServiceResult<LabResultEntity>> {
    try {
      const existing = await this.labResultRepository.findById(request.id)
      if (!existing) {
        return { success: false, error: 'Lab result not found' }
      }

      const updated = existing.update({
        rawResult: request.rawResult,
        interpretation: request.interpretation,
        breakpointUsed: request.breakpointUsed,
        expertRuleApplied: request.expertRuleApplied,
        validationComments: request.validationComments,
        qualityControlPassed: request.qualityControlPassed,
        comments: request.comments
      })

      const savedResult = await this.labResultRepository.update(request.id, updated)
      return { success: true, labResult: savedResult }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async deleteLabResult(id: string): Promise<LabResultServiceResult<boolean>> {
    try {
      const existing = await this.labResultRepository.findById(id)
      if (!existing) {
        return { success: false, error: 'Lab result not found' }
      }

      const deleted = await this.labResultRepository.delete(id)
      return { success: deleted }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async validateLabResult(request: ValidationRequest): Promise<LabResultServiceResult<LabResultEntity>> {
    try {
      const existing = await this.labResultRepository.findById(request.id)
      if (!existing) {
        return { success: false, error: 'Lab result not found' }
      }

      let updated: LabResultEntity
      switch (request.validationStatus) {
        case ValidationStatus.VALIDATED:
          updated = existing.validate()
          break
        case ValidationStatus.REJECTED:
          updated = existing.reject(request.validationComments || '', request.reviewedBy)
          break
        case ValidationStatus.REQUIRES_REVIEW:
          updated = existing.requiresReview(request.validationComments || '')
          break
        default:
          updated = existing.update({
            validationStatus: request.validationStatus,
            validationComments: request.validationComments,
            reviewedBy: request.reviewedBy
          })
      }

      const savedResult = await this.labResultRepository.update(request.id, updated)
      return { success: true, labResult: savedResult }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async searchLabResults(criteria: LabResultSearchCriteria): Promise<LabResultEntity[]> {
    return await this.labResultRepository.search(criteria)
  }

  async getLabResultStatistics(): Promise<{
    total: number
    totalResults: number
    byValidationStatus: Record<ValidationStatus, number>
    byInterpretation: Record<SensitivityResult, number>
    byTestMethod: Record<TestMethod, number>
    qualityControlStats: {
      passed: number
      failed: number
      total: number
    }
  }> {
    const allResults = await this.labResultRepository.findAll()
    
    const byValidationStatus = allResults.reduce((acc, result) => {
      acc[result.validationStatus] = (acc[result.validationStatus] || 0) + 1
      return acc
    }, {} as Record<ValidationStatus, number>)

    const byInterpretation = allResults.reduce((acc, result) => {
      if (result.interpretation) {
        acc[result.interpretation] = (acc[result.interpretation] || 0) + 1
      }
      return acc
    }, {} as Record<SensitivityResult, number>)

    const byTestMethod = allResults.reduce((acc, result) => {
      acc[result.testMethod] = (acc[result.testMethod] || 0) + 1
      return acc
    }, {} as Record<TestMethod, number>)

    const qualityControlPassed = allResults.filter(r => r.qualityControlPassed).length
    const qualityControlFailed = allResults.filter(r => !r.qualityControlPassed).length

    return {
      total: allResults.length,
      totalResults: allResults.length,
      byValidationStatus,
      byInterpretation,
      byTestMethod,
      qualityControlStats: {
        passed: qualityControlPassed,
        failed: qualityControlFailed,
        total: allResults.length
      }
    }
  }

  async getLabResultsByDateRange(startDate: Date, endDate: Date): Promise<LabResultEntity[]> {
    return await this.labResultRepository.findByDateRange(startDate, endDate)
  }

  async getPendingValidationResults(): Promise<LabResultEntity[]> {
    return await this.labResultRepository.findByValidationStatus(ValidationStatus.PENDING)
  }

  async getResultsRequiringReview(): Promise<LabResultEntity[]> {
    return await this.labResultRepository.findByValidationStatus(ValidationStatus.REQUIRES_REVIEW)
  }

  async getQualityControlFailures(): Promise<LabResultEntity[]> {
    const allResults = await this.labResultRepository.findAll()
    return allResults.filter(result => !result.qualityControlPassed)
  }

  async bulkValidateResults(resultIds: string[], reviewedBy: string): Promise<LabResultServiceResult<number>> {
    try {
      let validatedCount = 0
      
      for (const id of resultIds) {
        const result = await this.validateLabResult({
          id,
          validationStatus: ValidationStatus.VALIDATED,
          reviewedBy
        })
        
        if (result.success) {
          validatedCount++
        }
      }

      return { success: true, data: validatedCount }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}