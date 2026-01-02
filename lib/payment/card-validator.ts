/**
 * Credit Card Validation Utilities
 * 
 * Features:
 * - Card type detection (Visa, Mastercard, Amex, Discover)
 * - Luhn algorithm validation
 * - Expiry date validation
 * - CVV validation
 * - Demo test card configuration
 */

// Card brand types
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'maestro' | 'unionpay' | 'unknown';

// Card brand configuration
export interface CardBrandConfig {
    brand: CardBrand;
    name: string;
    pattern: RegExp;
    lengths: number[];
    cvvLength: number;
    color: string; // For UI theming
}

// Card brands with their BIN/IIN patterns
const CARD_BRANDS: CardBrandConfig[] = [
    {
        brand: 'visa',
        name: 'Visa',
        pattern: /^4/,
        lengths: [13, 16, 19],
        cvvLength: 3,
        color: '#1A1F71',
    },
    {
        brand: 'mastercard',
        name: 'Mastercard',
        pattern: /^(5[1-5]|2[2-7])/,  // 51-55 or 2221-2720
        lengths: [16],
        cvvLength: 3,
        color: '#EB001B',
    },
    {
        brand: 'amex',
        name: 'American Express',
        pattern: /^3[47]/,  // 34 or 37
        lengths: [15],
        cvvLength: 4,
        color: '#006FCF',
    },
    {
        brand: 'discover',
        name: 'Discover',
        pattern: /^(6011|65|64[4-9])/,  // 6011, 65, 644-649
        lengths: [16, 19],
        cvvLength: 3,
        color: '#FF6600',
    },
    {
        brand: 'diners',
        name: 'Diners Club',
        pattern: /^(36|38|30[0-5])/,  // 36, 38, 300-305
        lengths: [14, 16, 19],
        cvvLength: 3,
        color: '#004A97',
    },
    {
        brand: 'unionpay',
        name: 'UnionPay',
        pattern: /^62/,  // 62 - must be before Maestro!
        lengths: [16, 17, 18, 19],
        cvvLength: 3,
        color: '#E21836',
    },
    {
        brand: 'maestro',
        name: 'Maestro',
        pattern: /^(50|5[6-9]|6[013-9]|6[0-9]{2}(?!2))/,  // 50, 56-59, 60, 63-69 (excludes 62 for UnionPay)
        lengths: [12, 13, 14, 15, 16, 17, 18, 19],
        cvvLength: 3,
        color: '#0066CC',
    },
];

// Test card numbers for demo mode
export const TEST_CARDS = {
    visa: {
        success: '4242424242424242',
        decline: '4000000000000002',
    },
    mastercard: {
        success: '5555555555554444',
        decline: '5100000000000004',
    },
    amex: {
        success: '378282246310005',
        decline: '371449635398431',
    },
    discover: {
        success: '6011111111111117',
        decline: '6011000990139424',
    },
    diners: {
        success: '36000000000008', // 14 digits Diners
        decline: '36000000000099',
    },
    maestro: {
        success: '6759649826438453', // 16 digits Maestro
        decline: '6759000000000000',
    },
    unionpay: {
        success: '6200000000000005', // 16 digits UnionPay
        decline: '6200000000000000',
    },
} as const;

// Cards that should simulate decline in demo mode
const DECLINE_CARDS: string[] = [
    TEST_CARDS.visa.decline,
    TEST_CARDS.mastercard.decline,
    TEST_CARDS.amex.decline,
    TEST_CARDS.discover.decline,
    TEST_CARDS.diners.decline,
    TEST_CARDS.maestro.decline,
    TEST_CARDS.unionpay.decline,
];

/**
 * Detect card brand from card number
 */
export function detectCardBrand(cardNumber: string): CardBrandConfig | null {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 2) return null;

    for (const config of CARD_BRANDS) {
        if (config.pattern.test(digits)) {
            return config;
        }
    }
    return null;
}

/**
 * Luhn Algorithm - Validate card number checksum
 * Returns true if valid
 */
export function luhnCheck(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length === 0) return false;

    let sum = 0;
    let isEven = false;

    // Process from right to left
    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i], 10);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
}

/**
 * Validate card number format and checksum
 */
export function validateCardNumber(cardNumber: string): {
    isValid: boolean;
    isPotentiallyValid: boolean;
    brand: CardBrandConfig | null;
    error?: string;
} {
    const digits = cardNumber.replace(/\D/g, '');
    const brand = detectCardBrand(digits);

    // Too short - potentially valid if still typing
    if (digits.length === 0) {
        return { isValid: false, isPotentiallyValid: true, brand: null };
    }

    // Check if matches a brand
    if (brand) {
        const minLength = Math.min(...brand.lengths);
        const maxLength = Math.max(...brand.lengths);

        // Still typing
        if (digits.length < minLength) {
            return { isValid: false, isPotentiallyValid: true, brand };
        }

        // Too long
        if (digits.length > maxLength) {
            return { isValid: false, isPotentiallyValid: false, brand, error: 'Card number is too long' };
        }

        // Check if valid length
        if (!brand.lengths.includes(digits.length)) {
            return { isValid: false, isPotentiallyValid: true, brand };
        }

        // Validate with Luhn
        if (!luhnCheck(digits)) {
            return { isValid: false, isPotentiallyValid: false, brand, error: 'Invalid card number' };
        }

        return { isValid: true, isPotentiallyValid: true, brand };
    }

    // Unknown brand
    if (digits.length >= 16) {
        if (luhnCheck(digits)) {
            return { isValid: true, isPotentiallyValid: true, brand: null };
        }
        return { isValid: false, isPotentiallyValid: false, brand: null, error: 'Invalid card number' };
    }

    return { isValid: false, isPotentiallyValid: true, brand: null };
}

/**
 * Validate expiry date (MM/YY format)
 */
export function validateExpiry(expiry: string): {
    isValid: boolean;
    isPotentiallyValid: boolean;
    error?: string;
} {
    const cleaned = expiry.replace(/\D/g, '');

    if (cleaned.length === 0) {
        return { isValid: false, isPotentiallyValid: true };
    }

    if (cleaned.length < 4) {
        // Check if month part is valid so far
        if (cleaned.length >= 2) {
            const month = parseInt(cleaned.slice(0, 2), 10);
            if (month < 1 || month > 12) {
                return { isValid: false, isPotentiallyValid: false, error: 'Invalid month' };
            }
        }
        return { isValid: false, isPotentiallyValid: true };
    }

    const month = parseInt(cleaned.slice(0, 2), 10);
    const year = parseInt('20' + cleaned.slice(2, 4), 10);

    // Validate month
    if (month < 1 || month > 12) {
        return { isValid: false, isPotentiallyValid: false, error: 'Invalid month' };
    }

    // Check if expired
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return { isValid: false, isPotentiallyValid: false, error: 'Card has expired' };
    }

    // Check if too far in future (10 years)
    if (year > currentYear + 10) {
        return { isValid: false, isPotentiallyValid: false, error: 'Invalid expiry year' };
    }

    return { isValid: true, isPotentiallyValid: true };
}

/**
 * Validate CVV
 */
export function validateCVV(cvv: string, brand: CardBrandConfig | null): {
    isValid: boolean;
    isPotentiallyValid: boolean;
    error?: string;
} {
    const digits = cvv.replace(/\D/g, '');
    const expectedLength = brand?.cvvLength ?? 3;

    if (digits.length === 0) {
        return { isValid: false, isPotentiallyValid: true };
    }

    if (digits.length < expectedLength) {
        return { isValid: false, isPotentiallyValid: true };
    }

    if (digits.length > expectedLength) {
        return { isValid: false, isPotentiallyValid: false, error: 'CVV is too long' };
    }

    return { isValid: true, isPotentiallyValid: true };
}

/**
 * Check if card should simulate decline (for demo mode)
 */
export function shouldDecline(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');
    return DECLINE_CARDS.includes(digits);
}

/**
 * Format card number with spaces
 */
export function formatCardNumber(value: string, brand?: CardBrandConfig | null): string {
    const digits = value.replace(/\D/g, '');

    // Amex uses 4-6-5 grouping
    if (brand?.brand === 'amex') {
        const maxLen = 15;
        const trimmed = digits.slice(0, maxLen);
        const groups = [trimmed.slice(0, 4), trimmed.slice(4, 10), trimmed.slice(10, 15)];
        return groups.filter(g => g).join(' ');
    }

    // Standard 4-4-4-4 grouping
    const maxLen = 19;
    const trimmed = digits.slice(0, maxLen);
    const groups = trimmed.match(/.{1,4}/g) || [];
    return groups.join(' ');
}

/**
 * Format expiry date as MM/YY
 */
export function formatExpiry(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 2) {
        return digits.slice(0, 2) + '/' + digits.slice(2);
    }
    return digits;
}

/**
 * Complete validation for payment form
 */
export interface PaymentValidationResult {
    isValid: boolean;
    cardNumber: { isValid: boolean; error?: string; brand: CardBrandConfig | null };
    expiry: { isValid: boolean; error?: string };
    cvv: { isValid: boolean; error?: string };
    name: { isValid: boolean; error?: string };
}

export function validatePaymentForm(data: {
    cardNumber: string;
    expiry: string;
    cvv: string;
    name: string;
}): PaymentValidationResult {
    const cardResult = validateCardNumber(data.cardNumber);
    const expiryResult = validateExpiry(data.expiry);
    const cvvResult = validateCVV(data.cvv, cardResult.brand);
    const nameValid = data.name.trim().length >= 2;

    return {
        isValid: cardResult.isValid && expiryResult.isValid && cvvResult.isValid && nameValid,
        cardNumber: { isValid: cardResult.isValid, error: cardResult.error, brand: cardResult.brand },
        expiry: { isValid: expiryResult.isValid, error: expiryResult.error },
        cvv: { isValid: cvvResult.isValid, error: cvvResult.error },
        name: { isValid: nameValid, error: nameValid ? undefined : 'Name is required' },
    };
}

// Card brand SVG icons (simplified versions)
export const CARD_ICONS: Record<CardBrand, string> = {
    visa: 'M9.5 4H14.5C15.33 4 16 4.67 16 5.5V18.5C16 19.33 15.33 20 14.5 20H9.5C8.67 20 8 19.33 8 18.5V5.5C8 4.67 8.67 4 9.5 4Z',
    mastercard: 'M12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17Z',
    amex: 'M4 8H20V16H4V8ZM6 10V14H18V10H6Z',
    discover: 'M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z',
    diners: 'M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C15.31 6 18 8.69 18 12C18 15.31 15.31 18 12 18Z',
    maestro: 'M12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4Z',
    unionpay: 'M3 6H21V18H3V6ZM5 8V16H19V8H5ZM7 10H11V14H7V10Z',
    unknown: 'M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z',
};
