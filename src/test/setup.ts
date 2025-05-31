import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    },
    subtle: {
      importKey: vi.fn().mockResolvedValue({}),
      deriveKey: vi.fn().mockResolvedValue({}),
      encrypt: vi.fn().mockImplementation(async (algorithm, key, data) => {
        // Return the data as-is for testing (no actual encryption)
        return new ArrayBuffer(data.byteLength)
      }),
      decrypt: vi.fn().mockImplementation(async (algorithm, key, data) => {
        // Return the data as-is for testing (no actual decryption)
        return new ArrayBuffer(data.byteLength)
      }),
      generateKey: vi.fn().mockResolvedValue({})
    }
  }
})

// Mock TextEncoder/TextDecoder for crypto operations
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
} 