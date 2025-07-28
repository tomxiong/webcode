import { Sample, SampleEntity, CreateSampleRequest, UpdateSampleRequest, SampleStatus, SampleType } from '../entities/Sample.js'

export interface SampleRepository {
  findAll(): Promise<SampleEntity[]>
  findById(id: string): Promise<SampleEntity | null>
  findByPatientId(patientId: string): Promise<SampleEntity[]>
  findByStatus(status: SampleStatus): Promise<SampleEntity[]>
  findByType(sampleType: SampleType): Promise<SampleEntity[]>
  findByDateRange(startDate: Date, endDate: Date): Promise<SampleEntity[]>
  save(sample: CreateSampleRequest): Promise<SampleEntity>
  update(id: string, sample: UpdateSampleRequest): Promise<SampleEntity | null>
  delete(id: string): Promise<boolean>
  getStatistics(): Promise<{
    totalSamples: number
    samplesByType: Record<string, number>
    samplesByStatus: Record<string, number>
    samplesByPriority: Record<string, number>
    averageProcessingTime: number
  }>
}