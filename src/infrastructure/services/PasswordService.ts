import { createHash, randomBytes, timingSafeEqual, pbkdf2 } from 'node:crypto'
import { promisify } from 'node:util'

const pbkdf2Async = promisify(pbkdf2)

export class PasswordService {
  private readonly saltLength = 32
  private readonly iterations = 100000
  private readonly keyLength = 64
  private readonly digest = 'sha512'

  async hash(password: string): Promise<string> {
    const salt = randomBytes(this.saltLength)
    const derivedKey = await pbkdf2Async(password, salt, this.iterations, this.keyLength, this.digest)
    
    // Combine salt and hash
    const hash = Buffer.concat([salt, derivedKey])
    return hash.toString('base64')
  }

  async verify(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const hash = Buffer.from(hashedPassword, 'base64')
      const salt = hash.subarray(0, this.saltLength)
      const storedHash = hash.subarray(this.saltLength)
      
      const derivedKey = await pbkdf2Async(password, salt, this.iterations, this.keyLength, this.digest)
      
      // Use timing-safe comparison
      return timingSafeEqual(storedHash, derivedKey)
    } catch (error) {
      return false
    }
  }

  // Simple hash for testing (not secure for production)
  simpleHash(password: string): string {
    return createHash('sha256').update(password).digest('hex')
  }

  simpleVerify(password: string, hash: string): boolean {
    return this.simpleHash(password) === hash
  }
}