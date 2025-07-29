import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MicroorganismService, CreateMicroorganismRequest, UpdateMicroorganismRequest, MicroorganismSearchCriteria } from '../../../application/services/MicroorganismService.js'
import { MicroorganismEntity } from '../../../domain/entities/Microorganism.js'

// Mock dependencies
const mockMicroorganismRepository = {
  findByGenusAndSpecies: vi.fn(),
  findById: vi.fn(),
  save: vi.fn(),
  update: vi.fn(),
  search: vi.fn(),
  findAll: vi.fn(),
  findByGenus: vi.fn(),
  delete: vi.fn()
}

describe('MicroorganismService', () => {
  let microorganismService: MicroorganismService

  beforeEach(() => {
    vi.clearAllMocks()
    microorganismService = new MicroorganismService(mockMicroorganismRepository as any)
  })

  describe('createMicroorganism', () => {
    it('should successfully create a new microorganism', async () => {
      const createRequest: CreateMicroorganismRequest = {
        genus: 'Escherichia',
        species: 'coli',
        groupName: 'Enterobacteriaceae',
        commonName: 'E. coli',
        description: 'Common gram-negative bacterium'
      }

      mockMicroorganismRepository.findByGenusAndSpecies.mockResolvedValue(null)
      mockMicroorganismRepository.save.mockResolvedValue(undefined)

      const result = await microorganismService.createMicroorganism(createRequest)

      expect(result.success).toBe(true)
      expect(result.microorganism).toBeDefined()
      expect(result.microorganism?.genus).toBe('Escherichia')
      expect(result.microorganism?.species).toBe('coli')
      expect(mockMicroorganismRepository.findByGenusAndSpecies).toHaveBeenCalledWith('Escherichia', 'coli')
      expect(mockMicroorganismRepository.save).toHaveBeenCalled()
    })

    it('should fail to create microorganism if it already exists', async () => {
      const createRequest: CreateMicroorganismRequest = {
        genus: 'Escherichia',
        species: 'coli'
      }

      const existingMicroorganism = new MicroorganismEntity(
        'existing-id',
        'Escherichia',
        'coli'
      )

      mockMicroorganismRepository.findByGenusAndSpecies.mockResolvedValue(existingMicroorganism)

      const result = await microorganismService.createMicroorganism(createRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Microorganism with this genus and species already exists')
      expect(mockMicroorganismRepository.save).not.toHaveBeenCalled()
    })

    it('should handle creation errors gracefully', async () => {
      const createRequest: CreateMicroorganismRequest = {
        genus: 'Escherichia',
        species: 'coli'
      }

      mockMicroorganismRepository.findByGenusAndSpecies.mockResolvedValue(null)
      mockMicroorganismRepository.save.mockRejectedValue(new Error('Database error'))

      const result = await microorganismService.createMicroorganism(createRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to create microorganism')
    })
  })

  describe('updateMicroorganism', () => {
    it('should successfully update an existing microorganism', async () => {
      const existingMicroorganism = new MicroorganismEntity(
        'micro-id',
        'Escherichia',
        'coli'
      )

      const updateRequest: UpdateMicroorganismRequest = {
        id: 'micro-id',
        genus: 'Escherichia',
        species: 'coli',
        groupName: 'Enterobacteriaceae',
        commonName: 'E. coli'
      }

      const updatedMicroorganism = { ...existingMicroorganism, ...updateRequest }

      mockMicroorganismRepository.findById.mockResolvedValue(existingMicroorganism)
      mockMicroorganismRepository.update.mockResolvedValue(updatedMicroorganism)

      const result = await microorganismService.updateMicroorganism(updateRequest)

      expect(result.success).toBe(true)
      expect(result.microorganism).toBeDefined()
      expect(mockMicroorganismRepository.findById).toHaveBeenCalledWith('micro-id')
      expect(mockMicroorganismRepository.update).toHaveBeenCalled()
    })

    it('should fail to update non-existent microorganism', async () => {
      const updateRequest: UpdateMicroorganismRequest = {
        id: 'non-existent-id',
        genus: 'Escherichia'
      }

      mockMicroorganismRepository.findById.mockResolvedValue(null)

      const result = await microorganismService.updateMicroorganism(updateRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Microorganism not found')
      expect(mockMicroorganismRepository.update).not.toHaveBeenCalled()
    })

    it('should handle update errors gracefully', async () => {
      const existingMicroorganism = new MicroorganismEntity(
        'micro-id',
        'Escherichia',
        'coli'
      )

      const updateRequest: UpdateMicroorganismRequest = {
        id: 'micro-id',
        genus: 'Escherichia'
      }

      mockMicroorganismRepository.findById.mockResolvedValue(existingMicroorganism)
      mockMicroorganismRepository.update.mockRejectedValue(new Error('Database error'))

      const result = await microorganismService.updateMicroorganism(updateRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to update microorganism')
    })
  })

  describe('getMicroorganismById', () => {
    it('should return microorganism by id', async () => {
      const microorganism = new MicroorganismEntity(
        'micro-id',
        'Escherichia',
        'coli'
      )

      mockMicroorganismRepository.findById.mockResolvedValue(microorganism)

      const result = await microorganismService.getMicroorganismById('micro-id')

      expect(result).toEqual(microorganism)
      expect(mockMicroorganismRepository.findById).toHaveBeenCalledWith('micro-id')
    })

    it('should return null for non-existent microorganism', async () => {
      mockMicroorganismRepository.findById.mockResolvedValue(null)

      const result = await microorganismService.getMicroorganismById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('searchMicroorganisms', () => {
    it('should search microorganisms with criteria', async () => {
      const searchCriteria: MicroorganismSearchCriteria = {
        genus: 'Escherichia',
        isActive: true,
        limit: 10,
        offset: 0
      }

      const microorganisms = [
        new MicroorganismEntity('1', 'Escherichia', 'coli'),
        new MicroorganismEntity('2', 'Escherichia', 'fergusonii')
      ]

      mockMicroorganismRepository.search.mockResolvedValue(microorganisms)

      const result = await microorganismService.searchMicroorganisms(searchCriteria)

      expect(result).toEqual(microorganisms)
      expect(mockMicroorganismRepository.search).toHaveBeenCalledWith(searchCriteria)
    })
  })

  describe('getAllMicroorganisms', () => {
    it('should return all microorganisms', async () => {
      const microorganisms = [
        new MicroorganismEntity('1', 'Escherichia', 'coli'),
        new MicroorganismEntity('2', 'Staphylococcus', 'aureus')
      ]

      mockMicroorganismRepository.findAll.mockResolvedValue(microorganisms)

      const result = await microorganismService.getAllMicroorganisms()

      expect(result).toEqual(microorganisms)
      expect(mockMicroorganismRepository.findAll).toHaveBeenCalled()
    })
  })

  describe('getMicroorganismsByGenus', () => {
    it('should return microorganisms by genus', async () => {
      const microorganisms = [
        new MicroorganismEntity('1', 'Escherichia', 'coli'),
        new MicroorganismEntity('2', 'Escherichia', 'fergusonii')
      ]

      mockMicroorganismRepository.findByGenus.mockResolvedValue(microorganisms)

      const result = await microorganismService.getMicroorganismsByGenus('Escherichia')

      expect(result).toEqual(microorganisms)
      expect(mockMicroorganismRepository.findByGenus).toHaveBeenCalledWith('Escherichia')
    })
  })

  describe('getGenera', () => {
    it('should return distinct genera', async () => {
      const microorganisms = [
        new MicroorganismEntity('1', 'Escherichia', 'coli'),
        new MicroorganismEntity('2', 'Staphylococcus', 'aureus'),
        new MicroorganismEntity('3', 'Escherichia', 'fergusonii'),
        new MicroorganismEntity('4', 'Streptococcus', 'pneumoniae')
      ]

      mockMicroorganismRepository.findAll.mockResolvedValue(microorganisms)

      const result = await microorganismService.getGenera()

      expect(result).toEqual(['Escherichia', 'Staphylococcus', 'Streptococcus'])
      expect(mockMicroorganismRepository.findAll).toHaveBeenCalled()
    })
  })

  describe('getSpeciesByGenus', () => {
    it('should return species by genus', async () => {
      const microorganisms = [
        new MicroorganismEntity('1', 'Escherichia', 'coli'),
        new MicroorganismEntity('2', 'Escherichia', 'fergusonii'),
        new MicroorganismEntity('3', 'Escherichia', 'hermanii')
      ]

      mockMicroorganismRepository.findByGenus.mockResolvedValue(microorganisms)

      const result = await microorganismService.getSpeciesByGenus('Escherichia')

      expect(result).toEqual(['coli', 'fergusonii', 'hermanii'])
      expect(mockMicroorganismRepository.findByGenus).toHaveBeenCalledWith('Escherichia')
    })
  })

  describe('deleteMicroorganism', () => {
    it('should successfully soft delete microorganism', async () => {
      const microorganism = new MicroorganismEntity(
        'micro-id',
        'Escherichia',
        'coli'
      )

      mockMicroorganismRepository.findById.mockResolvedValue(microorganism)
      mockMicroorganismRepository.update.mockResolvedValue(microorganism)

      const result = await microorganismService.deleteMicroorganism('micro-id')

      expect(result.success).toBe(true)
      expect(mockMicroorganismRepository.findById).toHaveBeenCalledWith('micro-id')
      expect(mockMicroorganismRepository.update).toHaveBeenCalled()
    })

    it('should fail to delete non-existent microorganism', async () => {
      mockMicroorganismRepository.findById.mockResolvedValue(null)

      const result = await microorganismService.deleteMicroorganism('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Microorganism not found')
      expect(mockMicroorganismRepository.update).not.toHaveBeenCalled()
    })

    it('should handle delete errors gracefully', async () => {
      const microorganism = new MicroorganismEntity(
        'micro-id',
        'Escherichia',
        'coli',
        undefined,
        undefined,
        undefined
      )

      mockMicroorganismRepository.findById.mockResolvedValue(microorganism)
      mockMicroorganismRepository.update.mockRejectedValue(new Error('Database error'))

      const result = await microorganismService.deleteMicroorganism('micro-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to delete microorganism')
    })
  })

  describe('getHierarchicalData', () => {
    it('should return hierarchical microorganism data', async () => {
      const microorganisms = [
        new MicroorganismEntity('1', 'Escherichia', 'coli', 'Enterobacteriaceae'),
        new MicroorganismEntity('2', 'Escherichia', 'fergusonii', 'Enterobacteriaceae'),
        new MicroorganismEntity('3', 'Staphylococcus', 'aureus', 'Staphylococcaceae')
      ]

      mockMicroorganismRepository.findAll.mockResolvedValue(microorganisms)

      const result = await microorganismService.getHierarchicalData()

      expect(result).toHaveProperty('Escherichia')
      expect(result).toHaveProperty('Staphylococcus')
      expect(result.Escherichia).toHaveProperty('Enterobacteriaceae')
      expect(result.Staphylococcus).toHaveProperty('Staphylococcaceae')
    })
  })

  describe('getStatistics', () => {
    it('should return microorganism statistics', async () => {
      const microorganisms = [
        new MicroorganismEntity('1', 'Escherichia', 'coli', 'Enterobacteriaceae'),
        new MicroorganismEntity('2', 'Escherichia', 'fergusonii', 'Enterobacteriaceae'),
        new MicroorganismEntity('3', 'Staphylococcus', 'aureus', 'Staphylococcaceae')
      ]

      // Note: isActive is readonly, so we need to create a new object with the property
      const inactiveMicroorganism = new MicroorganismEntity(
        '3',
        'Staphylococcus',
        'aureus',
        'Staphylococcaceae',
        undefined,
        undefined,
        false // isActive = false
      )
      microorganisms[2] = inactiveMicroorganism

      mockMicroorganismRepository.findAll.mockResolvedValue(microorganisms)

      const result = await microorganismService.getStatistics()

      expect(result.total).toBe(3)
      expect(result.active).toBe(2)
      expect(result.inactive).toBe(1)
      expect(result.byGenus).toHaveProperty('Escherichia', 2)
      expect(result.byGenus).toHaveProperty('Staphylococcus', 1)
      expect(result.byGroup).toHaveProperty('Enterobacteriaceae', 2)
      expect(result.byGroup).toHaveProperty('Staphylococcaceae', 1)
    })
  })
})