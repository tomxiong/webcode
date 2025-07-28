import { ExpertRuleRepository } from '../../domain/repositories/ExpertRuleRepository.js'
import { ExpertRuleEntity, ExpertRuleType } from '../../domain/entities/ExpertRule.js'
import { BreakpointStandardService } from './BreakpointStandardService.js'
import { TestMethod, SensitivityResult } from '../../domain/entities/BreakpointStandard.js'

export interface RuleEvaluationContext {
  microorganismId: string
  drugId: string
  testValue: number
  testMethod: TestMethod
  interpretedResult: SensitivityResult
  year?: number
  additionalData?: Record<string, any>
}

export interface RuleEvaluationResult {
  ruleId: string
  ruleName: string
  ruleType: ExpertRuleType
  triggered: boolean
  action: string
  priority: number
  confidence: 'high' | 'medium' | 'low'
  message: string
  recommendation?: string
}

export interface ValidationResult {
  isValid: boolean
  triggeredRules: RuleEvaluationResult[]
  finalResult: SensitivityResult
  warnings: string[]
  errors: string[]
  recommendations: string[]
}

export class ExpertRuleService {
  constructor(
    private expertRuleRepository: ExpertRuleRepository,
    private breakpointService: BreakpointStandardService
  ) {}

  async getAllExpertRules(): Promise<ExpertRuleEntity[]> {
    return await this.expertRuleRepository.findAll()
  }

  async getRulesByType(ruleType?: ExpertRuleType, year?: number): Promise<ExpertRuleEntity[]> {
    if (!ruleType) {
      // Get all rules if no type specified
      return await this.expertRuleRepository.findAll()
    }
    return await this.expertRuleRepository.findByType(ruleType, year)
  }

  async getExpertRuleById(id: string): Promise<ExpertRuleEntity | null> {
    return await this.expertRuleRepository.findById(id)
  }

  async getRuleStatistics(): Promise<{
    totalRules: number
    rulesByType: Record<ExpertRuleType, number>
    rulesByYear: Record<number, number>
    activeRules: number
  }> {
    const allRules = await this.expertRuleRepository.findAll()
    
    const rulesByType = allRules.reduce((acc, rule) => {
      acc[rule.ruleType] = (acc[rule.ruleType] || 0) + 1
      return acc
    }, {} as Record<ExpertRuleType, number>)

    const rulesByYear = allRules.reduce((acc, rule) => {
      acc[rule.year] = (acc[rule.year] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    return {
      totalRules: allRules.length,
      rulesByType,
      rulesByYear,
      activeRules: allRules.filter(r => r.isActive).length
    }
  }

  async validateResult(context: RuleEvaluationContext): Promise<ValidationResult> {
    // Get applicable rules
    const rules = await this.getApplicableRules(
      context.microorganismId,
      context.drugId,
      context.year || new Date().getFullYear()
    )

    const triggeredRules: RuleEvaluationResult[] = []
    const warnings: string[] = []
    const errors: string[] = []
    const recommendations: string[] = []

    // Evaluate each rule
    for (const rule of rules) {
      const evaluation = await this.evaluateRule(rule, context)
      if (evaluation.triggered) {
        triggeredRules.push(evaluation)

        // Categorize results
        switch (evaluation.ruleType) {
          case ExpertRuleType.INTRINSIC_RESISTANCE:
          case ExpertRuleType.ACQUIRED_RESISTANCE:
            if (context.interpretedResult === SensitivityResult.SUSCEPTIBLE) {
              errors.push(evaluation.message)
            } else {
              warnings.push(evaluation.message)
            }
            break
          case ExpertRuleType.QUALITY_CONTROL:
            warnings.push(evaluation.message)
            break
          case ExpertRuleType.REPORTING_GUIDANCE:
            recommendations.push(evaluation.message)
            break
        }
      }
    }

    // Sort triggered rules by priority
    triggeredRules.sort((a, b) => b.priority - a.priority)

    // Determine final result based on rules
    const finalResult = this.determineFinalResult(context, triggeredRules)

    return {
      isValid: errors.length === 0,
      triggeredRules,
      finalResult,
      warnings,
      errors,
      recommendations
    }
  }

  async evaluateRule(
    rule: ExpertRuleEntity,
    context: RuleEvaluationContext
  ): Promise<RuleEvaluationResult> {
    try {
      // Parse and evaluate condition expression
      const conditionResult = this.evaluateCondition(rule.condition, context)
      
      if (conditionResult) {
        // Execute action expression
        const action = this.executeAction(rule.action, context)
        
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.ruleType,
          triggered: true,
          action,
          priority: rule.priority,
          confidence: this.calculateRuleConfidence(rule, context),
          message: this.formatRuleMessage(rule, context),
          recommendation: this.generateRecommendation(rule, context)
        }
      }

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.ruleType,
        triggered: false,
        action: '',
        priority: rule.priority,
        confidence: 'low',
        message: ''
      }
    } catch (error: any) {
      console.error(`Error evaluating rule ${rule.id}:`, error)
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.ruleType,
        triggered: false,
        action: '',
        priority: rule.priority,
        confidence: 'low',
        message: `Rule evaluation error: ${error.message}`
      }
    }
  }

  private evaluateCondition(
    conditionExpression: string,
    context: RuleEvaluationContext
  ): boolean {
    try {
      // Create a safe evaluation context
      const evalContext = {
        microorganismId: context.microorganismId,
        drugId: context.drugId,
        testValue: context.testValue,
        testMethod: context.testMethod,
        interpretedResult: context.interpretedResult,
        year: context.year,
        ...context.additionalData
      }

      // Simple expression evaluator (in production, use a proper expression parser)
      return this.safeEvaluateExpression(conditionExpression, evalContext)
    } catch (error) {
      console.error('Condition evaluation error:', error)
      return false
    }
  }

  private safeEvaluateExpression(expression: string, context: any): boolean {
    // Replace context variables in expression
    let processedExpression = expression

    // Replace common patterns
    processedExpression = processedExpression
      .replace(/microorganismId/g, `"${context.microorganismId}"`)
      .replace(/drugId/g, `"${context.drugId}"`)
      .replace(/testValue/g, context.testValue.toString())
      .replace(/testMethod/g, `"${context.testMethod}"`)
      .replace(/interpretedResult/g, `"${context.interpretedResult}"`)
      .replace(/year/g, (context.year || new Date().getFullYear()).toString())

    // Simple pattern matching for common rules
    if (processedExpression.includes('===') || processedExpression.includes('==')) {
      return this.evaluateEqualityExpression(processedExpression)
    }
    if (processedExpression.includes('>=') || processedExpression.includes('<=') || 
        processedExpression.includes('>') || processedExpression.includes('<')) {
      return this.evaluateComparisonExpression(processedExpression)
    }
    if (processedExpression.includes('&&') || processedExpression.includes('||')) {
      return this.evaluateLogicalExpression(processedExpression)
    }

    return false
  }

  private evaluateEqualityExpression(expression: string): boolean {
    // Handle simple equality checks
    const eqMatch = expression.match(/^"([^"]*)" === "([^"]*)"$/)
    if (eqMatch) {
      return eqMatch[1] === eqMatch[2]
    }
    return false
  }

  private evaluateComparisonExpression(expression: string): boolean {
    // Handle numeric comparisons
    const compMatch = expression.match(/^(\d+(?:\.\d+)?) (>=|<=|>|<) (\d+(?:\.\d+)?)$/)
    if (compMatch) {
      const left = parseFloat(compMatch[1])
      const operator = compMatch[2]
      const right = parseFloat(compMatch[3])
      
      switch (operator) {
        case '>=': return left >= right
        case '<=': return left <= right
        case '>': return left > right
        case '<': return left < right
      }
    }
    return false
  }

  private evaluateLogicalExpression(expression: string): boolean {
    // Handle simple logical operations
    if (expression.includes('&&')) {
      const parts = expression.split('&&').map(p => p.trim())
      return parts.every(part => this.safeEvaluateExpression(part, {}))
    }
    if (expression.includes('||')) {
      const parts = expression.split('||').map(p => p.trim())
      return parts.some(part => this.safeEvaluateExpression(part, {}))
    }
    return false
  }

  private executeAction(action: string, context: RuleEvaluationContext): string {
    // Replace placeholders in action expression
    return action
      .replace(/{microorganismId}/g, context.microorganismId)
      .replace(/{drugId}/g, context.drugId)
      .replace(/{testValue}/g, context.testValue.toString())
      .replace(/{testMethod}/g, context.testMethod)
      .replace(/{interpretedResult}/g, context.interpretedResult)
  }

  private calculateRuleConfidence(
    rule: ExpertRuleEntity,
    context: RuleEvaluationContext
  ): 'high' | 'medium' | 'low' {
    // Calculate confidence based on rule type and context
    switch (rule.ruleType) {
      case ExpertRuleType.INTRINSIC_RESISTANCE:
        return 'high' // Intrinsic resistance is well-established
      case ExpertRuleType.ACQUIRED_RESISTANCE:
        return 'medium' // May vary by strain
      case ExpertRuleType.QUALITY_CONTROL:
        return 'high' // QC rules are standardized
      case ExpertRuleType.PHENOTYPE_CONFIRMATION:
        return 'medium' // Requires additional testing
      case ExpertRuleType.REPORTING_GUIDANCE:
        return 'low' // Guidance, not definitive
      default:
        return 'low'
    }
  }

  private formatRuleMessage(rule: ExpertRuleEntity, context: RuleEvaluationContext): string {
    const action = this.executeAction(rule.action, context)
    return `${rule.name}: ${action}`
  }

  private generateRecommendation(
    rule: ExpertRuleEntity,
    context: RuleEvaluationContext
  ): string {
    switch (rule.ruleType) {
      case ExpertRuleType.INTRINSIC_RESISTANCE:
        return 'Consider intrinsic resistance pattern. Review organism identification.'
      case ExpertRuleType.ACQUIRED_RESISTANCE:
        return 'Possible acquired resistance. Consider additional testing or alternative therapy.'
      case ExpertRuleType.QUALITY_CONTROL:
        return 'Review test procedure and quality control measures.'
      case ExpertRuleType.PHENOTYPE_CONFIRMATION:
        return 'Perform confirmatory testing to verify phenotype.'
      case ExpertRuleType.REPORTING_GUIDANCE:
        return 'Follow institutional reporting guidelines.'
      default:
        return 'Review result and consider clinical context.'
    }
  }

  private determineFinalResult(
    context: RuleEvaluationContext,
    triggeredRules: RuleEvaluationResult[]
  ): SensitivityResult {
    // Check for high-priority resistance rules
    const resistanceRules = triggeredRules.filter(r => 
      r.ruleType === ExpertRuleType.INTRINSIC_RESISTANCE ||
      r.ruleType === ExpertRuleType.ACQUIRED_RESISTANCE
    )

    if (resistanceRules.length > 0 && context.interpretedResult === SensitivityResult.SUSCEPTIBLE) {
      // Override susceptible result if resistance rules are triggered
      return SensitivityResult.RESISTANT
    }

    // Return original result if no overriding rules
    return context.interpretedResult
  }

  private async getApplicableRules(
    microorganismId: string,
    drugId: string,
    year: number
  ): Promise<ExpertRuleEntity[]> {
    // Get rules for specific microorganism-drug combination
    const specificRules = await this.expertRuleRepository.findByMicroorganismAndDrug(
      microorganismId,
      drugId,
      year
    )

    // Get general rules for microorganism
    const microorganismRules = await this.expertRuleRepository.findByMicroorganism(
      microorganismId
    )

    // Get general rules for drug
    const drugRules = await this.expertRuleRepository.findByDrug(drugId)

    // Get global rules
    const globalRules = await this.expertRuleRepository.findByYear(year)
      .then(rules => rules.filter(r => !r.microorganismId && !r.drugId))

    // Combine and deduplicate
    const allRules = [...specificRules, ...microorganismRules, ...drugRules, ...globalRules]
    const uniqueRules = allRules.filter((rule, index, self) => 
      index === self.findIndex(r => r.id === rule.id)
    )

    return uniqueRules.sort((a, b) => b.priority - a.priority)
  }

  async createExpertRule(
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
  ): Promise<ExpertRuleEntity> {
    const rule = ExpertRuleEntity.create(
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

    return await this.expertRuleRepository.save(rule)
  }

  async updateExpertRule(
    id: string,
    updates: Partial<{
      name: string
      description: string
      condition: string
      action: string
      priority: number
      notes: string
      isActive: boolean
    }>
  ): Promise<ExpertRuleEntity | null> {
    const existing = await this.expertRuleRepository.findById(id)
    if (!existing) return null

    const updated = new ExpertRuleEntity(
      existing.id,
      updates.name ?? existing.name,
      updates.description ?? existing.description,
      existing.ruleType,
      updates.condition ?? existing.condition,
      updates.action ?? existing.action,
      updates.priority ?? existing.priority,
      existing.year,
      existing.microorganismId,
      existing.drugId,
      existing.sourceReference,
      updates.notes ?? existing.notes,
      updates.isActive ?? existing.isActive,
      existing.createdAt,
      new Date()
    )

    return await this.expertRuleRepository.update(updated)
  }
}