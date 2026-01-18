// Serialization utilities for converting between Tiptap JSON and Component[] format
// This ensures backward compatibility with existing course data

import { Component, HeaderComponent, TextComponent, ImageComponent, CodeComponent, DividerComponent, MultiFileCodeComponent, TableComponent } from './types';
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
                // Parse text for potential inline marks
                const contentNodes = header.text ? parseInlineMarks(header.text) : [{ type: 'text', text: '' }];
                content.push({
                    type: 'heading',
                    attrs: {
                        level: header.level || 2,
                        ...(header.align && header.align !== 'left' ? { textAlign: header.align } : {}),
                    },
                    content: contentNodes.length > 0 ? contentNodes : [{ type: 'text', text: '' }],
                });
                break;
            }

            case 'text': {
                const text = comp as TextComponent;
                // Preserve the HTML content as-is for Tiptap to parse
                // Tiptap will handle parsing bold, italic, blockquotes, etc.
                const htmlContent = text.content || '';

                // If content contains blockquote, handle it
                if (htmlContent.includes('<blockquote>')) {
                    const blockquoteMatch = htmlContent.match(/<blockquote>([\s\S]*?)<\/blockquote>/);
                    if (blockquoteMatch) {
                        const innerContent = blockquoteMatch[1];
                        // Parse paragraphs within blockquote, preserving their attributes
                        const paragraphMatches = innerContent.match(/<p([^>]*)>([\s\S]*?)<\/p>/g);
                        const blockquoteContent: TiptapNode[] = [];

                        if (paragraphMatches) {
                            for (const pMatch of paragraphMatches) {
                                // Extract textAlign from style
                                const styleMatch = pMatch.match(/style=["']([^"']*)["']/);
                                let textAlign: string | undefined;
                                if (styleMatch) {
                                    const alignMatch = styleMatch[1].match(/text-align:\s*([^;]+)/);
                                    if (alignMatch) textAlign = alignMatch[1].trim();
                                }

                                // Get inner content
                                const innerMatch = pMatch.match(/<p[^>]*>([\s\S]*?)<\/p>/);
                                const innerText = innerMatch ? innerMatch[1] : '';
                                const parsedContent = parseInlineMarks(innerText);

                                blockquoteContent.push({
                                    type: 'paragraph',
                                    ...(textAlign ? { attrs: { textAlign } } : {}),
                                    content: parsedContent.length > 0 ? parsedContent : [{ type: 'text', text: innerText.replace(/<[^>]+>/g, '') }],
                                });
                            }
                        } else {
                            // No paragraph tags, treat as single paragraph
                            const parsedContent = parseInlineMarks(innerContent);
                            blockquoteContent.push({
                                type: 'paragraph',
                                content: parsedContent.length > 0 ? parsedContent : [{ type: 'text', text: innerContent.replace(/<[^>]+>/g, '') }],
                            });
                        }

                        content.push({
                            type: 'blockquote',
                            content: blockquoteContent,
                        });
                        break;
                    }
                }

                // If content contains lists, handle them
                if (htmlContent.includes('<ul>') || htmlContent.includes('<ol>')) {
                    const listType = htmlContent.includes('<ul>') ? 'bulletList' : 'orderedList';
                    const listItemMatches = htmlContent.match(/<li>([\s\S]*?)<\/li>/g);
                    if (listItemMatches) {
                        content.push({
                            type: listType,
                            content: listItemMatches.map(li => ({
                                type: 'listItem',
                                content: [{
                                    type: 'paragraph',
                                    content: [{ type: 'text', text: li.replace(/<\/?li>/g, '').replace(/<[^>]+>/g, '') }],
                                }],
                            })),
                        });
                        break;
                    }
                }

                // For regular text, preserve basic structure
                // Use align from component (like header does), not just from HTML
                const componentAlign = text.align;
                // Extract paragraphs while keeping content for marks
                const paragraphMatches = htmlContent.match(/<p[^>]*>[\s\S]*?<\/p>/g);

                if (paragraphMatches && paragraphMatches.length > 0) {
                    for (const pMatch of paragraphMatches) {
                        // Extract textAlign from style attribute (if present)
                        const styleMatch = pMatch.match(/style=["']([^"']*)["']/);
                        let textAlign: string | undefined;
                        if (styleMatch) {
                            const alignMatch = styleMatch[1].match(/text-align:\s*([^;]+)/);
                            if (alignMatch) textAlign = alignMatch[1].trim();
                        }

                        const innerContent = pMatch.replace(/<\/?p[^>]*>/g, '');

                        // Skip placeholder text for custom blocks (legacy data)
                        const placeholderMatch = innerContent.match(/^\[([A-Z]+) BLOCK - ID: [^\]]+\]$/);
                        if (placeholderMatch) {
                            continue; // Skip placeholder paragraphs
                        }

                        // Parse inline marks (bold, italic, etc.)
                        const parsedContent = parseInlineMarks(innerContent);
                        // Use componentAlign (like header.align) or fallback to inline style
                        const finalAlign = componentAlign || textAlign;
                        content.push({
                            type: 'paragraph',
                            ...(finalAlign && finalAlign !== 'left' ? { attrs: { textAlign: finalAlign } } : {}),
                            content: parsedContent,
                        });
                    }
                } else {
                    // Fallback: plain text - also check for placeholder
                    const cleanText = htmlContent.replace(/<[^>]+>/g, '').trim();
                    const placeholderMatch = cleanText.match(/^\[([A-Z]+) BLOCK - ID: [^\]]+\]$/);
                    if (cleanText && !placeholderMatch) {
                        content.push({
                            type: 'paragraph',
                            ...(componentAlign && componentAlign !== 'left' ? { attrs: { textAlign: componentAlign } } : {}),
                            content: [{ type: 'text', text: cleanText }],
                        });
                    }
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

            case 'multiFileCode': {
                // Create customMultiFileCode Tiptap node
                const multiCode = comp as MultiFileCodeComponent;
                content.push({
                    type: 'customMultiFileCode',
                    attrs: {
                        files: multiCode.files || [],
                        activeFileId: multiCode.activeFileId || multiCode.files?.[0]?.id || '',
                        showLineNumbers: multiCode.showLineNumbers ?? true,
                    },
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

            case 'table': {
                // Restore the raw table node structure from tableData
                const tableComp = comp as TableComponent;
                if (tableComp.tableData) {
                    content.push(tableComp.tableData as TiptapNode);
                }
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

    // Helper: recursively find all table nodes in a node's content tree
    function extractTablesFromNode(node: TiptapNode): TiptapNode[] {
        const tables: TiptapNode[] = [];
        if (node.content && Array.isArray(node.content)) {
            for (const child of node.content) {
                if (child.type === 'table') {
                    tables.push(child);
                } else {
                    tables.push(...extractTablesFromNode(child));
                }
            }
        }
        return tables;
    }

    // Process nodes in document order
    for (const node of doc.content) {
        // Handle table directly at top level
        if (node.type === 'table') {
            components.push({
                id: uuidv4(),
                type: 'table',
                tableData: node,
            } as TableComponent);
            continue;
        }

        // For other nodes, first process the node normally
        // Then check if it contains nested tables and add them after
        const nestedTables = extractTablesFromNode(node);

        switch (node.type) {
            case 'heading': {
                const level = (node.attrs?.level as number) || 2;
                const textAlign = node.attrs?.textAlign as string | undefined;
                // Serialize heading content with marks to HTML
                const html = serializeNodeToHtml(node);

                components.push({
                    id: uuidv4(),
                    type: 'header',
                    level: level as 1 | 2 | 3 | 4 | 5 | 6,
                    text: html, // Store HTML with marks
                    ...(textAlign && textAlign !== 'left' ? { align: textAlign as 'left' | 'center' | 'right' } : {}),
                } as HeaderComponent);
                break;
            }

            case 'paragraph': {
                // Serialize paragraph with marks to HTML
                const html = serializeNodeToHtml(node);
                const textAlign = node.attrs?.textAlign as string | undefined;
                if (html.trim()) {
                    // Check if it's a placeholder for a custom block
                    const plainText = extractText(node);
                    const blockMatch = plainText.match(/^\[([A-Z]+) BLOCK - ID: ([^\]]+)\]$/);
                    if (blockMatch) {
                        // Skip - this would be handled by re-injecting the original component
                        continue;
                    }

                    // Use align property like HeaderComponent does
                    components.push({
                        id: uuidv4(),
                        type: 'text',
                        content: `<p>${html}</p>`,
                        ...(textAlign && textAlign !== 'left' ? { align: textAlign as 'left' | 'center' | 'right' | 'justify' } : {}),
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
                // Serialize blockquote preserving paragraph attrs and inner marks
                const html = serializeBlockquoteToHtml(node);
                components.push({
                    id: uuidv4(),
                    type: 'text',
                    content: `<blockquote>${html}</blockquote>`,
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

            case 'customMultiFileCode': {
                components.push({
                    id: uuidv4(),
                    type: 'multiFileCode',
                    files: node.attrs?.files || [],
                    activeFileId: node.attrs?.activeFileId || '',
                    showLineNumbers: node.attrs?.showLineNumbers ?? true,
                } as MultiFileCodeComponent);
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
            // Note: Top-level tables handled before switch, nested tables handled after
        }

        // Add any nested tables found in this node (e.g., tables inside bulletList)
        for (const tableNode of nestedTables) {
            components.push({
                id: uuidv4(),
                type: 'table',
                tableData: tableNode,
            } as TableComponent);
        }
    }

    return components;
}

/**
 * Parse HTML inline marks (bold, italic, underline, etc.) to Tiptap format
 */
function parseInlineMarks(html: string): TiptapNode[] {
    const nodes: TiptapNode[] = [];

    // Simple regex-based parsing for inline marks
    // This handles common cases: <strong>, <em>, <u>, <s>, <span style="...">

    // If no HTML tags, return plain text
    if (!/<[^>]+>/.test(html)) {
        if (html.trim()) {
            nodes.push({ type: 'text', text: html });
        }
        return nodes;
    }

    // Process text with potential marks
    // For simplicity, we'll extract text and basic marks
    // A full implementation would use a proper HTML parser

    let remaining = html;
    let currentText = '';
    let currentMarks: { type: string; attrs?: Record<string, unknown> }[] = [];

    // Process character by character with tag detection
    let i = 0;
    while (i < remaining.length) {
        if (remaining[i] === '<') {
            // Found a tag - first flush current text
            if (currentText) {
                nodes.push({
                    type: 'text',
                    text: currentText,
                    ...(currentMarks.length > 0 ? { marks: [...currentMarks] } : {}),
                });
                currentText = '';
            }

            // Find end of tag
            const tagEnd = remaining.indexOf('>', i);
            if (tagEnd === -1) break;

            const tag = remaining.slice(i, tagEnd + 1);
            const tagLower = tag.toLowerCase();

            // Handle opening/closing tags
            if (tagLower === '<strong>' || tagLower === '<b>') {
                currentMarks.push({ type: 'bold' });
            } else if (tagLower === '</strong>' || tagLower === '</b>') {
                currentMarks = currentMarks.filter(m => m.type !== 'bold');
            } else if (tagLower === '<em>' || tagLower === '<i>') {
                currentMarks.push({ type: 'italic' });
            } else if (tagLower === '</em>' || tagLower === '</i>') {
                currentMarks = currentMarks.filter(m => m.type !== 'italic');
            } else if (tagLower === '<u>') {
                currentMarks.push({ type: 'underline' });
            } else if (tagLower === '</u>') {
                currentMarks = currentMarks.filter(m => m.type !== 'underline');
            } else if (tagLower === '<s>' || tagLower === '<strike>') {
                currentMarks.push({ type: 'strike' });
            } else if (tagLower === '</s>' || tagLower === '</strike>') {
                currentMarks = currentMarks.filter(m => m.type !== 'strike');
            } else if (tagLower === '<code>') {
                currentMarks.push({ type: 'code' });
            } else if (tagLower === '</code>') {
                currentMarks = currentMarks.filter(m => m.type !== 'code');
            } else if (tagLower.startsWith('<span')) {
                // Parse span style for color and fontSize
                const styleMatch = tag.match(/style=["']([^"']*)["']/i);
                if (styleMatch) {
                    const style = styleMatch[1];
                    const colorMatch = style.match(/color:\s*([^;]+)/i);
                    const fontSizeMatch = style.match(/font-size:\s*([^;]+)/i);

                    if (colorMatch || fontSizeMatch) {
                        const attrs: Record<string, unknown> = {};
                        if (colorMatch) attrs.color = colorMatch[1].trim();
                        if (fontSizeMatch) attrs.fontSize = fontSizeMatch[1].trim();
                        currentMarks.push({ type: 'textStyle', attrs });
                    }
                }
            } else if (tagLower === '</span>') {
                currentMarks = currentMarks.filter(m => m.type !== 'textStyle');
            }
            // Skip <br>, <p>, </p> etc.

            i = tagEnd + 1;
        } else {
            currentText += remaining[i];
            i++;
        }
    }

    // Flush remaining text
    if (currentText) {
        nodes.push({
            type: 'text',
            text: currentText,
            ...(currentMarks.length > 0 ? { marks: [...currentMarks] } : {}),
        });
    }

    // If nothing parsed, return plain text
    if (nodes.length === 0 && html.trim()) {
        nodes.push({ type: 'text', text: html.replace(/<[^>]+>/g, '') });
    }

    return nodes;
}

/**
 * Serialize a Tiptap node (with marks) to HTML
 */
function serializeNodeToHtml(node: TiptapNode): string {
    if (!node.content) return '';

    return node.content.map(child => {
        if (child.type === 'text') {
            let text = child.text || '';

            // Apply marks
            if (child.marks && child.marks.length > 0) {
                for (const mark of child.marks) {
                    switch (mark.type) {
                        case 'bold':
                            text = `<strong>${text}</strong>`;
                            break;
                        case 'italic':
                            text = `<em>${text}</em>`;
                            break;
                        case 'underline':
                            text = `<u>${text}</u>`;
                            break;
                        case 'strike':
                            text = `<s>${text}</s>`;
                            break;
                        case 'code':
                            text = `<code>${text}</code>`;
                            break;
                        case 'textStyle': {
                            const styles: string[] = [];
                            if (mark.attrs?.color) styles.push(`color: ${mark.attrs.color}`);
                            if (mark.attrs?.fontSize) styles.push(`font-size: ${mark.attrs.fontSize}`);
                            if (styles.length > 0) {
                                text = `<span style="${styles.join('; ')}">${text}</span>`;
                            }
                            break;
                        }
                        case 'link':
                            text = `<a href="${mark.attrs?.href || '#'}">${text}</a>`;
                            break;
                    }
                }
            }

            return text;
        }

        // Recurse for other node types
        return serializeNodeToHtml(child);
    }).join('');
}

/**
 * Serialize a blockquote node to HTML preserving paragraph textAlign and inline marks
 */
function serializeBlockquoteToHtml(node: TiptapNode): string {
    if (!node.content) return '';

    return node.content.map(child => {
        if (child.type === 'paragraph') {
            const innerHtml = serializeNodeToHtml(child);

            // Apply textAlign if present
            const textAlign = child.attrs?.textAlign;
            if (textAlign && textAlign !== 'left') {
                return `<p style="text-align: ${textAlign}">${innerHtml}</p>`;
            }
            return `<p>${innerHtml}</p>`;
        }
        return '';
    }).join('');
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
