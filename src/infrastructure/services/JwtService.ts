import crypto from 'crypto'

export interface JwtPayload {
  userId: string
  username: string
  role: string
  exp: number
}

export class JwtService {
  private secret: string

  constructor() {
    this.secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
  }

  generateToken(payload: Omit<JwtPayload, 'exp'>): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    }

    const now = Math.floor(Date.now() / 1000)
    const fullPayload: JwtPayload = {
      ...payload,
      exp: now + (24 * 60 * 60) // 24 hours
    }

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header))
    const encodedPayload = this.base64UrlEncode(JSON.stringify(fullPayload))
    
    const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`)
    
    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return null
      }

      const [encodedHeader, encodedPayload, signature] = parts
      
      // Verify signature
      const expectedSignature = this.createSignature(`${encodedHeader}.${encodedPayload}`)
      if (signature !== expectedSignature) {
        return null
      }

      // Decode payload
      const payload = JSON.parse(this.base64UrlDecode(encodedPayload)) as JwtPayload
      
      // Check expiration
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp < now) {
        return null
      }

      return payload
    } catch (error) {
      return null
    }
  }

  private createSignature(data: string): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(data)
      .digest('base64url')
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  private base64UrlDecode(str: string): string {
    // Add padding if needed
    const padding = '='.repeat((4 - (str.length % 4)) % 4)
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding
    return Buffer.from(base64, 'base64').toString()
  }
}