import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "Learn how Gakuen protects your privacy and handles your personal data. Our commitment to data security and user privacy explained.",
    keywords: ["privacy policy", "data protection", "user privacy", "GDPR", "data security"],
    openGraph: {
        title: "Privacy Policy | Gakuen",
        description: "Learn how Gakuen protects your privacy and handles your personal data",
        type: "website",
    },
};

export default function PrivacyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
