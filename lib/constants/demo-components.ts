import { Component, HeaderComponent, TextComponent } from "../cms/types";

// Sample component blocks for demo lesson
export const DEMO_LESSON_COMPONENTS: Component[] = [
    {
        id: "header-demo-1",
        type: "header",
        level: 1,
        text: "What is an Algorithm?",
        align: "left",
        color: "#ffffff",
    } as HeaderComponent,
    {
        id: "text-demo-1",
        type: "text",
        content: "<p>An algorithm is a step-by-step procedure for solving a problem or accomplishing a task. Think of it as a recipe in cooking—you follow specific instructions in a particular order to achieve your desired result.</p>",
        align: "left",
        fontSize: 16,
        lineHeight: 1.6,
        color: "#d4d4d8",
    } as TextComponent,
    {
        id: "header-demo-2",
        type: "header",
        level: 2,
        text: "Key Characteristics",
        align: "left",
        color: "#ffffff",
    } as HeaderComponent,
    {
        id: "text-demo-2",
        type: "text",
        content: "<p><strong>1. Well-Defined Inputs</strong> – Every algorithm must clearly specify what data it accepts and what results it produces.</p><p><strong>2. Finiteness</strong> – An algorithm must terminate after a finite number of steps. Infinite loops are not algorithms!</p><p><strong>3. Effectiveness</strong> – Each step must be basic enough to be carried out.</p>",
        align: "left",
        fontSize: 16,
        lineHeight: 1.8,
        color: "#d4d4d8",
    } as TextComponent,
    {
        id: "header-demo-3",
        type: "header",
        level: 2,
        text: "Why Algorithms Matter",
        align: "left",
        color: "#ffffff",
    } as HeaderComponent,
    {
        id: "text-demo-3",
        type: "text",
        content: "<p>In computer science, algorithms form the foundation of efficient programming. Understanding how to design and analyze algorithms helps you:</p><ul><li>Write faster, more efficient code</li><li>Solve complex problems systematically</li><li>Optimize resource usage</li><li>Make better architectural decisions</li></ul>",
        align: "left",
        fontSize: 16,
        lineHeight: 1.8,
        color: "#d4d4d8",
    } as TextComponent,
];
