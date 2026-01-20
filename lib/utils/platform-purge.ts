/**
 * Platform Text Purge Utility
 * Removes specific platform names from text content while preserving links
 * Supports Indonesian text and copyright notices
 */

// Platform names to purge (case-insensitive)
const PLATFORM_PATTERNS = [
    // Platform names
    'dicoding',
    'ruang guru',
    'ruangguru',
    'zenius',
    'skill academy',
    'skillacademy',
    'Course-Net',
    'coursenet',
    'codepolitan',
    'belajar koding',
    'pintaria',
    'arkademi',
    'eduwork',
    'maubelajarapa',
    'sanbercode',
    'progate',

    // Add more platforms as needed
];

// Common Indonesian copyright/legal phrases to detect and remove entirely
const LEGAL_BLOCK_PATTERNS = [
    // Copyright blocks containing registration/trademark notices
    /(?:Hak cipta|Copyright)[^\n]*©[^\n]*/gi,
    /Modul kelas[^.]*Dirjen HKI[^.]*\./gi,
    /Segala bentuk penggandaan[^.]*jalur hukum\./gi,
    /Hak cipta dilindungi[^.]*Undang-undang[^.]*\./gi,
    /[^\n]*didaftarkan ke Dirjen HKI[^\n]*/gi,
    /[^\n]*Kemenkumham RI[^\n]*/gi,
    /©[^©\n]*20\d{2}[^\n]*/gi,  // Copyright notices with years
];

// Feature toggle
let isPurgeEnabled = true;

/**
 * Enable or disable the purge feature
 */
export function setPurgeEnabled(enabled: boolean): void {
    isPurgeEnabled = enabled;
    console.log(`🔧 Platform purge ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Check if purge is enabled
 */
export function isPurgeActive(): boolean {
    return isPurgeEnabled;
}

/**
 * Purge platform names from text content
 * PRESERVES links - only modifies plain text, not URLs
 * 
 * @param content - Text or HTML content to sanitize
 * @returns Sanitized content with platform names removed
 */
export function purgePlatformNames(content: string): string {
    if (!isPurgeEnabled || !content) return content;

    let result = content;

    // Step 1: Remove entire legal/copyright blocks (Indonesian)
    for (const pattern of LEGAL_BLOCK_PATTERNS) {
        result = result.replace(pattern, '');
    }

    // Step 2: Protect links - temporarily replace them with placeholders
    const links: string[] = [];
    const linkPlaceholder = '___LINK_PLACEHOLDER___';

    // Match href="..." and src="..." attributes
    result = result.replace(/(href|src)=["']([^"']+)["']/gi, (match) => {
        links.push(match);
        return `${linkPlaceholder}${links.length - 1}${linkPlaceholder}`;
    });

    // Match raw URLs in text
    result = result.replace(/(https?:\/\/[^\s<>"']+)/gi, (match) => {
        links.push(match);
        return `${linkPlaceholder}${links.length - 1}${linkPlaceholder}`;
    });

    // Step 3: Remove platform names from plain text (case-insensitive)
    for (const platform of PLATFORM_PATTERNS) {
        // Create regex that matches the platform name with word boundaries
        // Also matches common variations (with spaces, hyphens, etc.)
        const escapedPlatform = platform.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedPlatform}\\b`, 'gi');
        result = result.replace(regex, '');
    }

    // Step 4: Restore protected links
    for (let i = 0; i < links.length; i++) {
        result = result.replace(`${linkPlaceholder}${i}${linkPlaceholder}`, links[i]);
    }

    // Step 5: Clean up extra whitespace and empty lines
    result = result
        .replace(/\s{3,}/g, '  ')           // Collapse multiple spaces
        .replace(/^\s*[\r\n]+/gm, '\n')     // Remove empty lines
        .replace(/\n{3,}/g, '\n\n')         // Max 2 consecutive newlines
        .trim();

    return result;
}

/**
 * Add a custom platform name to the purge list
 */
export function addPurgePlatform(name: string): void {
    if (!PLATFORM_PATTERNS.includes(name.toLowerCase())) {
        PLATFORM_PATTERNS.push(name.toLowerCase());
        console.log(`✅ Added "${name}" to purge list`);
    }
}

/**
 * Get current list of platforms being purged
 */
export function getPurgePlatforms(): string[] {
    return [...PLATFORM_PATTERNS];
}

/**
 * Batch purge multiple content strings
 */
export function purgeBatch(contents: string[]): string[] {
    return contents.map(c => purgePlatformNames(c));
}

export default {
    purgePlatformNames,
    setPurgeEnabled,
    isPurgeActive,
    addPurgePlatform,
    getPurgePlatforms,
    purgeBatch,
};
