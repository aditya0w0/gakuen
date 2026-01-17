import '@tiptap/react';
import { Commands } from '@tiptap/core';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        // StarterKit commands
        toggleHeading: (options: { level: 1 | 2 | 3 | 4 | 5 | 6 }) => ReturnType;
        setParagraph: () => ReturnType;
        toggleBulletList: () => ReturnType;
        toggleOrderedList: () => ReturnType;
        toggleBlockquote: () => ReturnType;
        toggleCodeBlock: () => ReturnType;
        setHorizontalRule: () => ReturnType;
        clearNodes: () => ReturnType;

        // Color extension commands
        setColor: (color: string) => ReturnType;
        unsetColor: () => ReturnType;

        // Link extension commands
        setLink: (options: { href: string; target?: string }) => ReturnType;
        unsetLink: () => ReturnType;

        // Underline extension
        toggleUnderline: () => ReturnType;

        // Strike
        toggleStrike: () => ReturnType;

        // Code
        toggleCode: () => ReturnType;

        // Bold & Italic
        toggleBold: () => ReturnType;
        toggleItalic: () => ReturnType;
    }
}
