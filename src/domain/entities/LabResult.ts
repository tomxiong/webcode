export interface LabResult {
  id: string
  sampleId: string
  microorganismId: string
  drugId: string
  testMethod: TestMethod
  rawResult: number | string
  interpretation: ResultInterpretation
  breakpointUsed?: string
  expertRuleApplied?: string[]
  validationStatus: ValidationStatus
  validationComments?: string
  technician: string
  reviewedBy?: string
  testDate: Date
  reportDate?: Date
  instrumentId?: string
  qualityControlPassed: boolean
  comments?: string
  createdAt: Date
  updatedAt: Date
}

export interface LabResultEntity extends LabResult {
  sample?: SampleEntity
  microorganism?: MicroorganismEntity
  drug?: DrugEntity
}

export enum TestMethod {
  DISK_DIFFUSION = 'disk_diffusion',
  BROTH_MICRODILUTION = 'broth_microdilution',
  AGAR_DILUTION = 'agar_dilution',
  E_TEST = 'e_test',
  AUTOMATED = 'automated',
  MOLECULAR = 'molecular'
}

export enum ResultInterpretation {
  SUSCEPTIBLE = 'S',
  INTERMEDIATE = 'I',
  RESISTANT = 'R',
  NOT_TESTED = 'NT',
  NO_INTERPRETATION = 'NI'
}

export enum ValidationStatus {
  PENDING = 'pending',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
  REQUIRES_REVIEW = 'requires_review'
}

export interface CreateLabResultRequest {
  sampleId: string
  microorganismId: string
  drugId: string
  testMethod: TestMethod
  rawResult: number | string
  technician: string
  testDate: Date
  instrumentId?: string
  comments?: string
}

export interface UpdateLabResultRequest {
  testMethod?: TestMethod
  rawResult?: number | string
  interpretation?: ResultInterpretation
  validationStatus?: ValidationStatus
  validationComments?: string
  reviewedBy?: string
  reportDate?: Date
  qualityControlPassed?: boolean
  comments?: string
}

export interface ValidationRequest {
  labResultId: string
  interpretation: ResultInterpretation
  validationComments?: string
  reviewedBy: string
}