import { Hono } from 'hono'
import { LocalizationService } from '../../application/services/LocalizationService.js'
import { authMiddleware } from '../middleware/AuthMiddleware.js'

export class LocalizationRoutes {
  private app = new Hono()

  constructor(private localizationService: LocalizationService) {
    this.setupRoutes()
  }

  private setupRoutes() {
    // All routes require authentication
    this.app.use('*', authMiddleware)

    // Translation management
    this.app.post('/translations', async (c) => {
      try {
        const { key, language, value, context } = await c.req.json()

        const translationId = await this.localizationService.createTranslation(key, language, value, context)

        return c.json({
          success: true,
          data: { id: translationId }
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 400)
      }
    })

    this.app.get('/translations', async (c) => {
      try {
        const language = c.req.query('language')
        const context = c.req.query('context')

        const translations = await this.localizationService.listTranslations(language, context)

        return c.json({
          success: true,
          data: translations
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 500)
      }
    })

    this.app.get('/translations/:key', async (c) => {
      try {
        const key = c.req.param('key')
        const language = c.req.query('language') || 'en'

        const translation = await this.localizationService.getTranslation(key, language)

        if (!translation) {
          return c.json({
            success: false,
            error: 'Translation not found'
          }, 404)
        }

        return c.json({
          success: true,
          data: { key, language, value: translation }
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 500)
      }
    })

    this.app.put('/translations/:id', async (c) => {
      try {
        const id = c.req.param('id')
        const { value } = await c.req.json()

        await this.localizationService.updateTranslation(id, value)

        return c.json({
          success: true,
          message: 'Translation updated successfully'
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 400)
      }
    })

    this.app.delete('/translations/:id', async (c) => {
      try {
        const id = c.req.param('id')

        await this.localizationService.deleteTranslation(id)

        return c.json({
          success: true,
          message: 'Translation deleted successfully'
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 500)
      }
    })

    // Batch translation operations
    this.app.post('/translations/batch', async (c) => {
      try {
        const { translations } = await c.req.json()

        await this.localizationService.createTranslations(translations)

        return c.json({
          success: true,
          message: 'Translations created successfully'
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 400)
      }
    })

    this.app.post('/translations/get-batch', async (c) => {
      try {
        const { keys, language } = await c.req.json()

        const translations = await this.localizationService.getTranslations(keys, language)

        return c.json({
          success: true,
          data: translations
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 400)
      }
    })

    // Language management
    this.app.post('/languages', async (c) => {
      try {
        const { code, name, nativeName, isDefault } = await c.req.json()

        // Only admins can manage languages
        if (c.get('user').role !== 'admin') {
          return c.json({
            success: false,
            error: 'Admin access required'
          }, 403)
        }

        await this.localizationService.createLanguage(code, name, nativeName, isDefault)

        return c.json({
          success: true,
          message: 'Language created successfully'
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 400)
      }
    })

    this.app.get('/languages', async (c) => {
      try {
        const activeOnly = c.req.query('active') === 'true'

        const languages = await this.localizationService.listLanguages(activeOnly)

        return c.json({
          success: true,
          data: languages
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 500)
      }
    })

    this.app.get('/languages/:code', async (c) => {
      try {
        const code = c.req.param('code')

        const language = await this.localizationService.getLanguage(code)

        if (!language) {
          return c.json({
            success: false,
            error: 'Language not found'
          }, 404)
        }

        return c.json({
          success: true,
          data: language
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 500)
      }
    })

    this.app.put('/languages/:code', async (c) => {
      try {
        const code = c.req.param('code')
        const updates = await c.req.json()

        // Only admins can manage languages
        if (c.get('user').role !== 'admin') {
          return c.json({
            success: false,
            error: 'Admin access required'
          }, 403)
        }

        await this.localizationService.updateLanguage(code, updates)

        return c.json({
          success: true,
          message: 'Language updated successfully'
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 400)
      }
    })

    // Entity localization
    this.app.post('/entities/:entityType/:entityId/localize', async (c) => {
      try {
        const entityType = c.req.param('entityType')
        const entityId = c.req.param('entityId')
        const { language, fields } = await c.req.json()

        await this.localizationService.localizeEntity(entityType, entityId, language, fields)

        return c.json({
          success: true,
          message: 'Entity localized successfully'
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 400)
      }
    })

    // Configuration
    this.app.get('/config', async (c) => {
      try {
        const config = await this.localizationService.getLocalizationConfig()

        return c.json({
          success: true,
          data: config
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 500)
      }
    })

    this.app.put('/config', async (c) => {
      try {
        const config = await c.req.json()

        // Only admins can update configuration
        if (c.get('user').role !== 'admin') {
          return c.json({
            success: false,
            error: 'Admin access required'
          }, 403)
        }

        await this.localizationService.updateLocalizationConfig(config)

        return c.json({
          success: true,
          message: 'Configuration updated successfully'
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 400)
      }
    })

    // Utility endpoints
    this.app.get('/progress/:language', async (c) => {
      try {
        const language = c.req.param('language')

        const progress = await this.localizationService.getTranslationProgress(language)

        return c.json({
          success: true,
          data: progress
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 500)
      }
    })

    this.app.get('/missing/:language', async (c) => {
      try {
        const language = c.req.param('language')
        const context = c.req.query('context')

        const missing = await this.localizationService.getMissingTranslations(language, context)

        return c.json({
          success: true,
          data: missing
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 500)
      }
    })

    this.app.get('/search', async (c) => {
      try {
        const query = c.req.query('q')
        const language = c.req.query('language')

        if (!query) {
          return c.json({
            success: false,
            error: 'Query parameter is required'
          }, 400)
        }

        const results = await this.localizationService.searchTranslations(query, language)

        return c.json({
          success: true,
          data: results
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 500)
      }
    })

    // Initialize standard translations
    this.app.post('/initialize', async (c) => {
      try {
        // Only admins can initialize
        if (c.get('user').role !== 'admin') {
          return c.json({
            success: false,
            error: 'Admin access required'
          }, 403)
        }

        await this.localizationService.initializeLanguages()
        await this.localizationService.initializeStandardTranslations()

        return c.json({
          success: true,
          message: 'Localization system initialized successfully'
        })
      } catch (error: any) {
        return c.json({
          success: false,
          error: error.message
        }, 500)
      }
    })
  }

  getRoutes() {
    return this.app
  }
}