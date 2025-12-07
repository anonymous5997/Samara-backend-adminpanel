import { describe, it, expect, vi } from 'vitest';
import {
  getCurrencySymbol,
  formatPriceSync,
  convertPriceSync,
} from '@/lib/currency-utils';

describe('Currency Utility Functions', () => {
  describe('getCurrencySymbol', () => {
    it('should return correct symbol for INR', () => {
      expect(getCurrencySymbol('INR')).toBe('₹');
    });

    it('should return correct symbol for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    it('should return correct symbol for AED', () => {
      expect(getCurrencySymbol('AED')).toBe('AED');
    });
  });

  describe('formatPriceSync', () => {
    it('should format INR correctly', () => {
      const formatted = formatPriceSync(1000, 'INR');
      expect(formatted).toContain('₹');
      expect(formatted).toContain('1');
    });

    it('should format USD correctly', () => {
      const formatted = formatPriceSync(12.50, 'USD');
      expect(formatted).toBe('$12.50');
    });

    it('should format AED correctly', () => {
      const formatted = formatPriceSync(45.75, 'AED');
      expect(formatted).toBe('45.75 AED');
    });

    it('should handle zero amount', () => {
      const formatted = formatPriceSync(0, 'USD');
      expect(formatted).toBe('$0.00');
    });

    it('should handle negative amount', () => {
      const formatted = formatPriceSync(-50, 'USD');
      expect(formatted).toBe('$-50.00');
    });
  });

  describe('convertPriceSync', () => {
    it('should return same amount for INR to INR', () => {
      const rates = new Map<string, number>();
      const converted = convertPriceSync(1000, 'INR', rates);
      expect(converted).toBe(1000);
    });

    it('should convert INR to USD correctly', () => {
      const rates = new Map<string, number>();
      rates.set('USD', 83.5); // 1 USD = 83.5 INR

      const converted = convertPriceSync(835, 'USD', rates);
      expect(converted).toBe(10); // 835 INR = 10 USD
    });

    it('should convert INR to AED correctly', () => {
      const rates = new Map<string, number>();
      rates.set('AED', 22.75); // 1 AED = 22.75 INR

      const converted = convertPriceSync(227.5, 'AED', rates);
      expect(converted).toBe(10); // 227.5 INR = 10 AED
    });

    it('should fallback to INR if rate not found', () => {
      const rates = new Map<string, number>();
      const converted = convertPriceSync(1000, 'USD', rates);
      expect(converted).toBe(1000); // No conversion, return INR amount
    });

    it('should handle invalid rate (zero or negative)', () => {
      const rates = new Map<string, number>();
      rates.set('USD', 0);

      const converted = convertPriceSync(1000, 'USD', rates);
      expect(converted).toBe(1000); // Return original amount
    });
  });
});
