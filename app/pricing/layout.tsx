import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pricing Plans",
    description: "Choose the perfect Gakuen subscription plan for your learning journey. Compare features, AI access, and pricing across Free, Basic, Standard, and Pro tiers.",
    keywords: ["pricing", "subscription", "learning plans", "AI tutor", "online courses", "education pricing"],
    openGraph: {
        title: "Pricing Plans | Gakuen",
        description: "Choose the perfect subscription plan for your learning journey",
        type: "website",
    },
};

export default function PricingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
