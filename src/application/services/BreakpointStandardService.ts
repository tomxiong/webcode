import { BreakpointStandardRepository } from '../../domain/repositories/BreakpointStandardRepository.js'
import { BreakpointStandardEntity, TestMethod, SensitivityResult } from '../../domain/entities/BreakpointStandard.js'

export interface BreakpointQuery {
  microorganismId: string
  drugId: string
  year?: number
  method?: TestMethod
}

export interface BreakpointComparison {
  microorganismId: string
  drugId: string
  method: TestMethod
  standards: {
    year: number
    standard: BreakpointStandardEntity
  }[]
  changes: BreakpointChange[]
}

export interface BreakpointChange {
  year: number
  changeType: 'susceptible' | 'intermediate' | 'resistant' | 'method' | 'notes'
  oldValue?: any
  newValue?: any
  description: string
}

export interface InterpretationResult {
  result: SensitivityResult
  standard: BreakpointStandardEntity
  confidence: 'high' | 'medium' | 'low'
  notes?: string
}

export class BreakpointStandardService {
  constructor(
    private breakpointRepository: BreakpointStandardRepository
  ) {}

  async findBreakpoints(query: BreakpointQuery): Promise<BreakpointStandardEntity[]> {
    return await this.breakpointRepository.findByMicroorganismAndDrug(
      query.microorganismId,
      query.drugId,
      query.year
    )
  }

  async getLatestBreakpoint(
    microorganismId: string,
    drugId: string,
    method?: TestMethod
  ): Promise<BreakpointStandardEntity | null> {
    const standards = await this.breakpointRepository.findByMicroorganismAndDrug(
      microorganismId,
      drugId
    )

    if (standards.length === 0) return null

    // Filter by method if specified
    const filtered = method 
      ? standards.filter(s => s.method === method)
      : standards

    if (filtered.length === 0) return null

    // Return the most recent standard
    return filtered.sort((a, b) => b.year - a.year)[0]
  }

  async interpretResult(
    microorganismId: string,
    drugId: string,
    testValue: number,
    method: TestMethod,
    year?: number
  ): Promise<InterpretationResult | null> {
    // Find appropriate standard
    let standard: BreakpointStandardEntity | null

    if (year) {
      const standards = await this.breakpointRepository.findByMicroorganismAndDrug(
        microorganismId,
        drugId,
        year
      )
      standard = standards.find(s => s.method === method) || null
    } else {
      standard = await this.getLatestBreakpoint(microorganismId, drugId, method)
    }

    if (!standard) return null

    const result = standard.interpretResult(testValue)
    const confidence = this.calculateConfidence(standard, testValue, result)

    return {
      result,
      standard,
      confidence,
      notes: this.generateInterpretationNotes(standard, testValue, result)
    }
  }

  async compareBreakpointVersions(
    microorganismId: string,
    drugId: string,
    method?: TestMethod
  ): Promise<BreakpointComparison[]> {
    const allStandards = await this.breakpointRepository.findHistoricalVersions(
      microorganismId,
      drugId
    )

    // Group by method
    const groupedByMethod = allStandards.reduce((acc, standard) => {
      if (!acc[standard.method]) {
        acc[standard.method] = []
      }
      acc[standard.method].push(standard)
      return acc
    }, {} as Record<TestMethod, BreakpointStandardEntity[]>)

    const comparisons: BreakpointComparison[] = []

    for (const [methodKey, standards] of Object.entries(groupedByMethod)) {
      if (method && methodKey !== method) continue

      const sortedStandards = standards.sort((a, b) => a.year - b.year)
      const changes = this.detectChanges(sortedStandards)

      comparisons.push({
        microorganismId,
        drugId,
        method: methodKey as TestMethod,
        standards: sortedStandards.map(s => ({
          year: s.year,
          standard: s
        })),
        changes
      })
    }

    return comparisons
  }

  async getAvailableYears(): Promise<number[]> {
    const allStandards = await this.breakpointRepository.findAll()
    const years = [...new Set(allStandards.map(s => s.year))]
    return years.sort((a, b) => b - a)
  }

  async getStandardsByYear(year: number): Promise<BreakpointStandardEntity[]> {
    return await this.breakpointRepository.findByYear(year)
  }

  async createBreakpointStandard(
    microorganismId: string,
    drugId: string,
    year: number,
    method: TestMethod,
    breakpoints: {
      susceptibleMin?: number
      susceptibleMax?: number
      intermediateMin?: number
      intermediateMax?: number
      resistantMin?: number
      resistantMax?: number
    },
    notes?: string,
    sourceDocument?: string
  ): Promise<BreakpointStandardEntity> {
    const standard = BreakpointStandardEntity.create(
      microorganismId,
      drugId,
      year,
      method,
      breakpoints,
      notes,
      sourceDocument
    )

    return await this.breakpointRepository.save(standard)
  }

  async updateBreakpointStandard(
    id: string,
    updates: Partial<{
      susceptibleMin: number
      susceptibleMax: number
      intermediateMin: number
      intermediateMax: number
      resistantMin: number
      resistantMax: number
      notes: string
      sourceDocument: string
      isActive: boolean
    }>
  ): Promise<BreakpointStandardEntity | null> {
    const existing = await this.breakpointRepository.findById(id)
    if (!existing) return null

    const updated = new BreakpointStandardEntity(
      existing.id,
      existing.microorganismId,
      existing.drugId,
      existing.year,
      existing.method,
      updates.susceptibleMin ?? existing.susceptibleMin,
      updates.susceptibleMax ?? existing.susceptibleMax,
      updates.intermediateMin ?? existing.intermediateMin,
      updates.intermediateMax ?? existing.intermediateMax,
      updates.resistantMin ?? existing.resistantMin,
      updates.resistantMax ?? existing.resistantMax,
      updates.notes ?? existing.notes,
      updates.sourceDocument ?? existing.sourceDocument,
      updates.isActive ?? existing.isActive,
      existing.createdAt,
      new Date()
    )

    return await this.breakpointRepository.update(updated)
  }

  private calculateConfidence(
    standard: BreakpointStandardEntity,
    testValue: number,
    result: SensitivityResult
  ): 'high' | 'medium' | 'low' {
    // Calculate confidence based on how close the value is to breakpoint boundaries
    if (standard.method === TestMethod.DISK_DIFFUSION) {
      if (result === SensitivityResult.SUSCEPTIBLE && standard.susceptibleMin) {
        const margin = testValue - standard.susceptibleMin
        return margin >= 3 ? 'high' : margin >= 1 ? 'medium' : 'low'
      }
      if (result === SensitivityResult.RESISTANT && standard.intermediateMin) {
        const margin = standard.intermediateMin - testValue
        return margin >= 3 ? 'high' : margin >= 1 ? 'medium' : 'low'
      }
    } else {
      // MIC methods
      if (result === SensitivityResult.SUSCEPTIBLE && standard.susceptibleMax) {
        const ratio = testValue / standard.susceptibleMax
        return ratio <= 0.5 ? 'high' : ratio <= 0.8 ? 'medium' : 'low'
      }
      if (result === SensitivityResult.RESISTANT && standard.intermediateMax) {
        const ratio = testValue / standard.intermediateMax
        return ratio >= 2 ? 'high' : ratio >= 1.5 ? 'medium' : 'low'
      }
    }

    return result === SensitivityResult.INTERMEDIATE ? 'low' : 'medium'
  }

  private generateInterpretationNotes(
    standard: BreakpointStandardEntity,
    testValue: number,
    result: SensitivityResult
  ): string {
    const notes = []

    if (standard.notes) {
      notes.push(`Standard notes: ${standard.notes}`)
    }

    if (result === SensitivityResult.INTERMEDIATE) {
      notes.push('Intermediate results may require clinical correlation and consideration of alternative therapy.')
    }

    if (standard.method === TestMethod.DISK_DIFFUSION) {
      notes.push(`Zone diameter: ${testValue}mm`)
    } else {
      notes.push(`MIC: ${testValue} μg/mL`)
    }

    return notes.join(' ')
  }

  private detectChanges(standards: BreakpointStandardEntity[]): BreakpointChange[] {
    const changes: BreakpointChange[] = []

    for (let i = 1; i < standards.length; i++) {
      const prev = standards[i - 1]
      const curr = standards[i]

      // Check susceptible breakpoints
      if (prev.susceptibleMin !== curr.susceptibleMin || prev.susceptibleMax !== curr.susceptibleMax) {
        changes.push({
          year: curr.year,
          changeType: 'susceptible',
          oldValue: { min: prev.susceptibleMin, max: prev.susceptibleMax },
          newValue: { min: curr.susceptibleMin, max: curr.susceptibleMax },
          description: `Susceptible breakpoint changed from ${prev.susceptibleMin}-${prev.susceptibleMax} to ${curr.susceptibleMin}-${curr.susceptibleMax}`
        })
      }

      // Check intermediate breakpoints
      if (prev.intermediateMin !== curr.intermediateMin || prev.intermediateMax !== curr.intermediateMax) {
        changes.push({
          year: curr.year,
          changeType: 'intermediate',
          oldValue: { min: prev.intermediateMin, max: prev.intermediateMax },
          newValue: { min: curr.intermediateMin, max: curr.intermediateMax },
          description: `Intermediate breakpoint changed from ${prev.intermediateMin}-${prev.intermediateMax} to ${curr.intermediateMin}-${curr.intermediateMax}`
        })
      }

      // Check resistant breakpoints
      if (prev.resistantMin !== curr.resistantMin || prev.resistantMax !== curr.resistantMax) {
        changes.push({
          year: curr.year,
          changeType: 'resistant',
          oldValue: { min: prev.resistantMin, max: prev.resistantMax },
          newValue: { min: curr.resistantMin, max: curr.resistantMax },
          description: `Resistant breakpoint changed from ${prev.resistantMin}-${prev.resistantMax} to ${curr.resistantMin}-${curr.resistantMax}`
        })
      }

      // Check notes
      if (prev.notes !== curr.notes) {
        changes.push({
          year: curr.year,
          changeType: 'notes',
          oldValue: prev.notes,
          newValue: curr.notes,
          description: 'Notes updated'
        })
      }
    }

    return changes
  }
}