export interface ExpertRule {
  id: string
  name: string
  description: string
  ruleType: ExpertRuleType
  microorganismId?: string
  drugId?: string
  condition: string
  action: string
  priority: number
  year: number
  sourceReference?: string
  notes?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export enum ExpertRuleType {
  INTRINSIC_RESISTANCE = 'intrinsic_resistance',
  ACQUIRED_RESISTANCE = 'acquired_resistance',
  PHENOTYPE_CONFIRMATION = 'phenotype_confirmation',
  QUALITY_CONTROL = 'quality_control',
  REPORTING_GUIDANCE = 'reporting_guidance'
}

export class ExpertRuleEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly ruleType: ExpertRuleType,
    public readonly condition: string,
    public readonly action: string,
    public readonly priority: number,
    public readonly year: number,
    public readonly microorganismId?: string,
    public readonly drugId?: string,
    public readonly sourceReference?: string,
    public readonly notes?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    name: string,
    description: string,
    ruleType: ExpertRuleType,
    condition: string,
    action: string,
    priority: number,
    year: number,
    microorganismId?: string,
    drugId?: string,
    sourceReference?: string,
    notes?: string
  ): ExpertRuleEntity {
    return new ExpertRuleEntity(
      `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      ruleType,
      condition,
      action,
      priority,
      year,
      microorganismId,
      drugId,
      sourceReference,
      notes
    )
  }

  evaluateCondition(testData: Record<string, any>): boolean {
    // Simple condition evaluation - in real implementation, this would be more sophisticated
    try {
      // This is a simplified example - real implementation would use a proper rule engine
      const conditionFunction = new Function('data', `return ${this.condition}`)
      return conditionFunction(testData)
    } catch (error) {
      console.error(`Error evaluating rule condition: ${error}`)
      return false
    }
  }

  getActionMessage(testData: Record<string, any>): string {
    // Simple action message generation
    return this.action.replace(/\{(\w+)\}/g, (match, key) => {
      return testData[key] || match
    })
  }
}