
import useSWR from 'swr';
import { Course } from '@/lib/types'; // Ensure type safety if possible, or just use any for now

export function useCourse(courseId: string) {
    const { data, error, isLoading, mutate } = useSWR(
        courseId ? `/api/courses/${courseId}` : null,
        (url) => fetch(url, { cache: 'no-store' }).then(res => res.json()),
        {
            refreshInterval: 4000, // Poll every 4 seconds
            revalidateOnFocus: true,
            dedupingInterval: 2000,
        }
    );

    return {
        course: data as Course,
        isLoading,
        isError: error,
        mutate // Expose mutate for manual revalidation if needed
    };
}
