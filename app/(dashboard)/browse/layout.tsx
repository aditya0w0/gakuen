import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Browse Courses",
    description: "Explore our catalog of interactive courses in programming, design, AI, and more. Find the perfect course for your learning goals at Gakuen.",
    keywords: ["courses", "online learning", "programming courses", "design courses", "AI courses", "education"],
    openGraph: {
        title: "Browse Courses | Gakuen",
        description: "Explore our catalog of interactive courses",
        type: "website",
    },
};

export default function BrowseLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
