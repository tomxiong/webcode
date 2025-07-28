import { Database } from '../database/Database.js'
import { DocumentRepository } from '../../domain/repositories/DocumentRepository.js'
import { DocumentEntity, CreateDocumentRequest, UpdateDocumentRequest, DocumentSearchQuery, DocumentAssociation, CreateAssociationRequest, DocumentCategory, EntityType, AssociationType } from '../../domain/entities/Document.js'

export class SqliteDocumentRepository implements DocumentRepository {
  constructor(private database: Database) {}

  async findAll(): Promise<DocumentEntity[]> {
    const query = `
      SELECT d.*,
             COUNT(da.id) as association_count
      FROM documents d
      LEFT JOIN document_associations da ON d.id = da.document_id
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `
    const rows = await this.database.all(query)
    return rows.map(row => this.mapRowToEntity(row))
  }

  async findById(id: string): Promise<DocumentEntity | null> {
    const query = `
      SELECT d.*,
             COUNT(da.id) as association_count
      FROM documents d
      LEFT JOIN document_associations da ON d.id = da.document_id
      WHERE d.id = ?
      GROUP BY d.id
    `
    const row = await this.database.get(query, [id])
    if (!row) return null

    const document = this.mapRowToEntity(row)
    document.associations = await this.getAssociations(id)
    return document
  }

  async findByCategory(category: string): Promise<DocumentEntity[]> {
    const query = `
      SELECT d.*,
             COUNT(da.id) as association_count
      FROM documents d
      LEFT JOIN document_associations da ON d.id = da.document_id
      WHERE d.category = ?
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `
    const rows = await this.database.all(query, [category])
    return rows.map(row => this.mapRowToEntity(row))
  }

  async findByEntityAssociation(entityType: string, entityId: string): Promise<DocumentEntity[]> {
    const query = `
      SELECT d.*,
             COUNT(da2.id) as association_count
      FROM documents d
      INNER JOIN document_associations da ON d.id = da.document_id
      LEFT JOIN document_associations da2 ON d.id = da2.document_id
      WHERE da.entity_type = ? AND da.entity_id = ?
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `
    const rows = await this.database.all(query, [entityType, entityId])
    return rows.map(row => this.mapRowToEntity(row))
  }

  async search(query: DocumentSearchQuery): Promise<{ documents: DocumentEntity[], total: number }> {
    let sql = `
      SELECT d.*,
             COUNT(da.id) as association_count
      FROM documents d
      LEFT JOIN document_associations da ON d.id = da.document_id
    `
    
    const conditions: string[] = []
    const params: any[] = []

    if (query.query) {
      conditions.push('(d.title LIKE ? OR d.description LIKE ? OR d.tags LIKE ?)')
      const searchTerm = `%${query.query}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    if (query.category) {
      conditions.push('d.category = ?')
      params.push(query.category)
    }

    if (query.tags && query.tags.length > 0) {
      const tagConditions = query.tags.map(() => 'd.tags LIKE ?').join(' OR ')
      conditions.push(`(${tagConditions})`)
      query.tags.forEach(tag => params.push(`%"${tag}"%`))
    }

    if (query.entityType && query.entityId) {
      sql += ` INNER JOIN document_associations da_filter ON d.id = da_filter.document_id`
      conditions.push('da_filter.entity_type = ? AND da_filter.entity_id = ?')
      params.push(query.entityType, query.entityId)
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }

    sql += ` GROUP BY d.id ORDER BY d.created_at DESC`

    // Get total count
    const countSql = sql.replace(/SELECT d\.\*, COUNT\(da\.id\) as association_count/, 'SELECT COUNT(DISTINCT d.id) as total')
      .replace(/GROUP BY d\.id ORDER BY d\.created_at DESC/, '')
    const countResult = await this.database.get(countSql, params)
    const total = countResult?.total || 0

    // Apply pagination
    if (query.limit) {
      sql += ` LIMIT ${query.limit}`
      if (query.offset) {
        sql += ` OFFSET ${query.offset}`
      }
    }

    const rows = await this.database.all(sql, params)
    const documents = rows.map(row => this.mapRowToEntity(row))

    return { documents, total }
  }

  async save(document: CreateDocumentRequest, filePath: string, fileSize: number, mimeType: string, uploadedBy: string): Promise<DocumentEntity> {
    const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    
    const query = `
      INSERT INTO documents (
        id, title, description, file_name, file_path, file_size,
        mime_type, version, category, tags, uploaded_by,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const fileName = filePath.split('/').pop() || filePath
    const tags = document.tags ? JSON.stringify(document.tags) : '[]'
    
    await this.database.run(query, [
      id,
      document.title,
      document.description || null,
      fileName,
      filePath,
      fileSize,
      mimeType,
      document.version || '1.0',
      document.category,
      tags,
      uploadedBy,
      now.toISOString(),
      now.toISOString()
    ])

    const created = await this.findById(id)
    if (!created) {
      throw new Error('Failed to create document')
    }
    return created
  }

  async update(id: string, document: UpdateDocumentRequest): Promise<DocumentEntity | null> {
    const existing = await this.findById(id)
    if (!existing) {
      return null
    }

    const updates: string[] = []
    const values: any[] = []

    if (document.title !== undefined) {
      updates.push('title = ?')
      values.push(document.title)
    }
    if (document.description !== undefined) {
      updates.push('description = ?')
      values.push(document.description)
    }
    if (document.category !== undefined) {
      updates.push('category = ?')
      values.push(document.category)
    }
    if (document.tags !== undefined) {
      updates.push('tags = ?')
      values.push(JSON.stringify(document.tags))
    }
    if (document.version !== undefined) {
      updates.push('version = ?')
      values.push(document.version)
    }

    if (updates.length === 0) {
      return existing
    }

    updates.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    const query = `UPDATE documents SET ${updates.join(', ')} WHERE id = ?`
    await this.database.run(query, values)

    return await this.findById(id)
  }

  async delete(id: string): Promise<boolean> {
    // First delete all associations
    await this.database.run('DELETE FROM document_associations WHERE document_id = ?', [id])
    
    // Then delete the document
    const query = 'DELETE FROM documents WHERE id = ?'
    const result = await this.database.run(query, [id])
    return result.changes > 0
  }

  async createAssociation(documentId: string, association: CreateAssociationRequest): Promise<DocumentAssociation> {
    const id = `assoc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    
    const query = `
      INSERT INTO document_associations (
        id, document_id, entity_type, entity_id, association_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `
    
    await this.database.run(query, [
      id,
      documentId,
      association.entityType,
      association.entityId,
      association.associationType,
      now.toISOString()
    ])

    return {
      id,
      documentId,
      entityType: association.entityType,
      entityId: association.entityId,
      associationType: association.associationType,
      createdAt: now
    }
  }

  async removeAssociation(documentId: string, entityType: string, entityId: string): Promise<boolean> {
    const query = 'DELETE FROM document_associations WHERE document_id = ? AND entity_type = ? AND entity_id = ?'
    const result = await this.database.run(query, [documentId, entityType, entityId])
    return result.changes > 0
  }

  async getAssociations(documentId: string): Promise<DocumentAssociation[]> {
    const query = 'SELECT * FROM document_associations WHERE document_id = ? ORDER BY created_at DESC'
    const rows = await this.database.all(query, [documentId])
    
    return rows.map(row => ({
      id: row.id,
      documentId: row.document_id,
      entityType: row.entity_type as EntityType,
      entityId: row.entity_id,
      associationType: row.association_type as AssociationType,
      createdAt: new Date(row.created_at)
    }))
  }

  async getStatistics(): Promise<{
    totalDocuments: number
    documentsByCategory: Record<string, number>
    documentsByType: Record<string, number>
    totalFileSize: number
    averageFileSize: number
  }> {
    const totalQuery = 'SELECT COUNT(*) as count FROM documents'
    const totalResult = await this.database.get(totalQuery)
    
    const categoryQuery = 'SELECT category, COUNT(*) as count FROM documents GROUP BY category'
    const categoryResults = await this.database.all(categoryQuery)
    
    const typeQuery = 'SELECT mime_type, COUNT(*) as count FROM documents GROUP BY mime_type'
    const typeResults = await this.database.all(typeQuery)
    
    const sizeQuery = 'SELECT SUM(file_size) as total_size, AVG(file_size) as avg_size FROM documents'
    const sizeResult = await this.database.get(sizeQuery)

    return {
      totalDocuments: totalResult.count,
      documentsByCategory: categoryResults.reduce((acc: any, row: any) => {
        acc[row.category] = row.count
        return acc
      }, {}),
      documentsByType: typeResults.reduce((acc: any, row: any) => {
        acc[row.mime_type] = row.count
        return acc
      }, {}),
      totalFileSize: sizeResult.total_size || 0,
      averageFileSize: sizeResult.avg_size || 0
    }
  }

  private mapRowToEntity(row: any): DocumentEntity {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      fileName: row.file_name,
      filePath: row.file_path,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      version: row.version,
      category: row.category as DocumentCategory,
      tags: row.tags ? JSON.parse(row.tags) : [],
      uploadedBy: row.uploaded_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }
}