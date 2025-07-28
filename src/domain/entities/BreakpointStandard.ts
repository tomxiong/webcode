export interface BreakpointStandard {
  id: string
  microorganismId: string
  drugId: string
  year: number
  susceptibleMin?: number
  susceptibleMax?: number
  intermediateMin?: number
  intermediateMax?: number
  resistantMin?: number
  resistantMax?: number
  method: TestMethod
  notes?: string
  sourceDocument?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export enum TestMethod {
  DISK_DIFFUSION = 'disk_diffusion',
  BROTH_MICRODILUTION = 'broth_microdilution',
  AGAR_DILUTION = 'agar_dilution',
  ETEST = 'etest'
}

export enum SensitivityResult {
  SUSCEPTIBLE = 'susceptible',
  INTERMEDIATE = 'intermediate',
  RESISTANT = 'resistant'
}

export class BreakpointStandardEntity {
  constructor(
    public readonly id: string,
    public readonly microorganismId: string,
    public readonly drugId: string,
    public readonly year: number,
    public readonly method: TestMethod,
    public readonly susceptibleMin?: number,
    public readonly susceptibleMax?: number,
    public readonly intermediateMin?: number,
    public readonly intermediateMax?: number,
    public readonly resistantMin?: number,
    public readonly resistantMax?: number,
    public readonly notes?: string,
    public readonly sourceDocument?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
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
  ): BreakpointStandardEntity {
    return new BreakpointStandardEntity(
      `bp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      microorganismId,
      drugId,
      year,
      method,
      breakpoints.susceptibleMin,
      breakpoints.susceptibleMax,
      breakpoints.intermediateMin,
      breakpoints.intermediateMax,
      breakpoints.resistantMin,
      breakpoints.resistantMax,
      notes,
      sourceDocument
    )
  }

  interpretResult(value: number): SensitivityResult {
    // For disk diffusion (zone diameter - larger is more susceptible)
    if (this.method === TestMethod.DISK_DIFFUSION) {
      if (this.susceptibleMin && value >= this.susceptibleMin) {
        return SensitivityResult.SUSCEPTIBLE
      }
      if (this.intermediateMin && this.intermediateMax && 
          value >= this.intermediateMin && value <= this.intermediateMax) {
        return SensitivityResult.INTERMEDIATE
      }
      return SensitivityResult.RESISTANT
    }
    
    // For MIC methods (smaller is more susceptible)
    if (this.susceptibleMax && value <= this.susceptibleMax) {
      return SensitivityResult.SUSCEPTIBLE
    }
    if (this.intermediateMin && this.intermediateMax && 
        value >= this.intermediateMin && value <= this.intermediateMax) {
      return SensitivityResult.INTERMEDIATE
    }
    return SensitivityResult.RESISTANT
  }
}