import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LabResultService } from '../../../application/services/LabResultService.js'
import { LabResultRepository } from '../../../domain/repositories/LabResultRepository.js'
import { LabResultEntity, TestMethod, SensitivityResult, ValidationStatus } from '../../../domain/entities/LabResult.js'

// Mock repository
const mockLabResultRepository: LabResultRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findBySampleId: vi.fn(),
  findByMicroorganismId: vi.fn(),
  findByDrugId: vi.fn(),
  findByValidationStatus: vi.fn(),
  findByDateRange: vi.fn(),
  save: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
  search: vi.fn()
}

describe('LabResultService', () => {
  let labResultService: LabResultService
  let mockResult: LabResultEntity

  beforeEach(() => {
    labResultService = new LabResultService(mockLabResultRepository)
    
    // Reset all mocks
    vi.clearAllMocks()
    
    // Create mock lab result
    mockResult = new LabResultEntity(
      'result-1',
      'sample-1',
      'microorganism-1',
      'drug-1',
      TestMethod.DISK_DIFFUSION,
      '20mm',
      SensitivityResult.SUSCEPTIBLE,
      'CLSI 2024',
      '[]',
      ValidationStatus.VALIDATED,
      '',
      'tech-1',
      'reviewer-1',
      new Date('2024-01-15'),
      new Date('2024-01-15'),
      'instrument-1',
      true,
      '',
      new Date('2024-01-01'),
      new Date('2024-01-01')
    )
  })

  describe('getAllLabResults', () => {
    it('should return all lab results', async () => {
      // Arrange
      const expectedResults = [mockResult]
      vi.mocked(mockLabResultRepository.findAll).mockResolvedValue(expectedResults)

      // Act
      const results = await labResultService.getAllLabResults()

      // Assert
      expect(results).toEqual(expectedResults)
      expect(mockLabResultRepository.findAll).toHaveBeenCalledOnce()
    })

    it('should return empty array when no results exist', async () => {
      // Arrange
      vi.mocked(mockLabResultRepository.findAll).mockResolvedValue([])

      // Act
      const results = await labResultService.getAllLabResults()

      // Assert
      expect(results).toEqual([])
      expect(mockLabResultRepository.findAll).toHaveBeenCalledOnce()
    })
  })

  describe('getLabResultById', () => {
    it('should return lab result when found', async () => {
      // Arrange
      vi.mocked(mockLabResultRepository.findById).mockResolvedValue(mockResult)

      // Act
      const result = await labResultService.getLabResultById('result-1')

      // Assert
      expect(result).toEqual(mockResult)
      expect(mockLabResultRepository.findById).toHaveBeenCalledWith('result-1')
    })

    it('should return null when lab result not found', async () => {
      // Arrange
      vi.mocked(mockLabResultRepository.findById).mockResolvedValue(null)

      // Act
      const result = await labResultService.getLabResultById('nonexistent')

      // Assert
      expect(result).toBeNull()
      expect(mockLabResultRepository.findById).toHaveBeenCalledWith('nonexistent')
    })
  })

  describe('getLabResultsBySampleId', () => {
    it('should return lab results for a sample', async () => {
      // Arrange
      const expectedResults = [mockResult]
      vi.mocked(mockLabResultRepository.findBySampleId).mockResolvedValue(expectedResults)

      // Act
      const results = await labResultService.getLabResultsBySampleId('sample-1')

      // Assert
      expect(results).toEqual(expectedResults)
      expect(mockLabResultRepository.findBySampleId).toHaveBeenCalledWith('sample-1')
    })
  })

  describe('createLabResult', () => {
    it('should create a new lab result successfully', async () => {
      // Arrange
      const createRequest = {
        sampleId: 'sample-1',
        microorganismId: 'microorganism-1',
        drugId: 'drug-1',
        testMethod: TestMethod.DISK_DIFFUSION,
        rawResult: '20mm',
        interpretation: SensitivityResult.SUSCEPTIBLE,
        technician: 'tech-1',
        testDate: new Date('2024-01-15')
      }

      vi.mocked(mockLabResultRepository.save).mockResolvedValue(mockResult)

      // Act
      const result = await labResultService.createLabResult(createRequest)

      // Assert
      expect(result.success).toBe(true)
      expect(result.labResult).toEqual(mockResult)
      expect(mockLabResultRepository.save).toHaveBeenCalledOnce()
    })

    it('should fail when required fields are missing', async () => {
      // Arrange
      const invalidRequest = {
        sampleId: '',
        microorganismId: 'microorganism-1',
        drugId: 'drug-1',
        testMethod: TestMethod.DISK_DIFFUSION,
        rawResult: '20mm',
        interpretation: SensitivityResult.SUSCEPTIBLE,
        technician: 'tech-1',
        testDate: new Date('2024-01-15')
      }

      // Act
      const result = await labResultService.createLabResult(invalidRequest)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Sample ID is required')
      expect(mockLabResultRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('updateLabResult', () => {
    it('should update lab result successfully', async () => {
      // Arrange
      const updateRequest = {
        id: 'result-1',
        rawResult: '25mm',
        interpretation: SensitivityResult.RESISTANT,
        validationComments: 'Updated result'
      }

      vi.mocked(mockLabResultRepository.findById).mockResolvedValue(mockResult)
      vi.mocked(mockLabResultRepository.update).mockResolvedValue(mockResult)

      // Act
      const result = await labResultService.updateLabResult(updateRequest)

      // Assert
      expect(result.success).toBe(true)
      expect(result.labResult).toEqual(mockResult)
      expect(mockLabResultRepository.update).toHaveBeenCalledOnce()
    })

    it('should fail when lab result not found', async () => {
      // Arrange
      const updateRequest = {
        id: 'nonexistent',
        rawResult: '25mm'
      }

      vi.mocked(mockLabResultRepository.findById).mockResolvedValue(null)

      // Act
      const result = await labResultService.updateLabResult(updateRequest)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Lab result not found')
      expect(mockLabResultRepository.update).not.toHaveBeenCalled()
    })
  })

  describe('deleteLabResult', () => {
    it('should delete lab result successfully', async () => {
      // Arrange
      vi.mocked(mockLabResultRepository.findById).mockResolvedValue(mockResult)
      vi.mocked(mockLabResultRepository.delete).mockResolvedValue(true)

      // Act
      const result = await labResultService.deleteLabResult('result-1')

      // Assert
      expect(result.success).toBe(true)
      expect(mockLabResultRepository.delete).toHaveBeenCalledWith('result-1')
    })

    it('should fail when lab result not found', async () => {
      // Arrange
      vi.mocked(mockLabResultRepository.findById).mockResolvedValue(null)

      // Act
      const result = await labResultService.deleteLabResult('nonexistent')

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Lab result not found')
      expect(mockLabResultRepository.delete).not.toHaveBeenCalled()
    })
  })

  describe('validateLabResult', () => {
    it('should validate lab result successfully', async () => {
      // Arrange
      const validationRequest = {
        id: 'result-1',
        validationStatus: ValidationStatus.VALIDATED,
        validationComments: 'Result validated',
        reviewedBy: 'reviewer-1'
      }

      vi.mocked(mockLabResultRepository.findById).mockResolvedValue(mockResult)
      vi.mocked(mockLabResultRepository.update).mockResolvedValue(mockResult)

      // Act
      const result = await labResultService.validateLabResult(validationRequest)

      // Assert
      expect(result.success).toBe(true)
      expect(result.labResult).toEqual(mockResult)
      expect(mockLabResultRepository.update).toHaveBeenCalledOnce()
    })
  })

  describe('getLabResultStatistics', () => {
    it('should return lab result statistics', async () => {
      // Arrange
      const mockResults = [mockResult]
      vi.mocked(mockLabResultRepository.findAll).mockResolvedValue(mockResults)

      // Act
      const stats = await labResultService.getLabResultStatistics()

      // Assert
      expect(stats.total).toBe(1)
      expect(stats.totalResults).toBe(1)
      expect(stats.byValidationStatus[ValidationStatus.VALIDATED]).toBe(1)
      expect(stats.byInterpretation[SensitivityResult.SUSCEPTIBLE]).toBe(1)
      expect(stats.byTestMethod[TestMethod.DISK_DIFFUSION]).toBe(1)
    })
  })

  describe('searchLabResults', () => {
    it('should search lab results with criteria', async () => {
      // Arrange
      const searchCriteria = {
        sampleId: 'sample-1',
        validationStatus: ValidationStatus.VALIDATED,
        limit: 10,
        offset: 0
      }

      const expectedResults = [mockResult]
      vi.mocked(mockLabResultRepository.search).mockResolvedValue(expectedResults)

      // Act
      const results = await labResultService.searchLabResults(searchCriteria)

      // Assert
      expect(results).toEqual(expectedResults)
      expect(mockLabResultRepository.search).toHaveBeenCalledWith(searchCriteria)
    })
  })
})