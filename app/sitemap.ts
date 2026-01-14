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

    // Fetch courses for dynamic pages
    let coursePages: MetadataRoute.Sitemap = [];
    try {
        const res = await fetch(`${baseUrl}/api/courses`, {
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
    } catch (error) {
        console.error('Failed to fetch courses for sitemap:', error);
    }

    return [...staticPages, ...coursePages];
}
