"use client";

import { TableComponent } from "@/lib/cms/types";

interface TableBlockProps {
    component: TableComponent;
    isEditing?: boolean;
}

// Recursive function to render Tiptap table node to HTML
function renderTableNode(node: {
    type: string;
    content?: Array<unknown>;
    attrs?: Record<string, unknown>;
    text?: string;
}): string {
    if (!node) return '';

    if (node.type === 'text') {
        return node.text || '';
    }

    if (node.type === 'table') {
        const content = Array.isArray(node.content)
            ? node.content.map(child => renderTableNode(child as typeof node)).join('')
            : '';
        return `<table class="tiptap-table">${content}</table>`;
    }

    if (node.type === 'tableRow') {
        const content = Array.isArray(node.content)
            ? node.content.map(child => renderTableNode(child as typeof node)).join('')
            : '';
        return `<tr>${content}</tr>`;
    }

    if (node.type === 'tableHeader') {
        const content = Array.isArray(node.content)
            ? node.content.map(child => renderTableNode(child as typeof node)).join('')
            : '';
        return `<th>${content}</th>`;
    }

    if (node.type === 'tableCell') {
        const content = Array.isArray(node.content)
            ? node.content.map(child => renderTableNode(child as typeof node)).join('')
            : '';
        return `<td>${content}</td>`;
    }

    if (node.type === 'paragraph') {
        const content = Array.isArray(node.content)
            ? node.content.map(child => renderTableNode(child as typeof node)).join('')
            : '';
        return content;
    }

    // Fallback for other node types
    if (Array.isArray(node.content)) {
        return node.content.map(child => renderTableNode(child as typeof node)).join('');
    }

    return '';
}

export function TableBlock({ component }: TableBlockProps) {
    if (!component.tableData) {
        return <div className="text-red-400">Table data missing</div>;
    }

    const tableHtml = renderTableNode(component.tableData as Parameters<typeof renderTableNode>[0]);

    return (
        <div
            className="table-block prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: tableHtml }}
        />
    );
}
