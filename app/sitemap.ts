import { MetadataRoute } from 'next';

// Dynamic sitemap generator for better SEO and Google indexing
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gakuen-six.vercel.app';

    // Current date for lastModified
    const now = new Date();

    // Helper function to create alternates for multi-language support
    const createAlternates = (path: string) => ({
        languages: {
            'en-US': `${baseUrl}${path}`,
            'id-ID': `${baseUrl}/id${path}`,
        },
    });

    // Static pages with proper priorities and alternates
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 1.0,
            alternates: createAlternates(''),
        },
        {
            url: `${baseUrl}/browse`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.9,
            alternates: createAlternates('/browse'),
        },
        {
            url: `${baseUrl}/pricing`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.8,
            alternates: createAlternates('/pricing'),
        },
        {
            url: `${baseUrl}/login`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.5,
            alternates: createAlternates('/contact'),
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];

    // Fetch courses for dynamic pages
    let coursePages: MetadataRoute.Sitemap = [];

    // Use internal URL during build, otherwise use baseUrl
    const isVercel = !!process.env.VERCEL_URL;
    const fetchUrl = isVercel
        ? `https://${process.env.VERCEL_URL}/api/courses`
        : baseUrl.includes('localhost')
            ? `${baseUrl}/api/courses`
            : null;

    if (fetchUrl) {
        try {
            const res = await fetch(fetchUrl, {
                next: { revalidate: 3600 }, // Revalidate every hour
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (res.ok) {
                const courses = await res.json();
                if (Array.isArray(courses)) {
                    coursePages = courses.map((course: {
                        id: string;
                        updatedAt?: string;
                        title?: string;
                    }) => ({
                        url: `${baseUrl}/course/${course.id}`,
                        lastModified: course.updatedAt ? new Date(course.updatedAt) : now,
                        changeFrequency: 'weekly' as const,
                        priority: 0.7,
                    }));
                }
            }
        } catch (error) {
            // Expected during build when external domain is unreachable
            console.warn('Sitemap: course fetch skipped:', (error as Error).message);
        }
    }

    // Combine all pages
    return [...staticPages, ...coursePages];
}
