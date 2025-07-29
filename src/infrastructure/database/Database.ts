import sqlite3 from 'sqlite3'
import { promisify } from 'util'

export class Database {
  private db: sqlite3.Database
  private initialized = false

  constructor(private dbPath: string = './clsi_platform.db') {
    this.db = new sqlite3.Database(dbPath)
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    await this.createTables()
    this.initialized = true
  }

  private async createTables(): Promise<void> {
    const run = promisify(this.db.run.bind(this.db))

    // Users table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MICROBIOLOGIST', 'LAB_TECHNICIAN', 'VIEWER')),
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Microorganisms table
    await run(`
      CREATE TABLE IF NOT EXISTS microorganisms (
        id TEXT PRIMARY KEY,
        genus TEXT NOT NULL,
        group_name TEXT,
        species TEXT NOT NULL,
        common_name TEXT,
        description TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(genus, group_name, species)
      )
    `)

    // Drugs table
    await run(`
      CREATE TABLE IF NOT EXISTS drugs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('antibiotic', 'antifungal', 'antiviral', 'antimycobacterial')),
        description TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Breakpoint standards table
    await run(`
      CREATE TABLE IF NOT EXISTS breakpoint_standards (
        id TEXT PRIMARY KEY,
        microorganism_id TEXT NOT NULL,
        drug_id TEXT NOT NULL,
        year INTEGER NOT NULL,
        method TEXT NOT NULL CHECK (method IN ('disk_diffusion', 'broth_microdilution', 'agar_dilution', 'etest')),
        susceptible_min REAL,
        susceptible_max REAL,
        intermediate_min REAL,
        intermediate_max REAL,
        resistant_min REAL,
        resistant_max REAL,
        notes TEXT,
        source_document TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (microorganism_id) REFERENCES microorganisms (id),
        FOREIGN KEY (drug_id) REFERENCES drugs (id),
        UNIQUE(microorganism_id, drug_id, year, method)
      )
    `)

    // Expert rules table
    await run(`
      CREATE TABLE IF NOT EXISTS expert_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        rule_type TEXT NOT NULL CHECK (rule_type IN ('intrinsic_resistance', 'acquired_resistance', 'phenotype_confirmation', 'quality_control', 'reporting_guidance')),
        microorganism_id TEXT,
        drug_id TEXT,
        condition_expr TEXT NOT NULL,
        action_expr TEXT NOT NULL,
        priority INTEGER NOT NULL DEFAULT 0,
        year INTEGER NOT NULL,
        source_reference TEXT,
        notes TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (microorganism_id) REFERENCES microorganisms (id),
        FOREIGN KEY (drug_id) REFERENCES drugs (id)
      )
    `)

    // Samples table
    await run(`
      CREATE TABLE IF NOT EXISTS samples (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        sample_type TEXT NOT NULL CHECK (sample_type IN ('blood', 'urine', 'sputum', 'wound', 'csf', 'stool', 'throat', 'other')),
        collection_date DATETIME NOT NULL,
        received_date DATETIME NOT NULL,
        specimen_source TEXT NOT NULL,
        clinical_info TEXT,
        requesting_physician TEXT,
        priority TEXT NOT NULL CHECK (priority IN ('routine', 'urgent', 'stat')),
        status TEXT NOT NULL CHECK (status IN ('received', 'processing', 'completed', 'cancelled', 'on_hold')),
        barcode_id TEXT,
        comments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Lab results table
    await run(`
      CREATE TABLE IF NOT EXISTS lab_results (
        id TEXT PRIMARY KEY,
        sample_id TEXT NOT NULL,
        microorganism_id TEXT NOT NULL,
        drug_id TEXT NOT NULL,
        test_method TEXT NOT NULL CHECK (test_method IN ('disk_diffusion', 'broth_microdilution', 'agar_dilution', 'e_test', 'automated', 'molecular')),
        raw_result TEXT NOT NULL,
        interpretation TEXT CHECK (interpretation IN ('S', 'I', 'R', 'NT', 'NI')),
        breakpoint_used TEXT,
        expert_rule_applied TEXT, -- JSON array of rule IDs
        validation_status TEXT NOT NULL CHECK (validation_status IN ('pending', 'validated', 'rejected', 'requires_review')),
        validation_comments TEXT,
        technician TEXT NOT NULL,
        reviewed_by TEXT,
        test_date DATETIME NOT NULL,
        report_date DATETIME,
        instrument_id TEXT,
        quality_control_passed BOOLEAN DEFAULT 0,
        comments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sample_id) REFERENCES samples (id),
        FOREIGN KEY (microorganism_id) REFERENCES microorganisms (id),
        FOREIGN KEY (drug_id) REFERENCES drugs (id)
      )
    `)

    // Documents table
    await run(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        version TEXT NOT NULL DEFAULT '1.0',
        category TEXT NOT NULL CHECK (category IN ('clsi_standard', 'reference_paper', 'guideline', 'manual', 'protocol', 'other')),
        tags TEXT NOT NULL DEFAULT '[]',
        uploaded_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Document associations table
    await run(`
      CREATE TABLE IF NOT EXISTS document_associations (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        entity_type TEXT NOT NULL CHECK (entity_type IN ('microorganism', 'drug', 'breakpoint_standard', 'expert_rule')),
        entity_id TEXT NOT NULL,
        association_type TEXT NOT NULL CHECK (association_type IN ('reference', 'guideline', 'validation_source', 'protocol', 'supporting_document')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
      )
    `)

    // Reports table
    await run(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL CHECK (type IN ('sample_summary', 'lab_results_analysis', 'expert_rules_usage', 'quality_control', 'breakpoint_compliance', 'document_usage', 'user_activity', 'system_performance')),
        parameters TEXT NOT NULL,
        format TEXT NOT NULL CHECK (format IN ('pdf', 'excel', 'csv', 'json', 'html')),
        schedule TEXT,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_run_at DATETIME,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `)

    // Report results table
    await run(`
      CREATE TABLE IF NOT EXISTS report_results (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL,
        generated_at DATETIME NOT NULL,
        parameters TEXT NOT NULL,
        data TEXT NOT NULL,
        summary TEXT NOT NULL,
        file_path TEXT,
        file_size INTEGER,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
      )
    `)

    // Dashboards table
    await run(`
      CREATE TABLE IF NOT EXISTS dashboards (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        widgets TEXT NOT NULL DEFAULT '[]',
        layout TEXT NOT NULL CHECK (layout IN ('grid', 'flex')),
        is_public BOOLEAN DEFAULT 0,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `)

    // Export requests table
    await run(`
      CREATE TABLE IF NOT EXISTS export_requests (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('standards', 'rules', 'microorganisms', 'drugs', 'full_system')),
        format TEXT NOT NULL CHECK (format IN ('json', 'csv', 'excel', 'xml')),
        filters TEXT NOT NULL DEFAULT '{}',
        options TEXT NOT NULL DEFAULT '{}',
        requested_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        file_path TEXT,
        file_size INTEGER,
        download_url TEXT,
        expires_at DATETIME,
        FOREIGN KEY (requested_by) REFERENCES users(id)
      )
    `)

    // Import requests table
    await run(`
      CREATE TABLE IF NOT EXISTS import_requests (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('standards', 'rules', 'microorganisms', 'drugs', 'full_system')),
        format TEXT NOT NULL CHECK (format IN ('json', 'csv', 'excel', 'xml')),
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        options TEXT NOT NULL DEFAULT '{}',
        requested_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL CHECK (status IN ('pending', 'validating', 'importing', 'completed', 'failed')),
        validation_results TEXT NOT NULL DEFAULT '[]',
        import_results TEXT NOT NULL DEFAULT '{}',
        FOREIGN KEY (requested_by) REFERENCES users(id)
      )
    `)

    // Export templates table
    await run(`
      CREATE TABLE IF NOT EXISTS export_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL CHECK (type IN ('standards', 'rules', 'microorganisms', 'drugs')),
        format TEXT NOT NULL CHECK (format IN ('json', 'csv', 'excel', 'xml')),
        fields TEXT NOT NULL,
        filters TEXT NOT NULL DEFAULT '{}',
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_default BOOLEAN DEFAULT 0,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `)

    // Backup records table
    await run(`
      CREATE TABLE IF NOT EXISTS backup_records (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('export', 'import', 'scheduled')),
        description TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        metadata TEXT NOT NULL DEFAULT '{}',
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `)

    // Translations table
    await run(`
      CREATE TABLE IF NOT EXISTS translations (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL,
        language TEXT NOT NULL,
        value TEXT NOT NULL,
        context TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(key, language)
      )
    `)

    // Languages table
    await run(`
      CREATE TABLE IF NOT EXISTS languages (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        native_name TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        is_default BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Localized content table
    await run(`
      CREATE TABLE IF NOT EXISTS localized_content (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        language TEXT NOT NULL,
        field TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(entity_type, entity_id, language, field)
      )
    `)

    // Localization configuration table
    await run(`
      CREATE TABLE IF NOT EXISTS localization_config (
        id INTEGER PRIMARY KEY DEFAULT 1,
        default_language TEXT NOT NULL DEFAULT 'en',
        supported_languages TEXT NOT NULL DEFAULT '["en"]',
        fallback_language TEXT NOT NULL DEFAULT 'en',
        auto_detect BOOLEAN DEFAULT 0,
        cache_enabled BOOLEAN DEFAULT 1
      )
    `)

    // Create indexes for better performance
    await run('CREATE INDEX IF NOT EXISTS idx_microorganisms_genus ON microorganisms(genus)')
    await run('CREATE INDEX IF NOT EXISTS idx_drugs_code ON drugs(code)')
    await run('CREATE INDEX IF NOT EXISTS idx_breakpoint_standards_year ON breakpoint_standards(year)')
    await run('CREATE INDEX IF NOT EXISTS idx_expert_rules_type ON expert_rules(rule_type)')
    await run('CREATE INDEX IF NOT EXISTS idx_samples_collection_date ON samples(collection_date)')
    await run('CREATE INDEX IF NOT EXISTS idx_lab_results_test_date ON lab_results(test_date)')
    await run('CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)')
    await run('CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by)')
    await run('CREATE INDEX IF NOT EXISTS idx_document_associations_entity ON document_associations(entity_type, entity_id)')
    await run('CREATE INDEX IF NOT EXISTS idx_document_associations_document ON document_associations(document_id)')
    await run('CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type)')
    await run('CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by)')
    await run('CREATE INDEX IF NOT EXISTS idx_report_results_report_id ON report_results(report_id)')
    await run('CREATE INDEX IF NOT EXISTS idx_dashboards_created_by ON dashboards(created_by)')
    await run('CREATE INDEX IF NOT EXISTS idx_export_requests_status ON export_requests(status)')
    await run('CREATE INDEX IF NOT EXISTS idx_export_requests_requested_by ON export_requests(requested_by)')
    await run('CREATE INDEX IF NOT EXISTS idx_import_requests_status ON import_requests(status)')
    await run('CREATE INDEX IF NOT EXISTS idx_import_requests_requested_by ON import_requests(requested_by)')
    await run('CREATE INDEX IF NOT EXISTS idx_export_templates_type ON export_templates(type)')
    await run('CREATE INDEX IF NOT EXISTS idx_backup_records_created_by ON backup_records(created_by)')
    await run('CREATE INDEX IF NOT EXISTS idx_translations_key ON translations(key)')
    await run('CREATE INDEX IF NOT EXISTS idx_translations_language ON translations(language)')
    await run('CREATE INDEX IF NOT EXISTS idx_translations_context ON translations(context)')
    await run('CREATE INDEX IF NOT EXISTS idx_localized_content_entity ON localized_content(entity_type, entity_id)')
    await run('CREATE INDEX IF NOT EXISTS idx_localized_content_language ON localized_content(language)')
  }

  async run(sql: string, params: any[] = []): Promise<{ changes: number; lastID: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({ changes: this.changes, lastID: this.lastID })
        }
      })
    })
  }

  async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve(row as T | undefined)
        }
      })
    })
  }

  async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows as T[])
        }
      })
    })
  }

  async close(): Promise<void> {
    const close = promisify(this.db.close.bind(this.db))
    await close()
  }
}

// Singleton instance
export const database = new Database()