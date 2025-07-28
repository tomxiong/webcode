import { Database } from './Database.js'
import { UserEntity, UserRole } from '../../domain/entities/User.js'
import { MicroorganismEntity } from '../../domain/entities/Microorganism.js'
import { DrugEntity, DrugCategory } from '../../domain/entities/Drug.js'
import { BreakpointStandardEntity, TestMethod } from '../../domain/entities/BreakpointStandard.js'
import { ExpertRuleEntity, ExpertRuleType } from '../../domain/entities/ExpertRule.js'

export class DatabaseSeeder {
  constructor(private database: Database) {}

  async seed(): Promise<void> {
    console.log('🌱 Starting database seeding...')
    
    await this.seedUsers()
    await this.seedMicroorganisms()
    await this.seedDrugs()
    await this.seedBreakpointStandards()
    await this.seedExpertRules()
    
    console.log('✅ Database seeding completed')
  }

  private async seedUsers(): Promise<void> {
    const { createHash } = await import('crypto')
    
    const users = [
      new UserEntity(
        'admin-001',
        'admin',
        'admin@clsi-platform.com',
        createHash('sha256').update('admin123').digest('hex'),
        UserRole.ADMIN,
        true,
        new Date(),
        new Date()
      ),
      new UserEntity(
        'microbiologist-001',
        'microbiologist',
        'micro@clsi-platform.com',
        createHash('sha256').update('micro123').digest('hex'),
        UserRole.MICROBIOLOGIST,
        true,
        new Date(),
        new Date()
      ),
      new UserEntity(
        'technician-001',
        'technician',
        'tech@clsi-platform.com',
        createHash('sha256').update('tech123').digest('hex'),
        UserRole.LAB_TECHNICIAN,
        true,
        new Date(),
        new Date()
      ),
      new UserEntity(
        'viewer-001',
        'viewer',
        'viewer@clsi-platform.com',
        createHash('sha256').update('view123').digest('hex'),
        UserRole.VIEWER,
        true,
        new Date(),
        new Date()
      )
    ]

    for (const user of users) {
      await this.database.run(`
        INSERT OR REPLACE INTO users (id, username, email, password_hash, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user.id,
        user.username,
        user.email,
        user.passwordHash,
        user.role,
        user.isActive ? 1 : 0,
        user.createdAt.toISOString(),
        user.updatedAt.toISOString()
      ])
    }

    console.log('👥 Users seeded')
  }

  private async seedMicroorganisms(): Promise<void> {
    const microorganisms = [
      // Enterobacteriaceae
      MicroorganismEntity.create('Escherichia', 'Enterobacteriaceae', 'coli', 'E. coli'),
      MicroorganismEntity.create('Klebsiella', 'Enterobacteriaceae', 'pneumoniae', 'K. pneumoniae'),
      MicroorganismEntity.create('Enterobacter', 'Enterobacteriaceae', 'cloacae', 'E. cloacae'),
      MicroorganismEntity.create('Proteus', 'Enterobacteriaceae', 'mirabilis', 'P. mirabilis'),
      
      // Staphylococcus
      MicroorganismEntity.create('Staphylococcus', 'Gram-positive cocci', 'aureus', 'S. aureus'),
      MicroorganismEntity.create('Staphylococcus', 'Gram-positive cocci', 'epidermidis', 'S. epidermidis'),
      
      // Streptococcus
      MicroorganismEntity.create('Streptococcus', 'Gram-positive cocci', 'pneumoniae', 'S. pneumoniae'),
      MicroorganismEntity.create('Streptococcus', 'Gram-positive cocci', 'pyogenes', 'S. pyogenes'),
      
      // Pseudomonas
      MicroorganismEntity.create('Pseudomonas', 'Non-fermentative GNR', 'aeruginosa', 'P. aeruginosa'),
      
      // Acinetobacter
      MicroorganismEntity.create('Acinetobacter', 'Non-fermentative GNR', 'baumannii', 'A. baumannii')
    ]

    for (const microorganism of microorganisms) {
      await this.database.run(`
        INSERT OR IGNORE INTO microorganisms (id, genus, group_name, species, common_name, description, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        microorganism.id,
        microorganism.genus,
        microorganism.group,
        microorganism.species,
        microorganism.commonName,
        microorganism.description,
        microorganism.isActive ? 1 : 0,
        microorganism.createdAt.toISOString(),
        microorganism.updatedAt.toISOString()
      ])
    }

    console.log('🦠 Microorganisms seeded')
  }

  private async seedDrugs(): Promise<void> {
    const drugs = [
      // Beta-lactams
      DrugEntity.create('Ampicillin', 'AMP', DrugCategory.ANTIBIOTIC, 'Beta-lactam antibiotic'),
      DrugEntity.create('Amoxicillin/Clavulanate', 'AMC', DrugCategory.ANTIBIOTIC, 'Beta-lactam with beta-lactamase inhibitor'),
      DrugEntity.create('Ceftriaxone', 'CRO', DrugCategory.ANTIBIOTIC, 'Third-generation cephalosporin'),
      DrugEntity.create('Cefepime', 'FEP', DrugCategory.ANTIBIOTIC, 'Fourth-generation cephalosporin'),
      DrugEntity.create('Meropenem', 'MEM', DrugCategory.ANTIBIOTIC, 'Carbapenem antibiotic'),
      
      // Fluoroquinolones
      DrugEntity.create('Ciprofloxacin', 'CIP', DrugCategory.ANTIBIOTIC, 'Fluoroquinolone antibiotic'),
      DrugEntity.create('Levofloxacin', 'LEV', DrugCategory.ANTIBIOTIC, 'Fluoroquinolone antibiotic'),
      
      // Aminoglycosides
      DrugEntity.create('Gentamicin', 'GEN', DrugCategory.ANTIBIOTIC, 'Aminoglycoside antibiotic'),
      DrugEntity.create('Amikacin', 'AMK', DrugCategory.ANTIBIOTIC, 'Aminoglycoside antibiotic'),
      
      // Others
      DrugEntity.create('Trimethoprim/Sulfamethoxazole', 'SXT', DrugCategory.ANTIBIOTIC, 'Folate synthesis inhibitor'),
      DrugEntity.create('Vancomycin', 'VAN', DrugCategory.ANTIBIOTIC, 'Glycopeptide antibiotic'),
      DrugEntity.create('Linezolid', 'LZD', DrugCategory.ANTIBIOTIC, 'Oxazolidinone antibiotic')
    ]

    for (const drug of drugs) {
      await this.database.run(`
        INSERT OR IGNORE INTO drugs (id, name, code, category, description, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        drug.id,
        drug.name,
        drug.code,
        drug.category,
        drug.description,
        drug.isActive ? 1 : 0,
        drug.createdAt.toISOString(),
        drug.updatedAt.toISOString()
      ])
    }

    console.log('💊 Drugs seeded')
  }

  private async seedBreakpointStandards(): Promise<void> {
    // Get microorganism and drug IDs for reference
    const microorganisms = await this.database.all<any>('SELECT id, genus, species FROM microorganisms WHERE is_active = 1')
    const drugs = await this.database.all<any>('SELECT id, code FROM drugs WHERE is_active = 1')

    // Create lookup maps
    const microMap = new Map(microorganisms.map(m => [`${m.genus}_${m.species}`, m.id]))
    const drugMap = new Map(drugs.map(d => [d.code, d.id]))

    // CLSI 2024 Breakpoint Standards - Sample data
    const breakpointData = [
      // E. coli - Ampicillin (Disk Diffusion)
      {
        microorganism: 'Escherichia_coli',
        drug: 'AMP',
        year: 2024,
        method: TestMethod.DISK_DIFFUSION,
        susceptibleMin: 17,
        intermediateMin: 14,
        intermediateMax: 16,
        resistantMax: 13,
        notes: 'Zone diameter interpretive criteria',
        sourceDocument: 'CLSI M100-S34'
      },
      // E. coli - Ampicillin (MIC)
      {
        microorganism: 'Escherichia_coli',
        drug: 'AMP',
        year: 2024,
        method: TestMethod.BROTH_MICRODILUTION,
        susceptibleMax: 8,
        intermediateMin: 16,
        intermediateMax: 16,
        resistantMin: 32,
        notes: 'MIC interpretive criteria in μg/mL',
        sourceDocument: 'CLSI M100-S34'
      },
      // E. coli - Ciprofloxacin (Disk Diffusion)
      {
        microorganism: 'Escherichia_coli',
        drug: 'CIP',
        year: 2024,
        method: TestMethod.DISK_DIFFUSION,
        susceptibleMin: 21,
        intermediateMin: 16,
        intermediateMax: 20,
        resistantMax: 15,
        notes: 'Zone diameter interpretive criteria',
        sourceDocument: 'CLSI M100-S34'
      },
      // E. coli - Ciprofloxacin (MIC)
      {
        microorganism: 'Escherichia_coli',
        drug: 'CIP',
        year: 2024,
        method: TestMethod.BROTH_MICRODILUTION,
        susceptibleMax: 1,
        intermediateMin: 2,
        intermediateMax: 2,
        resistantMin: 4,
        notes: 'MIC interpretive criteria in μg/mL',
        sourceDocument: 'CLSI M100-S34'
      },
      // S. aureus - Vancomycin (MIC only)
      {
        microorganism: 'Staphylococcus_aureus',
        drug: 'VAN',
        year: 2024,
        method: TestMethod.BROTH_MICRODILUTION,
        susceptibleMax: 2,
        intermediateMin: 4,
        intermediateMax: 8,
        resistantMin: 16,
        notes: 'MIC interpretive criteria in μg/mL. Disk diffusion not recommended.',
        sourceDocument: 'CLSI M100-S34'
      },
      // P. aeruginosa - Meropenem (Disk Diffusion)
      {
        microorganism: 'Pseudomonas_aeruginosa',
        drug: 'MEM',
        year: 2024,
        method: TestMethod.DISK_DIFFUSION,
        susceptibleMin: 16,
        intermediateMin: 14,
        intermediateMax: 15,
        resistantMax: 13,
        notes: 'Zone diameter interpretive criteria',
        sourceDocument: 'CLSI M100-S34'
      },
      // P. aeruginosa - Meropenem (MIC)
      {
        microorganism: 'Pseudomonas_aeruginosa',
        drug: 'MEM',
        year: 2024,
        method: TestMethod.BROTH_MICRODILUTION,
        susceptibleMax: 4,
        intermediateMin: 8,
        intermediateMax: 8,
        resistantMin: 16,
        notes: 'MIC interpretive criteria in μg/mL',
        sourceDocument: 'CLSI M100-S34'
      },
      // Historical data - CLSI 2023 for comparison
      // E. coli - Ciprofloxacin (MIC) - 2023 version
      {
        microorganism: 'Escherichia_coli',
        drug: 'CIP',
        year: 2023,
        method: TestMethod.BROTH_MICRODILUTION,
        susceptibleMax: 1,
        intermediateMin: 2,
        intermediateMax: 2,
        resistantMin: 4,
        notes: 'MIC interpretive criteria in μg/mL (2023 version)',
        sourceDocument: 'CLSI M100-S33'
      }
    ]

    for (const bp of breakpointData) {
      const microorganismId = microMap.get(bp.microorganism)
      const drugId = drugMap.get(bp.drug)

      if (!microorganismId || !drugId) {
        console.warn(`Skipping breakpoint: microorganism ${bp.microorganism} or drug ${bp.drug} not found`)
        continue
      }

      const standard = BreakpointStandardEntity.create(
        microorganismId,
        drugId,
        bp.year,
        bp.method,
        {
          susceptibleMin: bp.susceptibleMin,
          susceptibleMax: bp.susceptibleMax,
          intermediateMin: bp.intermediateMin,
          intermediateMax: bp.intermediateMax,
          resistantMin: bp.resistantMin,
          resistantMax: bp.resistantMax
        },
        bp.notes,
        bp.sourceDocument
      )

      await this.database.run(`
        INSERT OR IGNORE INTO breakpoint_standards (
          id, microorganism_id, drug_id, year, method,
          susceptible_min, susceptible_max, intermediate_min, intermediate_max,
          resistant_min, resistant_max, notes, source_document,
          is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        standard.id,
        standard.microorganismId,
        standard.drugId,
        standard.year,
        standard.method,
        standard.susceptibleMin,
        standard.susceptibleMax,
        standard.intermediateMin,
        standard.intermediateMax,
        standard.resistantMin,
        standard.resistantMax,
        standard.notes,
        standard.sourceDocument,
        standard.isActive ? 1 : 0,
        standard.createdAt.toISOString(),
        standard.updatedAt.toISOString()
      ])
    }

    console.log('📊 Breakpoint standards seeded')
  }

  private async seedExpertRules(): Promise<void> {
    // Get microorganism and drug IDs for reference
    const microorganisms = await this.database.all<any>('SELECT id, genus, species FROM microorganisms WHERE is_active = 1')
    const drugs = await this.database.all<any>('SELECT id, code FROM drugs WHERE is_active = 1')

    // Create lookup maps
    const microMap = new Map(microorganisms.map(m => [`${m.genus}_${m.species}`, m.id]))
    const drugMap = new Map(drugs.map(d => [d.code, d.id]))

    // Expert Rules Data
    const expertRulesData = [
      // Intrinsic Resistance Rules
      {
        name: 'E. coli Ampicillin Intrinsic Resistance',
        description: 'E. coli shows intrinsic resistance to ampicillin due to chromosomal beta-lactamase',
        ruleType: ExpertRuleType.INTRINSIC_RESISTANCE,
        microorganism: 'Escherichia_coli',
        drug: 'AMP',
        condition: 'interpretedResult === "susceptible" && testValue < 14',
        action: 'Flag as possible false susceptible - verify organism identification and test procedure',
        priority: 9,
        year: 2024,
        sourceReference: 'CLSI M100-S34',
        notes: 'E. coli typically shows resistance to ampicillin'
      },
      // Quality Control Rules
      {
        name: 'Vancomycin Disk Diffusion QC',
        description: 'Vancomycin should not be tested by disk diffusion for Staphylococcus',
        ruleType: ExpertRuleType.QUALITY_CONTROL,
        microorganism: 'Staphylococcus_aureus',
        drug: 'VAN',
        condition: 'testMethod === "disk_diffusion"',
        action: 'Use broth microdilution method for vancomycin susceptibility testing',
        priority: 8,
        year: 2024,
        sourceReference: 'CLSI M100-S34',
        notes: 'Disk diffusion is not reliable for vancomycin testing'
      },
      // Acquired Resistance Rules
      {
        name: 'Pseudomonas Carbapenem Resistance',
        description: 'Pseudomonas aeruginosa carbapenem resistance detection',
        ruleType: ExpertRuleType.ACQUIRED_RESISTANCE,
        microorganism: 'Pseudomonas_aeruginosa',
        drug: 'MEM',
        condition: 'interpretedResult === "resistant"',
        action: 'Consider carbapenemase production - perform confirmatory testing',
        priority: 7,
        year: 2024,
        sourceReference: 'CLSI M100-S34',
        notes: 'Carbapenem resistance in Pseudomonas may indicate carbapenemase'
      },
      // Phenotype Confirmation Rules
      {
        name: 'ESBL Phenotype Confirmation',
        description: 'Extended-spectrum beta-lactamase phenotype confirmation',
        ruleType: ExpertRuleType.PHENOTYPE_CONFIRMATION,
        microorganism: 'Escherichia_coli',
        drug: 'CRO',
        condition: 'interpretedResult === "resistant" && testValue <= 22',
        action: 'Perform ESBL confirmatory testing with clavulanate',
        priority: 6,
        year: 2024,
        sourceReference: 'CLSI M100-S34',
        notes: 'Ceftriaxone resistance may indicate ESBL production'
      },
      // Reporting Guidance Rules
      {
        name: 'Ciprofloxacin Reporting Guidance',
        description: 'Fluoroquinolone reporting guidance for Enterobacteriaceae',
        ruleType: ExpertRuleType.REPORTING_GUIDANCE,
        microorganism: 'Escherichia_coli',
        drug: 'CIP',
        condition: 'interpretedResult === "intermediate"',
        action: 'Consider clinical context - intermediate results may predict treatment failure',
        priority: 5,
        year: 2024,
        sourceReference: 'CLSI M100-S34',
        notes: 'Intermediate fluoroquinolone results require clinical correlation'
      }
    ]

    for (const rule of expertRulesData) {
      const microorganismId = rule.microorganism ? microMap.get(rule.microorganism) : undefined
      const drugId = rule.drug ? drugMap.get(rule.drug) : undefined

      const expertRule = ExpertRuleEntity.create(
        rule.name,
        rule.description,
        rule.ruleType,
        rule.condition,
        rule.action,
        rule.priority,
        rule.year,
        microorganismId,
        drugId,
        rule.sourceReference,
        rule.notes
      )

      await this.database.run(`
        INSERT OR IGNORE INTO expert_rules (
          id, name, description, rule_type, microorganism_id, drug_id,
          condition_expr, action_expr, priority, year, source_reference,
          notes, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        expertRule.id,
        expertRule.name,
        expertRule.description,
        expertRule.ruleType,
        expertRule.microorganismId,
        expertRule.drugId,
        expertRule.condition,
        expertRule.action,
        expertRule.priority,
        expertRule.year,
        expertRule.sourceReference,
        expertRule.notes,
        expertRule.isActive ? 1 : 0,
        expertRule.createdAt.toISOString(),
        expertRule.updatedAt.toISOString()
      ])
    }

    console.log('🧠 Expert rules seeded')
  }
}