import { BreakpointStandardEntity, TestMethod } from '../entities/BreakpointStandard.js'

export interface BreakpointStandardRepository {
  findById(id: string): Promise<BreakpointStandardEntity | null>
  findByMicroorganismAndDrug(microorganismId: string, drugId: string, year?: number): Promise<BreakpointStandardEntity[]>
  findByYear(year: number): Promise<BreakpointStandardEntity[]>
  findLatestByMicroorganismAndDrug(microorganismId: string, drugId: string): Promise<BreakpointStandardEntity | null>
  save(standard: BreakpointStandardEntity): Promise<BreakpointStandardEntity>
  update(standard: BreakpointStandardEntity): Promise<BreakpointStandardEntity>
  delete(id: string): Promise<void>
  findAll(): Promise<BreakpointStandardEntity[]>
  findByMethod(method: TestMethod): Promise<BreakpointStandardEntity[]>
  findHistoricalVersions(microorganismId: string, drugId: string): Promise<BreakpointStandardEntity[]>
}