import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExpertRuleService } from '../../../application/services/ExpertRuleService.js'
import { ExpertRule } from '../../../domain/entities/ExpertRule.js'

const mockExpertRuleRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  findByType: vi.fn(),
  findByMicroorganism: vi.fn(),
  findByDrug: vi.fn(),
  search: vi.fn(),
  getStatistics: vi.fn(),
  validateResult: vi.fn()
}

describe('ExpertRuleService', () => {
  let expertRuleService: ExpertRuleService

  beforeEach(() => {
    vi.clearAllMocks()
    expertRuleService = new ExpertRuleService(mockExpertRuleRepository as any)
  })

  describe('createExpertRule', () => {
    it('should successfully create an expert rule', async () => {
      const ruleData = {
        name: 'Test Rule',
        type: 'intrinsic_resistance' as const,
        description: 'Test description',
        condition: 'test condition',
        action: 'test action',
        priority: 1,
        isActive: true,
        microorganismId: 'micro1',
        drugId: 'drug1'
      }

      mockExpertRuleRepository.create.mockResolvedValue('rule1')

      const result = await expertRuleService.createExpertRule(ruleData)

      expect(result).toBe('rule1')
      expect(mockExpertRuleRepository.create).toHaveBeenCalledWith(
        expect.any(ExpertRule)
      )
    })
  })

  describe('getExpertRule', () => {
    it('should return expert rule when found', async () => {
      const mockRule = new ExpertRule(
        'rule1',
        'Test Rule',
        'intrinsic_resistance',
        'Test description',
        'test condition',
        'test action',
        1,
        true,
        'micro1',
        'drug1',
        new Date(),
        new Date()
      )

      mockExpertRuleRepository.findById.mockResolvedValue(mockRule)

      const result = await expertRuleService.getExpertRule('rule1')

      expect(result).toEqual(mockRule)
    })

    it('should return null when rule not found', async () => {
      mockExpertRuleRepository.findById.mockResolvedValue(null)

      const result = await expertRuleService.getExpertRule('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('listExpertRules', () => {
    it('should return list of expert rules with pagination', async () => {
      const mockRules = [
        new ExpertRule('rule1', 'Rule 1', 'intrinsic_resistance', 'Desc 1', 'cond1', 'action1', 1, true, 'micro1', 'drug1', new Date(), new Date()),
        new ExpertRule('rule2', 'Rule 2', 'quality_control', 'Desc 2', 'cond2', 'action2', 2, true, 'micro2', 'drug2', new Date(), new Date())
      ]

      const mockResult = {
        rules: mockRules,
        total: 2,
        limit: 10,
        offset: 0
      }

      mockExpertRuleRepository.list.mockResolvedValue(mockResult)

      const result = await expertRuleService.listExpertRules(10, 0)

      expect(result).toEqual(mockResult)
    })
  })

  describe('validateResult', () => {
    it('should validate lab result against expert rules', async () => {
      const mockValidationResult = {
        isValid: true,
        appliedRules: ['rule1', 'rule2'],
        warnings: [],
        errors: []
      }

      mockExpertRuleRepository.validateResult.mockResolvedValue(mockValidationResult)

      const result = await expertRuleService.validateResult('micro1', 'drug1', 'S', 16)

      expect(result).toEqual(mockValidationResult)
      expect(mockExpertRuleRepository.validateResult).toHaveBeenCalledWith('micro1', 'drug1', 'S', 16)
    })
  })

  describe('getStatistics', () => {
    it('should return expert rule statistics', async () => {
      const mockStats = {
        totalRules: 146,
        activeRules: 140,
        rulesByType: {
          intrinsic_resistance: 30,
          quality_control: 29,
          acquired_resistance: 29,
          phenotype_confirmation: 29,
          reporting_guidance: 29
        },
        averagePriority: 2.5
      }

      mockExpertRuleRepository.getStatistics.mockResolvedValue(mockStats)

      const result = await expertRuleService.getStatistics()

      expect(result).toEqual(mockStats)
    })
  })
})