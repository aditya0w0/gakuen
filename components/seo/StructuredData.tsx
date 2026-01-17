// JSON-LD Structured Data for SEO
// Add this to layout.tsx or individual pages for rich search results

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gakuen-six.vercel.app";

export function OrganizationSchema() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Gakuen",
        "url": BASE_URL,
        "logo": `${BASE_URL}/logo.png`,
        "description": "Modern Learning Platform - Learn programming, design, and more with AI-powered tutoring",
        "sameAs": [
            // Add your social media links here
            // "https://twitter.com/gakuen",
            // "https://github.com/gakuen"
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "availableLanguage": ["English", "Indonesian"]
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

export function WebsiteSchema() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Gakuen",
        "url": BASE_URL,
        "description": "Modern online learning platform with AI-powered tutoring",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${BASE_URL}/browse?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

export function EducationalOrganizationSchema() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "name": "Gakuen",
        "url": BASE_URL,
        "logo": `${BASE_URL}/logo.png`,
        "description": "Online learning platform offering courses in programming, design, and more",
        "areaServed": "Worldwide",
        "availableLanguage": ["English", "Indonesian"],
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Course Catalog",
            "itemListElement": [
                {
                    "@type": "OfferCatalog",
                    "name": "Programming Courses"
                },
                {
                    "@type": "OfferCatalog",
                    "name": "Design Courses"
                }
            ]
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

interface CourseSchemaProps {
    name: string;
    description: string;
    provider?: string;
    imageUrl?: string;
    courseUrl: string;
    price?: number;
    currency?: string;
}

export function CourseSchema({
    name,
    description,
    provider = "Gakuen",
    imageUrl,
    courseUrl,
    price,
    currency = "USD"
}: CourseSchemaProps) {
    const schema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": name,
        "description": description,
        "provider": {
            "@type": "Organization",
            "name": provider,
            "url": BASE_URL
        },
        "url": courseUrl,
        "isAccessibleForFree": price === 0 || price === undefined,
        "inLanguage": "en",
        "courseMode": "online",
        "offers": price !== undefined ? {
            "@type": "Offer",
            "price": price,
            "priceCurrency": currency,
            "availability": "https://schema.org/InStock"
        } : undefined
    };

    if (imageUrl) {
        schema.image = imageUrl;
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

export function BreadcrumbSchema({ items }: { items: Array<{ name: string; url: string }> }) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url
        }))
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

export function FAQSchema({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
