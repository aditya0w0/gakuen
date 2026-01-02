import { describe, it, expect } from 'vitest';
import {
    luhnCheck,
    detectCardBrand,
    validateCardNumber,
    validateExpiry,
    validateCVV,
    formatCardNumber,
    formatExpiry,
    shouldDecline,
    TEST_CARDS,
} from '@/lib/payment/card-validator';

describe('card-validator', () => {
    describe('luhnCheck', () => {
        it('should validate correct Visa card number', () => {
            expect(luhnCheck('4242424242424242')).toBe(true);
        });

        it('should validate correct Mastercard number', () => {
            expect(luhnCheck('5555555555554444')).toBe(true);
        });

        it('should validate correct Amex number', () => {
            expect(luhnCheck('378282246310005')).toBe(true);
        });

        it('should validate correct Discover number', () => {
            expect(luhnCheck('6011111111111117')).toBe(true);
        });

        it('should reject invalid card number', () => {
            expect(luhnCheck('4242424242424241')).toBe(false);
        });

        it('should handle card number with spaces', () => {
            expect(luhnCheck('4242 4242 4242 4242')).toBe(true);
        });

        it('should reject empty string', () => {
            expect(luhnCheck('')).toBe(false);
        });
    });

    describe('detectCardBrand', () => {
        it('should detect Visa (starts with 4)', () => {
            const result = detectCardBrand('4242');
            expect(result?.brand).toBe('visa');
        });

        it('should detect Mastercard (starts with 51-55)', () => {
            const result = detectCardBrand('5555');
            expect(result?.brand).toBe('mastercard');
        });

        it('should detect Mastercard (starts with 2221-2720)', () => {
            const result = detectCardBrand('2221');
            expect(result?.brand).toBe('mastercard');
        });

        it('should detect Amex (starts with 34)', () => {
            const result = detectCardBrand('34');
            expect(result?.brand).toBe('amex');
        });

        it('should detect Amex (starts with 37)', () => {
            const result = detectCardBrand('37');
            expect(result?.brand).toBe('amex');
        });

        it('should detect Discover (starts with 6011)', () => {
            const result = detectCardBrand('6011');
            expect(result?.brand).toBe('discover');
        });

        it('should detect Diners Club (starts with 36)', () => {
            const result = detectCardBrand('36');
            expect(result?.brand).toBe('diners');
        });

        it('should detect Diners Club (starts with 300-305)', () => {
            const result = detectCardBrand('300');
            expect(result?.brand).toBe('diners');
        });

        it('should detect Maestro (starts with 50)', () => {
            const result = detectCardBrand('50');
            expect(result?.brand).toBe('maestro');
        });

        it('should detect Maestro (starts with 67)', () => {
            const result = detectCardBrand('67');
            expect(result?.brand).toBe('maestro');
        });

        it('should detect UnionPay (starts with 62)', () => {
            const result = detectCardBrand('62');
            expect(result?.brand).toBe('unionpay');
        });

        it('should return null for unknown brand', () => {
            const result = detectCardBrand('9999');
            expect(result).toBe(null);
        });

        it('should return null for single digit', () => {
            const result = detectCardBrand('4');
            expect(result).toBe(null);
        });
    });

    describe('validateCardNumber', () => {
        it('should validate complete Visa card', () => {
            const result = validateCardNumber('4242424242424242');
            expect(result.isValid).toBe(true);
            expect(result.brand?.brand).toBe('visa');
        });

        it('should be potentially valid while typing', () => {
            const result = validateCardNumber('4242');
            expect(result.isValid).toBe(false);
            expect(result.isPotentiallyValid).toBe(true);
        });

        it('should detect invalid Luhn', () => {
            const result = validateCardNumber('4242424242424241');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Invalid card number');
        });

        it('should handle formatted card number', () => {
            const result = validateCardNumber('4242 4242 4242 4242');
            expect(result.isValid).toBe(true);
        });
    });

    describe('validateExpiry', () => {
        it('should validate future date', () => {
            const futureMonth = new Date();
            futureMonth.setMonth(futureMonth.getMonth() + 6);
            const mm = String(futureMonth.getMonth() + 1).padStart(2, '0');
            const yy = String(futureMonth.getFullYear()).slice(-2);

            const result = validateExpiry(`${mm}/${yy}`);
            expect(result.isValid).toBe(true);
        });

        it('should reject expired card', () => {
            const result = validateExpiry('01/20'); // Jan 2020 is expired
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Card has expired');
        });

        it('should reject invalid month', () => {
            const result = validateExpiry('13/25');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Invalid month');
        });

        it('should be potentially valid while typing', () => {
            const result = validateExpiry('12');
            expect(result.isValid).toBe(false);
            expect(result.isPotentiallyValid).toBe(true);
        });
    });

    describe('validateCVV', () => {
        it('should validate 3-digit CVV for Visa', () => {
            const visaBrand = detectCardBrand('4242');
            const result = validateCVV('123', visaBrand);
            expect(result.isValid).toBe(true);
        });

        it('should validate 4-digit CVV for Amex', () => {
            const amexBrand = detectCardBrand('3782');
            const result = validateCVV('1234', amexBrand);
            expect(result.isValid).toBe(true);
        });

        it('should reject too short CVV', () => {
            const visaBrand = detectCardBrand('4242');
            const result = validateCVV('12', visaBrand);
            expect(result.isValid).toBe(false);
            expect(result.isPotentiallyValid).toBe(true);
        });

        it('should reject too long CVV', () => {
            const visaBrand = detectCardBrand('4242');
            const result = validateCVV('12345', visaBrand);
            expect(result.isValid).toBe(false);
        });
    });

    describe('formatCardNumber', () => {
        it('should format Visa with 4-4-4-4 grouping', () => {
            const result = formatCardNumber('4242424242424242');
            expect(result).toBe('4242 4242 4242 4242');
        });

        it('should format Amex with 4-6-5 grouping', () => {
            const amexBrand = detectCardBrand('3782');
            const result = formatCardNumber('378282246310005', amexBrand);
            expect(result).toBe('3782 822463 10005');
        });

        it('should strip non-digits', () => {
            const result = formatCardNumber('4242-4242-4242-4242');
            expect(result).toBe('4242 4242 4242 4242');
        });
    });

    describe('formatExpiry', () => {
        it('should add slash after month', () => {
            const result = formatExpiry('1225');
            expect(result).toBe('12/25');
        });

        it('should handle partial input', () => {
            expect(formatExpiry('1')).toBe('1');
            expect(formatExpiry('12')).toBe('12/');
        });

        it('should strip non-digits', () => {
            const result = formatExpiry('12-25');
            expect(result).toBe('12/25');
        });
    });

    describe('shouldDecline', () => {
        it('should return true for decline test card', () => {
            expect(shouldDecline(TEST_CARDS.visa.decline)).toBe(true);
        });

        it('should return false for success test card', () => {
            expect(shouldDecline(TEST_CARDS.visa.success)).toBe(false);
        });

        it('should handle formatted card number', () => {
            expect(shouldDecline('4000 0000 0000 0002')).toBe(true);
        });
    });
});
