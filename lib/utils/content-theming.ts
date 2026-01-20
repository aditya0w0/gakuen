/**
 * Content Theming Utility
 * Replaces real-world platform names, Indonesian institutions, etc.
 * with Honkai Impact 3 Academy lore equivalents for branding/theming
 */

// Replacement mappings: [regex pattern, replacement, flags]
const REPLACEMENTS: [RegExp, string][] = [
    // Platform names - order matters: longer/specific patterns first
    [/dicodingacademy/gi, "St. Freya Academy"],
    [/dicoding\.com/gi, "stfreya.academy"],  // Keep as domain-like for non-URL contexts
    [/dicoding indonesia/gi, "St. Freya Academy"],
    [/dicoding/gi, "St. Freya Academy"],  // Catch-all for dicoding
    [/\bHackerRank\b/gi, "Hyperion Archives"],
    [/\bCoursera\b/gi, "Schicksal Academy"],
    [/\bUdemy\b/gi, "Anti-Entropy Institute"],
    [/\bCodecademy\b/gi, "Elysian Archives"],
    [/\bLeetCode\b/gi, "Flamechasers Trials"],
    [/\bfreeCodeCamp\b/gi, "Valkyrie Training Camp"],
    [/\bKhan Academy\b/gi, "Kiana's Academy"],
    [/\bw3schools\b/gi, "World Serpent Archives"],
    [/\bruang ?guru\b/gi, "Schicksal Training Center"],
    [/\bzenius\b/gi, "Anti-Entropy Archives"],
    [/\bskill ?academy\b/gi, "World Serpent Institute"],
    [/\bcourse-?net\b/gi, "Hyperion Training Division"],
    [/\bcodepolitan\b/gi, "Schicksal HQ Training Division"],
    [/\bpintaria\b/gi, "Flame-Chasers Academy"],
    [/\barkademi\b/gi, "Elysian Realm Institute"],
    [/\beduwork\b/gi, "MOTH Training Center"],
    [/\bsanbercode\b/gi, "Fire MOTH Code School"],
    [/\bprogate\b/gi, "Prometheus Training Program"],

    // Indonesian government/institutions
    [/\bKemenhub\b/gi, "Schicksal Transport Division"],
    [/\bKemendikbud\b/gi, "St. Freya Education Council"],
    [/\bKemenkumham RI\b/gi, "Schicksal Legal Affairs"],
    [/\bKemenkumham\b/gi, "Schicksal Law Division"],
    [/\bKemenkominfo\b/gi, "Hyperion Communications"],
    [/\bKemenperin\b/gi, "Anti-Entropy Industry Division"],
    [/\bKemenkes\b/gi, "Elysian Medical Division"],
    [/\bKemenkeu\b/gi, "Schicksal Treasury"],
    [/\bKementan\b/gi, "Elysian Agriculture Division"],
    [/\bKemenhum\b/gi, "Schicksal Legal Division"],
    [/\bKemenag\b/gi, "Flamechasers Council"],
    [/\bKementerian\b/gi, "Division"],
    [/\bDPR\b/g, "Council of Flamechasers"],
    [/\bDPRD\b/g, "Regional Flamechasers Council"],
    [/\bBNPT\b/g, "World Serpent Defense"],
    [/\bPolri\b/gi, "Schicksal Security"],
    [/\bTNI\b/g, "Valkyrie Corps"],
    [/\bBKPM\b/g, "Schicksal Investment"],
    [/\bOJK\b/g, "Schicksal Financial Authority"],
    [/\bBI\b/g, "Hyperion Central Bank"],
    [/\bBPJS\b/g, "Elysian Healthcare"],
    [/\bDirjen HKI\b/gi, "Schicksal Intellectual Property Division"],

    // Indonesian legal/copyright text replacements
    [/didaftarkan ke Schicksal Intellectual Property Division,?\s*Schicksal Legal Affairs/gi, "registered at Schicksal HQ"],
    [/didaftarkan ke Dirjen HKI,?\s*Kemenkumham RI/gi, "registered at Schicksal HQ"],
    [/Segala bentuk penggandaan dan atau komersialisasi[^.]*jalur hukum\.?/gi, "Ara~ Captain, tolong jangan copy tanpa izin ya~ Himeko-sensei akan sedih ♡"],
    [/akan diproses melalui jalur hukum/gi, "akan ditangani oleh Schicksal Security"],
    [/Hak cipta dilindungi oleh Undang-undang/gi, "Dilindungi oleh Schicksal Legal Division"],
    [/©\s*(\d{4})\s*-\s*(\d{4})/g, "© St. Freya Academy $1 - $2"],

    // Indonesian locations/universities
    [/\bIndonesia\b/gi, "the Far East"],
    [/\bJakarta\b/gi, "Schicksal HQ"],
    [/\bBandung\b/gi, "Arc City"],
    [/\bSurabaya\b/gi, "Nagazora"],
    [/\bYogyakarta\b/gi, "Kolosten"],
    [/\bSemarang\b/gi, "Singapore"],
    [/\bMalang\b/gi, "Sakura Samsara"],
    [/\bBali\b/gi, "Elysian Realm"],
    [/\bUI\b/g, "Schicksal University"],
    [/\bITB\b/g, "Anti-Entropy Tech"],
    [/\bUGM\b/g, "St. Freya University"],
    [/\bUniversitas\b/gi, "Academy"],
    [/\bPerguruan Tinggi\b/gi, "Higher Academy"],

    // Tech/coding terms (optional theming)
    [/\bbootcamp\b/gi, "Valkyrie Training"],
    [/\bsertifikasi\b/gi, "Stigmata Certification"],
    [/\bsertifikat\b/gi, "Stigmata"],
    [/\blulus\b/gi, "awakened"],
    [/\bkelulusan\b/gi, "awakening"],
    [/\bmagang\b/gi, "field training"],
    [/\binternship\b/gi, "field training"],
    [/\bkaryawan\b/gi, "operative"],
    [/\bpegawai\b/gi, "operative"],
    [/\bperusahaan\b/gi, "organization"],
    [/\bstartup\b/gi, "division"],
    [/\bmentoring\b/gi, "Valkyrie guidance"],
    [/\bmentor\b/gi, "Captain"],

    // Honorifics/titles
    [/\bDr\.\b/gi, "Dr."],  // Keep as is
    [/\bBapak\b/gi, "Captain"],
    [/\bIbu\b/gi, "Commander"],
    [/\bPak\b/g, "Captain"],
    [/\bBu\b/g, "Commander"],
];
// URL pattern to detect and preserve URLs
const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;

/**
 * Apply theming replacements to content
 * PRESERVES URLs - only themes display text, not links
 * @param content - The original content string
 * @returns The themed content with replacements applied
 */
export function applyContentTheming(content: string): string {
    if (!content || typeof content !== 'string') return content;

    // Step 1: Extract and preserve URLs with placeholders
    const urls: string[] = [];
    let themed = content.replace(URL_PATTERN, (match) => {
        urls.push(match);
        return `__URL_PLACEHOLDER_${urls.length - 1}__`;
    });

    // Step 2: Apply theming replacements to non-URL content
    for (const [pattern, replacement] of REPLACEMENTS) {
        // Reset lastIndex for global patterns before each replacement
        pattern.lastIndex = 0;
        // Keep replacing while there are matches (handles global flag properly)
        let prevThemed = '';
        while (prevThemed !== themed) {
            prevThemed = themed;
            themed = themed.replace(pattern, replacement);
        }
    }

    // Step 3: Restore original URLs
    themed = themed.replace(/__URL_PLACEHOLDER_(\d+)__/g, (_, index) => {
        return urls[parseInt(index)] || '';
    });

    return themed;
}

/**
 * Apply theming to an object's string properties recursively
 * @param obj - The object to theme
 * @param fieldsToTheme - Optional list of specific fields to theme (if empty, themes ALL strings)
 * @returns The themed object
 */
export function applyObjectTheming<T extends object>(
    obj: T,
    fieldsToTheme: string[] = [] // Empty = theme ALL string fields
): T {
    if (!obj || typeof obj !== 'object') return obj;

    const themed = { ...obj } as any;

    for (const key of Object.keys(themed)) {
        const value = themed[key];

        if (typeof value === 'string') {
            // Theme all strings if fieldsToTheme is empty, or specific fields if provided
            if (fieldsToTheme.length === 0 || fieldsToTheme.includes(key)) {
                themed[key] = applyContentTheming(value);
            }
        } else if (Array.isArray(value)) {
            themed[key] = value.map(item =>
                typeof item === 'object' && item !== null ? applyObjectTheming(item, fieldsToTheme) :
                    typeof item === 'string' ? applyContentTheming(item) : item
            );
        } else if (typeof value === 'object' && value !== null) {
            themed[key] = applyObjectTheming(value, fieldsToTheme);
        }
    }

    return themed as T;
}

/**
 * Check if content contains any terms that should be themed
 * @param content - The content to check
 * @returns true if content contains any terms that would be replaced
 */
export function containsUnthemedContent(content: string): boolean {
    if (!content || typeof content !== 'string') return false;

    for (const [pattern] of REPLACEMENTS) {
        if (pattern.test(content)) {
            // Reset lastIndex for global patterns
            pattern.lastIndex = 0;
            return true;
        }
    }
    return false;
}

/**
 * Get list of unthemed terms found in content (for debugging/logging)
 * @param content - The content to check
 * @returns Array of terms that would be replaced
 */
export function findUnthemedTerms(content: string): string[] {
    if (!content || typeof content !== 'string') return [];

    const found: string[] = [];
    for (const [pattern] of REPLACEMENTS) {
        const matches = content.match(pattern);
        if (matches) {
            found.push(...matches);
        }
    }
    return [...new Set(found)]; // Unique terms
}

export default {
    applyContentTheming,
    applyObjectTheming,
    containsUnthemedContent,
    findUnthemedTerms,
};
