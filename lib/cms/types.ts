// Component type definitions for the CMS

export interface Spacing {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
}

// Syllabus item for the syllabus component
export interface SyllabusItem {
    id: string;
    title: string;
    description?: string;
    duration?: string;
}

// All valid component types
export type ComponentType =
    | "header"
    | "text"
    | "image"
    | "video"
    | "code"
    | "multiFileCode"
    | "cta"
    | "divider"
    | "spacer"
    | "syllabus";

export interface BaseComponent {
    id: string;
    type: ComponentType;
}

// Header Component
export interface HeaderComponent extends BaseComponent {
    type: "header";
    level: 1 | 2 | 3 | 4 | 5 | 6;
    text: string;
    align?: "left" | "center" | "right";
    color?: string;
    fontSize?: number;
    fontWeight?: number;
    margin?: Spacing;
}

// Text Component
export interface TextComponent extends BaseComponent {
    type: "text";
    content: string; // Rich text HTML
    align?: "left" | "center" | "right" | "justify";
    color?: string;
    fontSize?: number;
    lineHeight?: number;
    margin?: Spacing;
}

// Image Component
export interface ImageComponent extends BaseComponent {
    type: "image";
    url: string;
    alt?: string;
    caption?: string;
    width?: number | "auto";
    align?: "left" | "center" | "right";
    borderRadius?: number;
    margin?: Spacing;
}

// Video Component
export interface VideoComponent extends BaseComponent {
    type: "video";
    url: string; // YouTube, Vimeo, or direct URL
    platform?: "youtube" | "vimeo" | "direct";
    caption?: string;
    width?: number | "auto";
    aspectRatio?: "16:9" | "4:3" | "1:1";
    margin?: Spacing;
}

// Code Component
export interface CodeComponent extends BaseComponent {
    type: "code";
    code: string;
    language?: string;
    showLineNumbers?: boolean;
    theme?: "dark" | "light";
    fontSize?: number;
    margin?: Spacing;
}

// Code File (for multi-file code blocks)
export interface CodeFile {
    id: string;
    filename: string;
    language: string;
    code: string;
}

// Multi-File Code Component (tabbed code block)
export interface MultiFileCodeComponent extends BaseComponent {
    type: "multiFileCode";
    files: CodeFile[];
    activeFileId: string;  // Default tab to show
    showLineNumbers?: boolean;
    theme?: "dark" | "light";
    fontSize?: number;
    margin?: Spacing;
}

// CTA (Call-to-Action) Component
export interface CTAComponent extends BaseComponent {
    type: "cta";
    text: string;
    url?: string;
    align?: "left" | "center" | "right";
    bgColor?: string;
    textColor?: string;
    size?: "small" | "medium" | "large";
    borderRadius?: number;
    margin?: Spacing;
}

// Divider Component
export interface DividerComponent extends BaseComponent {
    type: "divider";
    style?: "solid" | "dashed" | "dotted";
    color?: string;
    width?: number; // percentage
    thickness?: number;
    margin?: Spacing;
}

// Spacer Component
export interface SpacerComponent extends BaseComponent {
    type: "spacer";
    height: number; // in pixels
}

// Syllabus Component
export interface SyllabusComponent extends BaseComponent {
    type: "syllabus";
    title?: string;
    items: SyllabusItem[];
    style?: "numbered" | "accordion" | "cards";
    showDuration?: boolean;
    accentColor?: string;
    margin?: Spacing;
}

// Union type of all components
export type Component =
    | HeaderComponent
    | TextComponent
    | ImageComponent
    | VideoComponent
    | CodeComponent
    | MultiFileCodeComponent
    | CTAComponent
    | DividerComponent
    | SpacerComponent
    | SyllabusComponent;

// Component metadata for registry
export interface ComponentMeta {
    type: ComponentType;
    name: string;
    icon: string;
    description: string;
    category: "content" | "media" | "interactive" | "layout";
    defaultProps: Partial<Component>;
}
