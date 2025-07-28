import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MicroorganismService } from '../../../application/services/MicroorganismService.js'
import { Microorganism } from '../../../domain/entities/Microorganism.js'

const mockMicroorganismRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  findByGenus: vi.fn(),
  findBySpecies: vi.fn(),
  search: vi.fn(),
  getStatistics: vi.fn()
}

describe('MicroorganismService', () => {
  let microorganismService: MicroorganismService

  beforeEach(() => {
    vi.clearAllMocks()
    microorganismService = new MicroorganismService(mockMicroorganismRepository as any)
  })

  describe('createMicroorganism', () => {
    it('should successfully create a microorganism', async () => {
      const microorganismData = {
        genus: 'Escherichia',
        species: 'coli',
        subspecies: null,
        gramStain: 'negative' as const,
        morphology: 'rod',
        oxygenRequirement: 'facultative' as const,
        catalaseTest: true,
        oxidaseTest: false
      }

      mockMicroorganismRepository.create.mockResolvedValue('micro1')

      const result = await microorganismService.createMicroorganism(microorganismData)

      expect(result).toBe('micro1')
      expect(mockMicroorganismRepository.create).toHaveBeenCalledWith(
        expect.any(Microorganism)
      )
    })
  })

  describe('getMicroorganism', () => {
    it('should return microorganism when found', async () => {
      const mockMicroorganism = new Microorganism(
        'micro1',
        'Escherichia',
        'coli',
        null,
        'negative',
        'rod',
        'facultative',
        true,
        false,
        new Date(),
        new Date()
      )

      mockMicroorganismRepository.findById.mockResolvedValue(mockMicroorganism)

      const result = await microorganismService.getMicroorganism('micro1')

      expect(result).toEqual(mockMicroorganism)
      expect(mockMicroorganismRepository.findById).toHaveBeenCalledWith('micro1')
    })

    it('should return null when microorganism not found', async () => {
      mockMicroorganismRepository.findById.mockResolvedValue(null)

      const result = await microorganismService.getMicroorganism('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('listMicroorganisms', () => {
    it('should return list of microorganisms with pagination', async () => {
      const mockMicroorganisms = [
        new Microorganism('micro1', 'Escherichia', 'coli', null, 'negative', 'rod', 'facultative', true, false, new Date(), new Date()),
        new Microorganism('micro2', 'Staphylococcus', 'aureus', null, 'positive', 'cocci', 'facultative', true, false, new Date(), new Date())
      ]

      const mockResult = {
        microorganisms: mockMicroorganisms,
        total: 2,
        limit: 10,
        offset: 0
      }

      mockMicroorganismRepository.list.mockResolvedValue(mockResult)

      const result = await microorganismService.listMicroorganisms(10, 0)

      expect(result).toEqual(mockResult)
      expect(mockMicroorganismRepository.list).toHaveBeenCalledWith(10, 0, undefined)
    })
  })

  describe('searchMicroorganisms', () => {
    it('should return search results', async () => {
      const mockResults = [
        new Microorganism('micro1', 'Escherichia', 'coli', null, 'negative', 'rod', 'facultative', true, false, new Date(), new Date())
      ]

      mockMicroorganismRepository.search.mockResolvedValue(mockResults)

      const result = await microorganismService.searchMicroorganisms('Escherichia')

      expect(result).toEqual(mockResults)
      expect(mockMicroorganismRepository.search).toHaveBeenCalledWith('Escherichia')
    })
  })

  describe('updateMicroorganism', () => {
    it('should successfully update microorganism', async () => {
      const updateData = {
        morphology: 'updated morphology'
      }

      mockMicroorganismRepository.update.mockResolvedValue(true)

      const result = await microorganismService.updateMicroorganism('micro1', updateData)

      expect(result).toBe(true)
      expect(mockMicroorganismRepository.update).toHaveBeenCalledWith('micro1', updateData)
    })
  })

  describe('deleteMicroorganism', () => {
    it('should successfully delete microorganism', async () => {
      mockMicroorganismRepository.delete.mockResolvedValue(true)

      const result = await microorganismService.deleteMicroorganism('micro1')

      expect(result).toBe(true)
      expect(mockMicroorganismRepository.delete).toHaveBeenCalledWith('micro1')
    })
  })

  describe('getStatistics', () => {
    it('should return microorganism statistics', async () => {
      const mockStats = {
        totalCount: 100,
        genusCount: 25,
        gramPositiveCount: 60,
        gramNegativeCount: 40,
        aerobicCount: 30,
        anaerobicCount: 20,
        facultativeCount: 50
      }

      mockMicroorganismRepository.getStatistics.mockResolvedValue(mockStats)

      const result = await microorganismService.getStatistics()

      expect(result).toEqual(mockStats)
    })
  })
})