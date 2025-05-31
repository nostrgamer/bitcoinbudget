import { describe, it, expect } from 'vitest'
import {
  formatSats,
  formatBTC,
  parseSats,
  parseBTC,
  satsToString,
  stringToSats,
  validateSatAmount,
  SATS_PER_BTC,
  addSats,
  subtractSats,
  multiplySats,
  divideSats,
  calculatePercentage,
  isValidSatAmount
} from '../bitcoin-utils'

describe('Bitcoin Utils', () => {
  describe('Constants', () => {
    it('should have correct SATS_PER_BTC constant', () => {
      expect(SATS_PER_BTC).toBe(100_000_000)
    })
  })

  describe('formatSats', () => {
    it('should format small amounts correctly', () => {
      expect(formatSats(0)).toBe('0 sats')
      expect(formatSats(1)).toBe('1 sat')
      expect(formatSats(2)).toBe('2 sats')
      expect(formatSats(999)).toBe('999 sats')
    })

    it('should format thousands with commas', () => {
      expect(formatSats(1000)).toBe('1,000 sats')
      expect(formatSats(10000)).toBe('10,000 sats')
      expect(formatSats(100000)).toBe('100,000 sats')
      expect(formatSats(1000000)).toBe('1,000,000 sats')
    })

    it('should handle negative amounts', () => {
      expect(formatSats(-1)).toBe('-1 sat')
      expect(formatSats(-1000)).toBe('-1,000 sats')
      expect(formatSats(-100000)).toBe('-100,000 sats')
    })

    it('should handle large amounts', () => {
      expect(formatSats(SATS_PER_BTC)).toBe('100,000,000 sats')
      expect(formatSats(SATS_PER_BTC * 21)).toBe('2,100,000,000 sats')
    })
  })

  describe('formatBTC', () => {
    it('should format exact BTC amounts', () => {
      expect(formatBTC(SATS_PER_BTC)).toBe('1.00000000 BTC')
      expect(formatBTC(SATS_PER_BTC * 2)).toBe('2.00000000 BTC')
      expect(formatBTC(0)).toBe('0.00000000 BTC')
    })

    it('should format fractional BTC amounts', () => {
      expect(formatBTC(50000000)).toBe('0.50000000 BTC') // 0.5 BTC
      expect(formatBTC(1000000)).toBe('0.01000000 BTC')  // 0.01 BTC
      expect(formatBTC(100000)).toBe('0.00100000 BTC')   // 0.001 BTC
      expect(formatBTC(1)).toBe('0.00000001 BTC')        // 1 sat
    })

    it('should handle negative amounts', () => {
      expect(formatBTC(-SATS_PER_BTC)).toBe('-1.00000000 BTC')
      expect(formatBTC(-50000000)).toBe('-0.50000000 BTC')
    })

    it('should maintain precision for all 8 decimal places', () => {
      expect(formatBTC(12345678)).toBe('0.12345678 BTC')
      expect(formatBTC(87654321)).toBe('0.87654321 BTC')
    })
  })

  describe('parseSats', () => {
    it('should parse valid sat strings', () => {
      expect(parseSats('0')).toBe(0)
      expect(parseSats('1')).toBe(1)
      expect(parseSats('1000')).toBe(1000)
      expect(parseSats('1,000')).toBe(1000)
      expect(parseSats('100,000')).toBe(100000)
    })

    it('should handle negative amounts', () => {
      expect(parseSats('-1')).toBe(-1)
      expect(parseSats('-1,000')).toBe(-1000)
    })

    it('should handle whitespace', () => {
      expect(parseSats(' 1000 ')).toBe(1000)
      expect(parseSats('\t1,000\n')).toBe(1000)
    })

    it('should throw on invalid input', () => {
      expect(() => parseSats('abc')).toThrow()
      expect(() => parseSats('1.5')).toThrow()
      expect(() => parseSats('')).toThrow()
      expect(() => parseSats('1,00')).toThrow() // Invalid comma placement
    })
  })

  describe('parseBTC', () => {
    it('should parse valid BTC strings', () => {
      expect(parseBTC('1')).toBe(SATS_PER_BTC)
      expect(parseBTC('0.5')).toBe(50000000)
      expect(parseBTC('0.01')).toBe(1000000)
      expect(parseBTC('0.00000001')).toBe(1)
    })

    it('should handle negative amounts', () => {
      expect(parseBTC('-1')).toBe(-SATS_PER_BTC)
      expect(parseBTC('-0.5')).toBe(-50000000)
    })

    it('should handle whitespace', () => {
      expect(parseBTC(' 1.0 ')).toBe(SATS_PER_BTC)
      expect(parseBTC('\t0.5\n')).toBe(50000000)
    })

    it('should throw on invalid input', () => {
      expect(() => parseBTC('abc')).toThrow()
      expect(() => parseBTC('')).toThrow()
      expect(() => parseBTC('1.123456789')).toThrow() // Too many decimal places
    })

    it('should handle precision correctly', () => {
      expect(parseBTC('0.12345678')).toBe(12345678)
      expect(parseBTC('1.87654321')).toBe(187654321)
    })
  })

  describe('satsToString and stringToSats', () => {
    it('should convert sats to string and back', () => {
      const amounts = [0, 1, 1000, 100000, SATS_PER_BTC, -1000]
      
      amounts.forEach(amount => {
        const str = satsToString(amount)
        const parsed = stringToSats(str)
        expect(parsed).toBe(amount)
      })
    })

    it('should handle edge cases', () => {
      expect(satsToString(0)).toBe('0')
      expect(stringToSats('0')).toBe(0)
      
      expect(satsToString(-1)).toBe('-1')
      expect(stringToSats('-1')).toBe(-1)
    })
  })

  describe('validateSatAmount', () => {
    it('should validate positive amounts', () => {
      expect(validateSatAmount(0)).toBe(true)
      expect(validateSatAmount(1)).toBe(true)
      expect(validateSatAmount(1000)).toBe(true)
      expect(validateSatAmount(SATS_PER_BTC)).toBe(true)
    })

    it('should validate negative amounts', () => {
      expect(validateSatAmount(-1)).toBe(true)
      expect(validateSatAmount(-1000)).toBe(true)
    })

    it('should reject non-integers', () => {
      expect(validateSatAmount(1.5)).toBe(false)
      expect(validateSatAmount(0.1)).toBe(false)
      expect(validateSatAmount(NaN)).toBe(false)
      expect(validateSatAmount(Infinity)).toBe(false)
    })

    it('should reject extremely large amounts', () => {
      const maxSats = 21_000_000 * SATS_PER_BTC // 21 million BTC in sats
      expect(validateSatAmount(maxSats)).toBe(true)
      expect(validateSatAmount(maxSats + 1)).toBe(false)
    })
  })

  describe('isValidSatAmount', () => {
    it('should validate integer amounts', () => {
      expect(isValidSatAmount(0)).toBe(true)
      expect(isValidSatAmount(1)).toBe(true)
      expect(isValidSatAmount(-1)).toBe(true)
      expect(isValidSatAmount(SATS_PER_BTC)).toBe(true)
    })

    it('should reject non-integers', () => {
      expect(isValidSatAmount(1.5)).toBe(false)
      expect(isValidSatAmount(NaN)).toBe(false)
      expect(isValidSatAmount(Infinity)).toBe(false)
    })
  })

  describe('Arithmetic Operations', () => {
    describe('addSats', () => {
      it('should add positive amounts correctly', () => {
        expect(addSats(1000, 2000)).toBe(3000)
        expect(addSats(0, 1000)).toBe(1000)
        expect(addSats(SATS_PER_BTC, SATS_PER_BTC)).toBe(SATS_PER_BTC * 2)
      })

      it('should handle negative amounts', () => {
        expect(addSats(1000, -500)).toBe(500)
        expect(addSats(-1000, -2000)).toBe(-3000)
        expect(addSats(-1000, 2000)).toBe(1000)
      })

      it('should handle multiple amounts', () => {
        expect(addSats(1000, 2000, 3000)).toBe(6000)
        expect(addSats(100, -50, 200, -100)).toBe(150)
      })

      it('should validate inputs', () => {
        expect(() => addSats(1.5, 1000)).toThrow()
        expect(() => addSats(1000, NaN)).toThrow()
      })
    })

    describe('subtractSats', () => {
      it('should subtract amounts correctly', () => {
        expect(subtractSats(3000, 1000)).toBe(2000)
        expect(subtractSats(1000, 1000)).toBe(0)
        expect(subtractSats(1000, 2000)).toBe(-1000)
      })

      it('should handle negative amounts', () => {
        expect(subtractSats(-1000, -500)).toBe(-500)
        expect(subtractSats(-1000, 500)).toBe(-1500)
        expect(subtractSats(1000, -500)).toBe(1500)
      })

      it('should validate inputs', () => {
        expect(() => subtractSats(1.5, 1000)).toThrow()
        expect(() => subtractSats(1000, NaN)).toThrow()
      })
    })

    describe('multiplySats', () => {
      it('should multiply by integers correctly', () => {
        expect(multiplySats(1000, 2)).toBe(2000)
        expect(multiplySats(1000, 0)).toBe(0)
        expect(multiplySats(1000, -2)).toBe(-2000)
      })

      it('should multiply by decimals correctly', () => {
        expect(multiplySats(1000, 0.5)).toBe(500)
        expect(multiplySats(1000, 1.5)).toBe(1500)
        expect(multiplySats(1000, 0.1)).toBe(100)
      })

      it('should handle rounding correctly', () => {
        expect(multiplySats(100, 0.333)).toBe(33) // Rounds down
        expect(multiplySats(100, 0.666)).toBe(67) // Rounds up
      })

      it('should validate inputs', () => {
        expect(() => multiplySats(1.5, 2)).toThrow()
        expect(() => multiplySats(1000, NaN)).toThrow()
      })
    })

    describe('divideSats', () => {
      it('should divide correctly', () => {
        expect(divideSats(2000, 2)).toBe(1000)
        expect(divideSats(1000, 4)).toBe(250)
        expect(divideSats(-1000, 2)).toBe(-500)
      })

      it('should handle rounding correctly', () => {
        expect(divideSats(1000, 3)).toBe(333) // Rounds down
        expect(divideSats(1001, 3)).toBe(334) // Rounds up
      })

      it('should throw on division by zero', () => {
        expect(() => divideSats(1000, 0)).toThrow()
      })

      it('should validate inputs', () => {
        expect(() => divideSats(1.5, 2)).toThrow()
        expect(() => divideSats(1000, NaN)).toThrow()
      })
    })

    describe('calculatePercentage', () => {
      it('should calculate percentages correctly', () => {
        expect(calculatePercentage(1000, 50)).toBe(500) // 50% of 1000
        expect(calculatePercentage(1000, 25)).toBe(250) // 25% of 1000
        expect(calculatePercentage(1000, 100)).toBe(1000) // 100% of 1000
        expect(calculatePercentage(1000, 0)).toBe(0) // 0% of 1000
      })

      it('should handle decimal percentages', () => {
        expect(calculatePercentage(1000, 12.5)).toBe(125) // 12.5% of 1000
        expect(calculatePercentage(1000, 33.33)).toBe(333) // 33.33% of 1000
      })

      it('should handle negative amounts', () => {
        expect(calculatePercentage(-1000, 50)).toBe(-500)
        expect(calculatePercentage(1000, -50)).toBe(-500)
      })

      it('should validate inputs', () => {
        expect(() => calculatePercentage(1.5, 50)).toThrow()
        expect(() => calculatePercentage(1000, NaN)).toThrow()
      })
    })
  })

  describe('Precision and Rounding', () => {
    it('should maintain integer precision in all operations', () => {
      // Test that we never introduce floating point errors
      const amount = 1000000 // 1M sats
      
      // Division and multiplication should be exact
      expect(divideSats(multiplySats(amount, 2), 2)).toBe(amount)
      expect(multiplySats(divideSats(amount, 4), 4)).toBe(amount)
      
      // Percentage calculations should round consistently
      expect(calculatePercentage(amount, 33.333)).toBe(333330)
    })

    it('should handle edge cases in rounding', () => {
      // Test rounding behavior at 0.5
      expect(multiplySats(3, 0.5)).toBe(2) // 1.5 rounds to 2
      expect(divideSats(3, 2)).toBe(2) // 1.5 rounds to 2
      
      // Test consistent rounding direction
      expect(multiplySats(5, 0.1)).toBe(1) // 0.5 rounds to 1
      expect(divideSats(5, 10)).toBe(1) // 0.5 rounds to 1
    })
  })

  describe('Large Number Handling', () => {
    it('should handle maximum Bitcoin supply correctly', () => {
      const maxBitcoin = 21_000_000 * SATS_PER_BTC
      
      expect(formatSats(maxBitcoin)).toBe('2,100,000,000,000,000 sats')
      expect(formatBTC(maxBitcoin)).toBe('21000000.00000000 BTC')
      expect(validateSatAmount(maxBitcoin)).toBe(true)
    })

    it('should handle JavaScript number limits', () => {
      // JavaScript can safely represent integers up to 2^53 - 1
      const maxSafeInteger = Number.MAX_SAFE_INTEGER
      const maxBitcoin = 21_000_000 * SATS_PER_BTC
      
      expect(maxBitcoin).toBeLessThan(maxSafeInteger)
      expect(addSats(maxBitcoin, 1000)).toBe(maxBitcoin + 1000)
    })
  })

  describe('Input Sanitization', () => {
    it('should handle various string formats in parseSats', () => {
      expect(parseSats('1000')).toBe(1000)
      expect(parseSats('1,000')).toBe(1000)
      expect(parseSats('1 000')).toBe(1000)
      expect(parseSats('1_000')).toBe(1000)
      expect(parseSats(' 1000 ')).toBe(1000)
    })

    it('should handle various string formats in parseBTC', () => {
      expect(parseBTC('1')).toBe(100000000)
      expect(parseBTC('1.0')).toBe(100000000)
      expect(parseBTC('0.5')).toBe(50000000)
      expect(parseBTC(' 0.1 ')).toBe(10000000)
    })

    it('should reject malformed input', () => {
      expect(() => parseSats('1,00')).toThrow() // Invalid comma
      expect(() => parseSats('1,,000')).toThrow() // Double comma
      expect(() => parseBTC('1.0.0')).toThrow() // Double decimal
      expect(() => parseBTC('1.000000000')).toThrow() // Too many decimals
    })
  })
}) 