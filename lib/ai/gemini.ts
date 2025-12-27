import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Fix typos - lightweight, fast (Flash)
export async function fixTypos(text: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const prompt = `Fix any typos and grammatical errors in the following text. Return ONLY the corrected text, no explanations:\n\n${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
}

// Paraphrase - high quality, human-like (Pro)
export async function paraphraseText(text: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

    const prompt = `Paraphrase the following text to make it sound more natural and engaging. Maintain the same meaning but improve the flow. Return ONLY the paraphrased text:\n\n${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
}

// General text improvement - high quality (Pro)
export async function improveText(text: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

    const prompt = `Improve the following text by making it clearer, more concise, and more engaging. Fix any issues and enhance readability. Return ONLY the improved text:\n\n${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
}

// Image generation
export async function generateImage(prompt: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-image-preview' });

    console.log('🎨 Generating image with prompt:', prompt);

    const result = await model.generateContent(prompt);

    console.log('📦 Full result:', JSON.stringify(result, null, 2));

    const response = await result.response;
    console.log('📝 Response object:', JSON.stringify(response, null, 2));

    // Check for inline data (base64 image)
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts?.[0]?.inlineData) {
        const img = candidate.content.parts[0].inlineData;
        const dataUrl = `data:${img.mimeType};base64,${img.data}`;
        console.log('✅ Found inline image data');
        return dataUrl;
    }

    // Try text response
    const text = response.text();
    console.log('📄 Text response:', text);
    if (text && text.trim()) {
        return text.trim();
    }

    throw new Error('No image data found in response');
}
// Recommendation engine
export async function recommendCourses(userQuery: string, coursesJson: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' }); // Using 2.0 Flash as standard "V3" equivalent or just use the same string as others if they really have 3.0. 
    // Wait, the previous file read showed `gemini-3-flash-preview`. I will use that.

    // logic...


    const prompt = `
    You are an expert educational advisor.
    
    Task: unique and specific recommendation based on the user's interest.
    
    User Query: "${userQuery}"
    
    Available Courses:
    ${coursesJson}
    
    Instructions:
    1. Analyze the user's intent.
    2. Pick the SINGLE best matching course from the list.
    3. If no course perfectly matches, pick the closest one or a fundamental one (like CS 101).
    4. Provide a short, encouraging reason why this fits them.
    
    Return JSON ONLY:
    {
        "courseId": "id-of-course",
        "reason": "One sentence explanation..."
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Cleanup markdown code blocks if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return text;
}
