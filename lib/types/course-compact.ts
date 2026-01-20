/**
 * Compact Course Types for Telegram Blob Storage
 * 
 * Normalized, diff-friendly structure:
 * - Arrays for order only
 * - Objects for identity
 * - Short keys for compression
 */

// Block types (short codes)
export type BlockType =
    | 'p'     // paragraph
    | 'h1'    // heading 1
    | 'h2'    // heading 2
    | 'h3'    // heading 3
    | 'img'   // image
    | 'code'  // code block
    | 'q'     // quote
    | 'list'  // bullet list
    | 'olist' // ordered list
    | 'div'   // divider
    | 'video' // video embed
    | 'embed' // generic embed

// Style overrides (only non-defaults stored)
export interface StyleOverrides {
    a?: 'l' | 'c' | 'r';  // align: left, center, right
    c?: string;            // color (hex)
    fs?: number;           // fontSize
    lh?: number;           // lineHeight
    bg?: string;           // background
}

// Block (normalized, with stable ID)
export interface BlockCompact {
    id: string;           // Stable ID: "B1", "B2"
    t: BlockType;         // Type
    v: string;            // Value (plain text, no HTML)
    s?: StyleOverrides;   // Styles (only non-defaults)
    src?: string;         // For images/videos: URL
    alt?: string;         // For images: alt text
    lang?: string;        // For code: language
}

// Lesson (references blocks by ID)
export interface LessonCompact {
    id: string;           // Stable ID: "L1", "L2"
    t: string;            // Title
    d?: string;           // Duration
    b: string[];          // Block IDs in order
}

// Section (groups lessons)
export interface SectionCompact {
    id: string;           // Stable ID: "S1", "S2"
    t: string;            // Title
    l: string[];          // Lesson IDs in order
}

// Course metadata (stored in Firestore, not blob)
export interface CourseMeta {
    title: string;
    description: string;
    thumbnail: string;
    instructor: string;
    instructorAvatar?: string;
    category: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    duration: string;
}

// Course blob (stored in Telegram)
export interface CourseBlob {
    v: number;  // Schema version for migrations
    lessons: Record<string, LessonCompact>;
    blocks: Record<string, BlockCompact>;
}

// Firestore document structure
export interface CourseFirestore {
    id: string;
    meta: CourseMeta;
    sections: SectionCompact[];

    // Published state (students see this)
    published?: {
        tg_file_id: string;
        version: number;
        hash: string;
        lessonCount: number;
        blockCount: number;
        publishedAt: string;
        publishedBy?: string;
    };

    // Draft snapshot (recovery only)
    draft_snapshot?: {
        tg_file_id: string;
        version: number;
        savedAt: string;
        savedBy?: string;
        dirty: boolean;
    };

    // Structure version (bump on add/remove/reorder)
    structure_version: number;

    status: 'draft' | 'published' | 'archived';
    createdAt: string;
    createdBy?: string;
}

// Schema version (bump when changing blob structure)
export const COURSE_BLOB_SCHEMA_VERSION = 1;
