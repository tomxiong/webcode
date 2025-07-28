import { Translation, Language, LocalizedContent, LocalizationConfig } from '../entities/Localization.js'

export interface LocalizationRepository {
  // Translation management
  createTranslation(translation: Translation): Promise<void>
  getTranslation(key: string, language: string): Promise<Translation | null>
  updateTranslation(id: string, updates: Partial<Translation>): Promise<void>
  deleteTranslation(id: string): Promise<void>
  listTranslations(language?: string, context?: string): Promise<Translation[]>
  
  // Batch translation operations
  createTranslations(translations: Translation[]): Promise<void>
  getTranslationsByKeys(keys: string[], language: string): Promise<Translation[]>
  
  // Language management
  createLanguage(language: Language): Promise<void>
  getLanguage(code: string): Promise<Language | null>
  updateLanguage(code: string, updates: Partial<Language>): Promise<void>
  deleteLanguage(code: string): Promise<void>
  listLanguages(activeOnly?: boolean): Promise<Language[]>
  
  // Localized content management
  createLocalizedContent(content: LocalizedContent): Promise<void>
  getLocalizedContent(entityType: string, entityId: string, language: string): Promise<LocalizedContent[]>
  updateLocalizedContent(id: string, updates: Partial<LocalizedContent>): Promise<void>
  deleteLocalizedContent(id: string): Promise<void>
  
  // Batch localized content operations
  createLocalizedContents(contents: LocalizedContent[]): Promise<void>
  getLocalizedContentsByEntity(entityType: string, entityIds: string[], language: string): Promise<LocalizedContent[]>
  
  // Configuration
  getLocalizationConfig(): Promise<LocalizationConfig>
  updateLocalizationConfig(config: Partial<LocalizationConfig>): Promise<void>
  
  // Utility methods
  getAvailableLanguagesForEntity(entityType: string, entityId: string): Promise<string[]>
  getMissingTranslations(language: string, context?: string): Promise<string[]>
  getTranslationProgress(language: string): Promise<{ total: number, translated: number, percentage: number }>
  
  // Search and filtering
  searchTranslations(query: string, language?: string): Promise<Translation[]>
  getTranslationsByContext(context: string, language?: string): Promise<Translation[]>
}