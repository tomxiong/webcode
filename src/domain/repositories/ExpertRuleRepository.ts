import { ExpertRuleEntity, ExpertRuleType, CreateExpertRuleRequest, UpdateExpertRuleRequest } from '../entities/ExpertRule.js'

export interface ExpertRuleRepository {
  findAll(): Promise<ExpertRuleEntity[]>
  findById(id: string): Promise<ExpertRuleEntity | null>
  findByType(ruleType: ExpertRuleType, year?: number): Promise<ExpertRuleEntity[]>
  findByMicroorganism(microorganismId: string): Promise<ExpertRuleEntity[]>
  findByDrug(drugId: string): Promise<ExpertRuleEntity[]>
  findByMicroorganismAndDrug(microorganismId: string, drugId: string, year?: number): Promise<ExpertRuleEntity[]>
  findByYear(year: number): Promise<ExpertRuleEntity[]>
  findActiveRules(): Promise<ExpertRuleEntity[]>
  findByPriority(minPriority: number): Promise<ExpertRuleEntity[]>
  save(expertRule: CreateExpertRuleRequest): Promise<ExpertRuleEntity>
  update(id: string, expertRule: UpdateExpertRuleRequest): Promise<ExpertRuleEntity | null>
  delete(id: string): Promise<boolean>
}