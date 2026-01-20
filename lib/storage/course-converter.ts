/**
 * Convert between legacy Course format and new CourseBlob format
 * 
 * Legacy: Course with embedded lessons and components
 * New: CourseBlob with normalized lessons and blocks
 */

import { Course, Lesson } from '@/lib/types';
import {
    CourseBlob,
    LessonCompact,
    BlockCompact,
    SectionCompact,
    CourseMeta,
    BlockType,
    COURSE_BLOB_SCHEMA_VERSION
} from '@/lib/types/course-compact';

/**
 * Convert legacy component type to compact block type
 */
function getBlockType(componentType: string): BlockType {
    const typeMap: Record<string, BlockType> = {
        'text': 'p',
        'paragraph': 'p',
        'header': 'h1',
        'heading': 'h1',
        'image': 'img',
        'code': 'code',
        'quote': 'q',
        'list': 'list',
        'divider': 'div',
        'video': 'video',
        'embed': 'embed',
    };
    return typeMap[componentType] || 'p';
}

/**
 * Extract plain text from HTML content
 */
function htmlToPlainText(html: string): string {
    if (!html) return '';
    // Simple HTML stripping (for server-side use)
    return html
        .replace(/<[^>]*>/g, '')  // Remove tags
        .replace(/&nbsp;/g, ' ')   // Replace nbsp
        .replace(/&amp;/g, '&')    // Replace amp
        .replace(/&lt;/g, '<')     // Replace lt
        .replace(/&gt;/g, '>')     // Replace gt
        .replace(/&quot;/g, '"')   // Replace quot
        .trim();
}

/**
 * Convert legacy Course to new CourseBlob
 */
export function courseToBlob(course: Course): {
    blob: CourseBlob;
    meta: CourseMeta;
    sections: SectionCompact[];
} {
    const lessons: Record<string, LessonCompact> = {};
    const blocks: Record<string, BlockCompact> = {};

    let blockCounter = 1;
    let lessonCounter = 1;

    // Convert each lesson
    for (const lesson of course.lessons || []) {
        const lessonId = `L${lessonCounter++}`;
        const blockIds: string[] = [];

        // Convert components to blocks
        for (const component of lesson.components || []) {
            const blockId = `B${blockCounter++}`;
            // Cast to any for safe access to all possible component properties
            const c = component as any;

            const block: BlockCompact = {
                id: blockId,
                t: getBlockType(c.type),
                // Preserve HTML content for rich formatting in student view
                v: c.content || c.text || c.code || '',
            };

            // Add optional fields
            if (c.src || c.imageUrl) {
                block.src = c.src || c.imageUrl;
            }
            if (c.alt) {
                block.alt = c.alt;
            }
            if (c.language) {
                block.lang = c.language;
            }

            // Add non-default styles
            const styles: any = {};
            if (c.align && c.align !== 'left') {
                styles.a = c.align === 'center' ? 'c' : 'r';
            }
            if (c.color && c.color !== '#d4d4d8') {
                styles.c = c.color;
            }
            if (c.fontSize && c.fontSize !== 16) {
                styles.fs = c.fontSize;
            }
            if (Object.keys(styles).length > 0) {
                block.s = styles;
            }

            blocks[blockId] = block;
            blockIds.push(blockId);
        }

        // Build lesson object with optional tiptapJson for rich rendering
        const lessonData: any = {
            id: lessonId,
            t: lesson.title,
            d: lesson.duration,
            b: blockIds,
        };

        // Preserve tiptapJson if it exists (for perfect rich text rendering)
        if (lesson.tiptapJson) {
            lessonData.j = lesson.tiptapJson;  // 'j' for JSON (compact key)
        }

        lessons[lessonId] = lessonData;
    }

    // Convert sections
    const sections: SectionCompact[] = (course.sections || []).map((section, i) => ({
        id: `S${i + 1}`,
        t: section.title,
        l: section.lessonIds.map((_, j) => `L${j + 1}`),
    }));

    // Extract metadata (filter out undefined values for Firestore)
    const metaRaw = {
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        instructor: course.instructor,
        instructorAvatar: course.instructorAvatar,
        category: course.category,
        level: course.level,
        duration: course.duration,
    };
    // Filter out undefined values and cast
    const meta = Object.fromEntries(
        Object.entries(metaRaw).filter(([_, v]) => v !== undefined)
    ) as unknown as CourseMeta;

    const blob: CourseBlob = {
        v: COURSE_BLOB_SCHEMA_VERSION,
        lessons,
        blocks,
    };

    return { blob, meta, sections };
}

/**
 * Convert CourseBlob back to legacy Course format
 * Used for backward compatibility during migration
 */
export function blobToCourse(
    id: string,
    meta: CourseMeta,
    sections: SectionCompact[],
    blob: CourseBlob
): Course {
    const lessons: Lesson[] = [];

    // Get lesson order from sections, or fallback to all lessons in blob
    let lessonOrder: string[] = sections.flatMap(s => s.l);

    // IMPORTANT: If sections is empty (common for new courses), 
    // fallback to iterating all lessons in the blob
    if (lessonOrder.length === 0) {
        lessonOrder = Object.keys(blob.lessons).sort((a, b) => {
            // Sort by L1, L2, L3... order
            const numA = parseInt(a.replace('L', '')) || 0;
            const numB = parseInt(b.replace('L', '')) || 0;
            return numA - numB;
        });
    }

    for (const lessonId of lessonOrder) {
        const lesson = blob.lessons[lessonId];
        if (!lesson) continue;

        const components = lesson.b.map(blockId => {
            const block = blob.blocks[blockId];
            if (!block) return null;

            // Map blob block types to component types
            let componentType: string = block.t;
            let level: number | undefined;

            if (block.t === 'p') {
                componentType = 'text';
            } else if (block.t === 'h1' || block.t === 'h2' || block.t === 'h3') {
                componentType = 'header';
                level = parseInt(block.t.replace('h', ''));
            } else if (block.t === 'img') {
                componentType = 'image';
            } else if (block.t === 'code') {
                componentType = 'code';
            } else if (block.t === 'div') {
                componentType = 'divider';
            } else if (block.t === 'list') {
                componentType = 'text';  // Lists are rendered as HTML in text
            } else if (block.t === 'olist') {
                componentType = 'text';  // Ordered lists as HTML in text
            }

            return {
                id: block.id,
                type: componentType,
                content: block.v,
                text: block.v,
                level: level,
                src: block.src,
                url: block.src,  // For image component
                alt: block.alt,
                language: block.lang,
                // Only set styling if explicitly saved in blob (don't override prose CSS)
                align: block.s?.a === 'c' ? 'center' : block.s?.a === 'r' ? 'right' : undefined,
                color: block.s?.c,  // No default - let CSS handle it
                fontSize: block.s?.fs,  // No default - let prose classes handle it
            };
        }).filter(Boolean);

        // Build lesson with optional tiptapJson for rich rendering
        const restoredLesson: any = {
            id: lesson.id,
            title: lesson.t,
            type: 'cms',
            duration: lesson.d || '',
            order: lessons.length + 1,
            components: components as any[],
        };

        // Restore tiptapJson if it was stored (key 'j')
        if ((lesson as any).j) {
            restoredLesson.tiptapJson = (lesson as any).j;
        }

        lessons.push(restoredLesson);
    }

    return {
        id,
        ...meta,
        lessonsCount: lessons.length,
        enrolledCount: 0,
        rating: 0,
        price: 0,
        lessons,
        sections: sections.map(s => ({
            id: s.id,
            title: s.t,
            lessonIds: s.l,
        })),
    };
}
