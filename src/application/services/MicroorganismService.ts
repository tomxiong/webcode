import { MicroorganismEntity } from '../../domain/entities/Microorganism.js'
import { MicroorganismRepository } from '../../domain/repositories/MicroorganismRepository.js'

export interface CreateMicroorganismRequest {
  genus: string
  groupName?: string
  species: string
  commonName?: string
  description?: string
}

export interface UpdateMicroorganismRequest {
  id: string
  genus?: string
  groupName?: string
  species?: string
  commonName?: string
  description?: string
  isActive?: boolean
}

export interface MicroorganismSearchCriteria {
  genus?: string
  groupName?: string
  species?: string
  commonName?: string
  isActive?: boolean
  limit?: number
  offset?: number
}

export class MicroorganismService {
  constructor(private microorganismRepository: MicroorganismRepository) {}

  async createMicroorganism(request: CreateMicroorganismRequest): Promise<{ success: boolean; microorganism?: MicroorganismEntity; error?: string }> {
    try {
      // Check if microorganism already exists
      const existing = await this.microorganismRepository.findByGenusAndSpecies(request.genus, request.species)
      if (existing) {
        return { success: false, error: 'Microorganism with this genus and species already exists' }
      }

      const microorganism = new MicroorganismEntity(
        crypto.randomUUID(),
        request.genus,
        request.species,
        request.groupName,
        request.commonName,
        request.description
      )

      await this.microorganismRepository.save(microorganism)
      return { success: true, microorganism }
    } catch (error) {
      console.error('Create microorganism error:', error)
      return { success: false, error: 'Failed to create microorganism' }
    }
  }

  async updateMicroorganism(request: UpdateMicroorganismRequest): Promise<{ success: boolean; microorganism?: MicroorganismEntity; error?: string }> {
    try {
      const existing = await this.microorganismRepository.findById(request.id)
      if (!existing) {
        return { success: false, error: 'Microorganism not found' }
      }

      // Create updated entity with new values
      const updatedEntity = existing.update({
        genus: request.genus,
        species: request.species,
        group: request.groupName,
        commonName: request.commonName,
        description: request.description
      })

      const updated = await this.microorganismRepository.update(updatedEntity)
      return { success: true, microorganism: updated }
    } catch (error) {
      console.error('Update microorganism error:', error)
      return { success: false, error: 'Failed to update microorganism' }
    }
  }

  async getMicroorganismById(id: string): Promise<MicroorganismEntity | null> {
    return await this.microorganismRepository.findById(id)
  }

  async searchMicroorganisms(criteria: MicroorganismSearchCriteria): Promise<MicroorganismEntity[]> {
    return await this.microorganismRepository.search(criteria)
  }

  async getAllMicroorganisms(): Promise<MicroorganismEntity[]> {
    return await this.microorganismRepository.findAll()
  }

  async getMicroorganismsByGenus(genus: string): Promise<MicroorganismEntity[]> {
    return await this.microorganismRepository.findByGenus(genus)
  }

  async getGenera(): Promise<string[]> {
    const microorganisms = await this.microorganismRepository.findAll()
    const genera = [...new Set(microorganisms.map(m => m.genus))]
    return genera.sort()
  }

  async getSpeciesByGenus(genus: string): Promise<string[]> {
    const microorganisms = await this.microorganismRepository.findByGenus(genus)
    const species = [...new Set(microorganisms.map(m => m.species))]
    return species.sort()
  }

  async deleteMicroorganism(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.microorganismRepository.findById(id)
      if (!existing) {
        return { success: false, error: 'Microorganism not found' }
      }

      // Soft delete by creating new entity with isActive = false
      const updatedEntity = new MicroorganismEntity(
        existing.id,
        existing.genus,
        existing.species,
        existing.group,
        existing.commonName,
        existing.description,
        false, // isActive = false
        existing.createdAt,
        new Date() // updatedAt
      )
      await this.microorganismRepository.update(updatedEntity)

      return { success: true }
    } catch (error) {
      console.error('Delete microorganism error:', error)
      return { success: false, error: 'Failed to delete microorganism' }
    }
  }

  async getHierarchicalData(): Promise<any> {
    try {
      const microorganisms = await this.microorganismRepository.findAll()
      
      // Group by genus
      const hierarchy: { [genus: string]: { [group: string]: MicroorganismEntity[] } } = {}
      
      for (const micro of microorganisms) {
        if (!hierarchy[micro.genus]) {
          hierarchy[micro.genus] = {}
        }
        
        const group = micro.group || 'Ungrouped'
        if (!hierarchy[micro.genus][group]) {
          hierarchy[micro.genus][group] = []
        }
        
        hierarchy[micro.genus][group].push(micro)
      }
      
      return hierarchy
    } catch (error) {
      console.error('Get hierarchical data error:', error)
      throw error
    }
  }

  async getStatistics(): Promise<any> {
    try {
      const microorganisms = await this.microorganismRepository.findAll()
      
      const stats = {
        totalCount: microorganisms.length,
        total: microorganisms.length,
        active: microorganisms.filter(m => m.isActive).length,
        inactive: microorganisms.filter(m => !m.isActive).length,
        byGenus: {} as { [key: string]: number },
        byGroup: {} as { [key: string]: number }
      }
      
      // Count by genus
      microorganisms.forEach(m => {
        stats.byGenus[m.genus] = (stats.byGenus[m.genus] || 0) + 1
        if (m.group) {
          stats.byGroup[m.group] = (stats.byGroup[m.group] || 0) + 1
        }
      })
      
      // Add genusCount for compatibility with tests
      const genusCount = Object.keys(stats.byGenus).length
      
      return {
        ...stats,
        genusCount
      }
    } catch (error) {
      console.error('Get microorganism statistics error:', error)
      throw error
    }
  }
}
