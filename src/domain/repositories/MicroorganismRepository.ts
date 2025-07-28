import { MicroorganismEntity } from '../entities/Microorganism.js'

export interface MicroorganismRepository {
  findById(id: string): Promise<MicroorganismEntity | null>
  findByGenusAndSpecies(genus: string, species: string): Promise<MicroorganismEntity | null>
  save(microorganism: MicroorganismEntity): Promise<void>
  update(microorganism: MicroorganismEntity): Promise<MicroorganismEntity>
  delete(id: string): Promise<void>
  findAll(): Promise<MicroorganismEntity[]>
  findByGenus(genus: string): Promise<MicroorganismEntity[]>
  search(criteria: any): Promise<MicroorganismEntity[]>
}