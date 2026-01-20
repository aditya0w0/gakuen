/**
 * TipTap to BlockCompact Bridge
 * 
 * Converts TipTap editor output to normalized BlockCompact format
 * for direct storage without legacy component conversion.
 */

import { BlockCompact, BlockType } from '@/lib/types/course-compact';

/**
 * Map TipTap node types to BlockCompact types
 */
function getBlockType(nodeType: string, level?: number): BlockType {
    switch (nodeType) {
        case 'heading':
            if (level === 1) return 'h1';
            if (level === 2) return 'h2';
            return 'h3';
        case 'paragraph':
            return 'p';
        case 'image':
            return 'img';
        case 'codeBlock':
            return 'code';
        case 'blockquote':
            return 'q';
        case 'bulletList':
        case 'orderedList':
            return 'list';
        case 'horizontalRule':
            return 'div';
        case 'quiz':
            return 'quiz';
        default:
            return 'p';
    }
}

/**
 * Extract plain text from TipTap node
 */
function extractText(node: any): string {
    if (!node) return '';

    if (typeof node === 'string') return node;

    if (node.text) return node.text;

    if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractText).join('');
    }

    return '';
}

/**
 * Convert a single TipTap node to BlockCompact
 */
export function nodeToBlock(node: any, blockId: string): BlockCompact {
    const block: BlockCompact = {
        id: blockId,
        t: getBlockType(node.type, node.attrs?.level),
        v: extractText(node),
    };

    // Handle image
    if (node.type === 'image' && node.attrs) {
        block.src = node.attrs.src;
        if (node.attrs.alt) block.alt = node.attrs.alt;
    }

    // Handle code block
    if (node.type === 'codeBlock' && node.attrs?.language) {
        block.lang = node.attrs.language;
    }

    // Handle quiz
    if (node.type === 'quiz' && node.attrs) {
        block.quiz = {
            q: node.attrs.question || '',
            o: node.attrs.options || [],
            a: node.attrs.correctIndex ?? 0,
        };
    }

    return block;
}

/**
 * Convert TipTap JSON document to array of BlockCompact
 */
export function tiptapToBlocks(
    doc: any,
    courseId: string,
    existingBlockIds?: string[]
): { blocks: BlockCompact[]; blockIds: string[] } {
    const blocks: BlockCompact[] = [];
    const blockIds: string[] = [];

    if (!doc || !doc.content) {
        return { blocks: [], blockIds: [] };
    }

    let blockCounter = 0;

    for (const node of doc.content) {
        // Skip empty paragraphs
        if (node.type === 'paragraph' && !extractText(node).trim()) {
            continue;
        }

        // Generate or reuse block ID
        const blockId = existingBlockIds?.[blockCounter] ||
            `B${courseId.slice(-6)}_${Date.now()}_${blockCounter}`;

        const block = nodeToBlock(node, blockId);
        blocks.push(block);
        blockIds.push(blockId);
        blockCounter++;
    }

    return { blocks, blockIds };
}

/**
 * Convert BlockCompact back to TipTap-compatible JSON
 * (for loading existing content into editor)
 */
export function blocksToTiptap(blocks: BlockCompact[]): any {
    const content = blocks.map(block => {
        switch (block.t) {
            case 'h1':
                return {
                    type: 'heading',
                    attrs: { level: 1 },
                    content: block.v ? [{ type: 'text', text: block.v }] : [],
                };
            case 'h2':
                return {
                    type: 'heading',
                    attrs: { level: 2 },
                    content: block.v ? [{ type: 'text', text: block.v }] : [],
                };
            case 'h3':
                return {
                    type: 'heading',
                    attrs: { level: 3 },
                    content: block.v ? [{ type: 'text', text: block.v }] : [],
                };
            case 'p':
                return {
                    type: 'paragraph',
                    content: block.v ? [{ type: 'text', text: block.v }] : [],
                };
            case 'img':
                return {
                    type: 'image',
                    attrs: { src: block.src, alt: block.alt || '' },
                };
            case 'code':
                return {
                    type: 'codeBlock',
                    attrs: { language: block.lang || 'plain' },
                    content: block.v ? [{ type: 'text', text: block.v }] : [],
                };
            case 'q':
                return {
                    type: 'blockquote',
                    content: [{
                        type: 'paragraph',
                        content: block.v ? [{ type: 'text', text: block.v }] : [],
                    }],
                };
            case 'list':
                return {
                    type: 'bulletList',
                    content: (block.v || '').split('\n').map(item => ({
                        type: 'listItem',
                        content: [{
                            type: 'paragraph',
                            content: item ? [{ type: 'text', text: item }] : [],
                        }],
                    })),
                };
            case 'div':
                return { type: 'horizontalRule' };
            case 'quiz':
                return {
                    type: 'quiz',
                    attrs: {
                        question: block.quiz?.q || '',
                        options: block.quiz?.o || [],
                        correctIndex: block.quiz?.a ?? 0,
                    },
                };
            default:
                return {
                    type: 'paragraph',
                    content: block.v ? [{ type: 'text', text: block.v }] : [],
                };
        }
    });

    return {
        type: 'doc',
        content,
    };
}

/**
 * Compare two blocks and return if they're different
 */
export function blocksDiffer(a: BlockCompact, b: BlockCompact): boolean {
    if (a.t !== b.t) return true;
    if (a.v !== b.v) return true;
    if (a.src !== b.src) return true;
    if (a.alt !== b.alt) return true;
    if (a.lang !== b.lang) return true;
    if (JSON.stringify(a.s) !== JSON.stringify(b.s)) return true;
    if (JSON.stringify(a.quiz) !== JSON.stringify(b.quiz)) return true;
    return false;
}
