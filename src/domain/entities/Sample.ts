export interface Sample {
  id: string
  patientId: string
  sampleType: SampleType
  collectionDate: Date
  receivedDate: Date
  specimenSource: string
  clinicalInfo?: string
  requestingPhysician?: string
  priority: SamplePriority
  status: SampleStatus
  barcodeId?: string
  comments?: string
  createdAt: Date
  updatedAt: Date
}

export interface SampleEntity extends Sample {
  labResults?: LabResultEntity[]
}

export enum SampleType {
  BLOOD = 'blood',
  URINE = 'urine',
  SPUTUM = 'sputum',
  WOUND = 'wound',
  CSF = 'csf',
  STOOL = 'stool',
  THROAT = 'throat',
  OTHER = 'other'
}

export enum SamplePriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  STAT = 'stat'
}

export enum SampleStatus {
  RECEIVED = 'received',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

export interface CreateSampleRequest {
  patientId: string
  sampleType: SampleType
  collectionDate: Date
  specimenSource: string
  clinicalInfo?: string
  requestingPhysician?: string
  priority: SamplePriority
  barcodeId?: string
  comments?: string
}

export interface UpdateSampleRequest {
  sampleType?: SampleType
  specimenSource?: string
  clinicalInfo?: string
  requestingPhysician?: string
  priority?: SamplePriority
  status?: SampleStatus
  comments?: string
}