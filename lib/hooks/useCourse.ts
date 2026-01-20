
import useSWR from 'swr';
import { Course } from '@/lib/types'; // Ensure type safety if possible, or just use any for now

export function useCourse(courseId: string) {
    const { data, error, isLoading, mutate } = useSWR(
        courseId ? `/api/courses/${courseId}` : null,
        (url) => fetch(url).then(res => res.json()),
        {
            // Disabled polling - course data rarely changes while viewing
            // Students only need fresh data on focus/remount
            refreshInterval: 0,
            revalidateOnFocus: true,
            dedupingInterval: 5000,  // Dedupe for 5 seconds
            revalidateOnReconnect: true,
        }
    );

    return {
        course: data as Course,
        isLoading,
        isError: error,
        mutate // Expose mutate for manual revalidation if needed
    };
}
