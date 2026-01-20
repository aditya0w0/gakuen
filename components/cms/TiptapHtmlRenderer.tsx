"use client";

// Renders Tiptap JSON to React components for student view
// This handles content saved as tiptapJson (which includes tables and quizzes)

import { QuizBlock } from "@/components/quiz/QuizBlock";
import type { Quiz } from "@/lib/types";

interface TiptapNode {
    type: string;
    content?: TiptapNode[];
    attrs?: Record<string, unknown>;
    text?: string;
    marks?: { type: string; attrs?: Record<string, unknown> }[];
}

// Render non-interactive nodes to HTML
function renderNodeToHtml(node: TiptapNode): string {
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
                        text = `<a href="${mark.attrs?.href || '#'}" target="_blank" class="text-teal-600 dark:text-indigo-400 underline">${text}</a>`;
                        break;
                    case 'textStyle':
                        const styles: string[] = [];
                        const color = mark.attrs?.color as string;
                        const fontSize = mark.attrs?.fontSize as string;
                        const fontFamily = mark.attrs?.fontFamily as string;

                        // Skip colors that are clearly dark-mode specific (light grays/whites)
                        // These would be invisible on white backgrounds
                        if (color) {
                            const lowerColor = color.toLowerCase();
                            const isDarkModeColor =
                                lowerColor === '#d4d4d8' ||  // zinc-300
                                lowerColor === '#e4e4e7' ||  // zinc-200
                                lowerColor === '#f4f4f5' ||  // zinc-100
                                lowerColor === '#ffffff' ||  // white
                                lowerColor === '#fafafa' ||  // zinc-50
                                lowerColor === '#a1a1aa' ||  // zinc-400
                                lowerColor.startsWith('rgb(212') ||  // rgb version of zinc-300
                                lowerColor.startsWith('rgb(244') ||  // rgb version of zinc-100
                                lowerColor.startsWith('rgb(255');    // white

                            // Only apply non-dark-mode colors
                            if (!isDarkModeColor) {
                                styles.push(`color: ${color}`);
                            }
                        }
                        if (fontSize) styles.push(`font-size: ${fontSize}`);
                        if (fontFamily) styles.push(`font-family: ${fontFamily}`);
                        if (styles.length > 0) {
                            text = `<span style="${styles.join('; ')}">${text}</span>`;
                        }
                        break;
                }
            }
        }
        return text;
    }

    const children = node.content?.map(child => renderNodeToHtml(child)).join('') || '';

    switch (node.type) {
        case 'doc':
            return children;
        case 'paragraph':
            const align = node.attrs?.textAlign as string;
            const alignStyle = align && align !== 'left' ? ` style="text-align: ${align}"` : '';
            // Add margin-bottom for proper paragraph spacing (prose handles this but just in case)
            return `<p class="mb-4"${alignStyle}>${children || '<br>'}</p>`;
        case 'heading':
            const level = node.attrs?.level || 1;
            // Add proper heading margins
            return `<h${level} class="mt-6 mb-3">${children}</h${level}>`;
        case 'bulletList':
            return `<ul class="list-disc pl-6 space-y-1">${children}</ul>`;
        case 'orderedList':
            return `<ol class="list-decimal pl-6 space-y-1">${children}</ol>`;
        case 'listItem':
            return `<li>${children}</li>`;
        case 'blockquote':
            return `<blockquote class="border-l-4 border-neutral-300 dark:border-neutral-600 pl-4 italic text-neutral-600 dark:text-neutral-300">${children}</blockquote>`;
        case 'codeBlock':
            return `<pre class="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg overflow-x-auto"><code>${children}</code></pre>`;
        case 'horizontalRule':
            return '<hr class="border-neutral-300 dark:border-neutral-700 my-6">';;
        case 'image':
        case 'customImage':
            return `<img src="${node.attrs?.src}" alt="${node.attrs?.alt || ''}" class="max-w-full rounded-lg my-4">`;
        case 'table':
            return `<table class="tiptap-table w-full border-collapse my-4">${children}</table>`;
        case 'tableRow':
            return `<tr>${children}</tr>`;
        case 'tableHeader':
            return `<th class="border border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-left font-semibold">${children}</th>`;
        case 'tableCell':
            return `<td class="border border-neutral-300 dark:border-neutral-600 px-3 py-2">${children}</td>`;
        case 'customYoutube':
            const videoId = node.attrs?.videoId as string;
            if (videoId) {
                return `<div class="relative pt-[56.25%] my-4 rounded-xl overflow-hidden bg-black">
                    <iframe 
                        class="absolute inset-0 w-full h-full"
                        src="https://www.youtube.com/embed/${videoId}?rel=0" 
                        title="${node.attrs?.title || 'YouTube Video'}"
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>`;
            }
            return '';
        default:
            return children;
    }
}

// Split content into segments: HTML strings and quiz nodes
interface ContentSegment {
    type: 'html' | 'quiz';
    content?: string;
    quizId?: string;
    passingScore?: number;
    timeLimit?: number;
}

function segmentContent(nodes: TiptapNode[]): ContentSegment[] {
    const segments: ContentSegment[] = [];
    let htmlBuffer = '';

    for (const node of nodes) {
        if (node.type === 'customQuiz') {
            // Flush HTML buffer
            if (htmlBuffer) {
                segments.push({ type: 'html', content: htmlBuffer });
                htmlBuffer = '';
            }
            // Add quiz segment
            segments.push({
                type: 'quiz',
                quizId: node.attrs?.quizId as string,
                passingScore: node.attrs?.passingScore as number,
                timeLimit: node.attrs?.timeLimit as number,
            });
        } else {
            // Accumulate HTML
            htmlBuffer += renderNodeToHtml(node);
        }
    }

    // Flush remaining HTML
    if (htmlBuffer) {
        segments.push({ type: 'html', content: htmlBuffer });
    }

    return segments;
}

interface TiptapHtmlRendererProps {
    content: { type: string; content?: TiptapNode[] };
    courseId?: string;
    quizzes?: Quiz[];
}

export function TiptapHtmlRenderer({ content, courseId, quizzes }: TiptapHtmlRendererProps) {
    if (!content || content.type !== 'doc' || !content.content) {
        return null;
    }

    const segments = segmentContent(content.content);

    return (
        <div className="ProseMirror prose prose-neutral dark:prose-invert max-w-none text-neutral-900 dark:text-neutral-100">
            {segments.map((segment, index) => {
                if (segment.type === 'html') {
                    return (
                        <div
                            key={index}
                            dangerouslySetInnerHTML={{ __html: segment.content || '' }}
                        />
                    );
                } else if (segment.type === 'quiz') {
                    const quiz = quizzes?.find(q => q.id === segment.quizId) || null;
                    return (
                        <QuizBlock
                            key={index}
                            quizId={segment.quizId || ''}
                            courseId={courseId || ''}
                            quiz={quiz}
                            passingScore={segment.passingScore}
                            timeLimit={segment.timeLimit}
                        />
                    );
                }
                return null;
            })}
        </div>
    );
}
