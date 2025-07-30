export enum TestMethod {
  DISK_DIFFUSION = 'disk_diffusion',
  BROTH_MICRODILUTION = 'broth_microdilution',
  AGAR_DILUTION = 'agar_dilution',
  E_TEST = 'e_test',
  AUTOMATED = 'automated',
  MOLECULAR = 'molecular'
}

export enum SensitivityResult {
  SUSCEPTIBLE = 'S',
  INTERMEDIATE = 'I',
  RESISTANT = 'R',
  NOT_TESTED = 'NT',
  NOT_INTERPRETABLE = 'NI'
}

export enum ValidationStatus {
  PENDING = 'pending',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
  REQUIRES_REVIEW = 'requires_review'
}

export class LabResultEntity {
  constructor(
    public readonly id: string,
    public readonly sampleId: string,
    public readonly microorganismId: string,
    public readonly drugId: string,
    public readonly testMethod: TestMethod,
    public readonly rawResult: string,
    public readonly interpretation: SensitivityResult | null,
    public readonly breakpointUsed: string | null,
    public readonly expertRuleApplied: string, // JSON array of rule IDs
    public readonly validationStatus: ValidationStatus,
    public readonly validationComments: string | null,
    public readonly technician: string,
    public readonly reviewedBy: string | null,
    public readonly testDate: Date,
    public readonly reportDate: Date | null,
    public readonly instrumentId: string | null,
    public readonly qualityControlPassed: boolean,
    public readonly comments: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    sampleId: string,
    microorganismId: string,
    drugId: string,
    testMethod: TestMethod,
    rawResult: string,
    technician: string,
    testDate: Date,
    interpretation?: SensitivityResult,
    breakpointUsed?: string,
    expertRuleApplied?: string,
    instrumentId?: string,
    comments?: string
  ): LabResultEntity {
    const now = new Date()
    const id = `lab_result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return new LabResultEntity(
      id,
      sampleId,
      microorganismId,
      drugId,
      testMethod,
      rawResult,
      interpretation || null,
      breakpointUsed || null,
      expertRuleApplied || '[]',
      ValidationStatus.PENDING,
      null,
      technician,
      null,
      testDate,
      null,
      instrumentId || null,
      false,
      comments || null,
      now,
      now
    )
  }

  update(updates: Partial<{
    rawResult: string
    interpretation: SensitivityResult
    breakpointUsed: string
    expertRuleApplied: string
    validationStatus: ValidationStatus
    validationComments: string
    reviewedBy: string
    reportDate: Date
    qualityControlPassed: boolean
    comments: string
  }>): LabResultEntity {
    return new LabResultEntity(
      this.id,
      this.sampleId,
      this.microorganismId,
      this.drugId,
      this.testMethod,
      updates.rawResult ?? this.rawResult,
      updates.interpretation ?? this.interpretation,
      updates.breakpointUsed ?? this.breakpointUsed,
      updates.expertRuleApplied ?? this.expertRuleApplied,
      updates.validationStatus ?? this.validationStatus,
      updates.validationComments ?? this.validationComments,
      this.technician,
      updates.reviewedBy ?? this.reviewedBy,
      this.testDate,
      updates.reportDate ?? this.reportDate,
      this.instrumentId,
      updates.qualityControlPassed ?? this.qualityControlPassed,
      updates.comments ?? this.comments,
      this.createdAt,
      new Date()
    )
  }

  validate(): LabResultEntity {
    return this.update({
      validationStatus: ValidationStatus.VALIDATED,
      reportDate: new Date()
    })
  }

  reject(comments: string, reviewedBy: string): LabResultEntity {
    return this.update({
      validationStatus: ValidationStatus.REJECTED,
      validationComments: comments,
      reviewedBy: reviewedBy
    })
  }

  requiresReview(comments: string): LabResultEntity {
    return this.update({
      validationStatus: ValidationStatus.REQUIRES_REVIEW,
      validationComments: comments
    })
  }

  isValidated(): boolean {
    return this.validationStatus === ValidationStatus.VALIDATED
  }

  isPending(): boolean {
    return this.validationStatus === ValidationStatus.PENDING
  }

  isRejected(): boolean {
    return this.validationStatus === ValidationStatus.REJECTED
  }

  needsReview(): boolean {
    return this.validationStatus === ValidationStatus.REQUIRES_REVIEW
  }

  hasQualityControl(): boolean {
    return this.qualityControlPassed
  }

  getAppliedRules(): string[] {
    try {
      return JSON.parse(this.expertRuleApplied)
    } catch {
      return []
    }
  }

  addAppliedRule(ruleId: string): LabResultEntity {
    const currentRules = this.getAppliedRules()
    if (!currentRules.includes(ruleId)) {
      currentRules.push(ruleId)
      return this.update({
        expertRuleApplied: JSON.stringify(currentRules)
      })
    }
    return this
  }

  removeAppliedRule(ruleId: string): LabResultEntity {
    const currentRules = this.getAppliedRules()
    const filteredRules = currentRules.filter(id => id !== ruleId)
    return this.update({
      expertRuleApplied: JSON.stringify(filteredRules)
    })
  }
}