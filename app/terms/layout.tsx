import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "Read the terms of service for using Gakuen's learning platform. Understand your rights and responsibilities as a user.",
    keywords: ["terms of service", "terms and conditions", "user agreement", "legal terms"],
    openGraph: {
        title: "Terms of Service | Gakuen",
        description: "Terms and conditions for using Gakuen's learning platform",
        type: "website",
    },
};

export default function TermsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
