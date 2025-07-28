import { DrugEntity, DrugCategory } from '../entities/Drug.js'

export interface DrugRepository {
  findById(id: string): Promise<DrugEntity | null>
  findByCode(code: string): Promise<DrugEntity | null>
  findByName(name: string): Promise<DrugEntity | null>
  save(drug: DrugEntity): Promise<void>
  update(drug: DrugEntity): Promise<DrugEntity>
  delete(id: string): Promise<void>
  findAll(): Promise<DrugEntity[]>
  findByCategory(category: DrugCategory): Promise<DrugEntity[]>
  search(criteria: any): Promise<DrugEntity[]>
}