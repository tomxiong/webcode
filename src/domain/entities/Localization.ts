export interface Translation {
  id: string
  key: string
  language: string
  value: string
  context?: string
  createdAt: string
  updatedAt: string
}

export interface Language {
  code: string
  name: string
  nativeName: string
  isActive: boolean
  isDefault: boolean
  createdAt: string
}

export interface LocalizedContent {
  id: string
  entityType: string
  entityId: string
  language: string
  field: string
  value: string
  createdAt: string
  updatedAt: string
}

export interface LocalizationConfig {
  defaultLanguage: string
  supportedLanguages: string[]
  fallbackLanguage: string
  autoDetect: boolean
  cacheEnabled: boolean
}

export type SupportedLanguages = 
  | 'en' // English
  | 'zh-CN' // Chinese Simplified
  | 'zh-TW' // Chinese Traditional
  | 'ja' // Japanese
  | 'ko' // Korean
  | 'es' // Spanish
  | 'fr' // French
  | 'de' // German
  | 'it' // Italian
  | 'pt' // Portuguese
  | 'ru' // Russian
  | 'ar' // Arabic

export interface LocalizedEntity {
  [key: string]: any
  _translations?: { [language: string]: { [field: string]: string } }
}