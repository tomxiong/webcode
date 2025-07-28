import { LocalizationRepository } from '../../domain/repositories/LocalizationRepository.js'
import { Translation, Language, LocalizedContent, LocalizationConfig, SupportedLanguages, LocalizedEntity } from '../../domain/entities/Localization.js'
import { v4 as uuidv4 } from 'uuid'

export class LocalizationService {
  constructor(private localizationRepository: LocalizationRepository) {}

  // Translation management
  async createTranslation(key: string, language: string, value: string, context?: string): Promise<string> {
    const translation: Translation = {
      id: uuidv4(),
      key,
      language,
      value,
      context,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await this.localizationRepository.createTranslation(translation)
    return translation.id
  }

  async getTranslation(key: string, language: string, fallback = true): Promise<string | null> {
    let translation = await this.localizationRepository.getTranslation(key, language)
    
    if (!translation && fallback) {
      const config = await this.localizationRepository.getLocalizationConfig()
      if (language !== config.fallbackLanguage) {
        translation = await this.localizationRepository.getTranslation(key, config.fallbackLanguage)
      }
    }

    return translation?.value || null
  }

  async updateTranslation(id: string, value: string): Promise<void> {
    await this.localizationRepository.updateTranslation(id, {
      value,
      updatedAt: new Date().toISOString()
    })
  }

  async deleteTranslation(id: string): Promise<void> {
    await this.localizationRepository.deleteTranslation(id)
  }

  async listTranslations(language?: string, context?: string): Promise<Translation[]> {
    return this.localizationRepository.listTranslations(language, context)
  }

  // Batch operations
  async createTranslations(translations: { key: string, language: string, value: string, context?: string }[]): Promise<void> {
    const translationEntities = translations.map(t => ({
      id: uuidv4(),
      key: t.key,
      language: t.language,
      value: t.value,
      context: t.context,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))

    await this.localizationRepository.createTranslations(translationEntities)
  }

  async getTranslations(keys: string[], language: string): Promise<{ [key: string]: string }> {
    const translations = await this.localizationRepository.getTranslationsByKeys(keys, language)
    const result: { [key: string]: string } = {}
    
    translations.forEach(t => {
      result[t.key] = t.value
    })

    return result
  }

  // Language management
  async createLanguage(code: string, name: string, nativeName: string, isDefault = false): Promise<void> {
    const language: Language = {
      code,
      name,
      nativeName,
      isActive: true,
      isDefault,
      createdAt: new Date().toISOString()
    }

    await this.localizationRepository.createLanguage(language)
  }

  async getLanguage(code: string): Promise<Language | null> {
    return this.localizationRepository.getLanguage(code)
  }

  async updateLanguage(code: string, updates: Partial<Language>): Promise<void> {
    await this.localizationRepository.updateLanguage(code, updates)
  }

  async deleteLanguage(code: string): Promise<void> {
    await this.localizationRepository.deleteLanguage(code)
  }

  async listLanguages(activeOnly = true): Promise<Language[]> {
    return this.localizationRepository.listLanguages(activeOnly)
  }

  // Localized content management
  async localizeEntity(entityType: string, entityId: string, language: string, fields: { [field: string]: string }): Promise<void> {
    const contents = Object.entries(fields).map(([field, value]) => ({
      id: uuidv4(),
      entityType,
      entityId,
      language,
      field,
      value,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))

    await this.localizationRepository.createLocalizedContents(contents)
  }

  async getLocalizedEntity<T extends LocalizedEntity>(
    entity: T, 
    entityType: string, 
    language: string, 
    includeTranslations = false
  ): Promise<T> {
    const localizedContents = await this.localizationRepository.getLocalizedContent(entityType, entity.id, language)
    
    const localizedEntity = { ...entity }
    
    // Apply localized content
    localizedContents.forEach(content => {
      if (content.field in localizedEntity) {
        localizedEntity[content.field] = content.value
      }
    })

    // Include all translations if requested
    if (includeTranslations) {
      const availableLanguages = await this.localizationRepository.getAvailableLanguagesForEntity(entityType, entity.id)
      const translations: { [language: string]: { [field: string]: string } } = {}

      for (const lang of availableLanguages) {
        const contents = await this.localizationRepository.getLocalizedContent(entityType, entity.id, lang)
        translations[lang] = {}
        contents.forEach(content => {
          translations[lang][content.field] = content.value
        })
      }

      localizedEntity._translations = translations
    }

    return localizedEntity
  }

  async getLocalizedEntities<T extends LocalizedEntity>(
    entities: T[], 
    entityType: string, 
    language: string
  ): Promise<T[]> {
    if (entities.length === 0) return entities

    const entityIds = entities.map(e => e.id)
    const localizedContents = await this.localizationRepository.getLocalizedContentsByEntity(entityType, entityIds, language)
    
    // Group by entity ID
    const contentsByEntity: { [entityId: string]: LocalizedContent[] } = {}
    localizedContents.forEach(content => {
      if (!contentsByEntity[content.entityId]) {
        contentsByEntity[content.entityId] = []
      }
      contentsByEntity[content.entityId].push(content)
    })

    // Apply localized content to entities
    return entities.map(entity => {
      const localizedEntity = { ...entity }
      const contents = contentsByEntity[entity.id] || []
      
      contents.forEach(content => {
        if (content.field in localizedEntity) {
          localizedEntity[content.field] = content.value
        }
      })

      return localizedEntity
    })
  }

  // Configuration
  async getLocalizationConfig(): Promise<LocalizationConfig> {
    return this.localizationRepository.getLocalizationConfig()
  }

  async updateLocalizationConfig(config: Partial<LocalizationConfig>): Promise<void> {
    await this.localizationRepository.updateLocalizationConfig(config)
  }

  // Utility methods
  async getTranslationProgress(language: string): Promise<{ total: number, translated: number, percentage: number }> {
    return this.localizationRepository.getTranslationProgress(language)
  }

  async getMissingTranslations(language: string, context?: string): Promise<string[]> {
    return this.localizationRepository.getMissingTranslations(language, context)
  }

  async searchTranslations(query: string, language?: string): Promise<Translation[]> {
    return this.localizationRepository.searchTranslations(query, language)
  }

  // Predefined translations for CLSI standards
  async initializeStandardTranslations(): Promise<void> {
    const standardTranslations = [
      // English (default)
      { key: 'microorganism.escherichia_coli', language: 'en', value: 'Escherichia coli', context: 'microorganism' },
      { key: 'microorganism.staphylococcus_aureus', language: 'en', value: 'Staphylococcus aureus', context: 'microorganism' },
      { key: 'microorganism.pseudomonas_aeruginosa', language: 'en', value: 'Pseudomonas aeruginosa', context: 'microorganism' },
      
      // Chinese Simplified
      { key: 'microorganism.escherichia_coli', language: 'zh-CN', value: '大肠埃希菌', context: 'microorganism' },
      { key: 'microorganism.staphylococcus_aureus', language: 'zh-CN', value: '金黄色葡萄球菌', context: 'microorganism' },
      { key: 'microorganism.pseudomonas_aeruginosa', language: 'zh-CN', value: '铜绿假单胞菌', context: 'microorganism' },
      
      // Japanese
      { key: 'microorganism.escherichia_coli', language: 'ja', value: '大腸菌', context: 'microorganism' },
      { key: 'microorganism.staphylococcus_aureus', language: 'ja', value: '黄色ブドウ球菌', context: 'microorganism' },
      { key: 'microorganism.pseudomonas_aeruginosa', language: 'ja', value: '緑膿菌', context: 'microorganism' },
      
      // Drug names
      { key: 'drug.ampicillin', language: 'en', value: 'Ampicillin', context: 'drug' },
      { key: 'drug.ampicillin', language: 'zh-CN', value: '氨苄西林', context: 'drug' },
      { key: 'drug.ampicillin', language: 'ja', value: 'アンピシリン', context: 'drug' },
      
      { key: 'drug.ciprofloxacin', language: 'en', value: 'Ciprofloxacin', context: 'drug' },
      { key: 'drug.ciprofloxacin', language: 'zh-CN', value: '环丙沙星', context: 'drug' },
      { key: 'drug.ciprofloxacin', language: 'ja', value: 'シプロフロキサシン', context: 'drug' },
      
      // Test methods
      { key: 'method.disk_diffusion', language: 'en', value: 'Disk Diffusion', context: 'method' },
      { key: 'method.disk_diffusion', language: 'zh-CN', value: '纸片扩散法', context: 'method' },
      { key: 'method.disk_diffusion', language: 'ja', value: 'ディスク拡散法', context: 'method' },
      
      { key: 'method.broth_microdilution', language: 'en', value: 'Broth Microdilution', context: 'method' },
      { key: 'method.broth_microdilution', language: 'zh-CN', value: '肉汤微量稀释法', context: 'method' },
      { key: 'method.broth_microdilution', language: 'ja', value: 'ブロス微量希釈法', context: 'method' },
      
      // Interpretations
      { key: 'interpretation.susceptible', language: 'en', value: 'Susceptible', context: 'interpretation' },
      { key: 'interpretation.susceptible', language: 'zh-CN', value: '敏感', context: 'interpretation' },
      { key: 'interpretation.susceptible', language: 'ja', value: '感受性', context: 'interpretation' },
      
      { key: 'interpretation.intermediate', language: 'en', value: 'Intermediate', context: 'interpretation' },
      { key: 'interpretation.intermediate', language: 'zh-CN', value: '中介', context: 'interpretation' },
      { key: 'interpretation.intermediate', language: 'ja', value: '中間', context: 'interpretation' },
      
      { key: 'interpretation.resistant', language: 'en', value: 'Resistant', context: 'interpretation' },
      { key: 'interpretation.resistant', language: 'zh-CN', value: '耐药', context: 'interpretation' },
      { key: 'interpretation.resistant', language: 'ja', value: '耐性', context: 'interpretation' },
      
      // Expert rule types
      { key: 'rule.intrinsic_resistance', language: 'en', value: 'Intrinsic Resistance', context: 'rule' },
      { key: 'rule.intrinsic_resistance', language: 'zh-CN', value: '固有耐药', context: 'rule' },
      { key: 'rule.intrinsic_resistance', language: 'ja', value: '固有耐性', context: 'rule' },
      
      { key: 'rule.exceptional_phenotype', language: 'en', value: 'Exceptional Phenotype', context: 'rule' },
      { key: 'rule.exceptional_phenotype', language: 'zh-CN', value: '异常表型', context: 'rule' },
      { key: 'rule.exceptional_phenotype', language: 'ja', value: '例外的表現型', context: 'rule' }
    ]

    await this.createTranslations(standardTranslations)
  }

  // Initialize supported languages
  async initializeLanguages(): Promise<void> {
    const languages = [
      { code: 'en', name: 'English', nativeName: 'English', isDefault: true },
      { code: 'zh-CN', name: 'Chinese Simplified', nativeName: '简体中文', isDefault: false },
      { code: 'zh-TW', name: 'Chinese Traditional', nativeName: '繁體中文', isDefault: false },
      { code: 'ja', name: 'Japanese', nativeName: '日本語', isDefault: false },
      { code: 'ko', name: 'Korean', nativeName: '한국어', isDefault: false },
      { code: 'es', name: 'Spanish', nativeName: 'Español', isDefault: false },
      { code: 'fr', name: 'French', nativeName: 'Français', isDefault: false },
      { code: 'de', name: 'German', nativeName: 'Deutsch', isDefault: false },
      { code: 'it', name: 'Italian', nativeName: 'Italiano', isDefault: false },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português', isDefault: false },
      { code: 'ru', name: 'Russian', nativeName: 'Русский', isDefault: false },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', isDefault: false }
    ]

    for (const lang of languages) {
      await this.createLanguage(lang.code, lang.name, lang.nativeName, lang.isDefault)
    }
  }
}