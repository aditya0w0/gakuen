"use client";

/**
 * Invisible Watermark Utility
 * 
 * Embeds invisible attribution links in content that:
 * - Are invisible to humans
 * - Copy with selected text
 * - Are visible to search engine crawlers
 */

// Zero-width characters for encoding
const ZERO_WIDTH_CHARS = {
    ZERO: '\u200B',     // Zero Width Space (represents 0)
    ONE: '\u200C',      // Zero Width Non-Joiner (represents 1)
    SEPARATOR: '\u200D' // Zero Width Joiner (separator)
};

/**
 * Encode a string into zero-width characters
 * Each character is converted to binary and represented by zero-width chars
 */
export function encodeToZeroWidth(text: string): string {
    return text
        .split('')
        .map(char => {
            const binary = char.charCodeAt(0).toString(2).padStart(8, '0');
            return binary
                .split('')
                .map(bit => bit === '0' ? ZERO_WIDTH_CHARS.ZERO : ZERO_WIDTH_CHARS.ONE)
                .join('');
        })
        .join(ZERO_WIDTH_CHARS.SEPARATOR);
}

/**
 * Decode zero-width characters back to original string
 */
export function decodeFromZeroWidth(encoded: string): string {
    if (!encoded) return '';

    // Check if contains zero-width characters
    const hasZeroWidth = encoded.includes(ZERO_WIDTH_CHARS.ZERO) ||
        encoded.includes(ZERO_WIDTH_CHARS.ONE);
    if (!hasZeroWidth) return '';

    try {
        // Extract only zero-width characters
        const zeroWidthOnly = encoded
            .split('')
            .filter(char =>
                char === ZERO_WIDTH_CHARS.ZERO ||
                char === ZERO_WIDTH_CHARS.ONE ||
                char === ZERO_WIDTH_CHARS.SEPARATOR
            )
            .join('');

        return zeroWidthOnly
            .split(ZERO_WIDTH_CHARS.SEPARATOR)
            .map(charBits => {
                const binary = charBits
                    .split('')
                    .map(bit => bit === ZERO_WIDTH_CHARS.ZERO ? '0' : '1')
                    .join('');
                return String.fromCharCode(parseInt(binary, 2));
            })
            .join('');
    } catch {
        return '';
    }
}

/**
 * Create a watermark string with encoded URL
 */
export function createInvisibleWatermark(sourceUrl: string): string {
    const watermarkText = `Source: ${sourceUrl}`;
    return encodeToZeroWidth(watermarkText);
}

/**
 * Create an HTML element with invisible watermark
 * This is visible to crawlers but invisible to users
 * When text is copied, the source link comes with it
 */
export function createWatermarkElement(sourceUrl: string): React.ReactNode {
    // Method 1: Zero-width encoded watermark (copies with text)
    const zeroWidthWatermark = createInvisibleWatermark(sourceUrl);

    // Method 2: Hidden span that copies with selection
    // Uses aria-hidden to hide from screen readers
    // position: absolute + left: -9999px hides visually but copies with text
    return (
        <>
            {/* Zero-width encoded watermark - copies with any selection */}
            <span aria-hidden="true" style={{ fontSize: 0 }}>
                {zeroWidthWatermark}
            </span>
            {/* Hidden source attribution - copies when full paragraph selected */}
            <span
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    left: '-9999px',
                    fontSize: '1px',
                    color: 'transparent',
                    userSelect: 'text', // Ensure it's selectable
                }}
            >
                {` — Source: ${sourceUrl}`}
            </span>
        </>
    );
}

/**
 * Create Schema.org markup for SEO
 * Google crawler will see this and understand the original source
 */
export function createSEOWatermark(courseId: string, courseTitle: string, baseUrl: string = 'https://gakuen.vercel.app'): React.ReactNode {
    const sourceUrl = `${baseUrl}/browse/${courseId}`;

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Course",
                    "name": courseTitle,
                    "url": sourceUrl,
                    "provider": {
                        "@type": "Organization",
                        "name": "Gakuen",
                        "url": baseUrl
                    },
                    "inLanguage": "en",
                    "isAccessibleForFree": false
                })
            }}
        />
    );
}

/**
 * Wrapper component that adds invisible watermark to any content
 */
interface WatermarkedContentProps {
    children: React.ReactNode;
    sourceUrl: string;
    courseId?: string;
    courseTitle?: string;
}

export function WatermarkedContent({
    children,
    sourceUrl,
    courseId,
    courseTitle
}: WatermarkedContentProps): React.ReactElement {
    return (
        <div style={{ position: 'relative' }}>
            {/* SEO Schema.org markup */}
            {courseId && courseTitle && createSEOWatermark(courseId, courseTitle)}

            {/* Invisible watermark */}
            {createWatermarkElement(sourceUrl)}

            {/* Actual content */}
            {children}

            {/* End watermark (in case of partial copy) */}
            {createWatermarkElement(sourceUrl)}
        </div>
    );
}

export default WatermarkedContent;
