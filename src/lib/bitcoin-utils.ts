// Bitcoin utility functions for formatting and conversion

const SATS_PER_BTC = 100000000

/**
 * Formats satoshis as a readable string with thousand separators
 */
export function formatSats(sats: number): string {
  return new Intl.NumberFormat('en-US').format(sats)
}

/**
 * Formats satoshis as Bitcoin with proper decimal places
 */
export function formatBTC(sats: number): string {
  return (sats / SATS_PER_BTC).toFixed(8)
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
 * Parses a string input to satoshis
 * Supports both BTC and sats input
 */
export function parseToSats(input: string): number {
  const trimmed = input.trim()
  
  // Remove commas and spaces
  const cleaned = trimmed.replace(/[,\s]/g, '')
  
  // Check if it's a BTC amount (contains decimal point)
  if (cleaned.includes('.')) {
    const btcAmount = parseFloat(cleaned)
    if (isNaN(btcAmount)) {
      throw new Error('Invalid BTC amount')
    }
    return Math.round(btcAmount * SATS_PER_BTC)
  }
  
  // Otherwise treat as sats
  const satsAmount = parseInt(cleaned, 10)
  if (isNaN(satsAmount)) {
    throw new Error('Invalid sats amount')
  }
  
  return satsAmount
}

/**
 * Validates if a number is a valid satoshi amount
 */
export function isValidSatsAmount(sats: number): boolean {
  return Number.isInteger(sats) && sats >= 0 && sats <= 21_000_000 * SATS_PER_BTC
}

/**
 * Validates if a string can be parsed to valid satoshis
 */
export function isValidSatsInput(input: string): boolean {
  try {
    parseToSats(input)
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
 * Calculates percentage of total
 */
export function calculatePercentage(amount: number, total: number): number {
  if (total === 0) return 0
  return (amount / total) * 100
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
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
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