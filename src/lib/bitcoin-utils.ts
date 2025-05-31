// Bitcoin utility functions for formatting and conversion

export const SATS_PER_BTC = 100000000

/**
 * Formats satoshis as a readable string with thousand separators
 */
export function formatSats(sats: number): string {
  if (sats === 1) return '1 sat'
  if (sats === -1) return '-1 sat'
  if (sats === 0) return '0 sats'
  return `${new Intl.NumberFormat('en-US').format(sats)} sats`
}

/**
 * Formats satoshis as Bitcoin with proper decimal places
 */
export function formatBTC(sats: number): string {
  return `${(sats / SATS_PER_BTC).toFixed(8)} BTC`
}

/**
 * Converts Bitcoin to satoshis
 */
export function btcToSats(btc: number): number {
  return Math.round(btc * SATS_PER_BTC)
}

/**
 * Converts satoshis to Bitcoin
 */
export function satsToBTC(sats: number): number {
  return sats / SATS_PER_BTC
}

/**
 * Parse satoshis from string input
 */
export function parseSats(input: string): number {
  const trimmed = input.trim()
  
  if (trimmed === '') throw new Error('Empty input')
  if (trimmed.includes('.')) throw new Error('Decimal not allowed for sats')
  
  // Check for invalid comma patterns
  if (trimmed.includes(',')) {
    // Remove sign for comma validation
    const withoutSign = trimmed.replace(/^[+\-]/, '')
    // Valid comma pattern: digits followed by groups of exactly 3 digits
    if (!/^\d{1,3}(,\d{3})*$/.test(withoutSign)) {
      throw new Error('Invalid comma placement')
    }
  }
  
  // Check for double commas
  if (trimmed.includes(',,')) {
    throw new Error('Invalid comma placement')
  }
  
  // Remove commas, spaces, and underscores for parsing
  const cleaned = trimmed.replace(/[,\s_]/g, '')
  
  const satsAmount = parseInt(cleaned, 10)
  if (isNaN(satsAmount)) throw new Error('Invalid sats amount')
  
  return satsAmount
}

/**
 * Parse Bitcoin from string input
 */
export function parseBTC(input: string): number {
  const trimmed = input.trim()
  const cleaned = trimmed.replace(/[+\s]/g, '')
  
  if (cleaned === '') throw new Error('Empty input')
  if (cleaned.includes('.') && cleaned.split('.')[1]?.length > 8) {
    throw new Error('Too many decimal places')
  }
  if (cleaned.split('.').length > 2) throw new Error('Multiple decimal points')
  
  const btcAmount = parseFloat(cleaned)
  if (isNaN(btcAmount)) throw new Error('Invalid BTC amount')
  
  return Math.round(btcAmount * SATS_PER_BTC)
}

/**
 * Convert sats to string
 */
export function satsToString(sats: number): string {
  return sats.toString()
}

/**
 * Convert string to sats
 */
export function stringToSats(input: string): number {
  return parseInt(input, 10)
}

/**
 * Validate satoshi amount
 */
export function validateSatAmount(sats: number): boolean {
  return Number.isInteger(sats) && sats >= -21_000_000 * SATS_PER_BTC && sats <= 21_000_000 * SATS_PER_BTC
}

/**
 * Check if amount is valid sats
 */
export function isValidSatAmount(sats: number): boolean {
  return Number.isInteger(sats) && !isNaN(sats) && isFinite(sats)
}

/**
 * Add satoshi amounts
 */
export function addSats(...amounts: number[]): number {
  amounts.forEach(amount => {
    if (!isValidSatAmount(amount)) throw new Error('Invalid sat amount')
  })
  return amounts.reduce((sum, amount) => sum + amount, 0)
}

/**
 * Subtract satoshi amounts
 */
export function subtractSats(a: number, b: number): number {
  if (!isValidSatAmount(a) || !isValidSatAmount(b)) throw new Error('Invalid sat amount')
  return a - b
}

/**
 * Multiply satoshi amount
 */
export function multiplySats(sats: number, multiplier: number): number {
  if (!isValidSatAmount(sats) || isNaN(multiplier) || !isFinite(multiplier)) {
    throw new Error('Invalid input')
  }
  return Math.round(sats * multiplier)
}

/**
 * Divide satoshi amount
 */
export function divideSats(sats: number, divisor: number): number {
  if (!isValidSatAmount(sats) || isNaN(divisor) || !isFinite(divisor) || divisor === 0) {
    throw new Error('Invalid input or division by zero')
  }
  return Math.round(sats / divisor)
}

/**
 * Calculate percentage of satoshi amount
 */
export function calculatePercentage(sats: number, percentage: number): number {
  if (!isValidSatAmount(sats) || isNaN(percentage) || !isFinite(percentage)) {
    throw new Error('Invalid input')
  }
  return Math.round(sats * (percentage / 100))
}

/**
 * Formats satoshis with appropriate unit (sats or BTC)
 */
export function formatSatsWithUnit(sats: number, preferBTC: boolean = false): string {
  if (preferBTC || sats >= SATS_PER_BTC) {
    return `₿ ${formatBTC(sats)}`
  }
  return `${formatSats(sats)} sats`
}

/**
 * Formats satoshis for display with both units
 */
export function formatSatsBoth(sats: number): { sats: string; btc: string } {
  return {
    sats: `${formatSats(sats)} sats`,
    btc: `₿ ${formatBTC(sats)}`
  }
}

/**
 * Validates if a string can be parsed to valid satoshis
 */
export function isValidSatsInput(input: string): boolean {
  try {
    parseSats(input)
    return true
  } catch {
    return false
  }
}

/**
 * Formats a percentage with proper decimal places
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Formats a date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Formats a date and time for display
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * Generate a random color for categories
 */
export function generateCategoryColor(): string {
  const colors = [
    '#f7931a', // Bitcoin orange
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
    '#ec4899', // Pink
    '#64748b', // Slate
    '#78716c', // Stone
  ]
  
  return colors[Math.floor(Math.random() * colors.length)] || '#f7931a'
}

/**
 * Validates Bitcoin address format (basic validation)
 */
export function isValidBitcoinAddress(address: string): boolean {
  // Basic validation - in a real app you'd want more comprehensive validation
  const patterns = [
    /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Legacy (P2PKH/P2SH)
    /^bc1[a-z0-9]{39,59}$/, // Bech32 (P2WPKH/P2WSH)
    /^bc1p[a-z0-9]{58}$/, // Bech32m (P2TR)
  ]
  
  return patterns.some(pattern => pattern.test(address))
}

/**
 * Truncates a Bitcoin address for display
 */
export function truncateAddress(address: string, chars: number = 6): string {
  if (address.length <= chars * 2) return address
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

/**
 * Generates a unique ID for database records
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Debounce function for search/input handling
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = window.setTimeout(() => func(...args), wait)
  }
}

/**
 * Parse user input for sats amount
 * Supports formats like "1000", "1000 sats", "0.001 BTC", "₿0.001"
 */
export function parseSatsInput(input: string): number {
  if (!input || typeof input !== 'string') return 0
  
  // Remove whitespace and convert to lowercase
  const cleaned = input.trim().toLowerCase()
  
  // Handle BTC formats
  if (cleaned.includes('btc') || cleaned.includes('₿')) {
    const btcAmount = parseFloat(cleaned.replace(/[^\d.-]/g, ''))
    return isNaN(btcAmount) ? 0 : Math.round(btcAmount * SATS_PER_BTC)
  }
  
  // Handle sats format (remove "sats" suffix and any commas)
  const satsAmount = parseFloat(cleaned.replace(/[^\d.-]/g, ''))
  return isNaN(satsAmount) ? 0 : Math.round(satsAmount)
}

// Debounced validation function
let timeout: number
export const debouncedValidateAddress = (address: string, callback: (isValid: boolean) => void, delay: number = 300) => {
  clearTimeout(timeout)
  timeout = window.setTimeout(() => {
    callback(isValidBitcoinAddress(address))
  }, delay)
} 