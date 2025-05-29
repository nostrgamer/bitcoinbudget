import type { EncryptedData } from '../../types/budget'

// Encryption configuration
const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits for GCM
const SALT_LENGTH = 16 // 128 bits
const PBKDF2_ITERATIONS = 100000 // OWASP recommended minimum

/**
 * Derives a cryptographic key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)
  
  // Import the password as a key
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  )
  
  // Derive the actual encryption key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    {
      name: ALGORITHM,
      length: KEY_LENGTH
    },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Generates a random salt for key derivation
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
}

/**
 * Generates a random initialization vector
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH))
}

/**
 * Converts Uint8Array to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Converts base64 string to Uint8Array
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Encrypts data using AES-256-GCM with password-based key derivation
 */
export async function encryptData(data: string, password: string): Promise<EncryptedData> {
  try {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    
    // Generate random salt and IV
    const salt = generateSalt()
    const iv = generateIV()
    
    // Derive encryption key from password
    const key = await deriveKey(password, salt)
    
    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv
      },
      key,
      dataBuffer
    )
    
    return {
      data: arrayBufferToBase64(encryptedBuffer),
      iv: arrayBufferToBase64(iv),
      salt: arrayBufferToBase64(salt)
    }
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Decrypts data using AES-256-GCM with password-based key derivation
 */
export async function decryptData(encryptedData: EncryptedData, password: string): Promise<string> {
  try {
    // Convert base64 strings back to Uint8Arrays
    const dataBuffer = base64ToArrayBuffer(encryptedData.data)
    const iv = base64ToArrayBuffer(encryptedData.iv)
    const salt = base64ToArrayBuffer(encryptedData.salt)
    
    // Derive decryption key from password
    const key = await deriveKey(password, salt)
    
    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv
      },
      key,
      dataBuffer
    )
    
    // Convert back to string
    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Invalid password or corrupted data'}`)
  }
}

/**
 * Generates a secure random password for automatic encryption
 */
export function generateSecurePassword(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length]
  }
  return password
}

/**
 * Validates if a string is a valid base64 encoded value
 */
export function isValidBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str
  } catch {
    return false
  }
}

/**
 * Validates the structure of encrypted data
 */
export function isValidEncryptedData(data: unknown): data is EncryptedData {
  if (typeof data !== 'object' || data === null) {
    return false
  }
  
  const encData = data as Record<string, unknown>
  
  return (
    typeof encData.data === 'string' &&
    typeof encData.iv === 'string' &&
    typeof encData.salt === 'string' &&
    isValidBase64(encData.data) &&
    isValidBase64(encData.iv) &&
    isValidBase64(encData.salt)
  )
} 