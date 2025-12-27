import { Component } from "@/lib/cms/types";
import { HeaderBlock } from "./blocks/HeaderBlock";
import { TextBlock } from "./blocks/TextBlock";
import { ImageBlock } from "./blocks/ImageBlock";
import { VideoBlock } from "./blocks/VideoBlock";
import { CodeBlock } from "./blocks/CodeBlock";
import { CTABlock } from "./blocks/CTABlock";
import { DividerBlock } from "./blocks/DividerBlock";
import { SpacerBlock } from "./blocks/SpacerBlock";

interface ComponentRendererProps {
    component: Component;
    isEditing?: boolean;
    isSelected?: boolean;
    onUpdate?: (component: Component) => void;
    onSelect?: () => void;
}

export function ComponentRenderer({
    component,
    isEditing = false,
    isSelected = false,
    onUpdate,
    onSelect,
}: ComponentRendererProps) {
    const props = {
        component,
        isEditing,
        isSelected,
        onUpdate,
        onSelect,
    };

    switch (component.type) {
        case "header":
            return <HeaderBlock {...props} component={component} />;
        case "text":
            return <TextBlock {...props} component={component} />;
        case "image":
            return <ImageBlock {...props} component={component} />;
        case "video":
            return <VideoBlock {...props} component={component} />;
        case "code":
            return <CodeBlock {...props} component={component} />;
        case "cta":
            return <CTABlock {...props} component={component} />;
        case "divider":
            return <DividerBlock {...props} component={component} />;
        case "spacer":
            return <SpacerBlock {...props} component={component} />;
        default:
            return <div className="text-red-400">Unknown component type</div>;
    }
}
