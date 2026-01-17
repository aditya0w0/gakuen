import { MetadataRoute } from 'next';

// Dynamic sitemap generator for SEO
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gakuen.app';

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/browse`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/pricing`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
    ];

    // Fetch courses for dynamic pages (skip if building or domain not accessible)
    let coursePages: MetadataRoute.Sitemap = [];

    // Skip external fetch during build - courses will be added on next revalidation
    const isProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL_URL;
    const fetchUrl = isProduction
        ? `https://${process.env.VERCEL_URL}/api/courses`
        : `${baseUrl}/api/courses`;

    try {
        // Only fetch if we have a valid URL that can be resolved
        if (isProduction || baseUrl.includes('localhost')) {
            const res = await fetch(fetchUrl, {
                next: { revalidate: 3600 }, // Revalidate every hour
            });

            if (res.ok) {
                const courses = await res.json();
                if (Array.isArray(courses)) {
                    coursePages = courses.map((course: { id: string; updatedAt?: string }) => ({
                        url: `${baseUrl}/course/${course.id}`,
                        lastModified: course.updatedAt ? new Date(course.updatedAt) : new Date(),
                        changeFrequency: 'weekly' as const,
                        priority: 0.7,
                    }));
                }
            }
        }
    } catch (error) {
        // Silently skip - courses will be added on next revalidation
        console.warn('Sitemap: skipping course fetch (expected during build):', (error as Error).message);
    }

    return [...staticPages, ...coursePages];
}
