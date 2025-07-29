import { vi } from 'vitest'
import crypto from 'crypto'

// Make crypto available globally for tests
Object.defineProperty(globalThis, 'crypto', {
  value: crypto.webcrypto || crypto,
  writable: true
})

// Mock console methods to reduce noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

// Setup test environment
// Note: beforeEach is provided by vitest globals
import { vi } from 'vitest'
import crypto from 'crypto'

// Make crypto available globally for tests
Object.defineProperty(globalThis, 'crypto', {
  value: crypto.webcrypto || crypto,
  writable: true
})

// Mock console methods to reduce noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

import { vi } from 'vitest'
import crypto from 'crypto'

// Make crypto available globally for tests
Object.defineProperty(globalThis, 'crypto', {
  value: crypto.webcrypto || crypto,
  writable: true
})

// Mock console methods to reduce noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

// Setup test environment
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()
})