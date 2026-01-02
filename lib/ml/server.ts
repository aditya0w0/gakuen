import { pipeline } from '@xenova/transformers';
import { Course } from '@/lib/types';

// Singleton for model loading
class MLService {
    static instance: any = null;
    static modelName = 'Xenova/all-MiniLM-L6-v2';

    static async getExtractor() {
        if (!MLService.instance) {
            console.log("Starting ML Model Load...");
            MLService.instance = await pipeline('feature-extraction', MLService.modelName);
            console.log("ML Model Loaded!");
        }
        return MLService.instance;
    }
}

// Cosine Similarity
function cosineSimilarity(a: number[], b: number[]) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function getEmbeddings(text: string) {
    const extractor = await MLService.getExtractor();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data) as number[];
}

export async function findSimilarCourses(courseId: string, allCourses: Course[]) {
    // 1. Get current course
    const currentCourse = allCourses.find(c => c.id === courseId);
    if (!currentCourse) return [];

    // 2. Compute embeddings (Real-world: Cache these!)
    const currentEmbedding = await getEmbeddings(`${currentCourse.title} ${currentCourse.description} ${currentCourse.category}`);

    // 3. Compare with others
    const scores = await Promise.all(allCourses
        .filter(c => c.id !== courseId)
        .map(async (c) => {
            const embedding = await getEmbeddings(`${c.title} ${c.description} ${c.category}`);
            const score = cosineSimilarity(currentEmbedding, embedding);
            return { ...c, score };
        })
    );

    // 4. Sort and return top 3
    return scores.sort((a, b) => b.score - a.score).slice(0, 3);
}

export async function searchCourses(query: string, allCourses: Course[]) {
    // 1. Get query embedding
    const queryEmbedding = await getEmbeddings(query);

    // 2. Compare with all courses
    const scores = await Promise.all(allCourses.map(async (c) => {
        // Create a rich context string for the course
        const content = `${c.title} ${c.description} ${c.category} ${c.level}`;
        const embedding = await getEmbeddings(content);
        // Note: score property is added to the return object, not modifying the original type permanently for this scope
        const score = cosineSimilarity(queryEmbedding, embedding);
        return { ...c, score };
    }));

    return scores.sort((a, b) => b.score - a.score);
}

// RAG: In-memory vector store for active course sessions
// Map<CourseID, { text: string; embedding: number[] }[]>
const courseVectorStore = new Map<string, { text: string; embedding: number[] }[]>();

function chunkText(text: string, chunkSize: number = 500): string[] {
    // Simple recursive chunking
    if (text.length <= chunkSize) return [text];

    // Split by paragraph
    const paragraphs = text.split('\n\n');
    const chunks: string[] = [];
    let currentChunk = "";

    for (const p of paragraphs) {
        if (currentChunk.length + p.length > chunkSize) {
            chunks.push(currentChunk);
            currentChunk = p;
        } else {
            currentChunk += (currentChunk ? "\n\n" : "") + p;
        }
    }
    if (currentChunk) chunks.push(currentChunk);

    return chunks;
}

export async function indexCourse(course: Course) {
    if (courseVectorStore.has(course.id)) return; // Already indexed

    console.log(`📚 Indexing course: ${course.title}`);
    const chunks: { text: string; embedding: number[] }[] = [];

    // Index Course Info
    const infoText = `Course Title: ${course.title}\nDescription: ${course.description}`;
    chunks.push({
        text: infoText,
        embedding: await getEmbeddings(infoText)
    });

    // Index Lessons
    if (course.lessons) {
        for (const lesson of course.lessons) {
            if (!lesson.content) continue;

            const lessonContext = `Lesson: ${lesson.title}\n`;
            const textChunks = chunkText(lesson.content, 800);

            for (const chunk of textChunks) {
                const fullText = lessonContext + chunk;
                chunks.push({
                    text: fullText,
                    embedding: await getEmbeddings(fullText)
                });
            }
        }
    }

    courseVectorStore.set(course.id, chunks);
    console.log(`✅ Indexed ${chunks.length} chunks for ${course.id}`);
}

export async function retrieveContext(query: string, courseId: string, topK: number = 3): Promise<string> {
    const courseIndex = courseVectorStore.get(courseId);
    if (!courseIndex) return "";

    const queryEmbedding = await getEmbeddings(query);

    const scoredChunks = courseIndex.map(chunk => ({
        text: chunk.text,
        score: cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    // Sort descending
    scoredChunks.sort((a, b) => b.score - a.score);

    // Return top K text joined
    return scoredChunks.slice(0, topK).map(c => c.text).join("\n\n---\n\n");
}
