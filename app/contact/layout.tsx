import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact Us",
    description: "Get in touch with the Gakuen team. Have questions about courses, technical issues, or partnership opportunities? We're here to help.",
    keywords: ["contact", "support", "help", "customer service", "Gakuen support"],
    openGraph: {
        title: "Contact Us | Gakuen",
        description: "Get in touch with the Gakuen team for support and inquiries",
        type: "website",
    },
};

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
