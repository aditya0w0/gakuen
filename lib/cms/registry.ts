import { Component, ComponentMeta } from "./types";

// Component Registry - defines all available components
export const COMPONENT_REGISTRY: ComponentMeta[] = [
    {
        type: "header",
        name: "Header",
        icon: "Type",
        description: "Heading text (H1-H6)",
        category: "content",
        defaultProps: {
            type: "header",
            level: 2,
            text: "New Heading",
            align: "left",
            color: "#ffffff",
            fontWeight: 600,
        },
    },
    {
        type: "text",
        name: "Text",
        icon: "AlignLeft",
        description: "Paragraph text with formatting",
        category: "content",
        defaultProps: {
            type: "text",
            content: "<p>Enter your text here...</p>",
            align: "left",
            color: "#d4d4d8",
            fontSize: 16,
            lineHeight: 1.6,
        },
    },
    {
        type: "image",
        name: "Image",
        icon: "Image",
        description: "Image with caption",
        category: "media",
        defaultProps: {
            type: "image",
            url: "https://placehold.co/800x400",
            alt: "Image",
            align: "center",
            width: "auto",
            borderRadius: 8,
        },
    },
    {
        type: "video",
        name: "Video",
        icon: "Video",
        description: "Embedded video",
        category: "media",
        defaultProps: {
            type: "video",
            url: "",
            platform: "youtube",
            aspectRatio: "16:9",
            width: "auto",
        },
    },
    {
        type: "code",
        name: "Code",
        icon: "Code",
        description: "Code block with syntax highlighting",
        category: "content",
        defaultProps: {
            type: "code",
            code: "// Write your code here\nconsole.log('Hello, World!');",
            language: "javascript",
            showLineNumbers: true,
            theme: "dark",
            fontSize: 14,
        },
    },
    {
        type: "multiFileCode",
        name: "Multi-File Code",
        icon: "Files",
        description: "Tabbed code block with multiple files",
        category: "content",
        defaultProps: {
            type: "multiFileCode",
            files: [
                { id: "file-1", filename: "main.js", language: "javascript", code: "// Main file\nconsole.log('Hello!');" },
                { id: "file-2", filename: "styles.css", language: "css", code: "/* Styles */\nbody {\n  margin: 0;\n}" },
            ],
            activeFileId: "file-1",
            showLineNumbers: true,
            theme: "dark",
            fontSize: 14,
        },
    },
    {
        type: "cta",
        name: "Button",
        icon: "MousePointerClick",
        description: "Call-to-action button",
        category: "interactive",
        defaultProps: {
            type: "cta",
            text: "Click Me",
            align: "center",
            bgColor: "#3b82f6",
            textColor: "#ffffff",
            size: "medium",
            borderRadius: 8,
        },
    },
    {
        type: "divider",
        name: "Divider",
        icon: "Minus",
        description: "Horizontal line separator",
        category: "layout",
        defaultProps: {
            type: "divider",
            style: "solid",
            color: "#404040",
            width: 100,
            thickness: 1,
            margin: { top: 24, bottom: 24 },
        },
    },
    {
        type: "spacer",
        name: "Spacer",
        icon: "MoveVertical",
        description: "Vertical spacing",
        category: "layout",
        defaultProps: {
            type: "spacer",
            height: 40,
        },
    },
    {
        type: "syllabus",
        name: "Syllabus",
        icon: "List",
        description: "Course syllabus with modules",
        category: "content",
        defaultProps: {
            type: "syllabus",
            title: "Course Syllabus",
            items: [
                { id: "1", title: "Module 1: Introduction", description: "Getting started with the basics", duration: "30 min" },
                { id: "2", title: "Module 2: Core Concepts", description: "Understanding the fundamentals", duration: "45 min" },
                { id: "3", title: "Module 3: Advanced Topics", description: "Deep dive into advanced features", duration: "1 hr" },
            ],
            style: "accordion",
            showDuration: true,
            accentColor: "#6366f1",
        },
    },
];

// Helper to create a new component with defaults
export function createComponent(type: string): Component {
    const meta = COMPONENT_REGISTRY.find((m) => m.type === type);
    if (!meta) throw new Error(`Unknown component type: ${type}`);

    return {
        id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...meta.defaultProps,
    } as Component;
}

// Helper to get component meta
export function getComponentMeta(type: string): ComponentMeta | undefined {
    return COMPONENT_REGISTRY.find((m) => m.type === type);
}
