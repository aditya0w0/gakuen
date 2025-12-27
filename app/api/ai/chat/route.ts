import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { indexCourse, retrieveContext } from '@/lib/ml/server';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: Request) {
    try {
        const { messages, course, mode } = await request.json();
        const userMessage = messages[messages.length - 1].content;

        // 1. Index course for RAG
        await indexCourse(course);

        // 2. Retrieve context
        const context = await retrieveContext(userMessage, course.id, 3);

        // 3. If deep mode, skip Flash and go straight to Pro
        if (mode === 'deep') {
            return await callPro(userMessage, course, context);
        }

        // 4. Try Flash first - it will ESCALATE if needed
        console.log(`⚡ Trying Flash first...`);
        const flashResponse = await callFlash(userMessage, course, context);

        // 5. Check for escalation
        if (flashResponse.includes('ESCALATE_TO_PRO')) {
            console.log(`🔄 Flash escalated to Pro`);
            return await callPro(userMessage, course, context);
        }

        // 6. Flash handled it
        return NextResponse.json({
            role: 'assistant',
            content: flashResponse,
            modelUsed: 'gemini-3-flash-preview'
        });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function callFlash(userMessage: string, course: any, context: string) {
    const flash = genAI.getGenerativeModel({
        model: 'gemini-3-flash-preview',
        systemInstruction: `You are a course tutor for "${course.title}".

RESPONSE PATTERN:
1. Give a SHORT answer (2-3 sentences max).
2. ALWAYS end with a follow-up offer related to the topic.

FOLLOW-UP EXAMPLES:
- "Would you like to see an example?"
- "Want me to explain how this works in practice?"
- "Should I break down the steps?"

ESCALATION:
If the question requires deep reasoning or multi-step explanation:
- Do NOT answer
- Respond exactly with: "ESCALATE_TO_PRO"

FORMATTING:
- Separate paragraphs with blank lines.

CONTEXT: ${context}`
    });

    const result = await flash.generateContent(userMessage);
    return result.response.text();
}

async function callPro(userMessage: string, course: any, context: string) {
    console.log(`🧠 Using Pro model...`);

    const pro = genAI.getGenerativeModel({
        model: 'gemini-3-pro-preview',
        systemInstruction: `You are an expert teacher for "${course.title}".

RESPONSE PATTERN (CHAIN FORMAT):
1. Answer the core question in 2-3 short paragraphs MAX.
2. ALWAYS end with ONE specific follow-up offer.

FOLLOW-UP FORMAT:
End with: "Would you like to explore [specific related topic]?"

Examples:
- "Would you like to explore how O(n) compares to O(log n)?"
- "Want me to show you a code example?"
- "Should I explain why this matters for large datasets?"

STRICT RULES:
- No introductions, no summaries.
- Under 100 words before the follow-up.
- One idea per paragraph.
- Separate paragraphs with blank lines.

CONTEXT: ${context}`
    });

    const result = await pro.generateContent(userMessage);
    const text = result.response.text();

    return NextResponse.json({
        role: 'assistant',
        content: text,
        modelUsed: 'gemini-3-pro-preview'
    });
}
