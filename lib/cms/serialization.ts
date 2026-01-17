// Serialization utilities for converting between Tiptap JSON and Component[] format
// This ensures backward compatibility with existing course data

import { Component, HeaderComponent, TextComponent, ImageComponent, CodeComponent, DividerComponent } from './types';
import { v4 as uuidv4 } from 'uuid';

// Tiptap node types
interface TiptapNode {
    type: string;
    attrs?: Record<string, unknown>;
    content?: TiptapNode[];
    text?: string;
    marks?: { type: string; attrs?: Record<string, unknown> }[];
}

interface TiptapDoc {
    type: 'doc';
    content: TiptapNode[];
}

/**
 * Convert Component[] array to Tiptap JSON document
 */
export function deserializeFromComponents(components: Component[]): TiptapDoc {
    const content: TiptapNode[] = [];

    for (const comp of components) {
        switch (comp.type) {
            case 'header': {
                const header = comp as HeaderComponent;
                content.push({
                    type: 'heading',
                    attrs: { level: header.level || 2 },
                    content: [{ type: 'text', text: header.text || '' }],
                });
                break;
            }

            case 'text': {
                const text = comp as TextComponent;
                // Parse HTML to extract paragraphs
                const htmlContent = text.content || '';
                // Simple parsing - treat each content as a paragraph
                // For more complex HTML, we'd need a proper parser
                const cleanText = htmlContent
                    .replace(/<p>/gi, '')
                    .replace(/<\/p>/gi, '\n')
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<[^>]+>/g, '') // Strip remaining HTML
                    .trim();

                const paragraphs = cleanText.split('\n').filter(p => p.trim());

                for (const para of paragraphs) {
                    content.push({
                        type: 'paragraph',
                        content: [{ type: 'text', text: para }],
                    });
                }

                if (paragraphs.length === 0) {
                    content.push({
                        type: 'paragraph',
                        content: [{ type: 'text', text: cleanText || '' }],
                    });
                }
                break;
            }

            case 'image': {
                const image = comp as ImageComponent;
                content.push({
                    type: 'customImage',
                    attrs: {
                        src: image.url,
                        alt: image.alt || '',
                        title: image.caption || '',
                    },
                });
                break;
            }

            case 'code': {
                const code = comp as CodeComponent;
                content.push({
                    type: 'codeBlock',
                    attrs: { language: code.language || 'javascript' },
                    content: [{ type: 'text', text: code.code || '' }],
                });
                break;
            }

            case 'divider': {
                content.push({
                    type: 'horizontalRule',
                });
                break;
            }

            case 'video':
            case 'cta':
            case 'spacer':
            case 'syllabus': {
                // These complex types will be rendered as custom blocks
                // For now, add a placeholder paragraph
                content.push({
                    type: 'paragraph',
                    content: [{
                        type: 'text',
                        text: `[${comp.type.toUpperCase()} BLOCK - ID: ${comp.id}]`,
                    }],
                });
                break;
            }
        }
    }

    // Ensure there's at least one empty paragraph
    if (content.length === 0) {
        content.push({
            type: 'paragraph',
            content: [],
        });
    }

    return {
        type: 'doc',
        content,
    };
}

/**
 * Convert Tiptap JSON document to Component[] array
 */
export function serializeToComponents(doc: TiptapDoc): Component[] {
    const components: Component[] = [];

    if (!doc.content) return components;

    for (const node of doc.content) {
        switch (node.type) {
            case 'heading': {
                const level = (node.attrs?.level as number) || 2;
                const text = extractText(node);

                components.push({
                    id: uuidv4(),
                    type: 'header',
                    level: level as 1 | 2 | 3 | 4 | 5 | 6,
                    text,
                } as HeaderComponent);
                break;
            }

            case 'paragraph': {
                const text = extractText(node);
                if (text.trim()) {
                    // Check if it's a placeholder for a custom block
                    const blockMatch = text.match(/^\[([A-Z]+) BLOCK - ID: ([^\]]+)\]$/);
                    if (blockMatch) {
                        // Skip - this would be handled by re-injecting the original component
                        continue;
                    }

                    components.push({
                        id: uuidv4(),
                        type: 'text',
                        content: `<p>${text}</p>`,
                    } as TextComponent);
                }
                break;
            }

            case 'bulletList':
            case 'orderedList': {
                const listHtml = serializeListToHtml(node);
                components.push({
                    id: uuidv4(),
                    type: 'text',
                    content: listHtml,
                } as TextComponent);
                break;
            }

            case 'blockquote': {
                const text = extractText(node);
                components.push({
                    id: uuidv4(),
                    type: 'text',
                    content: `<blockquote>${text}</blockquote>`,
                } as TextComponent);
                break;
            }

            case 'codeBlock': {
                const code = extractText(node);
                components.push({
                    id: uuidv4(),
                    type: 'code',
                    code,
                    language: (node.attrs?.language as string) || 'javascript',
                } as CodeComponent);
                break;
            }

            case 'image':
            case 'customImage': {
                components.push({
                    id: uuidv4(),
                    type: 'image',
                    url: (node.attrs?.src as string) || '',
                    alt: (node.attrs?.alt as string) || '',
                    caption: (node.attrs?.title as string) || '',
                } as ImageComponent);
                break;
            }

            case 'horizontalRule': {
                components.push({
                    id: uuidv4(),
                    type: 'divider',
                    style: 'solid',
                } as DividerComponent);
                break;
            }
        }
    }

    return components;
}

/**
 * Extract plain text from a Tiptap node
 */
function extractText(node: TiptapNode): string {
    if (node.text) return node.text;
    if (!node.content) return '';

    return node.content.map(child => extractText(child)).join('');
}

/**
 * Serialize a list node to HTML
 */
function serializeListToHtml(node: TiptapNode): string {
    const tag = node.type === 'bulletList' ? 'ul' : 'ol';

    if (!node.content) return `<${tag}></${tag}>`;

    const items = node.content.map(item => {
        if (item.type === 'listItem') {
            const text = extractText(item);
            return `<li>${text}</li>`;
        }
        return '';
    }).join('');

    return `<${tag}>${items}</${tag}>`;
}

/**
 * Convert Tiptap HTML to Component[] (convenience function)
 */
export function htmlToComponents(html: string): Component[] {
    // This is a simplified version - for full fidelity we'd use the JSON format
    // For now, treat all HTML as a single text component
    if (!html.trim()) return [];

    return [{
        id: uuidv4(),
        type: 'text',
        content: html,
    } as TextComponent];
}
