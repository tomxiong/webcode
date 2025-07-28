import { Database } from '../database/Database.js'
import { LocalizationRepository } from '../../domain/repositories/LocalizationRepository.js'
import { Translation, Language, LocalizedContent, LocalizationConfig } from '../../domain/entities/Localization.js'

export class SqliteLocalizationRepository implements LocalizationRepository {
  constructor(private database: Database) {}

  // Translation management
  async createTranslation(translation: Translation): Promise<void> {
    await this.database.run(`
      INSERT INTO translations (id, key, language, value, context, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      translation.id, translation.key, translation.language, translation.value,
      translation.context || null, translation.createdAt, translation.updatedAt
    ])
  }

  async getTranslation(key: string, language: string): Promise<Translation | null> {
    const row = await this.database.get<any>(`
      SELECT * FROM translations WHERE key = ? AND language = ?
    `, [key, language])

    if (!row) return null

    return {
      id: row.id,
      key: row.key,
      language: row.language,
      value: row.value,
      context: row.context,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  async updateTranslation(id: string, updates: Partial<Translation>): Promise<void> {
    const fields = []
    const values = []

    if (updates.value) {
      fields.push('value = ?')
      values.push(updates.value)
    }
    if (updates.context !== undefined) {
      fields.push('context = ?')
      values.push(updates.context)
    }
    if (updates.updatedAt) {
      fields.push('updated_at = ?')
      values.push(updates.updatedAt)
    }

    if (fields.length > 0) {
      values.push(id)
      await this.database.run(`
        UPDATE translations SET ${fields.join(', ')} WHERE id = ?
      `, values)
    }
  }

  async deleteTranslation(id: string): Promise<void> {
    await this.database.run('DELETE FROM translations WHERE id = ?', [id])
  }

  async listTranslations(language?: string, context?: string): Promise<Translation[]> {
    let query = 'SELECT * FROM translations WHERE 1=1'
    const params = []

    if (language) {
      query += ' AND language = ?'
      params.push(language)
    }
    if (context) {
      query += ' AND context = ?'
      params.push(context)
    }

    query += ' ORDER BY key ASC'

    const rows = await this.database.all<any>(query, params)
    return rows.map((row: any) => ({
      id: row.id,
      key: row.key,
      language: row.language,
      value: row.value,
      context: row.context,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  }

  // Batch translation operations
  async createTranslations(translations: Translation[]): Promise<void> {
    const stmt = await this.database.prepare(`
      INSERT INTO translations (id, key, language, value, context, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    for (const translation of translations) {
      await stmt.run([
        translation.id, translation.key, translation.language, translation.value,
        translation.context || null, translation.createdAt, translation.updatedAt
      ])
    }

    await stmt.finalize()
  }

  async getTranslationsByKeys(keys: string[], language: string): Promise<Translation[]> {
    if (keys.length === 0) return []

    const placeholders = keys.map(() => '?').join(',')
    const rows = await this.database.all<any>(`
      SELECT * FROM translations 
      WHERE key IN (${placeholders}) AND language = ?
      ORDER BY key ASC
    `, [...keys, language])

    return rows.map((row: any) => ({
      id: row.id,
      key: row.key,
      language: row.language,
      value: row.value,
      context: row.context,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  }

  // Language management
  async createLanguage(language: Language): Promise<void> {
    await this.database.run(`
      INSERT INTO languages (code, name, native_name, is_active, is_default, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      language.code, language.name, language.nativeName,
      language.isActive, language.isDefault, language.createdAt
    ])
  }

  async getLanguage(code: string): Promise<Language | null> {
    const row = await this.database.get<any>(`
      SELECT * FROM languages WHERE code = ?
    `, [code])

    if (!row) return null

    return {
      code: row.code,
      name: row.name,
      nativeName: row.native_name,
      isActive: row.is_active,
      isDefault: row.is_default,
      createdAt: row.created_at
    }
  }

  async updateLanguage(code: string, updates: Partial<Language>): Promise<void> {
    const fields = []
    const values = []

    if (updates.name) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.nativeName) {
      fields.push('native_name = ?')
      values.push(updates.nativeName)
    }
    if (updates.isActive !== undefined) {
      fields.push('is_active = ?')
      values.push(updates.isActive)
    }
    if (updates.isDefault !== undefined) {
      fields.push('is_default = ?')
      values.push(updates.isDefault)
    }

    if (fields.length > 0) {
      values.push(code)
      await this.database.run(`
        UPDATE languages SET ${fields.join(', ')} WHERE code = ?
      `, values)
    }
  }

  async deleteLanguage(code: string): Promise<void> {
    await this.database.run('DELETE FROM languages WHERE code = ?', [code])
  }

  async listLanguages(activeOnly = false): Promise<Language[]> {
    let query = 'SELECT * FROM languages'
    const params = []

    if (activeOnly) {
      query += ' WHERE is_active = ?'
      params.push(true)
    }

    query += ' ORDER BY is_default DESC, name ASC'

    const rows = await this.database.all<any>(query, params)
    return rows.map((row: any) => ({
      code: row.code,
      name: row.name,
      nativeName: row.native_name,
      isActive: row.is_active,
      isDefault: row.is_default,
      createdAt: row.created_at
    }))
  }

  // Localized content management
  async createLocalizedContent(content: LocalizedContent): Promise<void> {
    await this.database.run(`
      INSERT INTO localized_content (id, entity_type, entity_id, language, field, value, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      content.id, content.entityType, content.entityId, content.language,
      content.field, content.value, content.createdAt, content.updatedAt
    ])
  }

  async getLocalizedContent(entityType: string, entityId: string, language: string): Promise<LocalizedContent[]> {
    const rows = await this.database.all<any>(`
      SELECT * FROM localized_content 
      WHERE entity_type = ? AND entity_id = ? AND language = ?
      ORDER BY field ASC
    `, [entityType, entityId, language])

    return rows.map((row: any) => ({
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      language: row.language,
      field: row.field,
      value: row.value,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  }

  async updateLocalizedContent(id: string, updates: Partial<LocalizedContent>): Promise<void> {
    const fields = []
    const values = []

    if (updates.value) {
      fields.push('value = ?')
      values.push(updates.value)
    }
    if (updates.updatedAt) {
      fields.push('updated_at = ?')
      values.push(updates.updatedAt)
    }

    if (fields.length > 0) {
      values.push(id)
      await this.database.run(`
        UPDATE localized_content SET ${fields.join(', ')} WHERE id = ?
      `, values)
    }
  }

  async deleteLocalizedContent(id: string): Promise<void> {
    await this.database.run('DELETE FROM localized_content WHERE id = ?', [id])
  }

  // Batch localized content operations
  async createLocalizedContents(contents: LocalizedContent[]): Promise<void> {
    const stmt = await this.database.prepare(`
      INSERT INTO localized_content (id, entity_type, entity_id, language, field, value, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const content of contents) {
      await stmt.run([
        content.id, content.entityType, content.entityId, content.language,
        content.field, content.value, content.createdAt, content.updatedAt
      ])
    }

    await stmt.finalize()
  }

  async getLocalizedContentsByEntity(entityType: string, entityIds: string[], language: string): Promise<LocalizedContent[]> {
    if (entityIds.length === 0) return []

    const placeholders = entityIds.map(() => '?').join(',')
    const rows = await this.database.all<any>(`
      SELECT * FROM localized_content 
      WHERE entity_type = ? AND entity_id IN (${placeholders}) AND language = ?
      ORDER BY entity_id ASC, field ASC
    `, [entityType, ...entityIds, language])

    return rows.map((row: any) => ({
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      language: row.language,
      field: row.field,
      value: row.value,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  }

  // Configuration
  async getLocalizationConfig(): Promise<LocalizationConfig> {
    const row = await this.database.get<any>(`
      SELECT * FROM localization_config LIMIT 1
    `)

    if (!row) {
      // Return default configuration
      return {
        defaultLanguage: 'en',
        supportedLanguages: ['en'],
        fallbackLanguage: 'en',
        autoDetect: false,
        cacheEnabled: true
      }
    }

    return {
      defaultLanguage: row.default_language,
      supportedLanguages: JSON.parse(row.supported_languages),
      fallbackLanguage: row.fallback_language,
      autoDetect: row.auto_detect,
      cacheEnabled: row.cache_enabled
    }
  }

  async updateLocalizationConfig(config: Partial<LocalizationConfig>): Promise<void> {
    const currentConfig = await this.getLocalizationConfig()
    const updatedConfig = { ...currentConfig, ...config }

    await this.database.run(`
      INSERT OR REPLACE INTO localization_config 
      (id, default_language, supported_languages, fallback_language, auto_detect, cache_enabled)
      VALUES (1, ?, ?, ?, ?, ?)
    `, [
      updatedConfig.defaultLanguage,
      JSON.stringify(updatedConfig.supportedLanguages),
      updatedConfig.fallbackLanguage,
      updatedConfig.autoDetect,
      updatedConfig.cacheEnabled
    ])
  }

  // Utility methods
  async getAvailableLanguagesForEntity(entityType: string, entityId: string): Promise<string[]> {
    const rows = await this.database.all<any>(`
      SELECT DISTINCT language FROM localized_content 
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY language ASC
    `, [entityType, entityId])

    return rows.map((row: any) => row.language)
  }

  async getMissingTranslations(language: string, context?: string): Promise<string[]> {
    let query = `
      SELECT DISTINCT t1.key 
      FROM translations t1 
      LEFT JOIN translations t2 ON t1.key = t2.key AND t2.language = ?
      WHERE t1.language = 'en' AND t2.key IS NULL
    `
    const params = [language]

    if (context) {
      query += ' AND t1.context = ?'
      params.push(context)
    }

    query += ' ORDER BY t1.key ASC'

    const rows = await this.database.all<any>(query, params)
    return rows.map((row: any) => row.key)
  }

  async getTranslationProgress(language: string): Promise<{ total: number, translated: number, percentage: number }> {
    const [totalResult, translatedResult] = await Promise.all([
      this.database.get<any>(`
        SELECT COUNT(DISTINCT key) as count FROM translations WHERE language = 'en'
      `),
      this.database.get<any>(`
        SELECT COUNT(DISTINCT key) as count FROM translations WHERE language = ?
      `, [language])
    ])

    const total = totalResult?.count || 0
    const translated = translatedResult?.count || 0
    const percentage = total > 0 ? Math.round((translated / total) * 100) : 0

    return { total, translated, percentage }
  }

  // Search and filtering
  async searchTranslations(query: string, language?: string): Promise<Translation[]> {
    let sql = `
      SELECT * FROM translations 
      WHERE (key LIKE ? OR value LIKE ?)
    `
    const params = [`%${query}%`, `%${query}%`]

    if (language) {
      sql += ' AND language = ?'
      params.push(language)
    }

    sql += ' ORDER BY key ASC'

    const rows = await this.database.all<any>(sql, params)
    return rows.map((row: any) => ({
      id: row.id,
      key: row.key,
      language: row.language,
      value: row.value,
      context: row.context,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  }

  async getTranslationsByContext(context: string, language?: string): Promise<Translation[]> {
    let query = 'SELECT * FROM translations WHERE context = ?'
    const params = [context]

    if (language) {
      query += ' AND language = ?'
      params.push(language)
    }

    query += ' ORDER BY key ASC'

    const rows = await this.database.all<any>(query, params)
    return rows.map((row: any) => ({
      id: row.id,
      key: row.key,
      language: row.language,
      value: row.value,
      context: row.context,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  }
}