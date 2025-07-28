import { SampleRepository } from '../../domain/repositories/SampleRepository.js'
import { Sample, SampleEntity, CreateSampleRequest, UpdateSampleRequest, SampleStatus, SampleType } from '../../domain/entities/Sample.js'

export class SampleService {
  constructor(private sampleRepository: SampleRepository) {}

  async getAllSamples(): Promise<SampleEntity[]> {
    return await this.sampleRepository.findAll()
  }

  async getSampleById(id: string): Promise<SampleEntity | null> {
    return await this.sampleRepository.findById(id)
  }

  async getSamplesByPatient(patientId: string): Promise<SampleEntity[]> {
    return await this.sampleRepository.findByPatientId(patientId)
  }

  async getSamplesByStatus(status: SampleStatus): Promise<SampleEntity[]> {
    return await this.sampleRepository.findByStatus(status)
  }

  async getSamplesByType(sampleType: SampleType): Promise<SampleEntity[]> {
    return await this.sampleRepository.findByType(sampleType)
  }

  async getSamplesByDateRange(startDate: Date, endDate: Date): Promise<SampleEntity[]> {
    return await this.sampleRepository.findByDateRange(startDate, endDate)
  }

  async createSample(sampleData: CreateSampleRequest): Promise<SampleEntity> {
    // Validate required fields
    if (!sampleData.patientId || !sampleData.sampleType || !sampleData.specimenSource) {
      throw new Error('Missing required fields: patientId, sampleType, specimenSource')
    }

    // Validate collection date is not in the future
    if (sampleData.collectionDate > new Date()) {
      throw new Error('Collection date cannot be in the future')
    }

    return await this.sampleRepository.save(sampleData)
  }

  async updateSample(id: string, updateData: UpdateSampleRequest): Promise<SampleEntity | null> {
    const existing = await this.sampleRepository.findById(id)
    if (!existing) {
      throw new Error('Sample not found')
    }

    return await this.sampleRepository.update(id, updateData)
  }

  async deleteSample(id: string): Promise<boolean> {
    const existing = await this.sampleRepository.findById(id)
    if (!existing) {
      throw new Error('Sample not found')
    }

    return await this.sampleRepository.delete(id)
  }

  async getSampleStatistics(): Promise<{
    totalSamples: number
    samplesByType: Record<string, number>
    samplesByStatus: Record<string, number>
    samplesByPriority: Record<string, number>
    averageProcessingTime: number
  }> {
    return await this.sampleRepository.getStatistics()
  }

  async updateSampleStatus(id: string, status: SampleStatus, comments?: string): Promise<SampleEntity | null> {
    return await this.updateSample(id, { status, comments })
  }

  async getSamplesByStatusAndDateRange(
    status: SampleStatus,
    startDate: Date,
    endDate: Date
  ): Promise<SampleEntity[]> {
    const allSamples = await this.sampleRepository.findByDateRange(startDate, endDate)
    return allSamples.filter(sample => sample.status === status)
  }

  async getPendingSamples(): Promise<SampleEntity[]> {
    return await this.sampleRepository.findByStatus(SampleStatus.RECEIVED)
  }

  async getProcessingSamples(): Promise<SampleEntity[]> {
    return await this.sampleRepository.findByStatus(SampleStatus.PROCESSING)
  }

  async getCompletedSamples(): Promise<SampleEntity[]> {
    return await this.sampleRepository.findByStatus(SampleStatus.COMPLETED)
  }
}