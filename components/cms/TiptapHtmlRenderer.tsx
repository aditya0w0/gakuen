"use client";

// Renders Tiptap JSON to HTML for student view
// This handles content saved as tiptapJson (which includes tables)

interface TiptapNode {
    type: string;
    content?: TiptapNode[];
    attrs?: Record<string, unknown>;
    text?: string;
    marks?: { type: string; attrs?: Record<string, unknown> }[];
}

function renderNode(node: TiptapNode): string {
    if (!node) return '';

    // Text node with marks
    if (node.type === 'text') {
        let text = node.text || '';
        // Apply marks (bold, italic, underline, etc.)
        if (node.marks) {
            for (const mark of node.marks) {
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
                    case 'link':
                        text = `<a href="${mark.attrs?.href || '#'}" target="_blank" class="text-indigo-400 underline">${text}</a>`;
                        break;
                    case 'textStyle':
                        const color = mark.attrs?.color as string;
                        if (color) {
                            text = `<span style="color: ${color}">${text}</span>`;
                        }
                        break;
                }
            }
        }
        return text;
    }

    const children = node.content?.map(child => renderNode(child)).join('') || '';

    switch (node.type) {
        case 'doc':
            return children;
        case 'paragraph':
            const align = node.attrs?.textAlign as string;
            const alignStyle = align && align !== 'left' ? ` style="text-align: ${align}"` : '';
            return `<p${alignStyle}>${children || '<br>'}</p>`;
        case 'heading':
            const level = node.attrs?.level || 1;
            return `<h${level}>${children}</h${level}>`;
        case 'bulletList':
            return `<ul class="list-disc pl-6 space-y-1">${children}</ul>`;
        case 'orderedList':
            return `<ol class="list-decimal pl-6 space-y-1">${children}</ol>`;
        case 'listItem':
            return `<li>${children}</li>`;
        case 'blockquote':
            return `<blockquote class="border-l-4 border-neutral-600 pl-4 italic text-neutral-300">${children}</blockquote>`;
        case 'codeBlock':
            return `<pre class="bg-neutral-800 p-4 rounded-lg overflow-x-auto"><code>${children}</code></pre>`;
        case 'horizontalRule':
            return '<hr class="border-neutral-700 my-6">';
        case 'image':
        case 'customImage':
            return `<img src="${node.attrs?.src}" alt="${node.attrs?.alt || ''}" class="max-w-full rounded-lg my-4">`;
        case 'table':
            return `<table class="tiptap-table w-full border-collapse my-4">${children}</table>`;
        case 'tableRow':
            return `<tr>${children}</tr>`;
        case 'tableHeader':
            return `<th class="border border-neutral-600 bg-neutral-800 px-3 py-2 text-left font-semibold">${children}</th>`;
        case 'tableCell':
            return `<td class="border border-neutral-600 px-3 py-2">${children}</td>`;
        default:
            return children;
    }
}

interface TiptapHtmlRendererProps {
    content: { type: string; content?: TiptapNode[] };
}

export function TiptapHtmlRenderer({ content }: TiptapHtmlRendererProps) {
    if (!content || content.type !== 'doc') {
        return null;
    }

    const html = renderNode(content as TiptapNode);

    return (
        <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
