// Content Moderation using Google Cloud Vision Safe Search API
// Detects NSFW content before allowing uploads

import { ImageAnnotatorClient } from '@google-cloud/vision';

// Likelihood ratings from Vision API
type Likelihood = 'UNKNOWN' | 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';

// Safe search results
export interface SafeSearchResult {
    adult: Likelihood;
    violence: Likelihood;
    racy: Likelihood;
    medical: Likelihood;
    spoof: Likelihood;
}

export interface ModerationResult {
    safe: boolean;
    shouldReplace: boolean;  // If true, replace with meme image
    reason?: string;
    scores: SafeSearchResult;
}

// Threshold for blocking - LIKELY or VERY_LIKELY blocks the upload
const BLOCKED_LIKELIHOODS: Likelihood[] = ['LIKELY', 'VERY_LIKELY'];

// Client singleton
let visionClient: ImageAnnotatorClient | null = null;

/**
 * Get Vision API client using dedicated Vision credentials
 * (Uses separate billing-enabled project)
 */
function getVisionClient() {
    if (visionClient) return visionClient;

    // Use dedicated Vision API credentials (separate billing project)
    const credentials = {
        projectId: process.env.VISION_PROJECT_ID,
        credentials: {
            client_email: process.env.VISION_CLIENT_EMAIL,
            private_key: process.env.VISION_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }
    };

    visionClient = new ImageAnnotatorClient(credentials);
    return visionClient;
}

/**
 * Check if content moderation is available
 */
export function isModerationEnabled(): boolean {
    return !!(
        process.env.VISION_PROJECT_ID &&
        process.env.VISION_CLIENT_EMAIL &&
        process.env.VISION_PRIVATE_KEY
    );
}

/**
 * Moderate image content using Google Cloud Vision Safe Search
 * Returns whether the image is safe to upload
 */
export async function moderateImage(imageBuffer: Buffer): Promise<ModerationResult> {
    if (!isModerationEnabled()) {
        console.warn('⚠️ Content moderation not configured, skipping check');
        return {
            safe: true,
            shouldReplace: false,
            scores: {
                adult: 'UNKNOWN',
                violence: 'UNKNOWN',
                racy: 'UNKNOWN',
                medical: 'UNKNOWN',
                spoof: 'UNKNOWN'
            }
        };
    }

    try {
        const client = getVisionClient();

        const [result] = await client.safeSearchDetection({
            image: { content: imageBuffer.toString('base64') }
        });

        const safeSearch = result.safeSearchAnnotation;

        if (!safeSearch) {
            console.warn('⚠️ No safe search results returned');
            return {
                safe: true,
                shouldReplace: false,
                scores: {
                    adult: 'UNKNOWN',
                    violence: 'UNKNOWN',
                    racy: 'UNKNOWN',
                    medical: 'UNKNOWN',
                    spoof: 'UNKNOWN'
                }
            };
        }

        const scores: SafeSearchResult = {
            adult: (safeSearch.adult as Likelihood) || 'UNKNOWN',
            violence: (safeSearch.violence as Likelihood) || 'UNKNOWN',
            racy: (safeSearch.racy as Likelihood) || 'UNKNOWN',
            medical: (safeSearch.medical as Likelihood) || 'UNKNOWN',
            spoof: (safeSearch.spoof as Likelihood) || 'UNKNOWN',
        };

        // Log scores for debugging
        console.log(`🔍 Content moderation scores: adult=${scores.adult}, racy=${scores.racy}, violence=${scores.violence}`);

        // Check for blocked content - ONLY block clearly explicit content
        // We're very lenient because:
        // 1. Anime/game art often gets flagged as "racy" even when SFW
        // 2. Stylized art (Genshin Impact, etc.) should be allowed
        // 3. We only want to block actual pornographic/explicit content
        const blockedReasons: string[] = [];

        // Only block VERY_LIKELY adult content (actual explicit material)
        if (scores.adult === 'VERY_LIKELY') {
            blockedReasons.push('adult content');
        }

        // Only block VERY_LIKELY violence (gore, etc.)
        if (scores.violence === 'VERY_LIKELY') {
            blockedReasons.push('violent content');
        }

        // Racy is NOT blocked - stylized anime art often triggers this falsely
        // This allows Genshin Impact, anime, and similar artistic content

        if (blockedReasons.length > 0) {
            console.log(`🎭 NSFW content detected: ${blockedReasons.join(', ')} - will replace with meme`);
            return {
                safe: false,
                shouldReplace: true,
                reason: `NSFW detected: ${blockedReasons.join(', ')}`,
                scores
            };
        }

        console.log('✅ Content moderation passed');
        return { safe: true, shouldReplace: false, scores };

    } catch (error) {
        console.error('Content moderation error:', error);
        // On error, allow upload but log warning
        return {
            safe: true,
            shouldReplace: false,
            reason: 'Moderation check failed, allowing upload',
            scores: {
                adult: 'UNKNOWN',
                violence: 'UNKNOWN',
                racy: 'UNKNOWN',
                medical: 'UNKNOWN',
                spoof: 'UNKNOWN'
            }
        };
    }
}
