import { DrugEntity, DrugCategory } from '../../domain/entities/Drug.js'
import { DrugRepository } from '../../domain/repositories/DrugRepository.js'

export interface CreateDrugRequest {
  name: string
  code: string
  category: DrugCategory
  description?: string
}

export interface UpdateDrugRequest {
  id: string
  name?: string
  code?: string
  category?: DrugCategory
  description?: string
  isActive?: boolean
}

export interface DrugSearchCriteria {
  name?: string
  code?: string
  category?: DrugCategory
  isActive?: boolean
  limit?: number
  offset?: number
}

export class DrugService {
  constructor(private drugRepository: DrugRepository) {}

  async createDrug(request: CreateDrugRequest): Promise<{ success: boolean; drug?: DrugEntity; error?: string }> {
    try {
      // Check if drug with same code already exists
      const existing = await this.drugRepository.findByCode(request.code)
      if (existing) {
        return { success: false, error: 'Drug with this code already exists' }
      }

      const drug = new DrugEntity(
        crypto.randomUUID(),
        request.name,
        request.code,
        request.category,
        request.description
      )

      await this.drugRepository.save(drug)
      return { success: true, drug }
    } catch (error) {
      console.error('Create drug error:', error)
      return { success: false, error: 'Failed to create drug' }
    }
  }

  async updateDrug(request: UpdateDrugRequest): Promise<{ success: boolean; drug?: DrugEntity; error?: string }> {
    try {
      const existing = await this.drugRepository.findById(request.id)
      if (!existing) {
        return { success: false, error: 'Drug not found' }
      }

      // Check if code is being changed and if new code already exists
      if (request.code && request.code !== existing.code) {
        const codeExists = await this.drugRepository.findByCode(request.code)
        if (codeExists) {
          return { success: false, error: 'Drug with this code already exists' }
        }
      }

      // Create updated entity
      const updates: any = {}
      if (request.name !== undefined) updates.name = request.name
      if (request.code !== undefined) updates.code = request.code
      if (request.category !== undefined) updates.category = request.category
      if (request.description !== undefined) updates.description = request.description

      const updatedEntity = existing.update(updates)
      
      // Handle isActive separately since it's not in the update method
      let finalEntity = updatedEntity
      if (request.isActive !== undefined) {
        finalEntity = new DrugEntity(
          updatedEntity.id,
          updatedEntity.name,
          updatedEntity.code,
          updatedEntity.category,
          updatedEntity.description,
          request.isActive,
          updatedEntity.createdAt,
          new Date()
        )
      }

      const updated = await this.drugRepository.update(finalEntity)
      return { success: true, drug: updated }
    } catch (error) {
      console.error('Update drug error:', error)
      return { success: false, error: 'Failed to update drug' }
    }
  }

  async getDrugById(id: string): Promise<DrugEntity | null> {
    return await this.drugRepository.findById(id)
  }

  async getDrugByCode(code: string): Promise<DrugEntity | null> {
    return await this.drugRepository.findByCode(code)
  }

  async searchDrugs(criteria: DrugSearchCriteria): Promise<DrugEntity[]> {
    return await this.drugRepository.search(criteria)
  }

  async getAllDrugs(): Promise<DrugEntity[]> {
    return await this.drugRepository.findAll()
  }

  async getDrugsByCategory(category: DrugCategory): Promise<DrugEntity[]> {
    return await this.drugRepository.findByCategory(category)
  }

  async getCategories(): Promise<DrugCategory[]> {
    return Object.values(DrugCategory)
  }

  async deleteDrug(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.drugRepository.findById(id)
      if (!existing) {
        return { success: false, error: 'Drug not found' }
      }

      // Soft delete by setting isActive to false
      const deactivatedEntity = new DrugEntity(
        existing.id,
        existing.name,
        existing.code,
        existing.category,
        existing.description,
        false, // isActive = false
        existing.createdAt,
        new Date() // updatedAt
      )
      await this.drugRepository.update(deactivatedEntity)

      return { success: true }
    } catch (error) {
      console.error('Delete drug error:', error)
      return { success: false, error: 'Failed to delete drug' }
    }
  }

  async getDrugStatistics(): Promise<{
    total: number
    totalDrugs: number
    activeCount: number
    inactiveCount: number
    categoryBreakdown: { [key in DrugCategory]: number }
  }> {
    try {
      const allDrugs = await this.drugRepository.findAll()
      const activeDrugs = allDrugs.filter(d => d.isActive)
      const inactiveDrugs = allDrugs.filter(d => !d.isActive)

      const categoryBreakdown = Object.values(DrugCategory).reduce((acc, category) => {
        acc[category] = activeDrugs.filter(d => d.category === category).length
        return acc
      }, {} as { [key in DrugCategory]: number })

      return {
        total: allDrugs.length,
        totalDrugs: allDrugs.length,
        activeCount: activeDrugs.length,
        inactiveCount: inactiveDrugs.length,
        categoryBreakdown
      }
    } catch (error) {
      console.error('Get drug statistics error:', error)
      throw error
    }
  }
}