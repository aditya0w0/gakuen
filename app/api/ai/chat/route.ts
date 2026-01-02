import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { indexCourse, retrieveContext } from '@/lib/ml/server';
import { requireAuth, safeErrorResponse } from '@/lib/api/auth-guard';
import { checkRateLimit, getClientIP, RateLimits } from '@/lib/api/rate-limit';
import { initAdmin } from '@/lib/auth/firebase-admin';
import { AI_MODELS, SUBSCRIPTION_TIERS, SubscriptionTier, checkAILimit } from '@/lib/constants/subscription';
import { FieldValue } from 'firebase-admin/firestore';
import { isAIEnabled, shouldBypassRateLimits, shouldUnlockAI } from '@/lib/admin/feature-flags';

export const dynamic = 'force-dynamic';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Model mapping for tiers
const TIER_MODELS = {
    free: 'gemini-2.0-flash-lite',
    basic: 'gemini-2.0-flash',
    mid: 'gemini-2.0-flash', // Pro on request
    pro: 'gemini-2.0-flash', // Pro on request
} as const;

export async function POST(request: NextRequest) {
    try {
        // 🔧 Feature flag check
        if (!(await isAIEnabled())) {
            return NextResponse.json(
                { error: 'AI features are temporarily disabled for maintenance.' },
                { status: 503 }
            );
        }

        // 🔧 Check if rate limits should be bypassed
        const bypassRateLimits = await shouldBypassRateLimits();

        // 🔒 SECURITY: Rate limiting (unless bypassed)
        if (!bypassRateLimits) {
            const clientIP = getClientIP(request);
            const rateLimit = checkRateLimit(`ai-chat:${clientIP}`, RateLimits.AI);
            if (!rateLimit.allowed) {
                return NextResponse.json(
                    { error: 'Too many requests. Please wait before trying again.' },
                    {
                        status: 429,
                        headers: {
                            'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
                            'X-RateLimit-Remaining': '0',
                        }
                    }
                );
            }
        }

        // 🔒 SECURITY: Require authentication
        const authResult = await requireAuth(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        const { messages, course, mode } = await request.json();

        // 🔒 SECURITY: Validate input
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: 'Messages required' }, { status: 400 });
        }
        if (!course || !course.id || !course.title) {
            return NextResponse.json({ error: 'Course data required' }, { status: 400 });
        }

        const userMessage = messages[messages.length - 1].content;
        if (typeof userMessage !== 'string' || userMessage.length > 5000) {
            return NextResponse.json({ error: 'Message too long (max 5000 chars)' }, { status: 400 });
        }

        // Get user's subscription tier and AI usage
        const admin = initAdmin();
        let userTier: SubscriptionTier = 'free';
        let aiUsage = { proRequestsToday: 0, flashRequestsToday: 0, lastResetDate: '' };
        let userRef: FirebaseFirestore.DocumentReference | null = null;

        if (admin) {
            const db = admin.firestore();
            userRef = db.collection('users').doc(authResult.user.id);
            const userDoc = await userRef.get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                userTier = userData?.subscription?.tier || 'free';
                aiUsage = userData?.subscription?.aiUsage || aiUsage;

                // Check if daily limits need to reset
                const today = new Date().toISOString().split('T')[0];
                if (aiUsage.lastResetDate !== today) {
                    aiUsage = {
                        proRequestsToday: 0,
                        flashRequestsToday: 0,
                        lastResetDate: today,
                    };
                }
            }
        }

        // Determine model based on tier and mode
        // Check if AI should be unlocked for all (promo/testing)
        const unlockAI = await shouldUnlockAI(authResult.user.id);
        const effectiveTier = unlockAI ? 'pro' : userTier;
        let modelToUse = TIER_MODELS[effectiveTier];
        let usingProModel = false;

        // Check if user wants Pro model and has access
        if (mode === 'deep' && (userTier === 'mid' || userTier === 'pro')) {
            const proLimit = checkAILimit(userTier, aiUsage, 'pro');
            if (proLimit.allowed) {
                modelToUse = 'gemini-2.0-flash'; // Use best available
                usingProModel = true;
            } else {
                return NextResponse.json({
                    error: `Daily Pro AI limit reached (${SUBSCRIPTION_TIERS[userTier].aiLimits.proRequestsPerDay}/day). Try again tomorrow or use standard mode.`,
                    remaining: proLimit.remaining,
                }, { status: 429 });
            }
        }

        // Check Flash limits for non-pro tiers
        if (!usingProModel && userTier !== 'mid' && userTier !== 'pro') {
            const flashLimit = checkAILimit(userTier, aiUsage, 'flash');
            if (!flashLimit.allowed) {
                return NextResponse.json({
                    error: `Daily AI limit reached (${SUBSCRIPTION_TIERS[userTier].aiLimits.flashRequestsPerDay}/day). Upgrade your plan for more requests.`,
                    remaining: flashLimit.remaining,
                    upgradeUrl: '/pricing',
                }, { status: 429 });
            }
        }

        console.log(`🤖 User ${authResult.user.email} (${userTier}) using ${modelToUse}`);

        // 1. Index course for RAG
        await indexCourse(course);

        // 2. Retrieve context
        const context = await retrieveContext(userMessage, course.id, 3);

        // 3. Make AI call
        const response = await callAI(userMessage, course, context, modelToUse, usingProModel);

        // 4. Update usage tracking
        if (admin && userRef) {
            try {
                const usageUpdate = usingProModel
                    ? { 'subscription.aiUsage.proRequestsToday': FieldValue.increment(1) }
                    : { 'subscription.aiUsage.flashRequestsToday': FieldValue.increment(1) };

                await userRef.update({
                    ...usageUpdate,
                    'subscription.aiUsage.lastResetDate': new Date().toISOString().split('T')[0],
                });
            } catch (e) {
                console.log('Failed to update AI usage:', e);
            }
        }

        return response;

    } catch (error: unknown) {
        return safeErrorResponse(error, 'Chat service unavailable');
    }
}

async function callAI(
    userMessage: string,
    course: { id: string; title: string; lessons?: unknown[] },
    context: string,
    modelName: string,
    isDeepMode: boolean
) {
    const systemPrompt = isDeepMode
        ? `You are an expert teacher for "${course.title}".

RESPONSE PATTERN (CHAIN FORMAT):
1. Answer the core question in 2-3 short paragraphs MAX.
2. ALWAYS end with ONE specific follow-up offer.

FOLLOW-UP FORMAT:
End with: "Would you like to explore [specific related topic]?"

STRICT RULES:
- No introductions, no summaries.
- Under 100 words before the follow-up.
- One idea per paragraph.
- Separate paragraphs with blank lines.

CONTEXT: ${context}`
        : `You are a course tutor for "${course.title}".

RESPONSE PATTERN:
1. Give a SHORT answer (2-3 sentences max).
2. ALWAYS end with a follow-up offer related to the topic.

FOLLOW-UP EXAMPLES:
- "Would you like to see an example?"
- "Want me to explain how this works in practice?"
- "Should I break down the steps?"

FORMATTING:
- Separate paragraphs with blank lines.

CONTEXT: ${context}`;

    const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userMessage);
    const text = result.response.text();

    return NextResponse.json({
        role: 'assistant',
        content: text,
        modelUsed: modelName,
        tier: isDeepMode ? 'pro' : 'flash',
    });
}

