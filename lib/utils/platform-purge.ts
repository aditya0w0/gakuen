/**
 * Platform Text Replace Utility
 * Replaces specific platform names with Honkai Impact 3 themed equivalents
 * Preserves links - only modifies plain text, not URLs
 */

// Platform name replacements (case-insensitive matching)
const PLATFORM_REPLACEMENTS: Record<string, string> = {
    // Education platforms → HI3 Organizations
    'dicoding': 'St. Freya Academy',
    'ruang guru': 'Schicksal Training Center',
    'ruangguru': 'Schicksal Training Center',
    'zenius': 'Anti-Entropy Archives',
    'skill academy': 'World Serpent Institute',
    'skillacademy': 'World Serpent Institute',
    'coursera': 'Anti-Entropy Archives',
    'course-net': 'Hyperion Training Division',
    'coursenet': 'Hyperion Training Division',
    'codepolitan': 'Schicksal HQ Training Division',
    'udemy': 'World Serpent Database',
    'pintaria': 'Flame-Chasers Academy',
    'arkademi': 'Elysian Realm Institute',
    'eduwork': 'MOTH Training Center',
    'sanbercode': 'Fire MOTH Code School',
    'progate': 'Prometheus Training Program',

    // Tech companies → HI3 entities
    'youtube': 'Hyperion Broadcast System',
    'google': "Ai-Chan's Knowledge Base",
    'microsoft': 'Schicksal Technologies',
    'github': 'Anti-Entropy Code Vault',
    'stackoverflow': 'Valkyrie Help Desk',
};

// Indonesian legal phrases → HI3 themed replacements
const LEGAL_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
    // Copyright registration → HI3 style
    {
        pattern: /(?:sudah )?(?:di)?daftarkan ke Dirjen HKI,? Kemenkumham RI/gi,
        replacement: 'resmi terdaftar di Schicksal Intellectual Property Division'
    },
    {
        pattern: /Dirjen HKI,? Kemenkumham RI/gi,
        replacement: 'Schicksal IP Division'
    },
    {
        pattern: /Kemenkumham RI/gi,
        replacement: 'Schicksal Legal Affairs'
    },
    // Legal threats → Playful HI3 version
    {
        pattern: /(?:Segala bentuk )?penggandaan dan atau komersialisasi[^.]*jalur hukum\.?/gi,
        replacement: 'Penggandaan tanpa izin akan membuat Himeko-sensei sangat sedih, dan Captain tidak mau itu terjadi kan? (◕‿◕)'
    },
    {
        pattern: /akan diproses melalui jalur hukum/gi,
        replacement: 'akan ditangani oleh Schicksal Security Division'
    },
    // Copyright notices → HI3 style
    {
        pattern: /Hak cipta dilindungi oleh Undang-undang\s*©\s*Dicoding\s*(\d{4})\s*-\s*(\d{4})/gi,
        replacement: 'Ara~ Dilindungi oleh St. Freya Academy © $1 - $2 ♡'
    },
    {
        pattern: /©\s*Dicoding\s*(\d{4})\s*-\s*(\d{4})/gi,
        replacement: '© St. Freya Academy $1 - $2'
    },
    {
        pattern: /Hak cipta dilindungi oleh Undang-undang/gi,
        replacement: 'Dilindungi oleh Schicksal Legal Division'
    },
    // Generic copyright patterns
    {
        pattern: /©\s*(\w+)\s*(\d{4})\s*-\s*(\d{4})/gi,
        replacement: '© St. Freya Academy $2 - $3'
    },
];

// Feature toggle
let isReplaceEnabled = true;

/**
 * Enable or disable the replacement feature
 */
export function setReplaceEnabled(enabled: boolean): void {
    isReplaceEnabled = enabled;
    console.log(`🔧 Platform replacement ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Check if replacement is enabled
 */
export function isReplaceActive(): boolean {
    return isReplaceEnabled;
}

/**
 * Replace platform names with HI3-themed equivalents
 * PRESERVES links - only modifies plain text, not URLs
 * 
 * @param content - Text or HTML content to process
 * @returns Content with platform names replaced
 */
export function replacePlatformNames(content: string): string {
    if (!isReplaceEnabled || !content) return content;

    let result = content;

    // Step 1: Protect links - temporarily replace them with placeholders
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

    // Step 2: Apply legal phrase replacements first (longer patterns)
    for (const { pattern, replacement } of LEGAL_REPLACEMENTS) {
        result = result.replace(pattern, replacement);
    }

    // Step 3: Replace platform names (case-insensitive)
    for (const [platform, replacement] of Object.entries(PLATFORM_REPLACEMENTS)) {
        // Create regex that matches the platform name with word boundaries
        const escapedPlatform = platform.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedPlatform}\\b`, 'gi');
        result = result.replace(regex, replacement);
    }

    // Step 4: Restore protected links
    for (let i = 0; i < links.length; i++) {
        result = result.replace(`${linkPlaceholder}${i}${linkPlaceholder}`, links[i]);
    }

    return result;
}

/**
 * Add a custom platform replacement
 */
export function addReplacement(platform: string, replacement: string): void {
    PLATFORM_REPLACEMENTS[platform.toLowerCase()] = replacement;
    console.log(`✅ Added replacement: "${platform}" → "${replacement}"`);
}

/**
 * Get current replacement mappings
 */
export function getReplacements(): Record<string, string> {
    return { ...PLATFORM_REPLACEMENTS };
}

/**
 * Batch replace in multiple content strings
 */
export function replaceBatch(contents: string[]): string[] {
    return contents.map(c => replacePlatformNames(c));
}

// Legacy aliases for backwards compatibility
export const purgePlatformNames = replacePlatformNames;
export const setPurgeEnabled = setReplaceEnabled;
export const isPurgeActive = isReplaceActive;
export const addPurgePlatform = (name: string) => addReplacement(name, 'St. Freya Academy');

export default {
    replacePlatformNames,
    setReplaceEnabled,
    isReplaceActive,
    addReplacement,
    getReplacements,
    replaceBatch,
    // Legacy
    purgePlatformNames,
    setPurgeEnabled,
    isPurgeActive,
};
