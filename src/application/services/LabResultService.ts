import { LabResultRepository } from '../../domain/repositories/LabResultRepository.js'
import { LabResult, LabResultEntity, CreateLabResultRequest, UpdateLabResultRequest, ValidationRequest, ValidationStatus, TestMethod, ResultInterpretation } from '../../domain/entities/LabResult.js'
import { ExpertRuleService } from './ExpertRuleService.js'
import { BreakpointStandardService } from './BreakpointStandardService.js'

export class LabResultService {
  constructor(
    private labResultRepository: LabResultRepository,
    private expertRuleService: ExpertRuleService,
    private breakpointStandardService: BreakpointStandardService
  ) {}

  async getAllLabResults(): Promise<LabResultEntity[]> {
    return await this.labResultRepository.findAll()
  }

  async getLabResultById(id: string): Promise<LabResultEntity | null> {
    return await this.labResultRepository.findById(id)
  }

  async getLabResultsBySample(sampleId: string): Promise<LabResultEntity[]> {
    return await this.labResultRepository.findBySampleId(sampleId)
  }

  async getLabResultsByMicroorganism(microorganismId: string): Promise<LabResultEntity[]> {
    return await this.labResultRepository.findByMicroorganismId(microorganismId)
  }

  async getLabResultsByValidationStatus(status: ValidationStatus): Promise<LabResultEntity[]> {
    return await this.labResultRepository.findByValidationStatus(status)
  }

  async getLabResultsByDateRange(startDate: Date, endDate: Date): Promise<LabResultEntity[]> {
    return await this.labResultRepository.findByDateRange(startDate, endDate)
  }

  async createLabResult(resultData: CreateLabResultRequest): Promise<LabResultEntity> {
    // Validate required fields
    if (!resultData.sampleId || !resultData.microorganismId || !resultData.drugId) {
      throw new Error('Missing required fields: sampleId, microorganismId, drugId')
    }

    if (!resultData.technician || !resultData.testMethod) {
      throw new Error('Missing required fields: technician, testMethod')
    }

    // Create the lab result
    const labResult = await this.labResultRepository.save(resultData)

    // Auto-validate using expert rules and breakpoint standards
    await this.autoValidateResult(labResult.id)

    return await this.getLabResultById(labResult.id) || labResult
  }

  async updateLabResult(id: string, updateData: UpdateLabResultRequest): Promise<LabResultEntity | null> {
    const existing = await this.labResultRepository.findById(id)
    if (!existing) {
      throw new Error('Lab result not found')
    }

    return await this.labResultRepository.update(id, updateData)
  }

  async validateLabResult(validation: ValidationRequest): Promise<LabResultEntity | null> {
    const existing = await this.labResultRepository.findById(validation.labResultId)
    if (!existing) {
      throw new Error('Lab result not found')
    }

    return await this.labResultRepository.validate(validation)
  }

  async deleteLabResult(id: string): Promise<boolean> {
    const existing = await this.labResultRepository.findById(id)
    if (!existing) {
      throw new Error('Lab result not found')
    }

    return await this.labResultRepository.delete(id)
  }

  async getLabResultStatistics(): Promise<{
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
    return await this.labResultRepository.getStatistics()
  }

  async autoValidateResult(labResultId: string): Promise<LabResultEntity | null> {
    const labResult = await this.getLabResultById(labResultId)
    if (!labResult) {
      throw new Error('Lab result not found')
    }

    try {
      // Get applicable breakpoint standard
      const breakpointStandards = await this.breakpointStandardService.getBreakpointStandardsByMicroorganismAndDrug(
        labResult.microorganismId,
        labResult.drugId,
        new Date().getFullYear()
      )

      let interpretation = ResultInterpretation.NO_INTERPRETATION
      let breakpointUsed = ''

      // Apply breakpoint interpretation if available
      if (breakpointStandards.length > 0) {
        const standard = breakpointStandards[0] // Use the first matching standard
        const rawValue = parseFloat(labResult.rawResult.toString())
        
        if (!isNaN(rawValue)) {
          if (standard.susceptibleMin !== null && standard.susceptibleMax !== null) {
            if (rawValue >= standard.susceptibleMin && rawValue <= standard.susceptibleMax) {
              interpretation = ResultInterpretation.SUSCEPTIBLE
            }
          }
          if (standard.intermediateMin !== null && standard.intermediateMax !== null) {
            if (rawValue >= standard.intermediateMin && rawValue <= standard.intermediateMax) {
              interpretation = ResultInterpretation.INTERMEDIATE
            }
          }
          if (standard.resistantMin !== null && standard.resistantMax !== null) {
            if (rawValue >= standard.resistantMin && rawValue <= standard.resistantMax) {
              interpretation = ResultInterpretation.RESISTANT
            }
          }
          breakpointUsed = `${standard.year} ${standard.method}`
        }
      }

      // Apply expert rules validation
      const validationContext = {
        microorganismId: labResult.microorganismId,
        drugId: labResult.drugId,
        testMethod: labResult.testMethod,
        rawResult: labResult.rawResult,
        interpretation: interpretation,
        year: new Date().getFullYear()
      }

      const expertValidation = await this.expertRuleService.validateResult(validationContext)
      const appliedRules = expertValidation.appliedRules.map(rule => rule.id)

      // Update the lab result with validation results
      const updateData: UpdateLabResultRequest = {
        interpretation: interpretation,
        breakpointUsed: breakpointUsed,
        validationStatus: expertValidation.isValid ? ValidationStatus.VALIDATED : ValidationStatus.REQUIRES_REVIEW,
        validationComments: expertValidation.messages.join('; '),
        qualityControlPassed: expertValidation.isValid,
        reportDate: new Date()
      }

      // Store applied expert rules as JSON
      if (appliedRules.length > 0) {
        await this.labResultRepository.update(labResultId, {
          ...updateData,
          // Note: We'll need to add expert_rule_applied field handling in the repository
        })
      } else {
        await this.labResultRepository.update(labResultId, updateData)
      }

      return await this.getLabResultById(labResultId)
    } catch (error) {
      console.error('Auto-validation failed:', error)
      // Mark as requiring manual review
      await this.labResultRepository.update(labResultId, {
        validationStatus: ValidationStatus.REQUIRES_REVIEW,
        validationComments: `Auto-validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
      return await this.getLabResultById(labResultId)
    }
  }

  async getPendingValidationResults(): Promise<LabResultEntity[]> {
    return await this.labResultRepository.findByValidationStatus(ValidationStatus.PENDING)
  }

  async getResultsRequiringReview(): Promise<LabResultEntity[]> {
    return await this.labResultRepository.findByValidationStatus(ValidationStatus.REQUIRES_REVIEW)
  }

  async getValidatedResults(): Promise<LabResultEntity[]> {
    return await this.labResultRepository.findByValidationStatus(ValidationStatus.VALIDATED)
  }

  async bulkValidateResults(resultIds: string[], reviewedBy: string): Promise<{
    successful: number
    failed: number
    errors: string[]
  }> {
    let successful = 0
    let failed = 0
    const errors: string[] = []

    for (const resultId of resultIds) {
      try {
        await this.autoValidateResult(resultId)
        
        // Mark as reviewed
        await this.labResultRepository.update(resultId, {
          reviewedBy: reviewedBy,
          validationStatus: ValidationStatus.VALIDATED
        })
        
        successful++
      } catch (error) {
        failed++
        errors.push(`Result ${resultId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return { successful, failed, errors }
  }
}